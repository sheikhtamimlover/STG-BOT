
module.exports = {
  config: {
    name: "callad",
    aliases: [],
    author: "ST",
    version: "1.2.1",
    cooldown: 30,
    role: 0,
    description: "Send message to bot admins",
    category: "utility",
    usePrefix: true,
    guide: {
      en: `
Usage:
• {p}callad <message> - Send message to admins
• Reply to image/video/document with {p}callad <message> - Send with attachment

Examples:
• {p}callad I need help with something
• Reply to image: {p}callad Check this out

Note: You can reply to multiple images/files.
      `.trim()
    }
  },

  ST: async function ({ event, api, args, message, userId, chatId }) {
    try {
      if (!args[0]) {
        const guide = this.config.guide.en.replace(/{p}/g, global.config.prefix);
        return message.reply(`❌ Please provide a message.\n\n${guide}`);
      }

      const userMessage = args.join(" ");
      const user = await global.db.getUser(String(userId));
      const userName = user.firstName + (user.lastName ? ' ' + user.lastName : '');
      const username = user.username ? `@${user.username}` : 'No username';

      let groupInfo = '';
      if (event.chat.type === 'group' || event.chat.type === 'supergroup') {
        groupInfo = `\n📂 Group: ${event.chat.title}\n🆔 Group ID: ${chatId}`;
      }

      let adminMessage = `📢 Message from User\n\n` +
        `👤 Name: ${userName}\n` +
        `📝 Username: ${username}\n` +
        `🆔 User ID: ${userId}${groupInfo}\n\n` +
        `💬 Message:\n${userMessage}`;

      // Handle attachments
      const attachments = [];
      const replyMsg = event.reply_to_message;
      
      if (replyMsg) {
        // Handle photos
        if (replyMsg.photo && replyMsg.photo.length > 0) {
          const photo = replyMsg.photo[replyMsg.photo.length - 1];
          const filePath = await message.downloadAttachment({ type: 'photo', data: photo });
          if (filePath && fs.existsSync(filePath)) {
            attachments.push(fs.createReadStream(filePath));
          }
        }
        // Handle video
        else if (replyMsg.video) {
          const filePath = await message.downloadAttachment({ type: 'video', data: replyMsg.video });
          if (filePath && fs.existsSync(filePath)) {
            attachments.push(fs.createReadStream(filePath));
          }
        }
        // Handle document
        else if (replyMsg.document) {
          const filePath = await message.downloadAttachment({ type: 'document', data: replyMsg.document });
          if (filePath && fs.existsSync(filePath)) {
            attachments.push(fs.createReadStream(filePath));
          }
        }
      }

      // Send to all admins
      let sentCount = 0;
      for (const adminId of global.config.adminUID) {
        try {
          const adminMessage_utils = new global.utils.MessageUtils(api, { ...event, chat: { id: adminId } });
          
          if (attachments.length > 0) {
            await adminMessage_utils.sendAttachment({
              body: adminMessage,
              attachment: attachments
            });
          } else {
            await api.sendMessage(adminId, adminMessage);
          }
          sentCount++;
        } catch (err) {
          global.log.error(`Failed to send to admin ${adminId}: ${err.message}`);
        }
      }

      if (sentCount > 0) {
        return message.reply(`✅ Your message has been sent to ${sentCount} admin(s).\n\nThey will respond as soon as possible.`);
      } else {
        return message.reply('❌ Failed to send message to admins. Please try again later.');
      }

    } catch (error) {
      global.log.error('Callad error:', error);
      return message.reply(`❌ Error: ${error.message}`);
    }
  }
};
