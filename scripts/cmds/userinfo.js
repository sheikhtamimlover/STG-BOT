module.exports = {
  config: {
    name: "userinfo",
    aliases: [],
    author: "ST",
    version: "1.0.0",
    cooldown: 5,
    role: 0,
    description: "Get complete user information",
    category: "utility",
    usePrefix: true
  },

  ST: async function ({ event, api, message }) {
    try {
      let targetUser = null;
      let userId = null;

      if (event.reply_to_message) {
        targetUser = event.reply_to_message.from;
        userId = targetUser.id;
      } else if (event.entities && event.entities.some(e => e.type === 'text_mention')) {
        const mention = event.entities.find(e => e.type === 'text_mention');
        if (mention && mention.user) {
          targetUser = mention.user;
          userId = targetUser.id;
        }
      } else {
        targetUser = event.from;
        userId = targetUser.id;
      }

      if (!userId) {
        return message.reply('❌ Could not find user. Please reply to a message or mention a user.');
      }

      const userName = targetUser.first_name + (targetUser.last_name ? ' ' + targetUser.last_name : '');
      const username = targetUser.username ? `@${targetUser.username}` : 'No username';
      const isBot = targetUser.is_bot ? 'Yes' : 'No';
      const isPremium = targetUser.is_premium ? 'Yes' : 'No';
      const languageCode = targetUser.language_code || 'Unknown';

      let userInfoMessage = `👤 User Information\n\n` +
        `📝 First Name: ${targetUser.first_name}\n`;
      
      if (targetUser.last_name) {
        userInfoMessage += `📝 Last Name: ${targetUser.last_name}\n`;
      }
      
      userInfoMessage += `👥 Full Name: ${userName}\n` +
        `🔖 Username: ${username}\n` +
        `🆔 User ID: ${userId}\n` +
        `🤖 Is Bot: ${isBot}\n` +
        `⭐ Premium: ${isPremium}\n` +
        `🌍 Language: ${languageCode}`;

      if (global.config.adminUID.includes(userId)) {
        userInfoMessage += `\n\n👑 Role: Bot Owner`;
      }

      if (event.chat.type !== 'private') {
        try {
          const member = await api.getChatMember(event.chat.id, userId);
          userInfoMessage += `\n📊 Chat Status: ${member.status}`;
          
          if (member.status === 'administrator' || member.status === 'creator') {
            userInfoMessage += `\n🛡️ Admin: Yes`;
          }
        } catch (err) {
        }
      }

      await message.reply(userInfoMessage);

    } catch (error) {
      global.log.error('Error in userinfo command:', error);
      message.reply(`❌ Error: ${error.message}`);
    }
  }
};
