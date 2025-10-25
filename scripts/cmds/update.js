
module.exports = {
  config: {
    name: "update",
    aliases: [],
    author: "ST",
    version: "1.2.0",
    cooldown: 10,
    role: 2,
    description: "Check and install updates for STG BOT",
    category: "admin",
    usePrefix: true
  },

  ST: async function ({ event, api, message, args }) {
    try {
      const axios = require('axios');
      const currentVersion = require('../../package.json').version;

      // Fetch latest version info from GitHub
      let versions;
      try {
        const { data } = await axios.get('https://raw.githubusercontent.com/sheikhtamimlover/STG-BOT/main/version.json');
        versions = data;
      } catch (error) {
        return message.reply('❌ Failed to check for updates. Please try again later.');
      }

      const indexCurrentVersion = versions.findIndex(v => v.version === currentVersion);
      if (indexCurrentVersion === -1) {
        return message.reply(`⚠️ Cannot find current version ${currentVersion} in version list.`);
      }

      const versionsNeedToUpdate = versions.slice(indexCurrentVersion + 1);

      if (versionsNeedToUpdate.length === 0) {
        return message.reply(`✅ STG BOT is up to date!\n📦 Current version: ${currentVersion}`);
      }

      // Show update information
      let updateText = `🆕 New update available!\n\n`;
      updateText += `📦 Current version: ${currentVersion}\n`;
      updateText += `🎯 Latest version: ${versions[versions.length - 1].version}\n`;
      updateText += `📝 ${versionsNeedToUpdate.length} missed update(s)\n\n`;

      // Show ALL missed versions
      updateText += `📋 Missed Versions:\n`;
      versionsNeedToUpdate.forEach(v => {
        updateText += `  • v${v.version}${v.note ? ': ' + v.note : ''}\n`;
      });
      updateText += `\n`;

      // Show files that will be updated/deleted
      const allFiles = new Set();
      const allDeleteFiles = new Set();
      versionsNeedToUpdate.forEach(v => {
        if (v.files) {
          Object.keys(v.files).forEach(file => allFiles.add(file));
        }
        if (v.deleteFiles) {
          Object.keys(v.deleteFiles).forEach(file => allDeleteFiles.add(file));
        }
      });

      if (allFiles.size > 0) {
        updateText += `📁 Files to update/add: ${allFiles.size}\n`;
      }
      if (allDeleteFiles.size > 0) {
        updateText += `🗑️ Files to delete: ${allDeleteFiles.size}\n`;
      }

      // Show media content if available
      const allImageUrls = versionsNeedToUpdate.flatMap(v => v.imageUrl || []);
      const allVideoUrls = versionsNeedToUpdate.flatMap(v => v.videoUrl || []);
      const allAudioUrls = versionsNeedToUpdate.flatMap(v => v.audioUrl || []);

      if (allImageUrls.length > 0 || allVideoUrls.length > 0 || allAudioUrls.length > 0) {
        updateText += `\n📎 Media content:\n`;
        if (allImageUrls.length > 0) updateText += `🖼️ Images: ${allImageUrls.length}\n`;
        if (allVideoUrls.length > 0) updateText += `🎥 Videos: ${allVideoUrls.length}\n`;
        if (allAudioUrls.length > 0) updateText += `🎵 Audio: ${allAudioUrls.length}\n`;
      }

      // Send media if available
      if (allImageUrls.length > 0) {
        for (const imgUrl of allImageUrls.slice(0, 3)) {
          try {
            await api.sendPhoto(event.chat.id, imgUrl);
          } catch (error) {
            // Continue if image fails
          }
        }
      }

      const sentMsg = await api.sendMessage(event.chat.id, updateText, {
        reply_markup: {
          inline_keyboard: [[
            { text: '✅ Update Now', callback_data: 'update_confirm_yes' },
            { text: '❌ Cancel', callback_data: 'update_confirm_no' }
          ]]
        }
      });

      // Set up callback handler
      global.ST.onCallback.set(sentMsg.message_id, {
        commandName: 'update',
        messageID: sentMsg.message_id,
        author: event.from.id,
        chatId: event.chat.id
      });

    } catch (error) {
      global.log.error('Error in update command:', error);
      message.reply(`❌ Error: ${error.message}`);
    }
  },

  onCallback: async function ({ event, api, Callback }) {
    try {
      const data = event.data;
      
      // Check if authorized user
      if (Callback.author !== event.from.id) {
        return api.answerCallbackQuery(event.id, { text: '❌ You are not authorized' });
      }

      if (data === 'update_confirm_yes') {
        await api.answerCallbackQuery(event.id, { text: '✅ Starting update...' });
        await api.editMessageText(
          '🔄 Starting update process...\n\n✅ Auto-backup enabled\n✅ Auto-restore on failure\n\nPlease wait...',
          {
            chat_id: event.message.chat.id,
            message_id: event.message.message_id
          }
        );
        
        await this.executeUpdate(Callback.chatId, api);
        
      } else if (data === 'update_confirm_no') {
        await api.answerCallbackQuery(event.id, { text: '❌ Update cancelled' });
        await api.editMessageText(
          '❌ Update cancelled by user.',
          {
            chat_id: event.message.chat.id,
            message_id: event.message.message_id
          }
        );
      }

      global.ST.onCallback.delete(Callback.messageID);

    } catch (error) {
      global.log.error('Error in update onCallback:', error);
    }
  },

  executeUpdate: async function (chatId, api) {
    try {
      const fs = require('fs');
      const path = require('path');

      const { spawn } = require('child_process');
      const updateProcess = spawn('node', ['updater.js'], {
        stdio: 'pipe'
      });

      let outputBuffer = '';

      updateProcess.stdout.on('data', (data) => {
        const output = data.toString();
        outputBuffer += output;
        console.log(output);
      });

      updateProcess.stderr.on('data', (data) => {
        console.error(data.toString());
      });

      updateProcess.on('close', async (code) => {
        if (code === 0) {
          // Ensure tmp directory exists
          const tmpDir = path.join(__dirname, '..', '..', 'tmp');
          if (!fs.existsSync(tmpDir)) {
            fs.mkdirSync(tmpDir, { recursive: true });
          }

          // Save restart information (same as restart.js)
          const restartFile = path.join(tmpDir, 'restart.txt');
          const restartData = `${chatId} ${Date.now()}`;
          fs.writeFileSync(restartFile, restartData);

          await api.sendMessage(chatId, '✅ Update completed successfully!\n🔄 Restarting bot...');
          setTimeout(() => {
            process.exit(2);
          }, 2000);
        } else {
          await api.sendMessage(chatId, `❌ Update failed with code ${code}\n🔄 Auto-restore will activate on next restart`);
        }
      });

    } catch (error) {
      global.log.error('Error executing update:', error);
      await api.sendMessage(chatId, `❌ Update execution failed: ${error.message}`);
    }
  }
};
