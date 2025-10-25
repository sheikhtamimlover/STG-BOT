
module.exports = {
  config: {
    name: "balance",
    aliases: [],
    author: "ST",
    version: "1.2.0",
    cooldown: 3,
    role: 0,
    description: "Check your balance or another user's balance",
    category: "economy",
    usePrefix: true
  },

  ST: async function ({ event, api, message, userId }) {
    try {
      let targetUserId = userId;
      let targetUser = event.from;

      // Priority 1: Reply to message
      if (event.reply_to_message && event.reply_to_message.from) {
        targetUserId = event.reply_to_message.from.id;
        targetUser = event.reply_to_message.from;
      }
      // Priority 2: Text mention (clicking user's name)
      else if (event.entities && event.entities.length > 0) {
        const textMention = event.entities.find(e => e.type === 'text_mention');
        if (textMention && textMention.user) {
          targetUserId = textMention.user.id;
          targetUser = textMention.user;
        }
      }

      const userData = await global.db.getUser(String(targetUserId));
      const userName = targetUser.first_name + (targetUser.last_name ? ' ' + targetUser.last_name : '');
      const balance = userData.money || 0;

      let balanceText = `💰 Balance Information\n\n`;
      balanceText += `👤 User: ${userName}\n`;
      balanceText += `💵 Money: ${balance.toLocaleString()} coins\n`;
      balanceText += `⭐ Level: ${userData.level || 1}\n`;
      balanceText += `✨ EXP: ${userData.exp || 0}`;

      await message.reply(balanceText);

    } catch (error) {
      console.error('Error in balance command:', error);
      await message.reply(`❌ Error: ${error.message}`);
    }
  }
};
