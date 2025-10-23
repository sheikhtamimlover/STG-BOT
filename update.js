
const { execSync } = require('child_process');

try {
    console.log("Starting update process...");
    execSync("node updater.js", { stdio: 'inherit' });
} catch (error) {
    console.error("Update failed:", error.message);
    process.exit(1);
}