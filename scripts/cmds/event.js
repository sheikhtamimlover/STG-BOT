module.exports = {
  config: {
    name: "event",
    aliases: [],
    author: "ST",
    version: "1.2.1",
    cooldown: 5,
    role: 2,
    description: "Manage events (load, unload, install, delete, loadall)",
    category: "admin",
    usePrefix: true
  },

  ST: async function ({ event, api, args, message }) {
    try {
      if (args.length < 1) {
        const helpText = `🎭 Event Management\n\n` +
          `Usage:\n` +
          `${global.config.prefix}events load <name> - Load/reload an event\n` +
          `${global.config.prefix}events unload <name> - Unload an event\n` +
          `${global.config.prefix}events install <file.js> - Install from code (reply to code)\n` +
          `${global.config.prefix}events delete <file.js> - Delete event file\n` +
          `${global.config.prefix}events loadall - Reload all events\n\n` +
          `Example: ${global.config.prefix}events load welcome`;
        
        return message.reply(helpText);
      }

      const action = args[0].toLowerCase();

      if (action === 'load') {
        if (!args[1]) {
          return message.reply(`❌ Usage: ${global.config.prefix}events load <event_name>`);
        }
        
        const name = args[1].toLowerCase();
        const result = await global.reloadEvent(name);
        
        if (result.success) {
          global.log.success(`Event ${name} reloaded by ${event.from.first_name}`);
          return message.reply(`✅ ${result.message}`);
        } else {
          global.log.error(`Failed to reload event ${name}: ${result.message}`);
          return message.reply(`❌ ${result.message}`);
        }
      }

      if (action === 'unload') {
        if (!args[1]) {
          return message.reply(`❌ Usage: ${global.config.prefix}events unload <event_name>`);
        }
        
        const name = args[1].toLowerCase();
        const result = global.unloadEvent(name);
        
        if (result.success) {
          global.log.success(`Event ${name} unloaded by ${event.from.first_name}`);
          return message.reply(`✅ ${result.message}`);
        } else {
          global.log.error(`Failed to unload event ${name}: ${result.message}`);
          return message.reply(`❌ ${result.message}`);
        }
      }

      if (action === 'install') {
        if (!event.reply_to_message || !event.reply_to_message.text) {
          return message.reply(`❌ Usage:\n1. Send the code as a message\n2. Reply to that message with: ${global.config.prefix}events install <filename.js>`);
        }

        if (!args[1]) {
          return message.reply(`❌ Usage: ${global.config.prefix}events install <filename.js>`);
        }

        const fileName = args[1];
        const code = event.reply_to_message.text;

        if (!fileName.endsWith('.js')) {
          return message.reply(`❌ Filename must end with .js`);
        }

        const result = global.installEventFile(fileName, code);
        
        if (result.success) {
          await global.reloadEvent(fileName.replace('.js', ''));
          global.log.success(`Event ${fileName} installed by ${event.from.first_name}`);
          return message.reply(`✅ ${result.message}\n💡 Event loaded and ready to use!`);
        } else {
          global.log.error(`Failed to install event ${fileName}: ${result.message}`);
          return message.reply(`❌ ${result.message}`);
        }
      }

      if (action === 'delete') {
        if (!args[1]) {
          return message.reply(`❌ Usage: ${global.config.prefix}events delete <filename.js>`);
        }

        const fileName = args[1];

        if (!fileName.endsWith('.js')) {
          return message.reply(`❌ Filename must end with .js`);
        }

        const result = global.deleteEventFile(fileName);
        
        if (result.success) {
          global.log.success(`Event ${fileName} deleted by ${event.from.first_name}`);
          return message.reply(`✅ ${result.message}\n⚠️ File permanently deleted!`);
        } else {
          global.log.error(`Failed to delete event ${fileName}: ${result.message}`);
          return message.reply(`❌ ${result.message}`);
        }
      }

      if (action === 'loadall') {
        const msg = await message.reply('⏳ Reloading all events...');
        
        const result = await global.loadEvents(false);
        
        let responseText = `╭──────────────◊\n`;
        responseText += `│ ✅ Events Reloaded\n`;
        responseText += `├──────────────◊\n`;
        responseText += `│ 📦 Loaded: ${result.loaded.length} events\n`;
        responseText += `│ ❌ Errors: ${result.errors.length} events\n`;
        responseText += `├──────────────◊\n`;
        responseText += `│ Total: ${global.ST.events.size} events active\n`;
        responseText += `╰──────────────◊`;
        
        global.log.success(`All events reloaded by ${event.from.first_name}`);
        await api.editMessageText(responseText, {
          chat_id: event.chat.id,
          message_id: msg.message_id
        });
        return;
      } else {
        return message.reply(`❌ Unknown action: ${action}\n\n💡 Use ${global.config.prefix}events to see available options`);
      }

    } catch (error) {
      global.log.error('Error in events command:', error);
      message.reply(`❌ Error: ${error.message}`);
    }
  }
};
