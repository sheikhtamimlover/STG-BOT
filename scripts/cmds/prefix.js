
module.exports = {
  config: {
    name: "prefix",
    aliases: [],
    author: "ST",
    version: "1.2.0",
    cooldown: 5,
    role: 1,
    description: "Change prefix for this chat (Admin only)",
    category: "admin",
    usePrefix: true
  },

  ST: async function ({ event, api, args, message, chatId }) {
    try {
      if (!global.config.allowCustomPrefix) {
        return message.reply('⚠️ Custom prefix feature is disabled in config.');
      }

      const chatType = event.chat.type;
      
      // Only allow in groups/supergroups/channels, not DM
      if (chatType === 'private') {
        return message.reply(`⚙️ Global prefix: ${global.config.prefix}\n\n💡 Custom prefixes can only be set in groups/channels.`);
      }

      if (!args[0]) {
        const thread = await global.db.getThread(String(chatId));
        const currentPrefix = thread.customPrefix || global.config.prefix;
        
        return message.reply(
          `⚙️ Current Prefix Settings:\n\n` +
          `📍 Global Prefix: ${global.config.prefix}\n` +
          `📍 This Chat Prefix: ${currentPrefix}\n\n` +
          `💡 Usage: ${currentPrefix}prefix <new_prefix>\n` +
          `Example: ${currentPrefix}prefix !`
        );
      }

      const newPrefix = args[0];

      if (newPrefix.length > 3) {
        return message.reply('❌ Prefix must be 1-3 characters long.');
      }

      await global.db.updateThread(String(chatId), {
        customPrefix: newPrefix
      });

      global.log.success(`Prefix changed to "${newPrefix}" in chat ${chatId}`);
      
      return message.reply(
        `✅ Prefix updated successfully!\n\n` +
        `📍 Old Prefix: ${global.config.prefix}\n` +
        `📍 New Prefix: ${newPrefix}\n\n` +
        `💡 Use ${newPrefix}help to see all commands`
      );

    } catch (error) {
      global.log.error('Error in prefix command:', error);
      return message.reply(`❌ Error: ${error.message}`);
    }
  }
};
