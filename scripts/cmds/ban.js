
module.exports = {
  config: {
    name: "ban",
    aliases: ["block"],
    author: "ST",
    version: "1.2.0",
    cooldown: 3,
    role: 1,
    description: "Ban/unban users from using the bot",
    category: "admin",
    usePrefix: true
  },

  onReply: async function({ event, api, Reply, args, message }) {
    try {
      const { bans } = Reply;
      
      // Get full text from event
      const fullText = (event.text || '').trim().toLowerCase();
      
      if (!fullText || !fullText.startsWith('u')) {
        return message.reply('❌ Invalid format. Use: u <number>');
      }
      
      const index = parseInt(fullText.slice(1)) - 1;
      
      if (isNaN(index) || index < 0 || index >= bans.length) {
        return message.reply('❌ Invalid ban number');
      }
      
      const ban = bans[index];
      await global.db.unbanUser(ban.userId);
      
      await message.reply(
        `✅ Unbanned user successfully!\n` +
        `🆔 User ID: ${ban.userId}`
      );
      
    } catch (error) {
      await message.reply(`❌ Error: ${error.message}`);
    }
  },

  ST: async function ({ event, api, args, message, chatId }) {
    try {
      const subCommand = args[0]?.toLowerCase();
      
      if (subCommand === 'list') {
        const bans = await global.db.getAllBans();
        
        if (bans.length === 0) {
          return message.reply('✅ No banned users');
        }
        
        let text = `📋 Banned Users (${bans.length})\n\n`;
        
        bans.forEach((ban, index) => {
          text += `${index + 1}. User ID: ${ban.userId}\n`;
          text += `   📝 Reason: ${ban.reason || 'No reason'}\n`;
          text += `   👤 Banned by: ${ban.bannedBy || 'Unknown'}\n`;
          text += `   🕐 ${new Date(ban.bannedAt).toLocaleString()}\n\n`;
        });
        
        text += `💡 Reply with "u <number>" to unban\n`;
        text += `Example: u 1 (unbans first user)`;
        
        const msg = await message.reply(text);
        
        global.ST.onReply.set(msg.message_id, {
          commandName: this.config.name,
          messageID: msg.message_id,
          author: event.from.id,
          bans
        });
        
        return;
      }
      
      // Ban user
      let targetId = null;
      let reason = '';
      
      if (event.reply_to_message && event.reply_to_message.from) {
        targetId = event.reply_to_message.from.id;
        reason = args.join(' ') || 'No reason provided';
      } else if (args[0] && /^\d+$/.test(args[0])) {
        targetId = args[0];
        reason = args.slice(1).join(' ') || 'No reason provided';
      }
      
      if (!targetId) {
        return message.reply(
          `❌ Usage:\n` +
          `${global.config.prefix}ban <user_id> [reason] - Ban user by ID\n` +
          `${global.config.prefix}ban [reason] - Reply to user's message\n` +
          `${global.config.prefix}ban list - View all banned users`
        );
      }
      
      if (global.config.adminUID.includes(String(targetId))) {
        return message.reply('❌ Cannot ban bot admins');
      }
      
      await global.db.banUser(String(targetId), reason, String(event.from.id));
      
      // Kick from group if in group
      if (event.chat.type === 'group' || event.chat.type === 'supergroup') {
        try {
          await api.banChatMember(chatId, targetId);
          await message.reply(
            `✅ User banned and kicked from group!\n` +
            `🆔 User ID: ${targetId}\n` +
            `📝 Reason: ${reason}`
          );
        } catch (err) {
          await message.reply(
            `✅ User banned!\n` +
            `🆔 User ID: ${targetId}\n` +
            `📝 Reason: ${reason}\n\n` +
            `⚠️ Failed to kick from group: ${err.message}`
          );
        }
      } else {
        await message.reply(
          `✅ User banned!\n` +
          `🆔 User ID: ${targetId}\n` +
          `📝 Reason: ${reason}`
        );
      }
      
    } catch (error) {
      await message.reply(`❌ Error: ${error.message}`);
    }
  }
};
