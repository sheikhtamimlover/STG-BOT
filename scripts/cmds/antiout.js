
module.exports = {
  config: {
    name: "antiout",
    aliases: [],
    author: "ST",
    version: "1.2.1",
    cooldown: 5,
    role: 1,
    description: "Automatically re-add users who leave the group",
    category: "admin",
    usePrefix: true,
    guide: {
      en: `
Usage:
• {p}antiout on - Enable antiout for this group
• {p}antiout off - Disable antiout for this group
• {p}antiout status - Check antiout status

Note: Bot must have admin rights to add users back.
      `.trim()
    }
  },

  ST: async function ({ event, api, args, message, chatId }) {
    try {
      if (event.chat.type !== 'group' && event.chat.type !== 'supergroup') {
        return message.reply('❌ This command can only be used in groups.');
      }

      if (!args[0]) {
        const guide = this.config.guide.en.replace(/{p}/g, global.config.prefix);
        return message.reply(guide);
      }

      const action = args[0].toLowerCase();
      const thread = await global.db.getThread(String(chatId));

      if (action === 'on') {
        await global.db.updateThread(String(chatId), { antiOut: true });
        return message.reply('✅ Anti-out enabled! Users who leave will be automatically re-added.');
      } else if (action === 'off') {
        await global.db.updateThread(String(chatId), { antiOut: false });
        return message.reply('❌ Anti-out disabled.');
      } else if (action === 'status') {
        const status = thread.antiOut ? '✅ Enabled' : '❌ Disabled';
        return message.reply(`📊 Anti-out Status: ${status}`);
      } else {
        const guide = this.config.guide.en.replace(/{p}/g, global.config.prefix);
        return message.reply(`❌ Invalid option.\n\n${guide}`);
      }
    } catch (error) {
      global.log.error('Antiout error:', error);
      return message.reply(`❌ Error: ${error.message}`);
    }
  }
};
