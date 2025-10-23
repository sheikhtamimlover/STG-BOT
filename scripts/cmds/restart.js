
const fs = require('fs');
const path = require('path');

module.exports = {
  config: {
    name: "restart",
    aliases: [],
    author: "ST",
    version: "1.0.0",
    cooldown: 10,
    role: 2,
    description: "Restart the bot (Owner only) - PM2 style",
    category: "admin",
    usePrefix: true
  },

  onLoad: async function ({ api }) {
    const restartFile = path.join(__dirname, '..', '..', 'tmp', 'restart.txt');
    if (fs.existsSync(restartFile)) {
      try {
        const [chatId, startTime] = fs.readFileSync(restartFile, 'utf-8').split(' ');
        const timeTaken = ((Date.now() - parseInt(startTime)) / 1000).toFixed(2);
        
        await api.sendMessage(
          chatId,
          `✅ Bot restarted successfully!\n⏰ Time taken: ${timeTaken}s`
        );
        
        fs.unlinkSync(restartFile);
        global.log.success(`Restart notification sent to chat ${chatId}`);
      } catch (error) {
        global.log.error('Error sending restart notification:', error.message);
        fs.unlinkSync(restartFile);
      }
    }
  },

  ST: async function ({ event, api, message }) {
    try {
      // Ensure tmp directory exists
      const tmpDir = path.join(__dirname, '..', '..', 'tmp');
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
      }

      // Save restart information
      const restartFile = path.join(tmpDir, 'restart.txt');
      const restartData = `${event.chat.id} ${Date.now()}`;
      fs.writeFileSync(restartFile, restartData);

      // Notify user
      await message.reply('🔄 Restarting bot...\n\n⏳ This will take a few seconds.');
      
      const userName = event.from.first_name + (event.from.last_name ? ' ' + event.from.last_name : '');
      global.log.warn(`⚠️ Restart initiated by ${userName} (${event.from.id})`);
      
      // Use PM2-style restart: exit with code 2 to trigger index.js restart
      setTimeout(() => {
        global.log.info('🔄 Shutting down for restart...');
        process.exit(2);
      }, 1000);

    } catch (error) {
      global.log.error('Error in restart command:', error.message);
      message.reply(`❌ Restart failed: ${error.message}`);
    }
  }
};
