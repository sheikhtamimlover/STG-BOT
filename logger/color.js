const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',

  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',

  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m'
};

function colorize(text, color) {
  return `${colors[color] || ''}${text}${colors.reset}`;
}

function gradient(text, startColor, endColor) {
  return colorize(text, startColor);
}

module.exports = {
  colors,
  colorize,
  gradient,
  
  black: (text) => colorize(text, 'black'),
  red: (text) => colorize(text, 'red'),
  green: (text) => colorize(text, 'green'),
  yellow: (text) => colorize(text, 'yellow'),
  blue: (text) => colorize(text, 'blue'),
  magenta: (text) => colorize(text, 'magenta'),
  cyan: (text) => colorize(text, 'cyan'),
  white: (text) => colorize(text, 'white'),
  bright: (text) => colorize(text, 'bright'),
  dim: (text) => colorize(text, 'dim'),
  
  success: (text) => colorize(text, 'green'),
  error: (text) => colorize(text, 'red'),
  warning: (text) => colorize(text, 'yellow'),
  info: (text) => colorize(text, 'cyan'),
  
  bgSuccess: (text) => `${colors.bgGreen}${colors.black}${text}${colors.reset}`,
  bgError: (text) => `${colors.bgRed}${colors.white}${text}${colors.reset}`,
  bgWarning: (text) => `${colors.bgYellow}${colors.black}${text}${colors.reset}`,
  bgInfo: (text) => `${colors.bgCyan}${colors.black}${text}${colors.reset}`
};
