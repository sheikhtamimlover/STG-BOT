
let updateInterval;
let sessionId = null;
let editorType = 'command';

// Check authentication on load
async function checkAuth() {
    try {
        const response = await fetch('/api/auth/check');
        const data = await response.json();

        if (!data.passwordProtection) {
            // No password protection, show dashboard
            showDashboard();
        } else {
            // Check if we have a valid session
            const storedSession = localStorage.getItem('sessionId');
            if (storedSession) {
                sessionId = storedSession;
                try {
                    await fetchStats();
                    showDashboard();
                } catch (error) {
                    // Session invalid, show login
                    showLogin();
                }
            } else {
                showLogin();
            }
        }
    } catch (error) {
        console.error('Auth check failed:', error);
        showLogin();
    }
}

function showLogin() {
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('mainDashboard').style.display = 'none';
}

function showDashboard() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('mainDashboard').style.display = 'block';
    fetchStats();
    updateInterval = setInterval(fetchStats, 5000);
}

// Login form handler
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const password = document.getElementById('passwordInput').value;
    const errorEl = document.getElementById('loginError');

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password })
        });

        const data = await response.json();

        if (data.success) {
            sessionId = data.sessionId;
            localStorage.setItem('sessionId', sessionId);
            errorEl.textContent = '';
            showDashboard();
        } else {
            errorEl.textContent = 'Invalid password';
        }
    } catch (error) {
        errorEl.textContent = 'Login failed. Please try again.';
    }
});

async function fetchStats() {
    try {
        const headers = sessionId ? { 'X-Session-Id': sessionId } : {};
        const response = await fetch('/api/stats', { headers });

        if (response.status === 401) {
            localStorage.removeItem('sessionId');
            sessionId = null;
            showLogin();
            return;
        }

        const data = await response.json();
        updateUI(data);
        updateStatus(true);
    } catch (error) {
        console.error('Error fetching stats:', error);
        updateStatus(false);
    }
}

function updateUI(data) {
    document.getElementById('botName').textContent = `${data.bot.name} Dashboard`;

    const uptime = data.bot.uptime;
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);
    document.getElementById('uptime').textContent = `${hours}h ${minutes}m ${seconds}s`;

    document.getElementById('platform').textContent = data.bot.platform;
    document.getElementById('commandCount').textContent = data.commands.total;
    document.getElementById('eventCount').textContent = data.events.total;

    // Update commands list with management buttons
    const commandsList = document.getElementById('commandsList');
    if (data.commands.list.length > 0) {
        commandsList.innerHTML = data.commands.list
            .map(cmd => `
                <div class="item-card">
                    <div class="item-info">
                        <span class="item-name">${cmd.name}</span>
                        <span class="item-desc">${cmd.description}</span>
                        <span class="item-badge">${cmd.category}</span>
                    </div>
                    <div class="item-actions">
                        <button class="btn-sm btn-view" onclick="viewCommand('${cmd.name}')">👁 View</button>
                        <button class="btn-sm btn-edit" onclick="editCommand('${cmd.name}')">✏️ Edit</button>
                        <button class="btn-sm" onclick="reloadCommand('${cmd.name}')">🔄 Reload</button>
                        <button class="btn-sm btn-danger" onclick="unloadCommand('${cmd.name}')">✖ Unload</button>
                    </div>
                </div>
            `)
            .join('');
    } else {
        commandsList.innerHTML = '<p class="loading">No commands loaded</p>';
    }

    // Update events list with management buttons
    const eventsList = document.getElementById('eventsList');
    if (data.events.list.length > 0) {
        eventsList.innerHTML = data.events.list
            .map(evt => `
                <div class="item-card">
                    <div class="item-info">
                        <span class="item-name">${evt.name}</span>
                        <span class="item-desc">${evt.description}</span>
                        <span class="item-badge">${evt.eventType}</span>
                    </div>
                    <div class="item-actions">
                        <button class="btn-sm btn-view" onclick="viewEvent('${evt.name}')">👁 View</button>
                        <button class="btn-sm btn-edit" onclick="editEvent('${evt.name}')">✏️ Edit</button>
                        <button class="btn-sm" onclick="reloadEvent('${evt.name}')">🔄 Reload</button>
                        <button class="btn-sm btn-danger" onclick="unloadEvent('${evt.name}')">✖ Unload</button>
                    </div>
                </div>
            `)
            .join('');
    } else {
        eventsList.innerHTML = '<p class="loading">No events loaded</p>';
    }

    const memory = data.memory;
    document.getElementById('memoryRSS').textContent = `${(memory.rss / 1024 / 1024).toFixed(2)} MB`;
    document.getElementById('memoryHeap').textContent = `${(memory.heapUsed / 1024 / 1024).toFixed(2)} MB`;
    document.getElementById('prefix').textContent = data.bot.prefix;
    document.getElementById('lastUpdate').textContent = new Date(data.timestamp).toLocaleTimeString();
}

