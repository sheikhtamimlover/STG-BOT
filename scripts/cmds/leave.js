
module.exports = {
  config: {
    name: "leave",
    aliases: ["leavegc"],
    author: "ST",
    version: "1.2.1",
    cooldown: 5,
    role: 1,
    description: "Bot leaves selected group",
    category: "admin",
    usePrefix: true,
    guide: {
      en: `
Usage:
• {p}leave - Show list of all groups
• Reply with group number - Bot will leave that group

Example:
• {p}leave - Shows group list
• Reply: 1 - Bot leaves group #1
      `.trim()
    }
  },

  ST: async function ({ event, api, args, message, userId }) {
    try {
      const allThreads = await global.db.getAllThreads();
      const groups = allThreads.filter(t => t.type === 'group' || t.type === 'supergroup');

      if (groups.length === 0) {
        return message.reply('❌ Bot is not in any groups.');
      }

      let groupList = `📋 Groups Bot is In (${groups.length}):\n\n`;
      groups.forEach((group, index) => {
        groupList += `${index + 1}. ${group.name || 'Unknown Group'}\n`;
        groupList += `   🆔 ${group.id}\n`;
        groupList += `   👥 ${group.totalUsers || 0} members\n\n`;
      });

      groupList += `💡 Reply with the group number to leave that group.`;

      const sentMsg = await message.reply(groupList);

      global.ST.onReply.set(sentMsg.message_id, {
        commandName: this.config.name,
        type: 'selectLeave',
        messageID: sentMsg.message_id,
        author: userId,
        groups: groups
      });

    } catch (error) {
      global.log.error('Leave command error:', error);
      return message.reply(`❌ Error: ${error.message}`);
    }
  },

  onReply: async function ({ event, api, Reply, message }) {
    try {
      const { groups } = Reply;
      const input = (event.text || '').trim();
      const number = parseInt(input);

      if (isNaN(number) || number < 1 || number > groups.length) {
        return message.reply(`❌ Invalid number. Please enter 1-${groups.length}`);
      }

      const selectedGroup = groups[number - 1];
      const groupName = selectedGroup.name || 'Unknown Group';
      const groupId = selectedGroup.id;

      try {
        await api.sendMessage(
          groupId,
          `👋 Goodbye! Admin has requested me to leave this group.\n\n` +
          `If you want me back, contact: ${global.config.ownerName}`
        );
        
        await api.leaveChat(groupId);
        
        await message.reply(`✅ Successfully left: ${groupName} (${groupId})`);
        global.log.success(`Bot left group: ${groupName} (${groupId})`);
      } catch (error) {
        return message.reply(`❌ Failed to leave ${groupName}: ${error.message}`);
      }

    } catch (error) {
      global.log.error('Leave onReply error:', error);
      return message.reply(`❌ Error: ${error.message}`);
    }
  }
};
