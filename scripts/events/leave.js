module.exports = {
  config: {
    name: "leave",
    author: "ST",
    version: "1.0.0",
    description: "Notify when a member leaves the group",
    eventType: "left_member"
  },

  ST: async function ({ event, api, message, leftMember }) {
    try {
      if (leftMember.is_bot) return;
      
      const chatTitle = event.chat.title || 'this group';
      const userName = leftMember.first_name + (leftMember.last_name ? ' ' + leftMember.last_name : '');
      const userId = leftMember.id;
      const username = leftMember.username ? `@${leftMember.username}` : 'No username';
      
      const leaveMessage = `👋 Goodbye ${userName}!\n\n` +
        `📤 ${userName} (${username}) has left ${chatTitle}\n` +
        `🆔 User ID: ${userId}\n\n` +
        `😢 We'll miss you!`;
      
      await message.send(leaveMessage);
      
      global.log.info(`Member left: ${userName} (${userId}) from ${chatTitle}`);
    } catch (error) {
      global.log.error('Error in leave event:', error);
    }
  }
};
