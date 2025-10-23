
module.exports = {
  config: {
    name: "update",
    aliases: [],
    author: "ST",
    version: "1.0.0",
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
      updateText += `📝 ${versionsNeedToUpdate.length} update(s) available\n\n`;

      // Show version notes
      const versionNotes = versionsNeedToUpdate
        .filter(v => v.note)
        .map(v => `• v${v.version}: ${v.note}`)
        .join('\n');

      if (versionNotes) {
        updateText += `📋 What's New:\n${versionNotes}\n\n`;
      }

      // Show files that will be updated
      const allFiles = new Set();
      versionsNeedToUpdate.forEach(v => {
        if (v.files) {
          Object.keys(v.files).forEach(file => allFiles.add(file));
        }
      });

      if (allFiles.size > 0) {
        updateText += `📁 Files to update: ${allFiles.size}\n`;
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

      updateText += `\n💡 Reply "yes" to this message to update now.`;

      const sentMsg = await message.reply(updateText);

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

      // Set up reply handler
      global.ST.onReply.set(sentMsg.message_id, {
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

  onReply: async function ({ event, api, Reply, message }) {
    try {
      const userReply = (event.text || '').toLowerCase().trim();
      
      if (Reply.author !== event.from.id) {
        return;
      }

      if (userReply === 'yes') {
        await message.reply('🔄 Starting update process...\nPlease wait, the bot will restart automatically.');

        // Execute update script
        const { exec } = require('child_process');
        exec('node update.js', (error, stdout, stderr) => {
          if (error) {
            api.sendMessage(Reply.chatId, `❌ Update failed: ${error.message}`);
            return;
          }
          
          // Bot will restart after successful update
          setTimeout(() => {
            process.exit(2);
          }, 2000);
        });
      } else {
        await message.reply('❌ Update cancelled.');
      }

      global.ST.onReply.delete(Reply.messageID);

    } catch (error) {
      global.log.error('Error in update onReply:', error);
    }
  }
};
