
module.exports = {
  config: {
    name: "request",
    aliases: [],
    author: "ST",
    version: "1.2.0",
    cooldown: 60,
    role: 0,
    description: "Request to be unbanned from the bot",
    category: "utility",
    usePrefix: true
  },

  ST: async function ({ event, api, args, message, chatId, userId }) {
    try {
      // Check if user is banned
      const isBanned = await global.db.isUserBanned(String(userId));
      
      if (!isBanned) {
        return message.reply('✅ You are not banned from using this bot.');
      }

      // Check if user already has a pending request
      const existingRequests = await global.db.getUnbanRequests();
      const hasPending = existingRequests.some(r => r.userId === String(userId));
      
      if (hasPending) {
        return message.reply('⏳ You already have a pending unban request. Please wait for admin review.');
      }

      const reason = args.join(' ') || 'No reason provided';
      
      // Create unban request
      const requestId = await global.db.addUnbanRequest(
        String(userId),
        reason,
        event.chat.type !== 'private' ? String(chatId) : null
      );

      await message.reply(
        `✅ Unban request submitted!\n\n` +
        `📝 Your reason: ${reason}\n\n` +
        `⏳ Please wait for the bot admin to review your request.\n` +
        `You will be notified once your request is processed.`
      );

      // Notify admins
      const user = await global.db.getUser(String(userId));
      const userName = user.firstName || event.from.first_name || 'Unknown';
      
      for (const adminId of global.config.adminUID) {
        try {
          await api.sendMessage(
            adminId,
            `🔔 New Unban Request\n\n` +
            `👤 User: ${userName}\n` +
            `🆔 User ID: ${userId}\n` +
            `📝 Reason: ${reason}\n` +
            `🕐 Time: ${new Date().toLocaleString()}\n\n` +
            `Use /requestlist to review pending requests`,
            {
              reply_markup: {
                inline_keyboard: [[
                  { text: '✅ Approve', callback_data: `approve_unban_${requestId}` },
                  { text: '❌ Reject', callback_data: `reject_unban_${requestId}` }
                ]]
              }
            }
          );
        } catch (err) {
          // Skip if can't send to admin
        }
      }

    } catch (error) {
      await message.reply(`❌ Error: ${error.message}`);
    }
  }
};
