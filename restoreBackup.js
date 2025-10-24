
const fs = require("fs-extra");
const readline = require("readline");
const path = require('path');
const Logger = require('./logger/logs');

const logger = new Logger(global.config?.timezone || 'Asia/Dhaka');

function recursiveReadDirAndBackup(pathFileOrFolder, versionBackup) {
	const pathFileOrFolderBackup = `${process.cwd()}/backups/${versionBackup}/${pathFileOrFolder}`;
	const pathFileOrFolderRestore = `${process.cwd()}/${pathFileOrFolder}`;

	if (fs.lstatSync(pathFileOrFolderBackup).isDirectory()) {
		if (!fs.existsSync(pathFileOrFolderRestore))
			fs.mkdirSync(pathFileOrFolderRestore);
		const readDir = fs.readdirSync(pathFileOrFolderBackup);
		readDir.forEach(fileOrFolder => {
			recursiveReadDirAndBackup(`${pathFileOrFolder}/${fileOrFolder}`, versionBackup);
		});
	}
	else {
		pathFileOrFolder = pathFileOrFolder.replace(/\\/g, '/');
		fs.copyFileSync(pathFileOrFolderBackup, pathFileOrFolderRestore);
	}
}

function getLatestBackup() {
	const backupsPath = `${process.cwd()}/backups`;
	if (!fs.existsSync(backupsPath)) {
		return null;
	}

	const backupFolders = fs.readdirSync(backupsPath)
		.filter(folder => folder.startsWith('backup_') && fs.lstatSync(`${backupsPath}/${folder}`).isDirectory())
		.map(folder => {
			const backupInfoPath = `${backupsPath}/${folder}/backup_info.json`;
			let timestamp = 0;
			if (fs.existsSync(backupInfoPath)) {
				const info = JSON.parse(fs.readFileSync(backupInfoPath, 'utf-8'));
				timestamp = new Date(info.timestamp).getTime();
			}
			return { folder, timestamp };
		})
		.sort((a, b) => b.timestamp - a.timestamp);

	return backupFolders.length > 0 ? backupFolders[0].folder : null;
}

function autoRestore() {
	logger.info('🔄 Starting automatic restore...');

	const latestBackup = getLatestBackup();
	if (!latestBackup) {
		throw new Error('No backup found for auto-restore');
	}

	const versionBackup = latestBackup;
	const backupFolder = `${process.cwd()}/backups/${versionBackup}`;

	logger.info(`📦 Restoring from backup: ${versionBackup}`);

	const files = fs.readdirSync(backupFolder).filter(f => f !== 'backup_info.json');
	for (const file of files) {
		recursiveReadDirAndBackup(file, versionBackup);
	}

	// Restore package.json version
	const backupInfoPath = `${backupFolder}/backup_info.json`;
	if (fs.existsSync(backupInfoPath)) {
		const backupInfo = JSON.parse(fs.readFileSync(backupInfoPath, 'utf-8'));
		const packageJson = require(`${process.cwd()}/package.json`);
		packageJson.version = backupInfo.version;
		fs.writeFileSync(`${process.cwd()}/package.json`, JSON.stringify(packageJson, null, 2));
	}

	logger.success(`✅ Auto-restore completed successfully from ${versionBackup}`);
	logger.info('🔄 Bot will restart automatically');
}

// CLI mode
if (require.main === module) {
	(async () => {
		let versionBackup;
		const rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout
		});

		if (process.argv.length < 3) {
			versionBackup = await new Promise((resolve) => {
				rl.question("Input version backup (or press Enter for latest): ", answer => {
					resolve(answer);
				});
			});
			rl.close();
		}
		else {
			versionBackup = process.argv[2];
		}

		// Use latest backup if none specified
		if (!versionBackup) {
			versionBackup = getLatestBackup();
			if (!versionBackup) {
				logger.error("ERROR", `No backups found`);
				process.exit(1);
			}
			logger.info(`Using latest backup: ${versionBackup}`);
		}

		versionBackup = versionBackup.replace("backup_", "");
		versionBackup = `backup_${versionBackup}`;

		const backupFolder = `${process.cwd()}/backups/${versionBackup}`;
		if (!fs.existsSync(backupFolder)) {
			logger.error("ERROR", `Backup folder does not exist (${backupFolder})`);
			process.exit(1);
		}

		const files = fs.readdirSync(backupFolder).filter(f => f !== 'backup_info.json');
		for (const file of files) {
			recursiveReadDirAndBackup(file, versionBackup);
		}

		const backupInfoPath = `${backupFolder}/backup_info.json`;
		if (fs.existsSync(backupInfoPath)) {
			const backupInfo = JSON.parse(fs.readFileSync(backupInfoPath, 'utf-8'));
			const packageJson = require(`${process.cwd()}/package.json`);
			packageJson.version = backupInfo.version;
			fs.writeFileSync(`${process.cwd()}/package.json`, JSON.stringify(packageJson, null, 2));
		}

		logger.success("SUCCESS", `Restore backup ${versionBackup} success`);
	})();
}

module.exports = { autoRestore, getLatestBackup };
