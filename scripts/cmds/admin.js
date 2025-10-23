
module.exports = {
  config: {
    name: "admin",
    aliases: ["owner", "adminlist"],
    author: "ST | Sheikh Tamim",
    version: "1.0.0",
    cooldown: 5,
    role: 2,
    description: "Manage bot administrators",
    category: "admin",
    usePrefix: true
  },

  ST: async function ({ event, api, args, message, userId }) {
    if (!global.config.adminUID.includes(String(userId))) {
      return message.reply('⚠️ Only bot owners can use this command.');
    }

    const subCommand = args[0]?.toLowerCase();

    if (subCommand === 'add') {
      let targetId;
      
      if (event.reply_to_message) {
        targetId = event.reply_to_message.from.id;
      } else if (args[1]) {
        targetId = parseInt(args[1]);
      }

      if (!targetId) {
        return message.reply('❌ Usage: /admin add <user_id> or reply to a user');
      }

      if (global.config.adminUID.includes(String(targetId))) {
        return message.reply('⚠️ This user is already an admin.');
      }

      global.config.adminUID.push(String(targetId));
      fs.writeFileSync('./config.json', JSON.stringify(global.config, null, 2));
      
      return message.reply(`✅ Added user ${targetId} as admin.`);
    }

    if (subCommand === 'remove') {
      let targetId;
      
      if (event.reply_to_message) {
        targetId = event.reply_to_message.from.id;
      } else if (args[1]) {
        targetId = parseInt(args[1]);
      }

      if (!targetId) {
        return message.reply('❌ Usage: /admin remove <user_id> or reply to a user');
      }

      const index = global.config.adminUID.indexOf(String(targetId));
      if (index === -1) {
        return message.reply('⚠️ This user is not an admin.');
      }

      global.config.adminUID.splice(index, 1);
      fs.writeFileSync('./config.json', JSON.stringify(global.config, null, 2));
      
      return message.reply(`✅ Removed user ${targetId} from admin list.`);
    }

    if (subCommand === 'list') {
      if (global.config.adminUID.length === 0) {
        return message.reply('📋 No administrators configured.');
      }

      let adminList = '👥 Bot Administrators:\n\n';
      
      for (let i = 0; i < global.config.adminUID.length; i++) {
        const adminId = global.config.adminUID[i];
        try {
          const chat = await api.getChat(adminId);
          const name = chat.first_name + (chat.last_name ? ' ' + chat.last_name : '');
          const username = chat.username ? `@${chat.username}` : 'N/A';
          adminList += `${i + 1}. ${name}\n`;
          adminList += `   🆔 ID: ${adminId}\n`;
          adminList += `   👤 Username: ${username}\n\n`;
        } catch (error) {
          adminList += `${i + 1}. User ID: ${adminId}\n`;
          adminList += `   ⚠️ Unable to fetch user info\n\n`;
        }
      }

      return message.reply(adminList);
    }

    const helpText = `🔧 Admin Commands:\n\n` +
      `${global.config.prefix}admin add <user_id> - Add admin\n` +
      `${global.config.prefix}admin remove <user_id> - Remove admin\n` +
      `${global.config.prefix}admin list - List all admins\n\n` +
      `💡 You can also reply to a user's message instead of using ID`;

    message.reply(helpText);
  }
};
