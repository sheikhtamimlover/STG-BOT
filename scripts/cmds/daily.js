
const moment = require('moment-timezone');

module.exports = {
  config: {
    name: "daily",
    aliases: ["claim"],
    author: "ST",
    version: "1.0.0",
    cooldown: 0,
    role: 0,
    description: "Claim your daily money and exp rewards (resets at midnight)",
    category: "economy",
    usePrefix: true
  },

  ST: async function ({ event, api, message, userId }) {
    try {
      const user = await global.db.getUser(userId);
      const timezone = global.config.timezone || 'Asia/Dhaka';
      const now = moment().tz(timezone);
      const todayDate = now.format('YYYY-MM-DD');
      
      // Check if user has claimed today
      if (user.lastDailyClaim === todayDate) {
        const midnight = moment().tz(timezone).endOf('day');
        const timeLeft = moment.duration(midnight.diff(now));
        const hours = Math.floor(timeLeft.asHours());
        const minutes = Math.floor(timeLeft.asMinutes() % 60);
        
        return message.reply(
          `⏳ You've already claimed your daily reward!\n\n` +
          `⏰ Next claim available in: ${hours}h ${minutes}m\n` +
          `🌙 Resets at midnight (${timezone})`
        );
      }
      
      const dailyMoney = 500;
      const dailyExp = 100;
      
      await global.db.updateUser(userId, {
        money: (user.money || 0) + dailyMoney,
        exp: (user.exp || 0) + dailyExp,
        lastDailyClaim: todayDate
      });
      
      const updatedUser = await global.db.getUser(userId);
      
      const replyText = `🎁 Daily Reward Claimed!\n\n` +
        `💰 Money: +${dailyMoney}\n` +
        `⭐ Exp: +${dailyExp}\n\n` +
        `📊 Your Stats:\n` +
        `💵 Total Money: ${updatedUser.money}\n` +
        `🌟 Total Exp: ${updatedUser.exp}\n` +
        `📈 Level: ${updatedUser.level}\n\n` +
        `⏰ Come back tomorrow after midnight for your next reward!`;
      
      await message.reply(replyText);
      
    } catch (error) {
      global.log.error('Error in daily command:', error);
      await message.reply(`❌ Error: ${error.message}`);
    }
  }
};
