module.exports = {
  config: {
    name: "tid",
    aliases: [],
    author: "ST",
    version: "1.2.0",
    cooldown: 3,
    role: 0,
    description: "Get thread/chat/group ID",
    category: "utility",
    usePrefix: true
  },

  ST: async ({ event, message }) => {
    try {
      const chatId = event.chat.id; // This is the chat/group ID
      const chatType = event.chat.type; // private, group, supergroup, channel

      await message.reply(`• Chat ID: \`${chatId}\`\n• Chat Type: ${chatType}`, {
        parse_mode: "Markdown"
      });

    } catch (error) {
      console.error('Error in /tid command:', error);
      await message.reply('❌ An error occurred while fetching the chat ID.');
    }
  }
};
