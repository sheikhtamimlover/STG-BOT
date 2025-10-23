
module.exports = {
  config: {
    name: "rank",
    aliases: ["level", "lvl"],
    author: "ST",
    version: "1.0.0",
    cooldown: 5,
    role: 0,
    description: "Check your rank and level",
    category: "game",
    usePrefix: true
  },

  ST: async function ({ event, api, message, userId }) {
    try {
      let targetUserId = userId;
      let targetUser = event.from;

      if (event.reply_to_message) {
        targetUserId = event.reply_to_message.from.id;
        targetUser = event.reply_to_message.from;
      }

      const userData = await global.db.getUser(targetUserId);
      const userName = targetUser.first_name + (targetUser.last_name ? ' ' + targetUser.last_name : '');

      const expNeeded = userData.level * 100;
      const progress = Math.floor((userData.exp / expNeeded) * 20);
      const progressBar = '█'.repeat(progress) + '░'.repeat(20 - progress);

      let rankText = `🎮 Rank Information\n\n`;
      rankText += `👤 ${userName}\n`;
      rankText += `⭐ Level: ${userData.level}\n`;
      rankText += `✨ EXP: ${userData.exp}/${expNeeded}\n\n`;
      rankText += `Progress:\n[${progressBar}] ${Math.floor((userData.exp / expNeeded) * 100)}%\n\n`;
      rankText += `💰 Money: ${userData.money}\n`;
      rankText += `💬 Total Messages: ${userData.msgCountPrivate + Object.values(userData.msgCountThread || {}).reduce((a, b) => a + b, 0)}`;

      await message.reply(rankText);

    } catch (error) {
      global.log.error('Error in rank command:', error);
      message.reply(`❌ Error: ${error.message}`);
    }
  }
};
