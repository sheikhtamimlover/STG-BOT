module.exports = {
  config: {
    name: "tid",
    aliases: [],
    author: "ST",
    version: "1.0.0",
    cooldown: 3,
    role: 0,
    description: "Get thread/chat/group ID",
    category: "utility",
    usePrefix: true
  },

  ST: async function ({ event, api, message }) {
    try {
      const chatId = event.chat.id;
      const chatTitle = event.chat.title || 'Private Chat';
      const chatType = event.chat.type;
      const memberCount = event.chat.type !== 'private' 
        ? (await api.getChatMembersCount(chatId)) 
        : 1;

      let tidMessage = `🆔 Chat/Thread Information\n\n` +
        `📍 Chat Name: ${chatTitle}\n` +
        `🆔 Chat ID: ${chatId}\n` +
        `📱 Chat Type: ${chatType}\n` +
        `👥 Members: ${memberCount}`;

      if (event.chat.username) {
        tidMessage += `\n🔗 Username: @${event.chat.username}`;
      }

      await message.reply(tidMessage);
    } catch (error) {
      global.log.error('Error in tid command:', error);
      message.reply(`❌ Error: ${error.message}`);
    }
  }
};
