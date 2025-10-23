
module.exports = {
  config: {
    name: "userdb",
    aliases: [],
    author: "ST",
    version: "1.0.0",
    cooldown: 5,
    role: 0,
    description: "View user database information",
    category: "database",
    usePrefix: true
  },

  ST: async function ({ event, api, message, userId }) {
    try {
      let targetUserId = userId;
      let targetUser = event.from;

      if (event.reply_to_message) {
        targetUserId = event.reply_to_message.from.id;
        targetUser = event.reply_to_message.from;
      } else if (event.entities && event.entities.some(e => e.type === 'text_mention')) {
        const mention = event.entities.find(e => e.type === 'text_mention');
        if (mention && mention.user) {
          targetUserId = mention.user.id;
          targetUser = mention.user;
        }
      }

      const userData = await global.db.getUser(targetUserId);

      const userName = targetUser.first_name + (targetUser.last_name ? ' ' + targetUser.last_name : '');
      
      let infoText = `📊 User Database Info\n\n`;
      infoText += `👤 Name: ${userName}\n`;
      infoText += `🆔 User ID: ${userData.id}\n`;
      infoText += `📝 Username: ${userData.username ? '@' + userData.username : 'None'}\n`;
      infoText += `⭐ Level: ${userData.level}\n`;
      infoText += `✨ EXP: ${userData.exp}\n`;
      infoText += `💰 Money: ${userData.money}\n`;
      infoText += `📅 Joined: ${new Date(userData.createdAt).toLocaleDateString()}`;

      await message.reply(infoText);

    } catch (error) {
      global.log.error('Error in userdb command:', error);
      message.reply(`❌ Error: ${error.message}`);
    }
  }
};
