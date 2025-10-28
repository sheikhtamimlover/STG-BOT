module.exports = {
  config: {
    name: 'leave',
    eventType: 'left_member',
    version: '1.2.1',
    author: 'ST',
    description: 'Handle member leave events and antiout'
  },

  ST: async function ({ event, api, message, leftMember }) {
    try {
      if (!leftMember || leftMember.is_bot) return;

      const chatId = event.chat.id;
      const chatName = event.chat.title || 'this group';
      const userName = leftMember.first_name + (leftMember.last_name ? ' ' + leftMember.last_name : '');

      // Check antiout setting
      const thread = await global.db.getThread(String(chatId));

      if (thread.antiOut) {
        try {
          // Try to re-add the user directly
          try {
            await api.unbanChatMember(chatId, leftMember.id);
            await message.send(`🔄 ${userName} left but anti-out is enabled. User unbanned.`);
          } catch (unbanError) {
            // If unban fails, try sending invite link
            const inviteLink = await api.exportChatInviteLink(chatId);

            // Send invite link to the user
            try {
              await api.sendMessage(
                leftMember.id,
                `⚠️ You left ${chatName} but anti-out is enabled!\n\n` +
                `Please rejoin using this link: ${inviteLink}`
              );
              await message.send(`🔄 ${userName} left but anti-out is enabled. Invite link sent!`);
            } catch (dmError) {
              // User might have blocked the bot
              await message.send(`🔄 ${userName} left but anti-out is enabled.\n📎 Invite link: ${inviteLink}`);
            }
          }
        } catch (error) {
          // Bot might not have permission
          await message.send(`👋 ${userName} has left ${chatName}\n⚠️ Could not re-add: ${error.message}`);
        }
      } else {
        await message.send(`👋 ${userName} has left ${chatName}`);
      }
    } catch (error) {
      global.log.error('Leave event error:', error);
    }
  }
};