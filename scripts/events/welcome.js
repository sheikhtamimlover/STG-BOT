module.exports = {
  config: {
    name: "welcome",
    author: "ST",
    version: "1.2.0",
    description: "Welcome new members and bot-added to groups",
    eventType: "new_member"
  },

  ST: async function ({ event, api, message, newMembers }) {
    try {
      const chatTitle = event.chat.title || 'this group';
      const chatId = event.chat.id;
      
      for (const member of newMembers) {
        if (member.is_bot && member.id === (await api.getMe()).id) {
          const addedBy = event.from;
          const addedByName = addedBy.first_name + (addedBy.last_name ? ' ' + addedBy.last_name : '');
          const addedByUsername = addedBy.username ? `@${addedBy.username}` : 'No username';
          
          // Check if group approval is enabled
          if (global.config.groupApproval?.enabled) {
            // Check if added by admin
            const isAdmin = global.config.adminUID.includes(String(addedBy.id));
            
            if (!isAdmin) {
              // Need approval
              const approvalId = await global.db.addApproval('group', {
                chatId: String(chatId),
                chatName: chatTitle,
                addedBy: String(addedBy.id),
                addedByName: addedByName
              });
              
              await message.send(
                `⏳ Thank you for adding me!\n\n` +
                `This bot requires admin approval to operate in new groups.\n` +
                `📩 An approval request has been sent to the bot owner.\n\n` +
                `Please wait for approval. The bot owner will review your request soon.\n\n` +
                `👤 Added by: ${addedByName}\n` +
                `🆔 Approval ID: ${approvalId}`
              );
              
              // Send approval request to all admins
              for (const adminId of global.config.adminUID) {
                try {
                  const ownerUsername = global.config.ownerName || 'Bot Owner';
                  await api.sendMessage(
                    adminId,
                    `🔔 New Group Approval Request\n\n` +
                    `📂 Group: ${chatTitle}\n` +
                    `🆔 Chat ID: ${chatId}\n` +
                    `👤 Added by: ${addedByName}\n` +
                    `📝 Username: ${addedByUsername}\n` +
                    `🆔 User ID: ${addedBy.id}\n` +
                    `🕐 Time: ${new Date().toLocaleString()}\n\n` +
                    `⏳ Waiting for approval...`,
                    {
                      reply_markup: {
                        inline_keyboard: [[
                          { text: '✅ Approve', callback_data: `approve_group_${approvalId}` },
                          { text: '❌ Reject', callback_data: `reject_group_${approvalId}` }
                        ]]
                      }
                    }
                  );
                } catch (err) {
                  global.log.error(`Failed to send approval to admin ${adminId}`);
                }
              }
              
              global.log.info(`Group approval request: ${chatTitle} by ${addedByName}`);
              continue;
            } else {
              // Auto-approve if added by admin
              await global.db.updateThread(String(chatId), { approved: true });
            }
          } else {
            // Auto-approve if group approval is disabled
            await global.db.updateThread(String(chatId), { approved: true });
          }
          
          const botWelcomeMessage = `🤖 Hello ${chatTitle}!\n\n` +
            `✅ Thank you for adding me to this group!\n\n` +
            `👤 Added by: ${addedByName} (${addedByUsername})\n` +
            `🆔 Added by ID: ${addedBy.id}\n\n` +
            `👑 Bot Owner: ${global.config.ownerName}\n` +
            `🆔 Owner ID: ${global.config.adminUID.join(', ') || 'Not set'}\n\n` +
            `⚙️ System Prefix: ${global.config.prefix}\n` +
            `💡 Usage: ${global.config.prefix}help\n\n` +
            `🎉 I'm ready to serve this group!\n` +
            `📝 Type ${global.config.prefix}help to see all available commands.`;
          
          await message.send(botWelcomeMessage);
          
          global.log.success(`Bot added to group: ${chatTitle} by ${addedByName} (${addedBy.id})`);
          continue;
        }
        
        if (member.is_bot) continue;
        
        const userName = member.first_name + (member.last_name ? ' ' + member.last_name : '');
        const userId = member.id;
        const username = member.username ? `@${member.username}` : 'No username';
        const mention = member.username ? `@${member.username}` : userName;
        
        const welcomeMessage = `👋 Welcome to ${chatTitle}!\n\n` +
          `👤 Name: ${userName}\n` +
          `📝 Username: ${mention}\n` +
          `🆔 User ID: ${userId}\n` +
          `📍 Group: ${chatTitle}\n\n` +
          `🎉 We're glad to have you here!\n` +
          `💡 Type ${global.config.prefix}help to see available commands.`;
        
        await message.send(welcomeMessage);
        
        global.log.info(`New member joined: ${userName} (${userId}) in ${chatTitle}`);
      }
    } catch (error) {
      global.log.error('Error in welcome event:', error);
    }
  }
};
