module.exports = {
  config: {
    name: "uid",
    aliases: [],
    author: "ST",
    version: "1.0.0",
    cooldown: 3,
    role: 0,
    description: "Get user ID (own, reply, or mention)",
    category: "utility",
    usePrefix: true
  },

  ST: async function ({ event, api, args, message }) {
    try {
      let targetUser = null;
      let userId = null;
      let userName = '';
      let username = '';

      if (event.reply_to_message) {
        targetUser = event.reply_to_message.from;
        userId = targetUser.id;
        userName = targetUser.first_name + (targetUser.last_name ? ' ' + targetUser.last_name : '');
        username = targetUser.username ? `@${targetUser.username}` : 'No username';
      } else if (event.entities && event.entities.some(e => e.type === 'mention' || e.type === 'text_mention')) {
        const mention = event.entities.find(e => e.type === 'text_mention');
        if (mention && mention.user) {
          targetUser = mention.user;
          userId = targetUser.id;
          userName = targetUser.first_name + (targetUser.last_name ? ' ' + targetUser.last_name : '');
          username = targetUser.username ? `@${targetUser.username}` : 'No username';
        } else {
          const mentionText = event.entities.find(e => e.type === 'mention');
          if (mentionText) {
            const usernameText = event.text.substring(mentionText.offset, mentionText.offset + mentionText.length);
            return message.reply(`⚠️ Cannot get user ID from username mention ${usernameText}\nPlease reply to a user's message instead.`);
          }
        }
      } else {
        targetUser = event.from;
        userId = targetUser.id;
        userName = targetUser.first_name + (targetUser.last_name ? ' ' + targetUser.last_name : '');
        username = targetUser.username ? `@${targetUser.username}` : 'No username';
      }

      if (!userId) {
        return message.reply('❌ Could not retrieve user ID. Please reply to a message or use your own.');
      }

      const uidMessage = `🆔 User ID Information\n\n` +
        `👤 Name: ${userName}\n` +
        `📝 Username: ${username}\n` +
        `🆔 User ID: ${userId}\n` +
        `🤖 Is Bot: ${targetUser.is_bot ? 'Yes' : 'No'}`;

      await message.reply(uidMessage);
    } catch (error) {
      global.log.error('Error in uid command:', error);
      message.reply(`❌ Error: ${error.message}`);
    }
  }
};
