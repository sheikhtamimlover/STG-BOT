const { spawn } = require("child_process");
const Logger = require('./logger/logs');
const log = new Logger('Asia/Dhaka');

function startProject() {
  const child = spawn("node", ["ST.js"], {
    cwd: __dirname,
    stdio: "inherit",
    shell: true
  });

  child.on("close", (code) => {
    if (code == 2) {
      log.info("Restarting Project...");
      startProject();
    }
  });
}

startProject();