
module.exports = {
  config: {
    name: "userdb",
    aliases: [],
    author: "ST",
    version: "1.2.0",
    cooldown: 5,
    role: 0,
    description: "View user database information",
    category: "database",
    usePrefix: true
  },

  ST: async function ({ event, api, args, message, userId }) {
    try {
      let targetUserId = null;
      let targetUser = null;

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
      // Priority 3: @username mention
      if (!targetUserId && event.entities && event.entities.length > 0 && args[0]) {
        const mention = event.entities.find(e => e.type === 'mention');
        if (mention) {
          const username = args[0].replace('@', '');
          try {
            const chat = await api.getChat('@' + username);
            if (chat && chat.id) {
              targetUserId = chat.id;
              targetUser = chat;
            }
          } catch (err) {
            // Username not found
          }
        }
      }
      // Priority 4: Direct user ID in args
      if (!targetUserId && args[0] && /^\d+$/.test(args[0])) {
        targetUserId = parseInt(args[0]);
        try {
          const chat = await api.getChat(targetUserId);
          targetUser = chat;
        } catch (err) {
          // User ID not found
        }
      }
      // Priority 5: Self (message sender)
      if (!targetUserId) {
        targetUserId = userId;
        targetUser = event.from;
      }

      if (!targetUserId) {
        return await message.reply("❌ Could not retrieve user data");
      }

      const userData = await global.db.getUser(String(targetUserId));

      const userName = targetUser ? (targetUser.first_name + (targetUser.last_name ? ' ' + targetUser.last_name : '')) : 'User';
      
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
