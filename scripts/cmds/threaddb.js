module.exports = {
  config: {
    name: "threaddb",
    aliases: [],
    author: "ST",
    version: "1.0.0",
    cooldown: 5,
    role: 0,
    description: "View thread/group database information",
    category: "database",
    usePrefix: true
  },

  ST: async function ({ event, api, message, chatId }) {
    try {
      if (event.chat.type === 'private') {
        return message.reply('❌ This command only works in groups/threads.');
      }

      const threadData = await global.db.getThread(chatId);

      let infoText = `📊 Thread Database Info\n\n`;
      infoText += `📱 Thread ID: ${threadData.id}\n`;
      infoText += `📝 Name: ${threadData.name || 'Unknown'}\n`;
      infoText += `📂 Type: ${threadData.type}\n`;
      infoText += `👥 Total Users: ${threadData.totalUsers}\n`;
      infoText += `📅 Created: ${new Date(threadData.createdAt).toLocaleDateString()}`;

      await message.reply(infoText);

    } catch (error) {
      global.log.error('Error in threaddb command:', error);
      message.reply(`❌ Error: ${error.message}`);
    }
  }
};