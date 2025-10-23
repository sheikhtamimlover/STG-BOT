
const axios = require('axios');
const FormData = require('form-data');
const path = require('path');
const fs = require('fs');

module.exports = {
  config: {
    name: "streport",
    aliases: ["report", "bug"],
    version: "1.0.0",
    author: "ST",
    cooldown: 30,
    role: 0,
    description: "Send report with message and attachments to bot owner",
    category: "Owner",
    usePrefix: true
  },

  ST: async function ({ event, api, args, message }) {
    try {
      if (!args[0]) {
        return message.reply(
          "⚠️ Please provide a report message!\n\n" +
          `Usage:\n` +
          `${global.config.prefix}streport <your message>\n\n` +
          `You can also reply to photos/videos/audios with:\n` +
          `${global.config.prefix}streport <your message>`
        );
      }

      const reportMessage = args.join(" ");
      const chatId = String(event.chat.id);
      const userId = String(event.from.id);

      await message.reply("📤 Sending your report to bot owner...");

      // Collect attachments from current message and reply
      const allAttachments = [];
      
      // Get attachments from current message
      if (event.photo) allAttachments.push({ type: 'photo', data: event.photo[event.photo.length - 1] });
      if (event.video) allAttachments.push({ type: 'video', data: event.video });
      if (event.audio) allAttachments.push({ type: 'audio', data: event.audio });
      if (event.document && event.document.mime_type?.startsWith('image/')) {
        allAttachments.push({ type: 'photo', data: event.document });
      }

      // Get attachments from reply message
      if (event.reply_to_message) {
        const reply = event.reply_to_message;
        if (reply.photo) allAttachments.push({ type: 'photo', data: reply.photo[reply.photo.length - 1] });
        if (reply.video) allAttachments.push({ type: 'video', data: reply.video });
        if (reply.audio) allAttachments.push({ type: 'audio', data: reply.audio });
        if (reply.document && reply.document.mime_type?.startsWith('image/')) {
          allAttachments.push({ type: 'photo', data: reply.document });
        }
      }

      // Prepare form data
      const packageJsonPath = path.join(__dirname, "../../package.json");
      const packageVersion = require(packageJsonPath).version;
      const formData = new FormData();
      
      formData.append('uid', userId);
      formData.append('threadId', chatId);
      formData.append('version', packageVersion);
      formData.append('message', reportMessage);

      // Download and attach files
      if (allAttachments.length > 0) {
        const tmpDir = path.join(__dirname, '..', '..', 'tmp');
        if (!fs.existsSync(tmpDir)) {
          fs.mkdirSync(tmpDir, { recursive: true });
        }

        for (let i = 0; i < allAttachments.length; i++) {
          const attachment = allAttachments[i];
          try {
            const fileId = attachment.data.file_id;
            const file = await api.getFile(fileId);
            const fileUrl = `https://api.telegram.org/file/bot${global.config.token}/${file.file_path}`;
            
            // Download file
            const response = await axios({
              method: 'GET',
              url: fileUrl,
              responseType: 'arraybuffer'
            });

            // Determine file extension
            let fileExt = 'jpg';
            if (attachment.type === 'video') fileExt = 'mp4';
            else if (attachment.type === 'audio') fileExt = 'mp3';

            const fileName = `attachment_${i + 1}.${fileExt}`;
            const tempPath = path.join(tmpDir, fileName);
            
            // Save temporarily
            fs.writeFileSync(tempPath, Buffer.from(response.data));
            
            // Append to form
            formData.append('attachments', fs.createReadStream(tempPath), {
              filename: fileName,
              contentType: this.getContentType(attachment.type)
            });
          } catch (downloadError) {
            global.log.error(`Error downloading attachment ${i}:`, downloadError.message);
          }
        }
      }

      // Send to API
      const stbotApi = new global.utils.STBotApis();
      await axios.post(`${stbotApi.baseURL}/api/feedback`, formData, {
        headers: {
          ...formData.getHeaders(),
          'Content-Type': `multipart/form-data; boundary=${formData.getBoundary()}`
        }
      });

      // Clean up temp files
      const tmpDir = path.join(__dirname, '..', '..', 'tmp');
      if (fs.existsSync(tmpDir)) {
        const files = fs.readdirSync(tmpDir);
        files.forEach(file => {
          if (file.startsWith('attachment_')) {
            try {
              fs.unlinkSync(path.join(tmpDir, file));
            } catch (err) {
              // Ignore cleanup errors
            }
          }
        });
      }

      return message.reply(
        "✅ Your report has been sent to the bot owner!\n\n" +
        "📱 The owner will review your feedback and address any issues.\n" +
        "🔄 Check /update regularly for the latest bot improvements."
      );

    } catch (error) {
      global.log.error('STReport Error:', error.message);
      return message.reply("❌ Failed to send your report. Please try again later.");
    }
  },

  getContentType: function(attachmentType) {
    switch (attachmentType) {
      case 'photo':
        return 'image/jpeg';
      case 'video':
        return 'video/mp4';
      case 'audio':
        return 'audio/mpeg';
      default:
        return 'application/octet-stream';
    }
  }
};
