
module.exports = {
  config: {
    name: "groupapproval",
    aliases: [],
    author: "ST",
    version: "1.2.0",
    cooldown: 5,
    role: 2,
    description: "Manage group approval requests\n\nUsage:\n- /ga - View pending approvals\n- /ga approved - View approved groups\n- Reply with 'a <number>' to approve\n- Reply with 'r <number>' to reject/move to rejected",
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
          await global.db.updateThread(item.chatId, { approved: true });
          await global.db.removeApproval(item.id);
          
          try {
            await api.sendMessage(
              item.chatId,
              `🎉 Great news!\n\n` +
              `✅ This group has been approved by the bot admin.\n` +
              `I'm now ready to serve this group!\n\n` +
              `Type ${global.config.prefix}help to see all available commands.`
            );
          } catch (err) {
            // Group might be inaccessible
          }
          
          await message.reply(
            `✅ Approved group:\n` +
            `📂 ${item.chatName}\n` +
            `🆔 ${item.chatId}`
          );
        } else {
          await global.db.removeApproval(item.id);
          
          try {
            await api.sendMessage(
              item.chatId,
              `❌ This group was rejected by the bot admin.\n\nThe bot will now leave this group.`
            );
            await api.leaveChat(item.chatId);
            
            await message.reply(
              `✅ Rejected and left group:\n` +
              `📂 ${item.chatName}\n` +
              `🆔 ${item.chatId}`
            );
          } catch (err) {
            await message.reply(`❌ Failed to leave group: ${err.message}`);
          }
        }
      } else if (type === 'approved') {
        // Handle approved groups (move to rejected)
        if (action === 'r') {
          await global.db.updateThread(item.id, { approved: false });
          
          try {
            await api.sendMessage(
              item.id,
              `❌ This group's approval has been revoked.\n\nThe bot will now leave this group.`
            );
            await api.leaveChat(item.id);
            
            await message.reply(
              `✅ Revoked approval and left group:\n` +
              `📂 ${item.name}\n` +
              `🆔 ${item.id}`
            );
          } catch (err) {
            await message.reply(`✅ Approval revoked (failed to leave: ${err.message})`);
          }
        } else {
          await message.reply('❌ Can only use "r" to revoke approved groups');
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
        // Show approved groups
        const allThreads = await global.db.getAllThreads();
        const approvedGroups = allThreads.filter(t => t.approved === true);
        
        if (approvedGroups.length === 0) {
          return message.reply('✅ No approved groups yet');
        }
        
        let text = `✅ Approved Groups (${approvedGroups.length})\n\n`;
        
        approvedGroups.forEach((group, index) => {
          text += `${index + 1}. ${group.name || 'Unknown'}\n`;
          text += `   🆔 Chat ID: ${group.id}\n`;
          text += `   📅 ${new Date(group.createdAt).toLocaleString()}\n\n`;
        });
        
        text += `💡 Reply with "r <number>" to revoke approval and leave\n`;
        text += `Example: r 1 (revokes first group)`;
        
        const msg = await message.reply(text);
        
        global.ST.onReply.set(msg.message_id, {
          commandName: this.config.name,
          messageID: msg.message_id,
          author: event.from.id,
          type: 'approved',
          list: approvedGroups
        });
        
      } else {
        // Show pending approvals (default)
        const approvals = await global.db.getAllApprovals('group');
        
        if (approvals.length === 0) {
          return message.reply('✅ No pending group approval requests');
        }
        
        let text = `⏳ Pending Group Approvals (${approvals.length})\n\n`;
        
        approvals.forEach((approval, index) => {
          text += `${index + 1}. ${approval.chatName}\n`;
          text += `   🆔 Chat ID: ${approval.chatId}\n`;
          text += `   👤 Added by: ${approval.addedByName}\n`;
          text += `   🕐 ${new Date(approval.createdAt).toLocaleString()}\n\n`;
        });
        
        text += `💡 Reply with:\n`;
        text += `  • "a <number>" to approve\n`;
        text += `  • "r <number>" to reject and leave\n`;
        text += `Example: a 1 (approves first group) or r 1 (rejects first group)\n\n`;
        text += `💡 Use /ga approved to see approved groups`;
        
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
