
module.exports = {
  config: {
    name: "requestlist",
    aliases: ["reqlist", "unbanlist"],
    author: "ST",
    version: "1.0",
    cooldown: 5,
    role: 2,
    description: "View and manage unban requests",
    category: "admin",
    usePrefix: true
  },

  ST: async function ({ event, api, message }) {
    try {
      const requests = await global.db.getUnbanRequests();
      
      if (requests.length === 0) {
        return message.reply('✅ No pending unban requests');
      }

      let text = `📋 Unban Requests (${requests.length})\n\n`;
      
      for (let i = 0; i < requests.length; i++) {
        const req = requests[i];
        const user = await global.db.getUser(req.userId);
        const userName = user.firstName || 'Unknown';
        
        text += `${i + 1}. ${userName}\n`;
        text += `   🆔 User ID: ${req.userId}\n`;
        text += `   📝 Reason: ${req.reason}\n`;
        text += `   🕐 ${new Date(req.createdAt).toLocaleString()}\n\n`;
      }

      text += `💡 Click the approve/reject buttons in the notification messages to process requests.`;

      await message.reply(text);

    } catch (error) {
      await message.reply(`❌ Error: ${error.message}`);
    }
  }
};
