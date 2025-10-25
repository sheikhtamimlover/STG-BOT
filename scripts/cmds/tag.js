module.exports = {
  config: {
    name: "tag",
    aliases: [],
    author: "ST | Sheikh Tamim",
    version: "1.2.0",
    cooldown: 3,
    role: 0,
    description: "Tag (mention) a user by reply or name in group/supergroup",
    category: "utility",
    usePrefix: true
  },

  ST: async ({ event, message, args, api }) => {
    try {
      // 🧩 Ensure this runs only in groups
      if (event.chat.type === "private") {
        return await message.reply("❌ This command can only be used in groups or supergroups.");
      }

      let mentionText = null;
      let tagText = null;

      // 🟢 1. If replied to someone's message — mention them
      if (event.reply_to_message && event.reply_to_message.from) {
        const user = event.reply_to_message.from;
        const fullName = user.first_name + (user.last_name ? " " + user.last_name : "");
        mentionText = `[${fullName}](tg://user?id=${user.id})`;
        tagText = args.length ? args.join(" ") : "👋 You’ve been tagged!";
      }

      // 🟢 2. If /tag name used (no reply)
      else if (args.length > 0) {
        const name = args.join(" ");
        mentionText = name; // just plain text tag
        tagText = "👋 " + name;
      }

      // 🔴 3. If neither reply nor name
      else {
        return await message.reply("❌ Please reply to someone or provide a name.\nExample:\n`/tag @user` or reply `/tag`");
      }

      // 🧠 Send message mentioning or tagging
      await message.reply(`${mentionText}\n${tagText}`, { parse_mode: "Markdown" });

    } catch (error) {
      console.error("Error in tag command:", error);
      await message.reply(`❌ Error: ${error.message}`);
    }
  }
};
