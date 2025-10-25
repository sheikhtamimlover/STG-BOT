const fs = require('fs');
const path = require('path');

class JsonDatabase {
  constructor() {
    this.dataDir = path.join(__dirname, 'data');
    this.usersFile = path.join(this.dataDir, 'users.json');
    this.threadsFile = path.join(this.dataDir, 'threads.json');
    this.approvalsFile = path.join(this.dataDir, 'approvals.json');
    this.bansFile = path.join(this.dataDir, 'bans.json');

    this.users = new Map();
    this.threads = new Map();
    this.approvals = new Map();
    this.bans = new Map();

    this.init();
  }

  init() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }

    if (fs.existsSync(this.usersFile)) {
      const data = JSON.parse(fs.readFileSync(this.usersFile, 'utf-8'));
      this.users = new Map(Object.entries(data));
    } else {
      fs.writeFileSync(this.usersFile, JSON.stringify({}, null, 2));
    }

    if (fs.existsSync(this.threadsFile)) {
      const data = JSON.parse(fs.readFileSync(this.threadsFile, 'utf-8'));
      this.threads = new Map(Object.entries(data));
    } else {
      fs.writeFileSync(this.threadsFile, JSON.stringify({}, null, 2));
    }

    if (fs.existsSync(this.approvalsFile)) {
      const data = JSON.parse(fs.readFileSync(this.approvalsFile, 'utf-8'));
      this.approvals = new Map(Object.entries(data));
    } else {
      fs.writeFileSync(this.approvalsFile, JSON.stringify({}, null, 2));
    }

    if (fs.existsSync(this.bansFile)) {
      const data = JSON.parse(fs.readFileSync(this.bansFile, 'utf-8'));
      this.bans = new Map(Object.entries(data));
    } else {
      fs.writeFileSync(this.bansFile, JSON.stringify({}, null, 2));
    }
  }

  save() {
    const usersObj = Object.fromEntries(this.users);
    const threadsObj = Object.fromEntries(this.threads);
    const approvalsObj = Object.fromEntries(this.approvals);
    const bansObj = Object.fromEntries(this.bans);

    fs.writeFileSync(this.usersFile, JSON.stringify(usersObj, null, 2));
    fs.writeFileSync(this.threadsFile, JSON.stringify(threadsObj, null, 2));
    fs.writeFileSync(this.approvalsFile, JSON.stringify(approvalsObj, null, 2));
    fs.writeFileSync(this.bansFile, JSON.stringify(bansObj, null, 2));
  }

  async getUser(userId) {
    userId = String(userId);
    if (!this.users.has(userId)) {
      this.users.set(userId, {
        id: userId,
        firstName: '',
        lastName: '',
        username: '',
        pfpUrl: '',
        location: '',
        exp: 0,
        money: 0,
        level: 1,
        lastDailyClaim: '',
        banned: false,
        dmApproved: false,
        warnings: {},
        createdAt: Date.now()
      });
      this.save();
    }
    return this.users.get(userId);
  }

  async updateUser(userId, data) {
    userId = String(userId);
    const user = await this.getUser(userId);
    Object.assign(user, data);
    this.users.set(userId, user);
    this.save();
    return user;
  }

  async getThread(threadId) {
    threadId = String(threadId);
    if (!this.threads.has(threadId)) {
      this.threads.set(threadId, {
        id: threadId,
        name: '',
        type: '',
        totalUsers: 0,
        customPrefix: '',
        approved: false,
        createdAt: Date.now()
      });
      this.save();
    }
    return this.threads.get(threadId);
  }

  async updateThread(threadId, data) {
    threadId = String(threadId);
    const thread = await this.getThread(threadId);
    Object.assign(thread, data);
    this.threads.set(threadId, thread);
    this.save();
    return thread;
  }

  async incrementUserExp(userId, amount = 5) {
    userId = String(userId);
    const user = await this.getUser(userId);
    user.exp += amount;

    const expNeeded = user.level * 100;
    if (user.exp >= expNeeded) {
      user.level++;
      user.exp = user.exp - expNeeded;
    }

    this.users.set(userId, user);
    this.save();
    return user;
  }

  async getAllUsers() {
    return Array.from(this.users.values());
  }

  async getAllThreads() {
    return Array.from(this.threads.values());
  }

  async addApproval(type, data) {
    const id = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.approvals.set(id, {
      id,
      type,
      ...data,
      createdAt: Date.now()
    });
    this.save();
    return id;
  }

  async getApproval(id) {
    return this.approvals.get(id);
  }

  async removeApproval(id) {
    this.approvals.delete(id);
    this.save();
  }

  async getAllApprovals(type = null) {
    const all = Array.from(this.approvals.values());
    if (type) {
      return all.filter(a => a.type === type);
    }
    return all;
  }

  async banUser(userId, reason = '', bannedBy = '') {
    userId = String(userId);
    this.bans.set(userId, {
      userId,
      reason,
      bannedBy,
      bannedAt: Date.now()
    });
    await this.updateUser(userId, { banned: true });
    this.save();
  }

  async unbanUser(userId) {
    userId = String(userId);
    this.bans.delete(userId);
    await this.updateUser(userId, { banned: false });
    this.save();
  }

  async isUserBanned(userId) {
    userId = String(userId);
    return this.bans.has(userId);
  }

  async getAllBans() {
    return Array.from(this.bans.values());
  }

  async addUnbanRequest(userId, reason = '', chatId = null) {
    const id = `unban_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.approvals.set(id, {
      id,
      type: 'unban',
      userId: String(userId),
      reason,
      chatId: chatId ? String(chatId) : null,
      createdAt: Date.now()
    });
    this.save();
    return id;
  }

  async getUnbanRequests() {
    const all = Array.from(this.approvals.values());
    return all.filter(a => a.type === 'unban');
  }

  async addWarning(userId, chatId, reason = '', warnedBy = '') {
    userId = String(userId);
    chatId = String(chatId);
    const user = await this.getUser(userId);
    
    // Ensure warnings object exists
    if (!user.warnings || typeof user.warnings !== 'object') {
      user.warnings = {};
    }
    
    if (!user.warnings[chatId]) {
      user.warnings[chatId] = [];
    }
    
    user.warnings[chatId].push({
      reason,
      warnedBy,
      warnedAt: Date.now()
    });
    
    await this.updateUser(userId, { warnings: user.warnings });
    return user.warnings[chatId].length;
  }

  async getWarnings(userId, chatId) {
    userId = String(userId);
    chatId = String(chatId);
    const user = await this.getUser(userId);
    if (!user.warnings || typeof user.warnings !== 'object') {
      return [];
    }
    return user.warnings[chatId] || [];
  }

  async clearWarnings(userId, chatId) {
    userId = String(userId);
    chatId = String(chatId);
    const user = await this.getUser(userId);
    if (user.warnings && typeof user.warnings === 'object' && user.warnings[chatId]) {
      delete user.warnings[chatId];
      await this.updateUser(userId, { warnings: user.warnings });
    }
  }
}

module.exports = JsonDatabase;