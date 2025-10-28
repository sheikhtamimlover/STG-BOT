
module.exports = {
  config: {
    name: "count",
    aliases: [],
    author: "ST",
    version: "1.2.1",
    cooldown: 5,
    role: 0,
    description: "View message count statistics",
    category: "info",
    usePrefix: true,
    guide: {
      en: `
Usage:
• {p}count - View your message count in this chat
• {p}count all - View top users by message count in this group

Examples:
• {p}count - Shows your message count
• {p}count all - Shows leaderboard
      `.trim()
    }
  },

  ST: async function ({ event, api, args, message, userId }) {
    try {
      const chatId = String(event.chat.id);
      const chatType = event.chat.type;

      // Check if user wants leaderboard
      if (args[0] && args[0].toLowerCase() === 'all') {
        if (chatType !== 'group' && chatType !== 'supergroup') {
          return message.reply('❌ Leaderboard is only available in groups.');
        }

        const stats = await global.db.getThreadMessageStats(chatId);
        const userMessages = stats.userMessages || {};

        if (Object.keys(userMessages).length === 0) {
          return message.reply('📊 No message data available yet.');
        }

        // Sort users by message count
        const sorted = Object.entries(userMessages)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 20); // Top 20

        let leaderboard = `📊 Top Message Senders\n`;
        leaderboard += `📍 ${event.chat.title || 'This Group'}\n`;
        leaderboard += `💬 Total Messages: ${stats.totalMessages}\n\n`;

        for (let i = 0; i < sorted.length; i++) {
          const [uid, count] = sorted[i];
          try {
            const user = await global.db.getUser(uid);
            const name = user.firstName + (user.lastName ? ' ' + user.lastName : '');
            const username = user.username ? `@${user.username}` : '';
            
            const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
            leaderboard += `${medal} ${name} ${username}\n`;
            leaderboard += `   💬 ${count} messages\n\n`;
          } catch (error) {
            leaderboard += `${i + 1}. User ${uid}\n   💬 ${count} messages\n\n`;
          }
        }

        return message.reply(leaderboard);
      }

      // Show user's own count
      const userCount = await global.db.getUserMessageCount(userId, chatId);
      const stats = await global.db.getThreadMessageStats(chatId);
      
      let response = `📊 Message Statistics\n\n`;
      response += `👤 User: ${event.from.first_name}\n`;
      
      if (chatType === 'group' || chatType === 'supergroup') {
        response += `📍 Chat: ${event.chat.title}\n`;
        response += `💬 Your Messages: ${userCount}\n`;
        response += `📈 Total Messages: ${stats.totalMessages}\n`;
        
        if (stats.totalMessages > 0 && userCount > 0) {
          const percentage = ((userCount / stats.totalMessages) * 100).toFixed(1);
          response += `📊 Your Share: ${percentage}%\n`;
        }
        
        response += `\n💡 Use ${global.config.prefix}count all to see leaderboard`;
      } else {
        response += `💬 Messages Sent: ${userCount}`;
      }

      return message.reply(response);

    } catch (error) {
      global.log.error('Error in count command:', error);
      return message.reply(`❌ Error: ${error.message}`);
    }
  }
};