function updateStatus(online) {
    const statusBadge = document.getElementById('statusBadge');
    const statusText = document.getElementById('statusText');

    if (online) {
        statusBadge.classList.remove('offline');
        statusText.textContent = 'Online';
    } else {
        statusBadge.classList.add('offline');
        statusText.textContent = 'Offline';
    }
}

// Command/Event Management Functions
async function reloadCommand(name) {
    try {
        const response = await fetch('/api/commands/reload', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Session-Id': sessionId
            },
            body: JSON.stringify({ name })
        });
        const result = await response.json();
        alert(result.message);
        fetchStats();
    } catch (error) {
        alert('Failed to reload command');
    }
}

async function unloadCommand(name) {
    if (!confirm(`Are you sure you want to unload ${name}?`)) return;

    try {
        const response = await fetch('/api/commands/unload', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Session-Id': sessionId
            },
            body: JSON.stringify({ name })
        });
        const result = await response.json();
        alert(result.message);
        fetchStats();
    } catch (error) {
        alert('Failed to unload command');
    }
}

async function reloadEvent(name) {
    try {
        const response = await fetch('/api/events/reload', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Session-Id': sessionId
            },
            body: JSON.stringify({ name })
        });
        const result = await response.json();
        alert(result.message);
        fetchStats();
    } catch (error) {
        alert('Failed to reload event');
    }
}

async function unloadEvent(name) {
    if (!confirm(`Are you sure you want to unload ${name}?`)) return;

    try {
        const response = await fetch('/api/events/unload', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Session-Id': sessionId
            },
            body: JSON.stringify({ name })
        });
        const result = await response.json();
        alert(result.message);
        fetchStats();
    } catch (error) {
        alert('Failed to unload event');
    }
}

async function viewCommand(name) {
    try {
        const response = await fetch(`/api/commands/view/${name}`, {
            headers: { 'X-Session-Id': sessionId }
        });
        const result = await response.json();

        if (result.success) {
            document.getElementById('editorTitle').textContent = `View Command: ${name}`;
            document.getElementById('fileName').value = result.fileName;
            document.getElementById('fileName').readOnly = true;
            document.getElementById('codeEditor').value = result.code;
            document.getElementById('codeEditor').readOnly = true;
            document.getElementById('editorForm').querySelector('button[type="submit"]').style.display = 'none';
            document.getElementById('editorModal').style.display = 'block';
        } else {
            alert(result.message);
        }
    } catch (error) {
        alert('Failed to view command');
    }
}

async function editCommand(name) {
    try {
        const response = await fetch(`/api/commands/view/${name}`, {
            headers: { 'X-Session-Id': sessionId }
        });
        const result = await response.json();

        if (result.success) {
            editorType = 'edit-command';
            document.getElementById('editorTitle').textContent = `Edit Command: ${name}`;
            document.getElementById('fileName').value = result.fileName;
            document.getElementById('fileName').readOnly = true;
            document.getElementById('codeEditor').value = result.code;
            document.getElementById('codeEditor').readOnly = false;
            document.getElementById('editorForm').querySelector('button[type="submit"]').style.display = 'block';
            document.getElementById('editorForm').querySelector('button[type="submit"]').textContent = 'Save Changes';
            document.getElementById('editorModal').style.display = 'block';
        } else {
            alert(result.message);
        }
    } catch (error) {
        alert('Failed to edit command');
    }
}

