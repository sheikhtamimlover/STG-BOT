const c = require('./color');

function getBanner() {
  const packageJson = require('../package.json');
  const version = packageJson.version || '1.0.0';
  
  return `
${c.blue('╔═══════════════════════════════════════════════════════════════╗')}
${c.blue('║')}                                                               ${c.blue('║')}
${c.blue('║')}     ${c.bright(c.cyan('███████╗████████╗ ██████╗     ██████╗  ██████╗ ████████╗'))}  ${c.blue('║')}
${c.blue('║')}     ${c.bright(c.cyan('██╔════╝╚══██╔══╝██╔════╝     ██╔══██╗██╔═══██╗╚══██╔══╝'))}  ${c.blue('║')}
${c.blue('║')}     ${c.bright(c.cyan('███████╗   ██║   ██║  ███╗    ██████╔╝██║   ██║   ██║   '))}  ${c.blue('║')}
${c.blue('║')}     ${c.bright(c.cyan('╚════██║   ██║   ██║   ██║    ██╔══██╗██║   ██║   ██║   '))}  ${c.blue('║')}
${c.blue('║')}     ${c.bright(c.cyan('███████║   ██║   ╚██████╔╝    ██████╔╝╚██████╔╝   ██║   '))}  ${c.blue('║')}
${c.blue('║')}     ${c.bright(c.cyan('╚══════╝   ╚═╝    ╚═════╝     ╚═════╝  ╚═════╝    ╚═╝   '))}  ${c.blue('║')}
${c.blue('║')}                                                               ${c.blue('║')}
${c.blue('║')}           ${c.white(`Advanced Telegram Bot Framework v${version}`)}                ${c.blue('║')}
${c.blue('║')}              ${c.dim('Developed by Sheikh Tamim')}                        ${c.blue('║')}
${c.blue('║')}                                                               ${c.blue('║')}
${c.blue('╚═══════════════════════════════════════════════════════════════╝')}
`;
}

function showBanner() {
  console.clear();
  console.log(getBanner());
}

function showCopyright() {
  const c = require('./color');
  console.log('\n' + c.yellow('═'.repeat(70)));
  console.log(c.bright(c.cyan('  © 2024 STG BOT - All Rights Reserved')));
  console.log(c.white('  Created by: Sheikh Tamim'));
  console.log(c.white('  GitHub: https://github.com/sheikhtamimlover/STG-BOT'));
  console.log(c.white('  Telegram: https://t.me/STGBOTGC'));
  console.log(c.dim('  This software is licensed under the MIT License'));
  console.log(c.yellow('═'.repeat(70)) + '\n');
}

module.exports = { showBanner, getBanner, showCopyright };
