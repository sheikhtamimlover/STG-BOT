const c = require('./color');
const moment = require('moment-timezone');

const logLevels = {
  INFO: 'info',
  SUCCESS: 'success',
  WARN: 'warn',
  ERROR: 'error',
  DEBUG: 'debug',
  ACTIVITY: 'activity'
};

class Logger {
  constructor(timezone = 'Asia/Dhaka') {
    this.timezone = timezone;
    this.activityLog = [];
  }

  getTimestamp() {
    return moment().tz(this.timezone).format('HH:mm:ss');
  }

  formatMessage(level, ...args) {
    const timestamp = c.dim(`[${this.getTimestamp()}]`);
    const message = args.join(' ');
    
    switch (level) {
      case logLevels.SUCCESS:
        return `${timestamp} ${c.bgSuccess(' ✓ ')} ${c.green(message)}`;
      case logLevels.ERROR:
        return `${timestamp} ${c.bgError(' ✗ ')} ${c.red(message)}`;
      case logLevels.WARN:
        return `${timestamp} ${c.bgWarning(' ⚠ ')} ${c.yellow(message)}`;
      case logLevels.INFO:
        return `${timestamp} ${c.bgInfo(' ℹ ')} ${c.cyan(message)}`;
      case logLevels.DEBUG:
        return `${timestamp} ${c.dim('[DEBUG]')} ${c.dim(message)}`;
      case logLevels.ACTIVITY:
        return `${timestamp} ${c.magenta('→')} ${message}`;
      default:
        return `${timestamp} ${message}`;
    }
  }

  info(...args) {
    console.log(this.formatMessage(logLevels.INFO, ...args));
  }

  success(...args) {
    console.log(this.formatMessage(logLevels.SUCCESS, ...args));
  }

  warn(...args) {
    console.log(this.formatMessage(logLevels.WARN, ...args));
  }

  error(...args) {
    console.log(this.formatMessage(logLevels.ERROR, ...args));
  }

  debug(...args) {
    console.log(this.formatMessage(logLevels.DEBUG, ...args));
  }

  activity(type, user, chat, command = null) {
    const timestamp = this.getTimestamp();
    const activity = { timestamp, type, user, chat, command };
    this.activityLog.push(activity);

    let chatType = chat?.type === 'private' ? c.blue('DM') : c.green('GROUP');
    let userName = user?.first_name || 'Unknown';
    let chatName = chat?.title || 'Private Chat';
    
    let activityMsg = `${chatType} ${c.bright(userName)}`;
    
    if (chat?.type !== 'private') {
      activityMsg += ` in ${c.bright(chatName)}`;
    }
    
    if (command) {
      activityMsg += ` used ${c.yellow(command)}`;
    }

    console.log(this.formatMessage(logLevels.ACTIVITY, activityMsg));
  }

  loading(message, current, total) {
    const percentage = Math.floor((current / total) * 100);
    const barLength = 30;
    const filled = Math.floor((current / total) * barLength);
    const empty = barLength - filled;
    
    const bar = c.green('█'.repeat(filled)) + c.dim('░'.repeat(empty));
    const counter = c.cyan(`${current}/${total}`);
    
    process.stdout.write(`\r${c.dim(`[${this.getTimestamp()}]`)} ${message} ${bar} ${counter} ${c.yellow(percentage + '%')}`);
    
    if (current === total) {
      process.stdout.write('\n');
    }
  }

  box(title, content, color = 'cyan') {
    const width = 60;
    const titleText = ` ${title} `;
    const padding = Math.floor((width - titleText.length) / 2);
    
    console.log(c[color]('╔' + '═'.repeat(width) + '╗'));
    console.log(c[color]('║') + ' '.repeat(padding) + c.bright(titleText) + ' '.repeat(width - padding - titleText.length) + c[color]('║'));
    console.log(c[color]('╠' + '═'.repeat(width) + '╣'));
    
    if (Array.isArray(content)) {
      content.forEach(line => {
        const lineText = ` ${line}`;
        const spaces = width - lineText.length;
        console.log(c[color]('║') + lineText + ' '.repeat(spaces) + c[color]('║'));
      });
    } else {
      const lineText = ` ${content}`;
      const spaces = width - lineText.length;
      console.log(c[color]('║') + lineText + ' '.repeat(spaces) + c[color]('║'));
    }
    
    console.log(c[color]('╚' + '═'.repeat(width) + '╝'));
  }

  separator(char = '═', color = 'dim') {
    console.log(c[color](char.repeat(70)));
  }

  getActivityLog() {
    return this.activityLog;
  }
}

module.exports = Logger;
