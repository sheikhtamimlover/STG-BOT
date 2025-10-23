module.exports = {
  config: {
    name: "unsend",
    aliases: ["r", "del"],
    author: "ST",
    version: "1.0.0",
    cooldown: 0,
    role: 2,
    description: "Unsend bot's message (reply to bot message)",
    category: "admin",
    usePrefix: true
  },

  ST: async function ({ event, api, message }) {
    try {
      if (!event.reply_to_message) {
        return message.reply('❌ Please reply to a bot message to unsend it.');
      }

      const replyMsg = event.reply_to_message;

      if (!replyMsg.from.is_bot) {
        return message.reply('❌ You can only unsend bot messages.');
      }

      await api.deleteMessage(event.chat.id, replyMsg.message_id);
      await api.deleteMessage(event.chat.id, event.message_id);

    } catch (error) {
      global.log.error('Error in unsend command:', error);
    }
  }
};