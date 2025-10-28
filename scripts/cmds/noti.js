
const fs = require('fs');

module.exports = {
  config: {
    name: "noti",
    aliases: ["broadcast", "announce"],
    author: "ST",
    version: "1.2.1",
    cooldown: 10,
    role: 2,
    description: "Send notifications to users/groups",
    category: "admin",
    usePrefix: true,
    guide: {
      en: `
Usage:
• {p}noti all <message> - Send to all groups and DM users
• {p}noti <tid/uid> <message> - Send to specific chat/user (can be multiple, comma-separated)
• {p}noti list - Show group list, reply with numbers to send
• {p}noti dm - Show DM user list, reply with numbers to send

Examples:
• {p}noti all Server maintenance in 1 hour
• {p}noti -1001234567890 Hello group!
• {p}noti 123456789,987654321 Personal message
• Reply to image: {p}noti all Check this update!

Note: You can reply to image/video/document to send with attachment.
      `.trim()
    }
  },

  ST: async function ({ event, api, args, message, userId }) {
    try {
      if (!args[0]) {
        const guide = this.config.guide.en.replace(/{p}/g, global.config.prefix);
        return message.reply(guide);
      }

      const subCommand = args[0].toLowerCase();

      // Show group list
      if (subCommand === 'list') {
        const allThreads = await global.db.getAllThreads();
        const groups = allThreads.filter(t => t.type === 'group' || t.type === 'supergroup');

        if (groups.length === 0) {
          return message.reply('❌ Bot is not in any groups.');
        }

        let groupList = `📋 All Groups (${groups.length}):\n\n`;
        groups.forEach((group, index) => {
          groupList += `${index + 1}. ${group.name || 'Unknown'}\n`;
          groupList += `   TID: ${group.id}\n`;
          groupList += `   👥 ${group.totalUsers || 0} members\n\n`;
        });

        groupList += `💡 Reply with numbers (e.g., 1,3,5) and message to send notification.`;

        const sentMsg = await message.reply(groupList);
        global.ST.onReply.set(sentMsg.message_id, {
          commandName: this.config.name,
          type: 'groupList',
          messageID: sentMsg.message_id,
          author: userId,
          groups: groups
        });
        return;
      }

      // Show DM user list
      if (subCommand === 'dm') {
        const allUsers = await global.db.getAllUsers();
        const dmUsers = allUsers.filter(u => u.dmApproved);

        if (dmUsers.length === 0) {
          return message.reply('❌ No approved DM users.');
        }

        let userList = `📋 DM Approved Users (${dmUsers.length}):\n\n`;
        dmUsers.slice(0, 50).forEach((user, index) => {
          const name = user.firstName + (user.lastName ? ' ' + user.lastName : '');
          userList += `${index + 1}. ${name}\n`;
          userList += `   UID: ${user.id}\n\n`;
        });

        if (dmUsers.length > 50) {
          userList += `... and ${dmUsers.length - 50} more users\n\n`;
        }

        userList += `💡 Reply with numbers (e.g., 1,3,5) and message to send notification.`;

        const sentMsg = await message.reply(userList);
        global.ST.onReply.set(sentMsg.message_id, {
          commandName: this.config.name,
          type: 'dmList',
          messageID: sentMsg.message_id,
          author: userId,
          users: dmUsers
        });
        return;
      }

      // Send to all
      if (subCommand === 'all') {
        if (!args[1]) {
          return message.reply('❌ Please provide a message.');
        }

        const notiMessage = args.slice(1).join(" ");
        return await this.sendBroadcast(api, message, event, notiMessage, 'all');
      }

      // Send to specific chats/users
      if (args[0].match(/^-?\d+/) || args[0].includes(',')) {
        const targets = args[0].split(',').map(t => t.trim());
        const notiMessage = args.slice(1).join(" ");

        if (!notiMessage) {
          return message.reply('❌ Please provide a message.');
        }

        return await this.sendBroadcast(api, message, event, notiMessage, 'specific', targets);
      }

      const guide = this.config.guide.en.replace(/{p}/g, global.config.prefix);
      return message.reply(`❌ Invalid usage.\n\n${guide}`);

    } catch (error) {
      global.log.error('Noti error:', error);
      return message.reply(`❌ Error: ${error.message}`);
    }
  },

  onReply: async function ({ event, api, Reply, message }) {
    try {
      const { type, groups, users } = Reply;
      const input = (event.text || '').trim();

      if (!input.includes(' ')) {
        return message.reply('❌ Format: <numbers> <message>\nExample: 1,3,5 Hello everyone!');
      }

      const parts = input.split(' ');
      const numbers = parts[0].split(',').map(n => parseInt(n.trim()));
      const notiMessage = parts.slice(1).join(' ');

      if (type === 'groupList') {
        const selectedGroups = numbers
          .filter(n => !isNaN(n) && n >= 1 && n <= groups.length)
          .map(n => groups[n - 1]);

        if (selectedGroups.length === 0) {
          return message.reply('❌ No valid group numbers provided.');
        }

        const targets = selectedGroups.map(g => g.id);
        return await this.sendBroadcast(api, message, event, notiMessage, 'specific', targets);
      }

      if (type === 'dmList') {
        const selectedUsers = numbers
          .filter(n => !isNaN(n) && n >= 1 && n <= users.length)
          .map(n => users[n - 1]);

        if (selectedUsers.length === 0) {
          return message.reply('❌ No valid user numbers provided.');
        }

        const targets = selectedUsers.map(u => u.id);
        return await this.sendBroadcast(api, message, event, notiMessage, 'specific', targets);
      }

    } catch (error) {
      global.log.error('Noti onReply error:', error);
      return message.reply(`❌ Error: ${error.message}`);
    }
  },

  sendBroadcast: async function (api, message, event, notiMessage, mode, targets = []) {
    try {
      const statusMsg = await message.reply('⏳ Sending notifications...');

      // Handle attachments
      const attachments = [];
      const replyMsg = event.reply_to_message;
      
      if (replyMsg) {
        if (replyMsg.photo && replyMsg.photo.length > 0) {
          const photo = replyMsg.photo[replyMsg.photo.length - 1];
          const filePath = await message.downloadAttachment({ type: 'photo', data: photo });
          if (filePath && fs.existsSync(filePath)) {
            attachments.push(filePath);
          }
        } else if (replyMsg.video) {
          const filePath = await message.downloadAttachment({ type: 'video', data: replyMsg.video });
          if (filePath && fs.existsSync(filePath)) {
            attachments.push(filePath);
          }
        } else if (replyMsg.document) {
          const filePath = await message.downloadAttachment({ type: 'document', data: replyMsg.document });
          if (filePath && fs.existsSync(filePath)) {
            attachments.push(filePath);
          }
        }
      }

      const finalMessage = `📢 Notification from Admin\n\n${notiMessage}`;

      let recipients = [];
      if (mode === 'all') {
        const allThreads = await global.db.getAllThreads();
        const allUsers = await global.db.getAllUsers();
        
        recipients = [
          ...allThreads.filter(t => t.type === 'group' || t.type === 'supergroup').map(t => t.id),
          ...allUsers.filter(u => u.dmApproved).map(u => u.id)
        ];
      } else {
        recipients = targets;
      }

      let success = 0;
      let failed = 0;

      for (const chatId of recipients) {
        try {
          const msgUtils = new global.utils.MessageUtils(api, { ...event, chat: { id: chatId } });
          
          if (attachments.length > 0) {
            await msgUtils.sendAttachment({
              body: finalMessage,
              attachment: attachments.map(p => fs.createReadStream(p))
            });
          } else {
            await api.sendMessage(chatId, finalMessage);
          }
          success++;
        } catch (err) {
          failed++;
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Cleanup temp files
      attachments.forEach(filePath => {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      });

      await api.editMessageText(
        `✅ Broadcast Complete!\n\n` +
        `✓ Sent: ${success}\n` +
        `✗ Failed: ${failed}\n` +
        `📊 Total: ${recipients.length}`,
        {
          chat_id: event.chat.id,
          message_id: statusMsg.message_id
        }
      );

    } catch (error) {
      global.log.error('Broadcast error:', error);
      throw error;
    }
  }
};
