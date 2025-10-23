module.exports = {
  config: {
    name: "help",
    aliases: [],
    author: "ST",
    version: "1.0.0",
    cooldown: 5,
    role: 0,
    description: "Display all available commands",
    category: "system",
    usePrefix: true
  },

  ST: async function ({ event, api, args, message }) {
    const commands = Array.from(global.ST.commands.values());
    const uniqueCommands = [...new Map(commands.map(cmd => [cmd.config.name, cmd])).values()];
    
    if (args[0]) {
      const commandName = args[0].toLowerCase();
      const command = global.ST.commands.get(commandName);
      
      if (!command) {
        return message.reply(`❌ Command "${commandName}" not found.`);
      }
      
      let helpText = `📖 Command: ${command.config.name}\n\n`;
      helpText += `📝 Description: ${command.config.description || 'No description'}\n`;
      helpText += `👤 Author: ${command.config.author || 'Unknown'}\n`;
      helpText += `📦 Version: ${command.config.version || '1.0'}\n`;
      helpText += `⏳ Cooldown: ${command.config.cooldown || 0}s\n`;
      helpText += `🔐 Role: ${getRoleName(command.config.role)}\n`;
      helpText += `📁 Category: ${command.config.category || 'general'}\n`;
      
      if (command.config.aliases && command.config.aliases.length > 0) {
        helpText += `🏷️ Aliases: ${command.config.aliases.join(', ')}\n`;
      }
      
      return message.reply(helpText);
    }
    
    const categories = {};
    uniqueCommands.forEach(cmd => {
      const category = cmd.config.category || 'general';
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(cmd.config.name);
    });
    
    let helpText = `📚 Available Commands (${uniqueCommands.length})\n`;
    helpText += `Prefix: ${global.config.prefix}\n\n`;
    
    for (const [category, cmds] of Object.entries(categories)) {
      helpText += `📂 ${category.toUpperCase()}\n`;
      helpText += cmds.map(cmd => `  • ${cmd}`).join('\n');
      helpText += `\n\n`;
    }
    
    helpText += `💡 Use ${global.config.prefix}help <command> for detailed info`;
    
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
