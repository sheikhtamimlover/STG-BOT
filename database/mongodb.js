const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  firstName: String,
  lastName: String,
  username: String,
  pfpUrl: String,
  location: String,
  exp: { type: Number, default: 0 },
  money: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  lastDailyClaim: { type: String, default: '' },
  createdAt: { type: Number, default: Date.now }
});

const threadSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: String,
  type: String,
  totalUsers: { type: Number, default: 0 },
  createdAt: { type: Number, default: Date.now }
});

class MongoDatabase {
  constructor() {
    this.User = null;
    this.Thread = null;
    this.connected = false;
  }

  async connect(uri) {
    try {
      await mongoose.connect(uri);
      this.User = mongoose.model('User', userSchema);
      this.Thread = mongoose.model('Thread', threadSchema);
      this.connected = true;
      return true;
    } catch (error) {
      console.error('MongoDB connection error:', error);
      return false;
    }
  }

  async getUser(userId) {
    userId = String(userId);
    let user = await this.User.findOne({ id: userId });
    if (!user) {
      user = await this.User.create({
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
        createdAt: Date.now()
      });
    }
    return user.toObject();
  }

  async updateUser(userId, data) {
    userId = String(userId);
    const user = await this.User.findOneAndUpdate(
      { id: userId },
      { $set: data },
      { new: true, upsert: true }
    );
    return user.toObject();
  }

  async getThread(threadId) {
    threadId = String(threadId);
    let thread = await this.Thread.findOne({ id: threadId });
    if (!thread) {
      thread = await this.Thread.create({
        id: threadId,
        name: '',
        type: '',
        totalUsers: 0,
        createdAt: Date.now()
      });
    }
    return thread.toObject();
  }

  async updateThread(threadId, data) {
    threadId = String(threadId);
    const thread = await this.Thread.findOneAndUpdate(
      { id: threadId },
      { $set: data },
      { new: true, upsert: true }
    );
    return thread.toObject();
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

    return await this.updateUser(userId, { exp: user.exp, level: user.level });
  }

  async getAllUsers() {
    const users = await this.User.find({});
    return users.map(u => u.toObject());
  }

  async getAllThreads() {
    const threads = await this.Thread.find({});
    return threads.map(t => t.toObject());
  }
}

module.exports = MongoDatabase;