async function viewEvent(name) {
    try {
        const response = await fetch(`/api/events/view/${name}`, {
            headers: { 'X-Session-Id': sessionId }
        });
        const result = await response.json();

        if (result.success) {
            document.getElementById('editorTitle').textContent = `View Event: ${name}`;
            document.getElementById('fileName').value = result.fileName;
            document.getElementById('fileName').readOnly = true;
            document.getElementById('codeEditor').value = result.code;
            document.getElementById('codeEditor').readOnly = true;
            document.getElementById('editorForm').querySelector('button[type="submit"]').style.display = 'none';
            document.getElementById('editorModal').style.display = 'block';
        } else {
            alert(result.message);
        }
    } catch (error) {
        alert('Failed to view event');
    }
}

async function editEvent(name) {
    try {
        const response = await fetch(`/api/events/view/${name}`, {
            headers: { 'X-Session-Id': sessionId }
        });
        const result = await response.json();

        if (result.success) {
            editorType = 'edit-event';
            document.getElementById('editorTitle').textContent = `Edit Event: ${name}`;
            document.getElementById('fileName').value = result.fileName;
            document.getElementById('fileName').readOnly = true;
            document.getElementById('codeEditor').value = result.code;
            document.getElementById('codeEditor').readOnly = false;
            document.getElementById('editorForm').querySelector('button[type="submit"]').style.display = 'block';
            document.getElementById('editorForm').querySelector('button[type="submit"]').textContent = 'Save Changes';
            document.getElementById('editorModal').style.display = 'block';
        } else {
            alert(result.message);
        }
    } catch (error) {
        alert('Failed to edit event');
    }
}

function showCommandEditor() {
    editorType = 'command';
    document.getElementById('editorTitle').textContent = 'Add Command';
    document.getElementById('fileName').value = '';
    document.getElementById('fileName').placeholder = 'mycommand.js';
    document.getElementById('fileName').readOnly = false;
    document.getElementById('codeEditor').value = '';
    document.getElementById('codeEditor').readOnly = false;
    document.getElementById('editorForm').querySelector('button[type="submit"]').style.display = 'block';
    document.getElementById('editorForm').querySelector('button[type="submit"]').textContent = 'Save';
    document.getElementById('editorModal').style.display = 'block';
}

function showEventEditor() {
    editorType = 'event';
    document.getElementById('editorTitle').textContent = 'Add Event';
    document.getElementById('fileName').value = '';
    document.getElementById('fileName').placeholder = 'myevent.js';
    document.getElementById('fileName').readOnly = false;
    document.getElementById('codeEditor').value = '';
    document.getElementById('codeEditor').readOnly = false;
    document.getElementById('editorForm').querySelector('button[type="submit"]').style.display = 'block';
    document.getElementById('editorForm').querySelector('button[type="submit"]').textContent = 'Save';
    document.getElementById('editorModal').style.display = 'block';
}

function closeEditor() {
    document.getElementById('editorModal').style.display = 'none';
    document.getElementById('editorForm').reset();
    document.getElementById('editorError').textContent = '';
}

document.getElementById('editorForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fileName = document.getElementById('fileName').value;
    const code = document.getElementById('codeEditor').value;
    const errorEl = document.getElementById('editorError');

    if (!fileName.endsWith('.js')) {
        errorEl.textContent = 'File name must end with .js';
        return;
    }

    try {
        let endpoint = '/api/commands/install';
        if (editorType === 'edit-command') {
            endpoint = '/api/commands/install';
        } else if (editorType === 'edit-event' || editorType === 'event') {
            endpoint = '/api/events/install';
        }

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Session-Id': sessionId
            },
            body: JSON.stringify({ fileName, code })
        });

        const result = await response.json();

        if (result.success) {
            alert(result.message);
            closeEditor();
            fetchStats();
        } else {
            errorEl.textContent = result.message;
        }
    } catch (error) {
        errorEl.textContent = 'Failed to save file';
    }
});

// Initialize
checkAuth();
