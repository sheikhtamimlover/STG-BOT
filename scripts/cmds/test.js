module.exports = {
  config: {
    name: "test",
    aliases: ["demo"],
    author: "ST",
    version: "1.0",
    cooldown: 5,
    role: 0,
    description: "Test command demonstrating all handler types",
    category: "utility",
    usePrefix: true
  },

  ST: async function ({ event, api, args, message }) {
    const keyboard = {
      inline_keyboard: [
        [
          { text: '✅ Yes', callback_data: 'test_yes' },
          { text: '❌ No', callback_data: 'test_no' }
        ],
        [
          { text: '💡 Help', callback_data: 'test_help' }
        ]
      ]
    };

    const msg = await api.sendMessage(
      event.chat.id,
      `🧪 Test Command Demo\n\n` +
      `This demonstrates all handler types:\n\n` +
      `1️⃣ ST() - Main command (you just used it!)\n` +
      `2️⃣ onChat - Type "hello test" to trigger\n` +
      `3️⃣ onReply - Reply to this message\n` +
      `4️⃣ onCallback - Click a button below\n\n` +
      `Try them out!`,
      { reply_markup: keyboard }
    );

    global.ST.onReply.set(msg.message_id, {
      commandName: this.config.name,
      author: event.from.id
    });

    global.ST.onCallback.set(msg.message_id, {
      commandName: this.config.name,
      author: event.from.id
    });
  },

  onChat: async function ({ event, api, message }) {
    const body = event.text?.toLowerCase();
    if (body && body.includes('hello test')) {
      await message.reply('👋 onChat triggered! You said "hello test"!');
    }
  },

  onReply: async function ({ event, api, Reply, message }) {
    if (event.from.id !== Reply.author) return;

    await message.reply(
      `📩 onReply triggered!\n\n` +
      `You replied with: "${event.text}"\n\n` +
      `This handler catches replies to bot messages.`
    );
  },

  onCallback: async function ({ event, api, Callback }) {
    if (event.from.id !== Callback.author) {
      return api.answerCallbackQuery(event.id, {
        text: '⚠️ This is not your button!',
        show_alert: true
      });
    }

    const data = event.data;
    let responseText = '';

    if (data === 'test_yes') {
      responseText = '✅ You clicked Yes!';
    } else if (data === 'test_no') {
      responseText = '❌ You clicked No!';
    } else if (data === 'test_help') {
      responseText = '💡 Buttons use onCallback handler!';
    }

    await api.answerCallbackQuery(event.id, {
      text: responseText,
      show_alert: false
    });

    await api.editMessageText(
      `✅ onCallback triggered!\n\n` +
      `You clicked: ${responseText}\n\n` +
      `This handler processes button clicks.`,
      {
        chat_id: event.message.chat.id,
        message_id: event.message.message_id
      }
    );
  }
};
