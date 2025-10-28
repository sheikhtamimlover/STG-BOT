module.exports = {
  config: {
    name: "cmd",
    aliases: [],
    author: "ST",
    version: "1.2.1",
    cooldown: 5,
    role: 2,
    description: "Manage commands (load, unload, install, delete, loadall)",
    category: "admin",
    usePrefix: true,
    guide: {
      en: `
Usage:
• {p}cmd load <name> - Load/reload a command
• {p}cmd unload <name> - Unload a command
• {p}cmd install <file.js> - Install from code (reply to code message)
• {p}cmd delete <file.js> - Delete command file
• {p}cmd loadall - Reload all commands

Examples:
• {p}cmd load ping - Reload ping command
• Reply to code message then: {p}cmd install help.js
• {p}cmd delete test.js - Delete test.js file
• {p}cmd loadall - Reload all commands
      `.trim()
    }
  },

  ST: async function ({ event, api, args, message }) {
    try {
      if (args.length < 1) {
        const guide = this.config.guide.en.replace(/{p}/g, global.config.prefix);
        return message.reply(`🔧 Command Management\n\n${guide}`);
      }

      const action = args[0].toLowerCase();

      if (action === 'load') {
        if (!args[1]) {
          return message.reply(`❌ Usage: ${global.config.prefix}cmds load <command_name>`);
        }
        
        const name = args[1].toLowerCase();
        const result = await global.reloadCommand(name);
        
        if (result.success) {
          global.log.success(`Command ${name} reloaded by ${event.from.first_name}`);
          return message.reply(`✅ ${result.message}`);
        } else {
          global.log.error(`Failed to reload command ${name}: ${result.message}`);
          return message.reply(`❌ ${result.message}`);
        }
      }

      if (action === 'unload') {
        if (!args[1]) {
          return message.reply(`❌ Usage: ${global.config.prefix}cmds unload <command_name>`);
        }
        
        const name = args[1].toLowerCase();
        
        if (name === 'cmds' || name === 'help' || name === 'admin') {
          return message.reply(`⚠️ Cannot unload protected system command: ${name}`);
        }
        
        const result = global.unloadCommand(name);
        
        if (result.success) {
          global.log.success(`Command ${name} unloaded by ${event.from.first_name}`);
          return message.reply(`✅ ${result.message}`);
        } else {
          global.log.error(`Failed to unload command ${name}: ${result.message}`);
          return message.reply(`❌ ${result.message}`);
        }
      }

      if (action === 'install') {
        if (!args[1]) {
          return message.reply(`❌ Usage: ${global.config.prefix}cmd install <filename.js> <code>\n\nOr reply to a message containing code with: ${global.config.prefix}cmd install <filename.js>`);
        }

        const fileName = args[1];
        let code;

        // Check if code is provided as argument or in reply
        if (event.reply_to_message && event.reply_to_message.text) {
          code = event.reply_to_message.text;
        } else if (args.length > 2) {
          code = args.slice(2).join(' ');
        } else {
          return message.reply(`❌ Please provide code either:\n1. Reply to a message with code\n2. Or provide code as argument`);
        }

        if (!fileName.endsWith('.js')) {
          return message.reply(`❌ Filename must end with .js`);
        }

        const result = global.installCommandFile(fileName, code);
        
        if (result.success) {
          await global.reloadCommand(fileName.replace('.js', ''));
          global.log.success(`Command ${fileName} installed by ${event.from.first_name}`);
          return message.reply(`✅ ${result.message}\n💡 Command loaded and ready to use!`);
        } else {
          global.log.error(`Failed to install command ${fileName}: ${result.message}`);
          return message.reply(`❌ ${result.message}`);
        }
      }

      if (action === 'delete') {
        if (!args[1]) {
          return message.reply(`❌ Usage: ${global.config.prefix}cmds delete <filename.js>`);
        }

        const fileName = args[1];

        if (!fileName.endsWith('.js')) {
          return message.reply(`❌ Filename must end with .js`);
        }

        const protectedCommands = ['cmds.js', 'events.js', 'help.js', 'admin.js', 'restart.js'];
        if (protectedCommands.includes(fileName)) {
          return message.reply(`⚠️ Cannot delete protected system command: ${fileName}`);
        }

        const result = global.deleteCommandFile(fileName);
        
        if (result.success) {
          global.log.success(`Command ${fileName} deleted by ${event.from.first_name}`);
          return message.reply(`✅ ${result.message}\n⚠️ File permanently deleted!`);
        } else {
          global.log.error(`Failed to delete command ${fileName}: ${result.message}`);
          return message.reply(`❌ ${result.message}`);
        }
      }

      if (action === 'loadall') {
        const msg = await message.reply('⏳ Reloading all commands...');
        
        const result = await global.loadCommands(false);
        
        const responseText = `✅ Commands Reloaded\n\n` +
          `📦 Loaded: ${result.loaded.length} commands\n` +
          `❌ Errors: ${result.errors.length} commands\n\n` +
          `Total: ${global.ST.commands.size} commands active`;
        
        global.log.success(`All commands reloaded by ${event.from.first_name}`);
        await api.editMessageText(responseText, {
          chat_id: event.chat.id,
          message_id: msg.message_id
        });
      } else {
        return message.reply(`❌ Unknown action: ${action}\n\n💡 Use ${global.config.prefix}cmds to see available options`);
      }

    } catch (error) {
      global.log.error('Error in cmds command:', error);
      message.reply(`❌ Error: ${error.message}`);
    }
  }
};
