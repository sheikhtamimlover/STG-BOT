
<div align="center">

# 🤖 STG BOT

<img src="https://i.ibb.co.com/Ngch93Rz/818-F84-BF-03-F7-499-A-8-C77-B7-E23-C9-C4-AE4-modified.png" alt="STG BOT Logo" width="200" style="border-radius: 50%"/>

### Advanced Telegram Bot Framework

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/sheikhtamimlover/STG-BOT)
[![Node.js](https://img.shields.io/badge/node.js-18+-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-MIT-yellow.svg)](LICENSE)
[![Downloads](https://img.shields.io/github/downloads/sheikhtamimlover/STG-BOT/total)](https://github.com/sheikhtamimlover/STG-BOT/releases)
[![Telegram Group](https://img.shields.io/badge/Telegram-Join%20Group-blue.svg)](https://t.me/STGBOTGC)

[Features](#-features) • [Installation](#-installation) • [Configuration](#-configuration) • [Commands](#-commands) • [Support](#-support)

</div>

---

## 📋 Table of Contents

- [Features](#-features)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Commands](#-commands)
- [Creating Custom Commands](#-creating-custom-commands)
- [Database System](#-database-system)
- [Hosting](#-hosting)
- [Support](#-support)
- [Contributing](#-contributing)
- [License](#-license)

## ✨ Features

- 🚀 **Modular Command System** - Easy-to-use command handler with aliases and cooldowns
- 🎭 **Event Handling** - Support for group events (welcome, leave, etc.)
- 💾 **Dual Database Support** - JSON and MongoDB options
- 🔐 **Role-Based Permissions** - Three-tier permission system (User, Admin, Owner)
- 📊 **User Statistics** - Track user activity, levels, and messages
- 🎨 **Rich Message Formatting** - HTML/Markdown support with utilities
- 🔄 **Auto-Update System** - Built-in update checker and installer
- 🛡️ **Auto Package Installation** - Automatically installs missing dependencies
- 📈 **Level System** - User experience and leveling system
- 💰 **Economy System** - Built-in money and daily rewards

## 🚀 Installation

### Quick Setup (Recommended)

```bash
git clone https://github.com/sheikhtamimlover/STG-BOT.git && cp -r STG-BOT/. . && rm -rf STG-BOT
npm install
npm start
```

### Manual Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/sheikhtamimlover/STG-BOT.git
   cd STG-BOT
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure the bot**
   - Edit `config.json` and add your bot token
   - Get your bot token from [@BotFather](https://t.me/BotFather)

4. **Start the bot**
   ```bash
   npm start
   ```

## ⚙️ Configuration

### config.json

Edit `config.json` to customize your bot:

```json
{
  "prefix": "/",                    // Command prefix
  "usePrefix": true,                // Require prefix for commands
  "adminUID": ["YOUR_USER_ID"],     // Bot administrator user IDs
  "onlyAdmin": false,               // Restrict bot to admins only
  "timezone": "Asia/Dhaka",         // Bot timezone
  "ownerName": "Sheikh Tamim",      // Bot owner name
  "botName": "STG BOT",             // Bot display name
  "token": "YOUR_BOT_TOKEN",        // Telegram bot token (REQUIRED)
  "allowInboxMode": true,           // Allow private messages
  "autoRestart": true,              // Auto-restart on crash
  
  "database": {
    "type": "json",                 // Database type: "json" or "mongodb"
    "uriMongodb": "",               // MongoDB connection URI (if using MongoDB)
    "autoSyncWhenStart": false,     // Auto-sync on startup
    "autoRefreshThreadInfoFirstTime": true
  },
  
  "levelSystem": {
    "enabled": true,                // Enable level system
    "expPerMessage": 5,             // EXP gained per message
    "expToLevelUp": 100             // EXP needed per level
  },
  
  "reactionUnsend": {
    "enabled": true,                // Enable admin unsend via reaction
    "emoji": "",                    // Custom unsend emoji
    "likeEmoji": "❤️",             // Like emoji
    "allowAnyUser": false           // Allow any user to unsend
  }
}
```

### Getting Your User ID

1. Start a chat with your bot
2. Send any message
3. Use the `/uid` command to get your user ID
4. Add your ID to `adminUID` in `config.json`

## 📚 Commands

### General Commands
- `/help` - List all available commands
- `/help <command>` - Get detailed help for a specific command
- `/ping` - Check bot response time and statistics
- `/userinfo [@user]` - View user information
- `/rank` - View your level and rank

### Economy Commands
- `/daily` - Claim daily rewards (24-hour cooldown)

### Admin Commands (Group Admins)
- `/admin add <user_id>` - Add bot administrator
- `/admin remove <user_id>` - Remove administrator
- `/admin list` - List all administrators

### Owner Commands (Bot Owners Only)
- `/restart` - Restart the bot
- `/update` - Check and install updates
- `/eval <code>` - Execute JavaScript code
- `/shell <command>` - Execute shell commands
- `/cmd load/unload/reload <name>` - Manage commands
- `/events load/unload <name>` - Manage events

### Database Commands
- `/userdb [@user]` - View user database information
- `/threaddb` - View group/thread database information

## 🔨 Creating Custom Commands

Create a new file in `scripts/cmds/` directory:

```javascript
module.exports = {
  config: {
    name: "mycommand",              // Command name
    aliases: ["mc", "mycmd"],       // Command aliases
    author: "Your Name",            // Your name
    version: "1.0",                 // Command version
    cooldown: 5,                    // Cooldown in seconds
    role: 0,                        // 0=Everyone, 1=Admin, 2=Owner
    description: "My custom command",
    category: "general",
    usePrefix: true
  },

  // Main command handler
  ST: async function ({ event, api, args, message, userId, chatId }) {
    await message.reply("Hello from my command!");
  },

  // Optional: Trigger on any message
  onChat: async function ({ event, api, message }) {
    // React to specific keywords
  },

  // Optional: Handle replies to bot messages
  onReply: async function ({ event, api, Reply, message }) {
    // Handle user replies
  },

  // Optional: Handle callback queries (button clicks)
  onCallback: async function ({ event, api, Callback }) {
    // Handle button clicks
  },

  // Optional: Handle reactions
  onReaction: async function ({ event, api, Reaction }) {
    // Handle user reactions
  },

  // Optional: Called when command is loaded
  onLoad: async function ({ api }) {
    // Initialize command resources
  }
};
```

### Message Utility Functions

The `message` object provides these useful methods:

#### 1. **message.reply(text, options)**
Reply to the user's message:
```javascript
await message.reply("Hello!");
await message.reply("Formatted text", { parse_mode: 'Markdown' });
```

#### 2. **message.send(text, chatId, options)**
Send a message to any chat:
```javascript
await message.send("Hello!", chatId);
await message.send("Message", null, { parse_mode: 'HTML' });
```

#### 3. **message.unsend(messageId, chatId)**
Delete a message:
```javascript
await message.unsend(messageId);
```

#### 4. **message.react(emoji, messageId)**
React to a message:
```javascript
await message.react("❤️");
await message.react("👍", messageId);
```

#### 5. **message.edit(text, messageId, chatId, options)**
Edit a message:
```javascript
await message.edit("Updated text", messageId);
```

#### 6. **message.sendAttachment(options)**
Send media files:
```javascript
// Send photo
await message.sendAttachment({
  body: "Caption text",
  attachment: "/path/to/photo.jpg"
});

// Send video
await message.sendAttachment({
  body: "Video caption",
  attachment: "/path/to/video.mp4"
});

// Send audio
await message.sendAttachment({
  body: "Audio caption",
  attachment: "/path/to/audio.mp3"
});
```

#### 7. **message.getAttachment(type)**
Get attachments from message:
```javascript
const photo = message.getAttachment('photo');
const video = message.getAttachment('video');
const any = message.getAttachment('any');
```

#### 8. **message.downloadAttachment(attachment, savePath)**
Download attachments:
```javascript
const attachment = message.getAttachment('photo');
const path = await message.downloadAttachment(attachment, './photo.jpg');
```

### Using Eval Command

The `/eval` command allows you to execute JavaScript code (Owner only):

```javascript
// Example 1: Get bot statistics
/eval return {
  commands: global.ST.commands.size,
  events: global.ST.events.size,
  uptime: process.uptime()
}

// Example 2: Get user data
/eval return await global.db.getUser("USER_ID")

// Example 3: Send message to chat
/eval await global.bot.sendMessage("CHAT_ID", "Hello!")

// Example 4: Get all users
/eval return await global.db.getAllUsers()

// Example 5: Update user data
/eval return await global.db.updateUser("USER_ID", { money: 1000 })

// Example 6: Clear cooldowns
/eval global.ST.cooldowns.clear(); return "Cooldowns cleared"
```

### Using Callback Buttons

Create interactive buttons:

```javascript
const sentMsg = await message.reply("Choose an option:", {
  reply_markup: {
    inline_keyboard: [
      [{ text: "Option 1", callback_data: "option_1" }],
      [{ text: "Option 2", callback_data: "option_2" }]
    ]
  }
});

// Store callback data
global.ST.onCallback.set(sentMsg.message_id, {
  commandName: 'mycommand',
  author: userId,
  data: { /* your data */ }
});
```

Handle callback in `onCallback`:
```javascript
onCallback: async function ({ event, api, Callback }) {
  const query = event;
  
  // Check if user is authorized
  if (query.from.id !== Callback.author) {
    return api.answerCallbackQuery(query.id, {
      text: "Not authorized!",
      show_alert: true
    });
  }

  // Handle callback
  const action = query.data;
  if (action === 'option_1') {
    await api.sendMessage(query.message.chat.id, "You chose option 1");
  }
}
```

## 💾 Database System

STG BOT supports two database systems:

### JSON Database (Default)
- Lightweight and easy to use
- No external dependencies
- Stored in `database/data/` directory
- Recommended for small to medium bots

### MongoDB Database
- Scalable and powerful
- Recommended for large-scale bots
- Requires MongoDB connection URI

To switch to MongoDB:
1. Set `"type": "mongodb"` in config.json
2. Add your MongoDB URI to `"uriMongodb"`
3. Restart the bot

## 🌐 Hosting

### Replit (Recommended)

1. Import from GitHub: https://replit.com/github/sheikhtamimlover/STG-BOT
2. Add your bot token in `config.json`
3. Click "Run" button
4. Keep your Repl always online with Replit Core

### Render

1. Create new Web Service
2. Connect your GitHub repository
3. Set build command: `npm install`
4. Set start command: `npm start`
5. Add environment variables from `config.json`

### Other Platforms

The bot can run on any Node.js hosting platform:
- Heroku
- Railway
- Fly.io
- VPS/Cloud servers

**Requirements:**
- Node.js 18 or higher
- 512MB RAM minimum
- Persistent storage for database

## 📊 Project Structure

```
STG-BOT/
├── bot/                    # Bot core files
│   ├── handler/           # Event and command handlers
│   └── login/             # Bot login logic
├── database/              # Database systems
│   ├── jsondb.js         # JSON database
│   └── mongodb.js        # MongoDB database
├── logger/                # Logging utilities
├── scripts/
│   ├── cmds/             # Command files
│   └── events/           # Event files
├── tmp/                   # Temporary files
├── config.json           # Configuration file
├── package.json          # Dependencies
├── ST.js                 # Main bot file
├── utils.js              # Utility functions
└── README.md            # This file
```

## 🤝 Support

### Join Our Community

- **Telegram Group**: [STG BOT GC](https://t.me/STGBOTGC)
- **GitHub Issues**: [Report Issues](https://github.com/sheikhtamimlover/STG-BOT/issues)

### Contact Developer

- **GitHub**: [@sheikhtamimlover](https://github.com/sheikhtamimlover)
- **Instagram**: [@sheikh.tamim_lover](https://instagram.com/sheikh.tamim_lover)

## 🎯 Roadmap

- [ ] Add more built-in commands
- [ ] Implement plugin system
- [ ] Add web dashboard
- [ ] Multi-language support
- [ ] Enhanced analytics
- [ ] AI integration

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### MIT License

```
MIT License

Copyright (c) 2024 Sheikh Tamim

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## 🙏 Acknowledgments

- Thanks to all contributors who have helped this project grow
- Telegram Bot API for their excellent documentation
- The Node.js community for amazing tools and libraries

---

<div align="center">

**Made with ❤️ by [Sheikh Tamim](https://github.com/sheikhtamimlover)**

⭐ Star this repository if you find it useful!

</div>
