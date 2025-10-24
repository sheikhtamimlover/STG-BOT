
const express = require('express');
const path = require('path');
const os = require('os');

async function createServer() {
  const app = express();
  const server = require('http').createServer(app);
  const PORT = global.config.serverUptime?.port || 5000;

  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Detect deployment platform
  let deployName = "💻 Local";
  const hostname = os.hostname().toLowerCase();

  if (process.env.RENDER === "true") {
    deployName = "🚀 Render";
  } else if (process.env.REPL_ID) {
    deployName = "⚙️ Replit";
  } else if (process.env.PROJECT_DOMAIN) {
    deployName = `🌐 Glitch (${process.env.PROJECT_DOMAIN})`;
  } else if (hostname.includes("railway") || process.env.RAILWAY_ENVIRONMENT) {
    deployName = "🚄 Railway";
  } else if (hostname.includes("fly") || process.env.FLY_APP_NAME) {
    deployName = "🪰 Fly.io";
  } else if (process.env.HEROKU_APP_NAME) {
    deployName = "🟣 Heroku";
  } else if (process.env.VERCEL) {
    deployName = "▲ Vercel";
  }

  global.deploymentPlatform = deployName;

  // Session storage (in-memory)
  const sessions = new Map();

  // Authentication middleware
  const requireAuth = (req, res, next) => {
    const passwordProtection = global.config.serverUptime?.dashboard?.passwordProtection;

    if (!passwordProtection) {
      return next();
    }

    const sessionId = req.headers['x-session-id'];
    if (sessionId && sessions.has(sessionId)) {
      return next();
    }

    res.status(401).json({ error: 'Unauthorized' });
  };

  // Serve static dashboard
  app.use(express.static(path.join(__dirname, '../../dashboard')));

  // Auth endpoints
  app.post('/api/auth/login', (req, res) => {
    const { password } = req.body;
    const configPassword = global.config.serverUptime?.dashboard?.password;

    if (password === configPassword) {
      const sessionId = Math.random().toString(36).substring(7);
      sessions.set(sessionId, { timestamp: Date.now() });
      res.json({ success: true, sessionId });
    } else {
      res.status(401).json({ success: false, error: 'Invalid password' });
    }
  });

  app.get('/api/auth/check', (req, res) => {
    const passwordProtection = global.config.serverUptime?.dashboard?.passwordProtection;
    res.json({ passwordProtection: passwordProtection || false });
  });

  // View command endpoint
  app.get('/api/commands/view/:name', requireAuth, (req, res) => {
    try {
      const { name } = req.params;
      const commandsPath = path.join(__dirname, '../../scripts/cmds');
      const files = fs.readdirSync(commandsPath);

      let fileName = null;
      for (const file of files) {
        if (file.endsWith('.js')) {
          const cmdPath = path.join(commandsPath, file);
          delete require.cache[require.resolve(cmdPath)];
          const cmd = require(cmdPath);
          if (cmd.config && cmd.config.name === name) {
            fileName = file;
            break;
          }
        }
      }

      if (!fileName) {
        return res.json({ success: false, message: 'Command not found' });
      }

      const filePath = path.join(commandsPath, fileName);
      const code = fs.readFileSync(filePath, 'utf-8');
      res.json({ success: true, fileName, code });
    } catch (error) {
      res.json({ success: false, message: error.message });
    }
  });

  // View event endpoint
  app.get('/api/events/view/:name', requireAuth, (req, res) => {
    try {
      const { name } = req.params;
      const eventsPath = path.join(__dirname, '../../scripts/events');
      const files = fs.readdirSync(eventsPath);

      let fileName = null;
      for (const file of files) {
        if (file.endsWith('.js')) {
          const evtPath = path.join(eventsPath, file);
          delete require.cache[require.resolve(evtPath)];
          const evt = require(evtPath);
          if (evt.config && evt.config.name === name) {
            fileName = file;
            break;
          }
        }
      }

      if (!fileName) {
        return res.json({ success: false, message: 'Event not found' });
      }

      const filePath = path.join(eventsPath, fileName);
      const code = fs.readFileSync(filePath, 'utf-8');
      res.json({ success: true, fileName, code });
    } catch (error) {
      res.json({ success: false, message: error.message });
    }
  });

  // Install/update event endpoint
  app.post('/api/events/install', requireAuth, (req, res) => {
    try {
      const { fileName, code } = req.body;
      const result = global.installEventFile(fileName, code);
      res.json(result);
    } catch (error) {
      res.json({ success: false, message: error.message });
    }
  });

  // Uptime endpoint
  app.get('/uptime', (req, res) => {
    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);

    res.json({
      status: 'ok',
      uptime: {
        raw: uptime,
        formatted: `${hours}h ${minutes}m ${seconds}s`
      },
      platform: deployName,
      botName: global.config.botName,
      timestamp: Date.now(),
      commands: global.ST.commands.size,
      events: global.ST.events.size
    });
  });

  // Stats endpoint
  app.get('/api/stats', requireAuth, (req, res) => {
    res.json({
      bot: {
        name: global.config.botName,
        prefix: global.config.prefix,
        uptime: process.uptime(),
        platform: deployName
      },
      commands: {
        total: global.ST.commands.size,
        list: Array.from(global.ST.commands.keys()).map(name => {
          const cmd = global.ST.commands.get(name);
          return {
            name,
            description: cmd.config?.description || 'No description',
            category: cmd.config?.category || 'general',
            role: cmd.config?.role || 0
          };
        })
      },
      events: {
        total: global.ST.events.size,
        list: Array.from(global.ST.events.keys()).map(name => {
          const evt = global.ST.events.get(name);
          return {
            name,
            description: evt.config?.description || 'No description',
            eventType: evt.config?.eventType || 'unknown'
          };
        })
      },
      memory: process.memoryUsage(),
      timestamp: Date.now()
    });
  });

  // Command management endpoints
  app.post('/api/commands/reload', requireAuth, async (req, res) => {
    try {
      const { name } = req.body;
      const result = await global.reloadCommand(name);
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.post('/api/commands/unload', requireAuth, (req, res) => {
    try {
      const { name } = req.body;
      const result = global.unloadCommand(name);
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.post('/api/commands/install', requireAuth, (req, res) => {
    try {
      const { fileName, code } = req.body;
      const result = global.installCommandFile(fileName, code);
      if (result.success) {
        global.reloadCommand(fileName.replace('.js', ''));
      }
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.post('/api/commands/delete', requireAuth, (req, res) => {
    try {
      const { fileName } = req.body;
      const result = global.deleteCommandFile(fileName);
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Event management endpoints
  app.post('/api/events/reload', requireAuth, async (req, res) => {
    try {
      const { name } = req.body;
      const result = await global.reloadEvent(name);
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.post('/api/events/unload', requireAuth, (req, res) => {
    try {
      const { name } = req.body;
      const result = global.unloadEvent(name);
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../dashboard/index.html'));
  });

  // Initialize Socket.IO if enabled
  if (global.config.serverUptime?.socket?.enable) {
    const startTime = Date.now();
    global.log.info('Initializing Socket.IO...');

    try {
      const socketIO = require('./socketIO');
      await socketIO(server);
      const loadTime = ((Date.now() - startTime) / 1000).toFixed(2);
      global.log.success(`Socket.IO connected successfully in ${loadTime}s`);
    } catch (error) {
      global.log.error('Socket.IO initialization failed:', error.message);
    }
  }

  // Start server
  server.listen(PORT, '0.0.0.0', () => {
    global.log.success(`Server running on port ${PORT}`);
    global.log.info(`Platform: ${deployName}`);
    global.log.info(`Dashboard: http://0.0.0.0:${PORT}`);
  });

  return server;
}

module.exports = createServer;
