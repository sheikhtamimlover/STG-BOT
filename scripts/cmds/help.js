
module.exports = {
  config: {
    name: "help",
    aliases: [],
    author: "ST",
    version: "1.2.1",
    cooldown: 5,
    role: 0,
    description: "Display all available commands",
    category: "system",
    usePrefix: true
  },

  ST: async function ({ event, api, args, message, chatId }) {
    const commands = Array.from(global.ST.commands.values());
    const uniqueCommands = [...new Map(commands.map(cmd => [cmd.config.name, cmd])).values()];
    
    // Get prefix for this chat
    let prefix = global.config.prefix;
    if (global.config.allowCustomPrefix && chatId) {
      const thread = await global.db.getThread(String(chatId));
      if (thread.customPrefix) {
        prefix = thread.customPrefix;
      }
    }
    
    if (args[0]) {
      const commandName = args[0].toLowerCase();
      const command = global.ST.commands.get(commandName);
      
      if (!command) {
        return message.reply(`❌ Command "${commandName}" not found.`);
      }
      
      let helpText = `╭──────────────◊\n`;
      helpText += `│ 📖 Command: ${command.config.name}\n`;
      helpText += `├──────────────◊\n`;
      helpText += `│ 📝 Description: ${command.config.description || 'No description'}\n`;
      helpText += `│ 👤 Author: ${command.config.author || 'Unknown'}\n`;
      helpText += `│ 📦 Version: ${command.config.version || '1.0'}\n`;
      helpText += `│ ⏳ Cooldown: ${command.config.cooldown || 0}s\n`;
      helpText += `│ 🔐 Role: ${getRoleName(command.config.role)}\n`;
      helpText += `│ 📁 Category: ${command.config.category || 'general'}\n`;
      helpText += `│ ⚙️ Use Prefix: ${command.config.usePrefix ? 'Yes' : 'No'}\n`;
      
      if (command.config.aliases && command.config.aliases.length > 0) {
        helpText += `│ 🏷️ Aliases: ${command.config.aliases.join(', ')}\n`;
      }
      
      if (command.config.guide && command.config.guide.en) {
        const guide = command.config.guide.en.replace(/{p}/g, prefix);
        helpText += `├──────────────◊\n`;
        helpText += `│ 📚 Guide:\n`;
        helpText += guide.split('\n').map(line => `│ ${line}`).join('\n');
        helpText += `\n`;
      }
      
      helpText += `╰──────────────◊`;
      
      return message.reply(helpText);
    }
    
    const categories = {};
    uniqueCommands.forEach(cmd => {
      const category = (cmd.config.category || 'general').toUpperCase();
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(cmd.config.name);
    });
    
    let helpText = `╭──────────────◊\n`;
    helpText += `│ 📚 Available Commands (${uniqueCommands.length})\n`;
    helpText += `│ Prefix: ${prefix}\n`;
    helpText += `╰──────────────◊\n\n`;
    
    for (const [category, cmds] of Object.entries(categories).sort()) {
      helpText += `╭──── [ ${category} ]\n`;
      helpText += `│ ${cmds.map(cmd => `✧${cmd}`).join(' ✧ ')}\n`;
      helpText += `╰───────────────◊\n\n`;
    }
    
    helpText += `💡 Use ${prefix}help <command> for detailed info`;
    
    message.reply(helpText);
  }
};

function getRoleName(role) {
  switch (role) {
    case 0: return 'Everyone';
    case 1: return 'Group Admin';
    case 2: return 'Bot Owner';
    default: return 'Unknown';
  }
}
