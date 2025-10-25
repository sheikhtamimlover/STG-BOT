
module.exports = {
  config: {
    name: "adduser",
    aliases: [],
    author: "ST",
    version: "1.2.0",
    cooldown: 5,
    role: 1,
    description: "Add a user to this group/supergroup by UID",
    category: "admin",
    usePrefix: true
  },

  ST: async function ({ event, api, args, message }) {
    try {
      const chatId = event.chat.id;
      const chatType = event.chat.type;

      // Only works in groups and supergroups
      if (chatType !== 'group' && chatType !== 'supergroup') {
        return message.reply('⚠️ This command only works in groups and supergroups!');
      }

      // Get user ID from args
      let userId = null;

      if (args[0] && /^\d+$/.test(args[0])) {
        userId = parseInt(args[0].trim());
      }

      if (!userId) {
        return message.reply('❌ Usage: /adduser <user_id>\n\nExample: /adduser 123456789');
      }

      // Check if bot has permission to add members
      try {
        const botMember = await api.getChatMember(chatId, (await api.getMe()).id);
        if (botMember.status !== 'administrator' && botMember.status !== 'creator') {
          return message.reply('⚠️ I need to be an admin to add users!');
        }

        if (!botMember.can_invite_users) {
          return message.reply('⚠️ I don\'t have permission to add users! Please give me "Add users" permission.');
        }
      } catch (error) {
        return message.reply('❌ Failed to check bot permissions!');
      }

      // Check if user is already in group
      try {
        const member = await api.getChatMember(chatId, userId);
        if (member.status !== 'left' && member.status !== 'kicked') {
          return message.reply('⚠️ User is already a member of this group!');
        }
      } catch (error) {
        // User not in group, continue
      }

      // Try to add the user directly
      try {
        // First unban if previously banned
        try {
          await api.unbanChatMember(chatId, userId, { only_if_banned: true });
        } catch (e) {
          // Ignore unban errors
        }

        // Create an invite link with limited uses
        const inviteLink = await api.createChatInviteLink(chatId, {
          member_limit: 1,
          expire_date: Math.floor(Date.now() / 1000) + 86400 // 24 hours
        });

        // Send invite to user
        try {
          await api.sendMessage(
            userId,
            `📨 You've been invited to join: ${event.chat.title || 'a group'}!\n\n` +
            `🔗 Click to join: ${inviteLink.invite_link}\n\n` +
            `Invited by: ${event.from.first_name}`
          );

          await message.reply(`✅ User ${userId} has been sent an invite link!`);
        } catch (dmError) {
          // If DM fails, show the link in the group
          return message.reply(
            `⚠️ Could not send DM to user!\n\n` +
            `🔗 Share this link: ${inviteLink.invite_link}\n\n` +
            `This link will expire in 24 hours.`
          );
        }

        global.log.info(`👥 User ${userId} invited to ${chatId} by ${event.from.id}`);

      } catch (error) {
        if (error.message.includes('user not found')) {
          return message.reply('❌ User not found! Make sure the user ID is correct and the user has started a chat with the bot.');
        } else if (error.message.includes('not enough rights')) {
          return message.reply('⚠️ I don\'t have permission to create invite links!');
        } else {
          return message.reply(`❌ Failed to add user: ${error.message}`);
        }
      }

    } catch (error) {
      global.log.error('Adduser command error:', error);
      return message.reply(`❌ Error: ${error.message}`);
    }
  }
};
