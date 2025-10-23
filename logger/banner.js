const c = require('./color');

const banner = `
${c.blue('╔═══════════════════════════════════════════════════════════════╗')}
${c.blue('║')}                                                               ${c.blue('║')}
${c.blue('║')}     ${c.bright(c.cyan('███████╗████████╗ ██████╗     ██████╗  ██████╗ ████████╗'))}  ${c.blue('║')}
${c.blue('║')}     ${c.bright(c.cyan('██╔════╝╚══██╔══╝██╔════╝     ██╔══██╗██╔═══██╗╚══██╔══╝'))}  ${c.blue('║')}
${c.blue('║')}     ${c.bright(c.cyan('███████╗   ██║   ██║  ███╗    ██████╔╝██║   ██║   ██║   '))}  ${c.blue('║')}
${c.blue('║')}     ${c.bright(c.cyan('╚════██║   ██║   ██║   ██║    ██╔══██╗██║   ██║   ██║   '))}  ${c.blue('║')}
${c.blue('║')}     ${c.bright(c.cyan('███████║   ██║   ╚██████╔╝    ██████╔╝╚██████╔╝   ██║   '))}  ${c.blue('║')}
${c.blue('║')}     ${c.bright(c.cyan('╚══════╝   ╚═╝    ╚═════╝     ╚═════╝  ╚═════╝    ╚═╝   '))}  ${c.blue('║')}
${c.blue('║')}                                                               ${c.blue('║')}
${c.blue('║')}           ${c.white('Advanced Telegram Bot Framework v1.0')}                ${c.blue('║')}
${c.blue('║')}              ${c.dim('Developed by Sheikh Tamim')}                        ${c.blue('║')}
${c.blue('║')}                                                               ${c.blue('║')}
${c.blue('╚═══════════════════════════════════════════════════════════════╝')}
`;

function showBanner() {
  console.clear();
  console.log(banner);
}

module.exports = { showBanner, banner };
