
const axios = require("axios");
const fs = require("fs");
const path = require("path");

// Track processed URLs to prevent re-processing
const processedUrls = new Map();

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [url, timestamp] of processedUrls.entries()) {
    if (now - timestamp > 300000) { // 5 minutes
      processedUrls.delete(url);
    }
  }
}, 60000);

module.exports = {
  config: {
    name: "autodl",
    aliases: ["autovideo", "tiktok", "facebook"],
    version: "1.0.0",
    author: "ST | Sheikh Tamim",
    cooldown: 5,
    role: 0,
    description: "Auto download videos from TikTok, Facebook, Instagram, YouTube, etc.",
    category: "media",
    usePrefix: false
  },
  
  ST: async function ({ api, event, args, message }) {
    return message.reply("This command is only available in chat.");
  },

  onChat: async function ({ event, api, message }) {
    try {
      // Only process text messages (no attachments)
      if (!event.text || event.from.is_bot) {
        return;
      }

      const dipto = event.text.trim();
      
      // Check if this URL was already processed recently
      if (processedUrls.has(dipto)) {
        return;
      }
      
      // Check if message contains supported URLs
      if (
        dipto.startsWith("https://vt.tiktok.com") ||
        dipto.startsWith("https://www.tiktok.com/") ||
        dipto.startsWith("https://www.facebook.com") ||
        dipto.startsWith("https://www.instagram.com/") ||
        dipto.startsWith("https://youtu.be/") ||
        dipto.startsWith("https://youtube.com/") ||
        dipto.startsWith("https://x.com/") ||
        dipto.startsWith("https://www.instagram.com/p/") ||
        dipto.startsWith("https://pin.it/") ||
        dipto.startsWith("https://twitter.com/") ||
        dipto.startsWith("https://vm.tiktok.com") ||
        dipto.startsWith("https://fb.watch")
      ) {
        // Mark URL as processed to prevent re-processing
        processedUrls.set(dipto, Date.now());
        
        const userName = event.from.first_name || "User";
        const w = await message.send(`⏳ Wait ${userName}... Downloading`);
        
        try {
          const dipapis = new global.utils.dipapis();
          const response = await axios.get(`${dipapis.baseURL}/alldl?url=${encodeURIComponent(dipto)}`);
          const d = response.data;

          let ex;
          if (d.result.includes(".jpg")) {
            ex = ".jpg";
          } else if (d.result.includes(".png")) {
            ex = ".png";
          } else if (d.result.includes(".jpeg")) {
            ex = ".jpeg";
          } else {
            ex = ".mp4";
          }

          const cachePath = path.join(__dirname, "..", "..", "tmp", `video${ex}`);
          
          // Download file
          const fileResponse = await axios.get(d.result, { responseType: "arraybuffer" });
          fs.writeFileSync(cachePath, Buffer.from(fileResponse.data, "binary"));

          await message.unsend(w.message_id);

          // Send media using sendAttachment to avoid reply loop
          await message.sendAttachment({
            body: "✅ Downloaded successfully",
            attachment: cachePath,
            chatId: event.chat.id
          });

          // Clean up
          fs.unlinkSync(cachePath);

        } catch (downloadError) {
          await message.unsend(w.message_id);
          global.log.error("AutoDL download error:", downloadError.message);
          await message.send(`❌ Error: ${downloadError.message}`);
        }
        
        // Return to prevent further processing
        return;
      }

    } catch (err) {
      global.log.error("AutoDL error:", err.message);
    }
  }
};
