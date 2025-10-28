
module.exports = {
  config: {
    name: "spain",
    aliases: ["spin", "slot"],
    author: "ST",
    version: "1.2.1",
    cooldown: 10,
    role: 0,
    description: "Spin the slot machine and win money!",
    category: "fun",
    usePrefix: true
  },

  ST: async function ({ event, api, args, message, userId }) {
    try {
      const user = await global.db.getUser(String(userId));
      
      // Default bet is 100, or use custom amount
      let betAmount = 100;
      if (args[0] && !isNaN(args[0])) {
        betAmount = parseInt(args[0]);
      }

      // Validate bet amount
      if (betAmount < 50) {
        return message.reply('❌ Minimum bet is 50 coins!');
      }

      if (betAmount > 10000) {
        return message.reply('❌ Maximum bet is 10,000 coins!');
      }

      const userMoney = user.money || 0;
      if (userMoney < betAmount) {
        return message.reply(`❌ You don't have enough money!\n\n💰 Your balance: ${userMoney} coins\n🎰 Bet amount: ${betAmount} coins`);
      }

      // Slot machine symbols
      const symbols = ['🍒', '🍋', '🍊', '🍉', '⭐', '💎', '7️⃣'];
      
      // Send initial message
      const initialMsg = await message.reply('🎰 Spinning the slot machine...\n\n[ 🎰 | 🎰 | 🎰 ]');

      // Animation frames
      const frames = [
        '[ 🎰 | 🎰 | 🎰 ]',
        '[ 🍒 | 🎰 | 🎰 ]',
        '[ 🍒 | 🍋 | 🎰 ]',
        '[ 🍒 | 🍋 | 🍊 ]'
      ];

      // Animate spinning
      let lastText = '';
      for (let i = 0; i < frames.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 800));
        const spinText = `🎰 Spinning the slot machine...\n\n${frames[i]}`;
        
        // Only edit if text changed
        if (spinText !== lastText) {
          try {
            await message.edit(spinText, initialMsg.message_id, event.chat.id);
            lastText = spinText;
          } catch (err) {
            // Ignore if message is not modified
            if (!err.message.includes('message is not modified')) {
              console.error('Edit error:', err.message);
            }
          }
        }
      }

      // Generate random result
      const slot1 = symbols[Math.floor(Math.random() * symbols.length)];
      const slot2 = symbols[Math.floor(Math.random() * symbols.length)];
      const slot3 = symbols[Math.floor(Math.random() * symbols.length)];

      // Calculate winnings
      let winAmount = 0;
      let resultText = '';

      if (slot1 === slot2 && slot2 === slot3) {
        // All three match - JACKPOT!
        if (slot1 === '7️⃣') {
          winAmount = betAmount * 10;
          resultText = '🎊 MEGA JACKPOT! 🎊';
        } else if (slot1 === '💎') {
          winAmount = betAmount * 7;
          resultText = '💎 DIAMOND WIN! 💎';
        } else if (slot1 === '⭐') {
          winAmount = betAmount * 5;
          resultText = '⭐ SUPER WIN! ⭐';
        } else {
          winAmount = betAmount * 3;
          resultText = '🎉 JACKPOT! 🎉';
        }
      } else if (slot1 === slot2 || slot2 === slot3 || slot1 === slot3) {
        // Two match
        winAmount = betAmount * 2;
        resultText = '✨ Nice Match! ✨';
      } else {
        // No match - lose
        winAmount = -betAmount;
        resultText = '😔 Better luck next time!';
      }

      // Update user balance
      const newBalance = userMoney + winAmount;
      await global.db.updateUser(String(userId), {
        money: newBalance
      });

      // Final result with Try Again button
      const finalResult = `🎰 Slot Machine Result\n\n[ ${slot1} | ${slot2} | ${slot3} ]\n\n${resultText}\n\n💰 Bet: ${betAmount} coins\n${winAmount > 0 ? '🎁 Won: +' : '💸 Lost: '}${Math.abs(winAmount)} coins\n💵 New Balance: ${newBalance} coins`;

      await message.edit(finalResult, initialMsg.message_id, event.chat.id, {
        reply_markup: {
          inline_keyboard: [[
            { text: '🎰 Try Again (100 coins)', callback_data: 'spain_again_100' }
          ]]
        }
      });

    } catch (error) {
      console.error('Error in spain command:', error);
      return message.reply(`❌ Error: ${error.message}`);
    }
  },

  onCallback: async function ({ event, api, message }) {
    try {
      if (!event.data || !event.data.startsWith('spain_again_')) {
        return;
      }

      const userId = event.from.id;
      const user = await global.db.getUser(String(userId));
      const betAmount = 100;

      // Validate balance
      const userMoney = user.money || 0;
      if (userMoney < betAmount) {
        return api.answerCallbackQuery(event.id, {
          text: `❌ Not enough money! You have ${userMoney} coins, need ${betAmount} coins`,
          show_alert: true
        });
      }

      // Answer callback immediately
      await api.answerCallbackQuery(event.id, { text: '🎰 Spinning...' });

      // Slot machine symbols
      const symbols = ['🍒', '🍋', '🍊', '🍉', '⭐', '💎', '7️⃣'];
      
      // Edit message to show spinning (silently ignore if same content)
      try {
        await api.editMessageText('🎰 Spinning the slot machine...\n\n[ 🎰 | 🎰 | 🎰 ]', {
          chat_id: event.message.chat.id,
          message_id: event.message.message_id
        });
      } catch (editErr) {
        // Silently ignore "message is not modified" errors
        if (!editErr.message.includes('message is not modified')) {
          console.error('Edit error:', editErr.message);
        }
      }

      // Wait for animation effect
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Generate random result
      const slot1 = symbols[Math.floor(Math.random() * symbols.length)];
      const slot2 = symbols[Math.floor(Math.random() * symbols.length)];
      const slot3 = symbols[Math.floor(Math.random() * symbols.length)];

      // Calculate winnings
      let winAmount = 0;
      let resultText = '';

      if (slot1 === slot2 && slot2 === slot3) {
        if (slot1 === '7️⃣') {
          winAmount = betAmount * 10;
          resultText = '🎊 MEGA JACKPOT! 🎊';
        } else if (slot1 === '💎') {
          winAmount = betAmount * 7;
          resultText = '💎 DIAMOND WIN! 💎';
        } else if (slot1 === '⭐') {
          winAmount = betAmount * 5;
          resultText = '⭐ SUPER WIN! ⭐';
        } else {
          winAmount = betAmount * 3;
          resultText = '🎉 JACKPOT! 🎉';
        }
      } else if (slot1 === slot2 || slot2 === slot3 || slot1 === slot3) {
        winAmount = betAmount * 2;
        resultText = '✨ Nice Match! ✨';
      } else {
        winAmount = -betAmount;
        resultText = '😔 Better luck next time!';
      }

      // Update user balance
      const newBalance = userMoney + winAmount;
      await global.db.updateUser(String(userId), {
        money: newBalance
      });

      // Final result
      const finalResult = `🎰 Slot Machine Result\n\n[ ${slot1} | ${slot2} | ${slot3} ]\n\n${resultText}\n\n💰 Bet: ${betAmount} coins\n${winAmount > 0 ? '🎁 Won: +' : '💸 Lost: '}${Math.abs(winAmount)} coins\n💵 New Balance: ${newBalance} coins`;

      await api.editMessageText(finalResult, {
        chat_id: event.message.chat.id,
        message_id: event.message.message_id,
        reply_markup: {
          inline_keyboard: [[
            { text: '🎰 Try Again (100 coins)', callback_data: 'spain_again_100' }
          ]]
        }
      });

    } catch (error) {
      console.error('Error in spain callback:', error);
      try {
        await api.answerCallbackQuery(event.id, {
          text: `❌ Error: ${error.message}`,
          show_alert: true
        });
      } catch (e) {
        // Ignore
      }
    }
  }
};
