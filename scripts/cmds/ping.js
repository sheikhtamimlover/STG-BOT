
const os = require('os');

module.exports = {
  config: {
    name: "ping",
    aliases: [],
    author: "ST",
    version: "1.2.1",
    cooldown: 5,
    role: 0,
    description: "Check bot response time and system information",
    category: "system",
    usePrefix: true
  },

  ST: async function ({ event, api, message }) {
    const apiStartTime = Date.now();
    
    const loadingStates = [
      '[█▒▒▒▒▒▒▒▒▒]',
      '[███▒▒▒▒▒▒▒]',
      '[█████▒▒▒▒▒]',
      '[███████▒▒▒]',
      '[██████████]'
    ];
    
    const msg = await message.reply(loadingStates[0]);
    const apiPing = Date.now() - apiStartTime;
    
    for (let i = 1; i < loadingStates.length; i++) {
      await sleep(250);
      await message.edit(loadingStates[i], msg.message_id);
    }
    
    const uptime = process.uptime();
    
    const totalMem = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
    const freeMem = (os.freemem() / 1024 / 1024 / 1024).toFixed(2);
    const usedMem = (totalMem - freeMem).toFixed(2);
    const memUsage = ((usedMem / totalMem) * 100).toFixed(1);
    
    const cpuUsage = process.cpuUsage();
    const cpuPercent = ((cpuUsage.user + cpuUsage.system) / 1000000).toFixed(2);
    
    const formattedUptime = global.utils.formatUptime(uptime);
    
    // Get database statistics
    const allUsers = await global.db.getAllUsers();
    const allThreads = await global.db.getAllThreads();
    const totalGCs = allThreads.filter(t => t.type === 'group' || t.type === 'supergroup').length;
    
    const responseText = `🏓 Pong!\n\n` +
      `📊 System Information:\n\n` +
      `⏱️ API Ping: ${apiPing}ms\n` +
      `🕐 Bot Uptime: ${formattedUptime}\n` +
      `💾 Memory: ${usedMem}GB / ${totalMem}GB (${memUsage}%)\n` +
      `⚙️ CPU Usage: ${cpuPercent}s\n` +
      `🖥️ Platform: ${os.platform()} ${os.arch()}\n` +
      `📦 Node: ${process.version}\n\n` +
      `📈 Bot Statistics:\n` +
      `👤 Commands: ${global.ST.commands.size}\n` +
      `🎭 Events: ${global.ST.events.size}\n` +
      `⏳ Cooldowns: ${global.ST.cooldowns.size}\n` +
      `👥 Total Users: ${allUsers.length}\n` +
      `💬 Total Groups: ${totalGCs}\n\n` +
      `👤 User: ${event.from.first_name}\n` +
      `📍 Chat: ${event.chat.title || 'Private Chat'}`;
    
    await message.edit(responseText, msg.message_id);
  }
};

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
