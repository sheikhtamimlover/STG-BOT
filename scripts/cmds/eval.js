const util = require('util');

module.exports = {
  config: {
    name: "eval",
    aliases: [],
    author: "ST",
    version: "1.0.0",
    cooldown: 0,
    role: 2,
    description: "Execute JavaScript code (Owner only)",
    category: "admin",
    usePrefix: true
  },

  ST: async function ({ event, api, args, message, userId }) {
    const code = args.join(' ');

    if (!code) {
      return message.reply('❌ Please provide code to execute.');
    }

    try {
      const axios = require('axios');
      const fs = require('fs');
      const path = require('path');

      let result = eval(code);

      if (result instanceof Promise) {
        result = await result;
      }

      let output;
      if (typeof result === 'undefined') {
        return;
      }
      
      if (typeof result === 'object') {
        output = util.inspect(result, { depth: 2, colors: false });
      } else {
        output = String(result);
      }

      if (output.length > 4000) {
        output = output.substring(0, 4000) + '...';
      }

      await api.sendMessage(event.chat.id, output);

    } catch (error) {
      await api.sendMessage(event.chat.id, `❌ ${error.message}`);
    }
  }
};