module.exports = {
  config: {
    name: "kick",
    aliases: [],
    author: "ST | Sheikh Tamim",
    version: "1.2.0",
    cooldown: 5,
    role: 1,
    description: "Kick a user from the group (admin only)",
    category: "admin",
    usePrefix: true
  },

  ST: async ({ event, api, message, args }) => {
    try {
      const chatId = event.chat.id;
      const chatType = event.chat.type;

      // Only works in groups and supergroups
      if (chatType !== "group" && chatType !== "supergroup") {
        return message.reply("⚠️ This command only works in groups and supergroups!");
      }

      // 1️⃣ Determine target user
      let targetUserId;
      let targetUserName;

      // Reply to message
      if (event.reply_to_message && event.reply_to_message.from) {
        const user = event.reply_to_message.from;
        targetUserId = user.id;
        targetUserName = `${user.first_name || ""} ${user.last_name || ""}`.trim();
      } 
      // Mention in text (text_mention)
      else if (event.entities) {
        const textMention = event.entities.find(e => e.type === "text_mention");
        if (textMention && textMention.user) {
          targetUserId = textMention.user.id;
          targetUserName = textMention.user.first_name || "User";
        }
      }

      // If no target, show usage
      if (!targetUserId) {
        return message.reply(
          "⚠️ Please specify a user to kick!\n\n" +
          "1️⃣ Reply to their message: /kick\n" +
          "2️⃣ Mention them: /kick @username"
        );
      }

      // Prevent kicking bot admins or self
      if (global.config.adminUID.includes(String(targetUserId))) {
        return message.reply("⚠️ Cannot kick bot administrators!");
      }
      if (targetUserId === event.from.id) {
        return message.reply("⚠️ You cannot kick yourself!");
      }

      // 2️⃣ Check bot permissions
      const botMember = await api.getChatMember(chatId, (await api.getMe()).id);
      if (botMember.status !== "administrator" && botMember.status !== "creator") {
        return message.reply("⚠️ I need to be an admin to kick users!");
      }
      if (!botMember.can_restrict_members) {
        return message.reply("⚠️ I don't have 'Ban Users' permission!");
      }

      // 3️⃣ Check target user status
      const targetMember = await api.getChatMember(chatId, targetUserId);
      if (targetMember.status === "administrator" || targetMember.status === "creator") {
        return message.reply("⚠️ Cannot kick group administrators!");
      }

      // 4️⃣ Kick the user (temporary ban for 5 seconds)
      const untilDate = Math.floor(Date.now() / 1000) + 5;
      await api.banChatMember(chatId, targetUserId, { until_date: untilDate });

      await message.reply(
        `✅ Kicked ${targetUserName}!\n` +
        `👤 User ID: \`${targetUserId}\`\n` +
        `👮 Kicked by: ${event.from.first_name}`
        , { parse_mode: "Markdown" }
      );

      console.log(`👢 User ${targetUserId} kicked from ${chatId} by ${event.from.id}`);

    } catch (error) {
      console.error("Kick command error:", error);
      await message.reply(`❌ Failed to kick user: ${error.message}`);
    }
  }
};
