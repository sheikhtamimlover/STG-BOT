
const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "flux",
    version: "1.0.0",
    author: "ST",//dipto api
    role: 0,
    description: "Generate AI images using Flux",
    category: "image",
    usePrefix: true,
    cooldown: 15
  },

  ST: async function ({ args, message }) {
    if (!args[0]) {
      return message.reply("❌ Please provide a prompt.\nExample: /flux cat in space --ratio 16:9");
    }

    try {
      const input = args.join(" ");
      const [prompt, ratio = "1:1"] = input.includes("--ratio")
        ? input.split("--ratio").map(s => s.trim())
        : [input, "1:1"];

      const processingMsg = await message.reply("🌀 Generating your image, please wait...");

      const apiUrl = `https://www.noobs-api.rf.gd/dipto/flux?prompt=${encodeURIComponent(prompt)}&ratio=${encodeURIComponent(ratio)}`;
      
      const response = await axios.get(apiUrl, { responseType: "arraybuffer" });
      
      const tmpDir = path.join(__dirname, "..", "..", "tmp");
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
      }
      
      const imagePath = path.join(tmpDir, `flux_${Date.now()}.png`);
      fs.writeFileSync(imagePath, Buffer.from(response.data));

      await message.unsend(processingMsg.message_id);

      await message.sendAttachment({
        body: `✅ Done!\n📝 Prompt: ${prompt}\n📐 Ratio: ${ratio}`,
        attachment: imagePath
      });

      fs.unlinkSync(imagePath);

    } catch (error) {
      global.log.error("Flux error:", error);
      return message.reply("❌ Failed to generate image.\nTry again later or check your prompt.");
    }
  }
};
