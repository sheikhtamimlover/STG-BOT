
module.exports = {
  config: {
    name: "dmapproval",
    aliases: ["dma"],
    author: "ST",
    version: "1.2.0",
    cooldown: 5,
    role: 2,
    description: "Manage DM approval requests\n\nUsage:\n- /dma - View pending approvals\n- /dma approved - View approved users\n- Reply with 'a <number>' to approve\n- Reply with 'r <number>' to reject/revoke",
    category: "admin",
    usePrefix: true
  },

  onReply: async function({ event, api, Reply, args, message }) {
    try {
      const { type, list } = Reply;
      
      // Get full text from event
      const fullText = (event.text || '').trim().toLowerCase();
      
      if (!fullText) {
        return message.reply('❌ Invalid format. Use: a <number> to approve or r <number> to reject');
      }
      
      const action = fullText.charAt(0);
      const index = parseInt(fullText.slice(1)) - 1;
      
      if ((action !== 'a' && action !== 'r') || isNaN(index) || index < 0 || index >= list.length) {
        return message.reply('❌ Invalid format. Use: a <number> to approve or r <number> to reject');
      }
      
      const item = list[index];
      
      if (type === 'pending') {
        // Handle pending approvals
        if (action === 'a') {
          await global.db.updateUser(item.userId, { dmApproved: true });
          await global.db.removeApproval(item.id);
          
          try {
            await api.sendMessage(
              item.userId,
              `🎉 Great news!\n\n` +
              `✅ Your DM access has been approved!\n` +
              `You can now use the bot in private messages.\n\n` +
              `Type ${global.config.prefix}help to see all available commands.`
            );
          } catch (err) {
            // User might have blocked the bot
          }
          
          await message.reply(
            `✅ Approved user:\n` +
            `👤 ${item.userName}\n` +
            `🆔 ${item.userId}`
          );
        } else {
          await global.db.banUser(item.userId, 'DM access rejected', String(event.from.id));
          await global.db.removeApproval(item.id);
          
          try {
            await api.sendMessage(
              item.userId,
              `❌ Your DM access request was rejected.\n\nYou have been banned from using this bot.`
            );
          } catch (err) {
            // User might have blocked the bot
          }
          
          await message.reply(
            `✅ Rejected and banned user:\n` +
            `👤 ${item.userName}\n` +
            `🆔 ${item.userId}`
          );
        }
      } else if (type === 'approved') {
        // Handle approved users (revoke approval)
        if (action === 'r') {
          await global.db.updateUser(item.id, { dmApproved: false });
          await global.db.banUser(item.id, 'DM approval revoked', String(event.from.id));
          
          try {
            await api.sendMessage(
              item.id,
              `❌ Your DM access has been revoked and you have been banned.`
            );
          } catch (err) {
            // User might have blocked the bot
          }
          
          await message.reply(
            `✅ Revoked approval and banned user:\n` +
            `👤 ${item.firstName || 'Unknown'}\n` +
            `🆔 ${item.id}`
          );
        } else {
          await message.reply('❌ Can only use "r" to revoke approved users');
        }
      }
      
    } catch (error) {
      await message.reply(`❌ Error: ${error.message}`);
    }
  },

  ST: async function ({ event, api, message, args }) {
    try {
      const option = args[0]?.toLowerCase();
      
      if (option === 'approved') {
        // Show approved users
        const allUsers = await global.db.getAllUsers();
        const approvedUsers = allUsers.filter(u => u.dmApproved === true);
        
        if (approvedUsers.length === 0) {
          return message.reply('✅ No approved DM users yet');
        }
        
        let text = `✅ Approved DM Users (${approvedUsers.length})\n\n`;
        
        approvedUsers.forEach((user, index) => {
          text += `${index + 1}. ${user.firstName || 'Unknown'}\n`;
          text += `   📝 @${user.username || 'No username'}\n`;
          text += `   🆔 User ID: ${user.id}\n`;
          text += `   📅 ${new Date(user.createdAt).toLocaleString()}\n\n`;
        });
        
        text += `💡 Reply with "r <number>" to revoke approval and ban\n`;
        text += `Example: r 1 (revokes first user)`;
        
        const msg = await message.reply(text);
        
        global.ST.onReply.set(msg.message_id, {
          commandName: this.config.name,
          messageID: msg.message_id,
          author: event.from.id,
          type: 'approved',
          list: approvedUsers
        });
        
      } else {
        // Show pending approvals (default)
        const approvals = await global.db.getAllApprovals('dm');
        
        if (approvals.length === 0) {
          return message.reply('✅ No pending DM approval requests');
        }
        
        let text = `⏳ Pending DM Approvals (${approvals.length})\n\n`;
        
        approvals.forEach((approval, index) => {
          text += `${index + 1}. ${approval.userName}\n`;
          text += `   📝 @${approval.username}\n`;
          text += `   🆔 User ID: ${approval.userId}\n`;
          text += `   🕐 ${new Date(approval.createdAt).toLocaleString()}\n\n`;
        });
        
        text += `💡 Reply with:\n`;
        text += `  • "a <number>" to approve\n`;
        text += `  • "r <number>" to reject and ban\n`;
        text += `Example: a 1 (approves first user) or r 1 (rejects first user)\n\n`;
        text += `💡 Use /dma approved to see approved users`;
        
        const msg = await message.reply(text);
        
        global.ST.onReply.set(msg.message_id, {
          commandName: this.config.name,
          messageID: msg.message_id,
          author: event.from.id,
          type: 'pending',
          list: approvals
        });
      }
      
    } catch (error) {
      await message.reply(`❌ Error: ${error.message}`);
    }
  }
};
