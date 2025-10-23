
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

module.exports = {
  config: {
    name: "shell",
    aliases: [],
    author: "ST",
    version: "1.0.0",
    cooldown: 5,
    role: 2,
    description: "Execute shell commands (Owner only)",
    category: "admin",
    usePrefix: true
  },

  ST: async function ({ event, api, args, message, userId }) {
    try {
      if (!global.config.adminUID.includes(String(userId))) {
        return message.reply('⚠️ Only bot owners can use this command.');
      }

      const command = args.join(' ');

      if (!command) {
        const helpText = `🖥️ Shell Command Executor\n\n` +
          `Usage: ${global.config.prefix}shell <command>\n\n` +
          `Examples:\n` +
          `${global.config.prefix}shell ls -la\n` +
          `${global.config.prefix}shell pwd\n` +
          `${global.config.prefix}shell df -h\n` +
          `${global.config.prefix}shell ps aux\n\n` +
          `⚠️ Use with caution!`;
        
        return message.reply(helpText);
      }

      const loadingMsg = await message.reply(`⏳ Executing: \`${command}\`...`);

      const startTime = Date.now();
      
      try {
        const { stdout, stderr } = await execPromise(command, {
          timeout: 60000,
          maxBuffer: 1024 * 1024 * 10
        });

        const executionTime = Date.now() - startTime;

        let output = '';
        
        if (stdout) {
          output += `📤 STDOUT:\n${stdout}\n`;
        }
        
        if (stderr) {
          output += `⚠️ STDERR:\n${stderr}\n`;
        }

        if (!stdout && !stderr) {
          output = '✅ Command executed successfully (no output)';
        }

        if (output.length > 4000) {
          output = output.substring(0, 4000) + '\n...(truncated)';
        }

        const responseText = `✅ Shell Command Executed\n\n` +
          `💻 Command: \`${command}\`\n\n` +
          `${output}\n` +
          `⏱️ Execution Time: ${executionTime}ms`;

        await api.editMessageText(responseText, {
          chat_id: event.chat.id,
          message_id: loadingMsg.message_id,
          parse_mode: 'Markdown'
        });

        global.log.success(`Shell command executed by ${event.from.first_name}: ${command}`);

      } catch (execError) {
        const executionTime = Date.now() - startTime;
        
        let errorOutput = execError.message;
        
        if (execError.stdout) {
          errorOutput += `\n\n📤 STDOUT:\n${execError.stdout}`;
        }
        
        if (execError.stderr) {
          errorOutput += `\n\n📛 STDERR:\n${execError.stderr}`;
        }

        if (errorOutput.length > 4000) {
          errorOutput = errorOutput.substring(0, 4000) + '\n...(truncated)';
        }

        const errorText = `❌ Shell Command Failed\n\n` +
          `💻 Command: \`${command}\`\n\n` +
          `${errorOutput}\n\n` +
          `⏱️ Execution Time: ${executionTime}ms`;

        await api.editMessageText(errorText, {
          chat_id: event.chat.id,
          message_id: loadingMsg.message_id,
          parse_mode: 'Markdown'
        });

        global.log.error(`Shell command failed for ${event.from.first_name}: ${command}`);
      }

    } catch (error) {
      global.log.error('Error in shell command:', error);
      message.reply(`❌ Error: ${error.message}`);
    }
  }
};
