const yts = require("yt-search");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "sing",
    aliases: ["music", "song", "play"],
    version: "1.0.0",
    author: "ST",
    cooldown: 10,
    role: 0,
    description: "Search and download music from YouTube",
    category: "media",
    usePrefix: true
  },

  ST: async function ({ event, api, args, message }) {
    if (!args[0]) {
      return message.reply("⚠️ Please provide a song name!\n\nUsage: /sing <song name>");
    }

    try {
      const searchQuery = args.join(" ");
      const searchMsg = await message.send(`🔍 Searching for: ${searchQuery}...`);

      const results = await yts(searchQuery);
      const videos = results.videos.slice(0, 6);

      if (videos.length === 0) {
        await message.unsend(searchMsg.message_id);
        return message.reply("❌ No results found for your search.");
      }

      let resultText = `🎵 Search Results for "${searchQuery}":\n\n`;
      videos.forEach((video, index) => {
        resultText += `${index + 1}. ${video.title}\n`;
        resultText += `   ⏱️ ${video.timestamp} | 👁️ ${video.views}\n`;
        resultText += `   📺 ${video.author.name}\n\n`;
      });
      resultText += `Click a button below to download`;

      // Create inline keyboard with buttons
      const buttons = [];
      for (let i = 0; i < videos.length; i += 3) {
        const row = [];
        for (let j = i; j < Math.min(i + 3, videos.length); j++) {
          row.push({
            text: `${j + 1}`,
            callback_data: `sing_select_${j}`
          });
        }
        buttons.push(row);
      }

      await message.unsend(searchMsg.message_id);

      const replyMsg = await api.sendMessage(
        event.chat.id,
        resultText,
        {
          reply_markup: {
            inline_keyboard: buttons
          }
        }
      );

      global.ST.onCallback.set(replyMsg.message_id, {
        commandName: this.config.name,
        messageID: replyMsg.message_id,
        author: event.from.id,
        videos: videos
      });

    } catch (error) {
      global.log.error("Sing search error:", error.message);
      return message.reply(`❌ Error: ${error.message}`);
    }
  },

  onCallback: async function ({ event, api, Callback }) {
    try {
      const userId = event.from.id;

      if (userId !== Callback.author) {
        return api.answerCallbackQuery(event.id, {
          text: "⚠️ You didn't request this!",
          show_alert: true
        });
      }

      const callbackData = event.data.split('_');
      const selectedIndex = parseInt(callbackData[2]);

      if (isNaN(selectedIndex) || selectedIndex < 0 || selectedIndex >= Callback.videos.length) {
        return api.answerCallbackQuery(event.id, { text: "⚠️ Invalid selection" });
      }

      const selectedVideo = Callback.videos[selectedIndex];

      await api.answerCallbackQuery(event.id, {
        text: "⏳ Downloading..."
      });

      const processingMsg = await api.sendMessage(
        event.message.chat.id,
        `⏳ Downloading "${selectedVideo.title}"...`
      );

      try {
        const dipapis = new global.utils.dipapis();
        const { data: { title, downloadLink, quality } } = await axios.get(
          `${dipapis.baseURL}/ytDl3?link=${selectedVideo.videoId}&format=mp3`
        );

        const filename = `${Date.now()}.mp3`;
        const cachePath = path.join(__dirname, "..", "..", "tmp", filename);

        const audioResponse = await axios.get(downloadLink, { responseType: "arraybuffer" });
        fs.writeFileSync(cachePath, Buffer.from(audioResponse.data));

        await api.deleteMessage(event.message.chat.id, Callback.messageID);
        await api.deleteMessage(event.message.chat.id, processingMsg.message_id);

        await api.sendAudio(event.message.chat.id, cachePath, {
          caption: `🎶 Title: ${title}\n🎵 Quality: ${quality || 'High'}`
        });

        fs.unlinkSync(cachePath);

      } catch (downloadErr) {
        await api.deleteMessage(event.message.chat.id, processingMsg.message_id);
        global.log.error("Callback download error:", downloadErr.message);
        await api.sendMessage(event.message.chat.id, "⚠️ Download failed. Try another song.");
      }

    } catch (err) {
      global.log.error("Sing callback error:", err.message);
      await api.sendMessage(event.message.chat.id, "⚠️ Error: " + err.message);
    }
  }
};