
module.exports = {
  config: {
    name: "ttt",
    aliases: ["tictactoe", "xo"],
    author: "ST",
    version: "1.2.1",
    cooldown: 5,
    role: 0,
    description: "Play Tic-Tac-Toe game!\n\nUsage:\n- !ttt - Play with bot\n- !ttt @user or reply to user - Play with another user",
    category: "game",
    usePrefix: false
  },

  ST: async function ({ event, api, args, message, userId }) {
    try {
      let opponent = null;
      let opponentName = 'Bot';
      let isVsBot = true;

      if (event.reply_to_message) {
        opponent = event.reply_to_message.from.id;
        opponentName = event.reply_to_message.from.first_name;
        isVsBot = false;
        
        if (opponent === userId) {
          return message.reply('❌ You cannot play with yourself!');
        }
      }

      const gameId = `${userId}_${Date.now()}`;
      const gameState = {
        board: ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'],
        currentPlayer: userId,
        player1: userId,
        player1Name: event.from.first_name,
        player2: opponent || 'bot',
        player2Name: opponentName,
        isVsBot: isVsBot,
        gameOver: false,
        winner: null
      };

      global.ST.tttGames = global.ST.tttGames || new Map();
      global.ST.tttGames.set(gameId, gameState);

      const boardText = this.getBoardText(gameState);

      const msg = await message.reply(`${boardText}\n\n💡 Reply with position number (1-9) to make your move!`);

      global.ST.onReply.set(msg.message_id, {
        commandName: this.config.name,
        type: 'ttt_game',
        gameId: gameId,
        messageID: msg.message_id,
        author: userId,
        chatId: event.chat.id
      });

      setTimeout(() => {
        global.ST.tttGames.delete(gameId);
        global.ST.onReply.delete(msg.message_id);
      }, 600000);

    } catch (error) {
      global.log.error('Error in tictactoe command:', error);
      return message.reply(`❌ Error: ${error.message}`);
    }
  },

  onReply: async function ({ event, api, Reply, message }) {
    try {
      const gameId = Reply.gameId;
      
      global.ST.tttGames = global.ST.tttGames || new Map();
      const gameState = global.ST.tttGames.get(gameId);

      if (!gameState) {
        return message.reply('❌ Game expired or not found!');
      }

      const userId = event.from.id;
      const moveText = event.text.trim();
      
      const position = parseInt(moveText) - 1;
      
      if (isNaN(position) || position < 0 || position > 8) {
        return message.reply('❌ Invalid position! Please enter a number between 1-9');
      }

      if (!gameState.isVsBot) {
        if (gameState.currentPlayer !== userId) {
          return message.reply('⏳ Not your turn!');
        }
      } else {
        if (userId !== gameState.player1) {
          return message.reply('❌ This is not your game!');
        }
      }

      if (gameState.board[position] === '❌' || gameState.board[position] === '⭕') {
        return message.reply('❌ Position already taken!');
      }

      const symbol = userId === gameState.player1 ? '❌' : '⭕';
      gameState.board[position] = symbol;

      const winner = this.checkWinner(gameState.board);
      if (winner) {
        gameState.gameOver = true;
        gameState.winner = winner === '❌' ? gameState.player1 : gameState.player2;
      } else if (!gameState.board.some(cell => !['❌', '⭕'].includes(cell))) {
        gameState.gameOver = true;
        gameState.winner = 'draw';
      }

      if (!gameState.gameOver) {
        gameState.currentPlayer = gameState.currentPlayer === gameState.player1 ? gameState.player2 : gameState.player1;
      }

      if (gameState.isVsBot && !gameState.gameOver && gameState.currentPlayer === 'bot') {
        await new Promise(resolve => setTimeout(resolve, 500));
        const botMove = this.getBotMove(gameState.board);
        if (botMove !== -1) {
          gameState.board[botMove] = '⭕';
          
          const winner = this.checkWinner(gameState.board);
          if (winner) {
            gameState.gameOver = true;
            gameState.winner = 'bot';
          } else if (!gameState.board.some(cell => !['❌', '⭕'].includes(cell))) {
            gameState.gameOver = true;
            gameState.winner = 'draw';
          }
          
          gameState.currentPlayer = gameState.player1;
        }
      }

      const boardText = this.getBoardText(gameState);
      
      await message.unsend(Reply.messageID, Reply.chatId);
      
      const newMsg = await message.send(`${boardText}\n\n💡 Reply with position number (1-9) to make your move!`, Reply.chatId);

      if (!gameState.gameOver) {
        global.ST.onReply.delete(Reply.messageID);
        global.ST.onReply.set(newMsg.message_id, {
          commandName: this.config.name,
          type: 'ttt_game',
          gameId: gameId,
          messageID: newMsg.message_id,
          author: Reply.author,
          chatId: Reply.chatId
        });
      } else {
        global.ST.tttGames.delete(gameId);
        global.ST.onReply.delete(Reply.messageID);
        
        let gameOverText = '🎮 Game Over!\n\n';
        if (gameState.winner === 'draw') {
          gameOverText += '🤝 It\'s a Draw!';
        } else if (gameState.winner === gameState.player1) {
          gameOverText += `🎉 ${gameState.player1Name} Won!`;
        } else if (gameState.winner === 'bot') {
          gameOverText += '🤖 Bot Won!';
        } else {
          gameOverText += `🏆 ${gameState.player2Name} Won!`;
        }
        
        await message.reply(gameOverText);
      }

    } catch (error) {
      global.log.error('Error in tictactoe onReply:', error);
      return message.reply('❌ Error occurred!');
    }
  },

  getBoardText(gameState) {
    const board = gameState.board;
    let text = '🎮 Tic-Tac-Toe Game\n\n';
    
    text += `${board[0]} ${board[1]} ${board[2]}\n`;
    text += `${board[3]} ${board[4]} ${board[5]}\n`;
    text += `${board[6]} ${board[7]} ${board[8]}\n\n`;

    if (gameState.gameOver) {
      if (gameState.winner === 'draw') {
        text += '🤝 Game Over - It\'s a Draw!';
      } else if (gameState.winner === gameState.player1) {
        text += `🎉 ${gameState.player1Name} Won!`;
      } else if (gameState.winner === 'bot') {
        text += '🤖 Bot Won!';
      } else {
        text += `🏆 ${gameState.player2Name} Won!`;
      }
    } else {
      if (gameState.currentPlayer === gameState.player1) {
        text += `❌ ${gameState.player1Name}'s Turn (X)`;
      } else if (gameState.isVsBot) {
        text += '⭕ Bot\'s Turn (O)';
      } else {
        text += `⭕ ${gameState.player2Name}'s Turn (O)`;
      }
    }

    return text;
  },

  checkWinner(board) {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];

    for (const [a, b, c] of lines) {
      if (board[a] !== '⬜' && !board[a].includes('️⃣') && board[a] === board[b] && board[a] === board[c]) {
        return board[a];
      }
    }

    return null;
  },

  getBotMove(board) {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];

    const isAvailable = (pos) => {
      return board[pos] !== '❌' && board[pos] !== '⭕';
    };

    for (const [a, b, c] of lines) {
      if (board[a] === '⭕' && board[b] === '⭕' && isAvailable(c)) return c;
      if (board[a] === '⭕' && board[c] === '⭕' && isAvailable(b)) return b;
      if (board[b] === '⭕' && board[c] === '⭕' && isAvailable(a)) return a;
    }

    for (const [a, b, c] of lines) {
      if (board[a] === '❌' && board[b] === '❌' && isAvailable(c)) return c;
      if (board[a] === '❌' && board[c] === '❌' && isAvailable(b)) return b;
      if (board[b] === '❌' && board[c] === '❌' && isAvailable(a)) return a;
    }

    if (isAvailable(4)) return 4;

    const corners = [0, 2, 6, 8];
    for (const corner of corners) {
      if (isAvailable(corner)) return corner;
    }

    for (let i = 0; i < 9; i++) {
      if (isAvailable(i)) return i;
    }

    return -1;
  }
};
