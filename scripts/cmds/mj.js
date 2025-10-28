
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

module.exports = {
  config: {
    name: 'mj',
    aliases: ['midjourney'],
    author: 'ST',
    version: '1.2.1',
    cooldown: 15,
    role: 0,
    description: 'Generate images using Midjourney AI',
    category: 'image',
    usePrefix: true,
    guide: {
      en: `
Usage:
• {p}mj <prompt> - Generate 4 AI images

Example:
• {p}mj a beautiful sunset over mountains
• {p}mj anime girl with blue hair

After generation, click U1-U4 buttons to get individual high-quality images.
      `.trim()
    }
  },

  ST: async function ({ event, api, args, message, userId }) {
    try {
      if (!args[0]) {
        const guide = this.config.guide.en.replace(/{p}/g, global.config.prefix);
        return message.reply(`🎨 Midjourney AI Generator\n\n${guide}`);
      }

      const prompt = args.join(' ');
      const processingMsg = await message.reply('🎨 Generating your Midjourney images...\n⏳ This may take 30-60 seconds, please wait...');

      try {
        const apiUrl = `https://midjanuarybyxnil.onrender.com/imagine?prompt=${encodeURIComponent(prompt)}`;
        const response = await axios.get(apiUrl, { timeout: 120000 });

        if (!response.data.success) {
          await api.editMessageText(
            '❌ Failed to generate images. Please try again.',
            {
              chat_id: event.chat.id,
              message_id: processingMsg.message_id
            }
          );
          return;
        }

        const { murl, urls, taskId } = response.data;

        // Download and convert webp to high-quality jpg using sharp
        const imageResponse = await axios.get(murl, { responseType: 'arraybuffer' });
        const tmpDir = path.join(__dirname, '..', '..', 'tmp');
        
        if (!fs.existsSync(tmpDir)) {
          fs.mkdirSync(tmpDir, { recursive: true });
        }

        const tempWebpPath = path.join(tmpDir, `mj_${taskId}.webp`);
        const tempJpgPath = path.join(tmpDir, `mj_${taskId}.jpg`);

        fs.writeFileSync(tempWebpPath, Buffer.from(imageResponse.data));

        // Convert webp to high-quality jpg using sharp
        await sharp(tempWebpPath)
          .jpeg({ quality: 95, progressive: true })
          .toFile(tempJpgPath);

        // Delete webp file
        fs.unlinkSync(tempWebpPath);

        // Send the merged image with U1-U4 buttons
        const sentMsg = await api.sendPhoto(
          event.chat.id,
          fs.createReadStream(tempJpgPath),
          {
            caption: `✨ Midjourney Generation Complete!\n\n📝 Prompt: ${prompt}\n\n👇 Click buttons below to get individual images:`,
            reply_markup: {
              inline_keyboard: [
                [
                  { text: '🖼️ U1', callback_data: 'mj_u1' },
                  { text: '🖼️ U2', callback_data: 'mj_u2' }
                ],
                [
                  { text: '🖼️ U3', callback_data: 'mj_u3' },
                  { text: '🖼️ U4', callback_data: 'mj_u4' }
                ],
                [
                  { text: '🔄 Regenerate', callback_data: 'mj_regen' }
                ]
              ]
            }
          }
        );

        // Delete original processing message
        await api.deleteMessage(event.chat.id, processingMsg.message_id);

        // Clean up merged image after 5 seconds
        setTimeout(() => {
          if (fs.existsSync(tempJpgPath)) fs.unlinkSync(tempJpgPath);
        }, 5000);

        // Store callback data with image URLs
        global.ST.onCallback.set(sentMsg.message_id, {
          commandName: this.config.name,
          author: userId,
          urls: urls,
          prompt: prompt,
          taskId: taskId
        });

      } catch (error) {
        await api.editMessageText(
          `❌ Error: ${error.response?.data?.message || error.message}\n\n💡 The API might be slow or down. Please try again later.`,
          {
            chat_id: event.chat.id,
            message_id: processingMsg.message_id
          }
        );
        global.log.error('Midjourney API error:', error.message);
      }

    } catch (error) {
      global.log.error('MJ command error:', error);
      return message.reply(`❌ Error: ${error.message}`);
    }
  },

  onCallback: async function ({ event, api, Callback }) {
    try {
      const query = event;

      // Check if user is authorized
      if (query.from.id !== Callback.author) {
        return api.answerCallbackQuery(query.id, {
          text: '⚠️ This is not your generation!',
          show_alert: true
        });
      }

      const action = query.data;
      const { urls, prompt, taskId } = Callback;

      // Handle regenerate
      if (action === 'mj_regen') {
        await api.answerCallbackQuery(query.id, {
          text: '🔄 Regenerating images...'
        });

        const processingMsg = await api.sendMessage(
          query.message.chat.id,
          '🎨 Regenerating your Midjourney images...\n⏳ This may take 30-60 seconds, please wait...',
          { reply_to_message_id: query.message.message_id }
        );

        try {
          const apiUrl = `https://midjanuarybyxnil.onrender.com/imagine?prompt=${encodeURIComponent(prompt)}`;
          const response = await axios.get(apiUrl, { timeout: 120000 });

          if (!response.data.success) {
            await api.editMessageText(
              '❌ Failed to regenerate images. Please try again.',
              {
                chat_id: query.message.chat.id,
                message_id: processingMsg.message_id
              }
            );
            return;
          }

          const { murl: newMurl, urls: newUrls, taskId: newTaskId } = response.data;
          const imageResponse = await axios.get(newMurl, { responseType: 'arraybuffer' });
          const tmpDir = path.join(__dirname, '..', '..', 'tmp');
          
          if (!fs.existsSync(tmpDir)) {
            fs.mkdirSync(tmpDir, { recursive: true });
          }

          const tempWebpPath = path.join(tmpDir, `mj_${newTaskId}.webp`);
          const tempJpgPath = path.join(tmpDir, `mj_${newTaskId}.jpg`);

          fs.writeFileSync(tempWebpPath, Buffer.from(imageResponse.data));
          await sharp(tempWebpPath).jpeg({ quality: 95, progressive: true }).toFile(tempJpgPath);
          fs.unlinkSync(tempWebpPath);

          const sentMsg = await api.sendPhoto(
            query.message.chat.id,
            fs.createReadStream(tempJpgPath),
            {
              caption: `✨ Midjourney Regenerated!\n\n📝 Prompt: ${prompt}\n\n👇 Click buttons below to get individual images:`,
              reply_to_message_id: query.message.message_id,
              reply_markup: {
                inline_keyboard: [
                  [
                    { text: '🖼️ U1', callback_data: 'mj_u1' },
                    { text: '🖼️ U2', callback_data: 'mj_u2' }
                  ],
                  [
                    { text: '🖼️ U3', callback_data: 'mj_u3' },
                    { text: '🖼️ U4', callback_data: 'mj_u4' }
                  ],
                  [
                    { text: '🔄 Regenerate', callback_data: 'mj_regen' }
                  ]
                ]
              }
            }
          );

          await api.deleteMessage(query.message.chat.id, processingMsg.message_id);

          setTimeout(() => {
            if (fs.existsSync(tempJpgPath)) fs.unlinkSync(tempJpgPath);
          }, 5000);

          global.ST.onCallback.set(sentMsg.message_id, {
            commandName: this.config.name,
            author: Callback.author,
            urls: newUrls,
            prompt: prompt,
            taskId: newTaskId
          });

        } catch (error) {
          await api.editMessageText(
            `❌ Error: ${error.response?.data?.message || error.message}\n\n💡 The API might be slow or down. Please try again later.`,
            {
              chat_id: query.message.chat.id,
              message_id: processingMsg.message_id
            }
          );
        }
        return;
      }

      // Determine which image to send
      let imageIndex = -1;
      let buttonName = '';

      if (action === 'mj_u1') {
        imageIndex = 0;
        buttonName = 'U1';
      } else if (action === 'mj_u2') {
        imageIndex = 1;
        buttonName = 'U2';
      } else if (action === 'mj_u3') {
        imageIndex = 2;
        buttonName = 'U3';
      } else if (action === 'mj_u4') {
        imageIndex = 3;
        buttonName = 'U4';
      }

      if (imageIndex === -1 || !urls[imageIndex]) {
        return api.answerCallbackQuery(query.id, {
          text: '❌ Image not available',
          show_alert: true
        });
      }

      // Answer callback query
      await api.answerCallbackQuery(query.id, {
        text: `⏳ Sending ${buttonName} image...`
      });

      // Download and send the individual image
      const imageUrl = urls[imageIndex].url;
      const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });

      const tmpDir = path.join(__dirname, '..', '..', 'tmp');
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
      }

      const tempPngPath = path.join(tmpDir, `mj_${taskId}_${buttonName}.png`);
      const tempJpgPath = path.join(tmpDir, `mj_${taskId}_${buttonName}.jpg`);

      fs.writeFileSync(tempPngPath, Buffer.from(imageResponse.data));

      // Convert to high-quality jpg using sharp
      await sharp(tempPngPath)
        .jpeg({ quality: 95, progressive: true })
        .toFile(tempJpgPath);

      // Delete png file
      fs.unlinkSync(tempPngPath);

      // Send the individual image
      await api.sendPhoto(
        query.message.chat.id,
        fs.createReadStream(tempJpgPath),
        {
          caption: `🖼️ Image ${buttonName}\n\n📝 Prompt: ${prompt}`,
          reply_to_message_id: query.message.message_id
        }
      );

      // Clean up
      setTimeout(() => {
        if (fs.existsSync(tempJpgPath)) fs.unlinkSync(tempJpgPath);
      }, 5000);

    } catch (error) {
      global.log.error('MJ callback error:', error);
      await api.answerCallbackQuery(event.id, {
        text: '❌ Failed to send image',
        show_alert: true
      });
    }
  }
};
