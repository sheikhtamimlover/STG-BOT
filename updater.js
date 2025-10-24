const axios = require('axios');
const _ = require('lodash');
const fs = require('fs-extra');
const path = require('path');
const Logger = require('./logger/logs');

const logger = new Logger(global.config?.timezone || 'Asia/Dhaka');
const sep = path.sep;

function checkAndAutoCreateFolder(pathFolder) {
  const splitPath = path.normalize(pathFolder).split(sep);
  let currentPath = '';
  for (const i in splitPath) {
    currentPath += splitPath[i] + sep;
    if (!fs.existsSync(currentPath))
      fs.mkdirSync(currentPath);
  }
}

function sortObj(obj, parentObj, rootKeys, stringKey = "") {
  const root = sortObjAsRoot(obj, rootKeys);
  stringKey = stringKey || "";
  if (stringKey) {
    stringKey += ".";
  }
  for (const key in root) {
    if (
      typeof root[key] == "object"
      && !Array.isArray(root[key])
      && root[key] != null
    ) {
      stringKey += key;

      root[key] = sortObj(
        root[key],
        parentObj,
        Object.keys(_.get(parentObj, stringKey) || {}),
        stringKey
      );

      stringKey = "";
    }
  }
  return root;
}

function sortObjAsRoot(subObj, rootKeys) {
  const _obj = {};
  for (const key in subObj) {
    const indexInRootObj = rootKeys.indexOf(key);
    _obj[key] = indexInRootObj == -1 ? 9999 : indexInRootObj;
  }
  const sortedSubObjKeys = Object.keys(_obj).sort((a, b) => _obj[a] - _obj[b]);
  const sortedSubObj = {};
  for (const key of sortedSubObjKeys) {
    sortedSubObj[key] = subObj[key];
  }

  return sortedSubObj;
}

const defaultWriteFileSync = fs.writeFileSync;
const defaulCopyFileSync = fs.copyFileSync;

fs.writeFileSync = function (fullPath, data) {
  fullPath = path.normalize(fullPath);
  const pathFolder = fullPath.split(sep);
  if (pathFolder.length > 1)
    pathFolder.pop();
  checkAndAutoCreateFolder(pathFolder.join(path.sep));
  defaultWriteFileSync(fullPath, data);
};

fs.copyFileSync = function (src, dest) {
  src = path.normalize(src);
  dest = path.normalize(dest);
  const pathFolder = dest.split(sep);
  if (pathFolder.length > 1)
    pathFolder.pop();
  checkAndAutoCreateFolder(pathFolder.join(path.sep));
  defaulCopyFileSync(src, dest);
};

(async () => {
  const { data: lastCommit } = await axios.get('https://api.github.com/repos/sheikhtamimlover/STG-BOT/commits/main');
  const lastCommitDate = new Date(lastCommit.commit.committer.date);

  if (new Date().getTime() - lastCommitDate.getTime() < 5 * 60 * 1000) {
    const minutes = Math.floor((5 * 60 * 1000 - (new Date().getTime() - lastCommitDate.getTime())) / 1000 / 60);
    const seconds = Math.floor((5 * 60 * 1000 - (new Date().getTime() - lastCommitDate.getTime())) / 1000 % 60);
    return logger.error(`⚠️ Update too fast! Please wait ${minutes}m ${seconds}s before updating again.`);
  }

  const { data: versions } = await axios.get('https://raw.githubusercontent.com/sheikhtamimlover/STG-BOT/main/version.json');
  const currentVersion = require('./package.json').version;
  const indexCurrentVersion = versions.findIndex(v => v.version === currentVersion);

  if (indexCurrentVersion === -1)
    return logger.error(`❌ Cannot find current version ${logger.color.yellow(currentVersion)} in version list`);

  const versionsNeedToUpdate = versions.slice(indexCurrentVersion + 1);
  if (versionsNeedToUpdate.length === 0)
    return logger.success('✅ STG BOT is already up to date!');

  fs.writeFileSync(`${process.cwd()}/version.json`, JSON.stringify(versions, null, 2));
  logger.info(`📦 Found ${logger.color.yellow(versionsNeedToUpdate.length)} new version(s) to update`);

  const versionNotes = versionsNeedToUpdate
    .filter(v => v.note)
    .map(v => `${logger.color.cyan(`v${v.version}`)}: ${v.note}`)
    .join('\n   ');

  if (versionNotes) {
    console.log(logger.color.bold(logger.color.green('\n📋 What\'s New in Updates:')));
    console.log(`   ${versionNotes}\n`);
  }

  const allImageUrls = versionsNeedToUpdate.flatMap(v => v.imageUrl || []);
  const allVideoUrls = versionsNeedToUpdate.flatMap(v => v.videoUrl || []);
  const allAudioUrls = versionsNeedToUpdate.flatMap(v => v.audioUrl || []);

  if (allImageUrls.length > 0 || allVideoUrls.length > 0 || allAudioUrls.length > 0) {
    console.log(logger.color.bold(logger.color.blue('\n📎 Media Content in Updates:')));
    if (allImageUrls.length > 0) console.log(`   🖼️  Images: ${logger.color.yellow(allImageUrls.length)} files`);
    if (allVideoUrls.length > 0) console.log(`   🎥 Videos: ${logger.color.yellow(allVideoUrls.length)} files`);
    if (allAudioUrls.length > 0) console.log(`   🎵 Audio: ${logger.color.yellow(allAudioUrls.length)} files`);
    console.log('');
  }

  const createUpdate = {
    version: "",
    files: {},
    deleteFiles: {},
    reinstallDependencies: false,
    imageUrl: [],
    videoUrl: [],
    audioUrl: []
  };

  for (const version of versionsNeedToUpdate) {
    for (const filePath in version.files) {
      if (["config.json", "configCommands.json"].includes(filePath)) {
        if (!createUpdate.files[filePath])
          createUpdate.files[filePath] = {};

        createUpdate.files[filePath] = {
          ...createUpdate.files[filePath],
          ...version.files[filePath]
        };
      }
      else
        createUpdate.files[filePath] = version.files[filePath];

      if (version.reinstallDependencies)
        createUpdate.reinstallDependencies = true;

      if (createUpdate.deleteFiles[filePath])
        delete createUpdate.deleteFiles[filePath];

      for (const filePath in version.deleteFiles)
        createUpdate.deleteFiles[filePath] = version.deleteFiles[filePath];

      if (version.imageUrl) createUpdate.imageUrl.push(...version.imageUrl);
      if (version.videoUrl) createUpdate.videoUrl.push(...version.videoUrl);
      if (version.audioUrl) createUpdate.audioUrl.push(...version.audioUrl);

      createUpdate.version = version.version;
    }
  }

  const backupsPath = `${process.cwd()}/backups`;
  if (!fs.existsSync(backupsPath))
    fs.mkdirSync(backupsPath);
  const folderBackup = `${backupsPath}/backup_${currentVersion}`;

  // Clean up old backups from root directory
  const foldersBackup = fs.readdirSync(process.cwd())
    .filter(folder => folder.startsWith("backup_") && fs.lstatSync(folder).isDirectory());
  for (const folder of foldersBackup)
    fs.moveSync(folder, `${backupsPath}/${folder}`);

  // Save current version info for auto-restore
  const backupInfo = {
    version: currentVersion,
    timestamp: new Date().toISOString(),
    targetVersion: createUpdate.version
  };
  fs.writeFileSync(`${folderBackup}/backup_info.json`, JSON.stringify(backupInfo, null, 2));

  logger.info(`🔄 Updating to version ${logger.color.yellow(createUpdate.version)}`);
  const { files, deleteFiles, reinstallDependencies, imageUrl, videoUrl, audioUrl } = createUpdate;

  if (imageUrl.length > 0 || videoUrl.length > 0 || audioUrl.length > 0) {
    logger.info(`📎 Media content: ${logger.color.cyan(imageUrl.length)} images, ${logger.color.cyan(videoUrl.length)} videos, ${logger.color.cyan(audioUrl.length)} audio files`);
  }

  for (const filePath in files) {
    const description = files[filePath];
    const fullPath = `${process.cwd()}/${filePath}`;
    let getFile;
    try {
      const response = await axios.get(`https://github.com/sheikhtamimlover/STG-BOT/raw/main/${filePath}`, {
        responseType: 'arraybuffer'
      });
      getFile = response.data;
    }
    catch (e) {
      logger.warn(`⚠️ Failed to download ${filePath}: ${e.message}`);
      continue;
    }

    if (["config.json", "configCommands.json"].includes(filePath)) {
      const currentConfig = JSON.parse(fs.readFileSync(fullPath, "utf-8"));
      const configValueUpdate = files[filePath];

      for (const key in configValueUpdate) {
        const value = configValueUpdate[key];
        if (typeof value == "string" && value.startsWith("DEFAULT_")) {
          const keyOfDefault = value.replace("DEFAULT_", "");
          _.set(currentConfig, key, _.get(currentConfig, keyOfDefault));
        }
        else
          _.set(currentConfig, key, value);
      }

      const currentConfigSorted = sortObj(currentConfig, currentConfig, Object.keys(currentConfig));

      if (fs.existsSync(fullPath))
        fs.copyFileSync(fullPath, `${folderBackup}/${filePath}`);
      fs.writeFileSync(fullPath, JSON.stringify(currentConfigSorted, null, 2));

      console.log(logger.color.bold(logger.color.blue('[↑]')), filePath);
      console.log(logger.color.bold(logger.color.yellow('[!]')), `Config file ${logger.color.yellow(filePath)} has been updated`);
    }
    else {
      const contentsSkip = ["DO NOT UPDATE", "SKIP UPDATE", "DO NOT UPDATE THIS FILE"];
      const fileExists = fs.existsSync(fullPath);

      if (fileExists) {
        const backupFilePath = `${folderBackup}/${filePath}`;
        const backupFileDir = path.dirname(backupFilePath);
        if (!fs.existsSync(backupFileDir)) {
          fs.mkdirSync(backupFileDir, { recursive: true });
        }
        fs.copyFileSync(fullPath, backupFilePath);
      }

      const firstLine = fileExists ? fs.readFileSync(fullPath, "utf-8").trim().split(/\r?\n|\r/)[0] : "";
      const indexSkip = contentsSkip.findIndex(c => firstLine.includes(c));
      if (indexSkip !== -1) {
        console.log(logger.color.bold(logger.color.yellow('[!]')), `Skipped ${logger.color.yellow(filePath)} (${logger.color.yellow(contentsSkip[indexSkip])})`);
        continue;
      }
      else {
        fs.writeFileSync(fullPath, Buffer.from(getFile));

        console.log(
          fileExists ? logger.color.bold(logger.color.blue('[↑]')) : logger.color.bold(logger.color.green('[+]')),
          `${filePath}:`,
          logger.color.hex('#858585')(
            typeof description == "string" ?
              description :
              typeof description == "object" ?
                JSON.stringify(description, null, 2) :
                description
          )
        );
      }
    }
  }

  for (const filePath in deleteFiles) {
    const description = deleteFiles[filePath];
    const fullPath = `${process.cwd()}/${filePath}`;
    if (fs.existsSync(fullPath)) {
      if (fs.lstatSync(fullPath).isDirectory())
        fs.removeSync(fullPath);
      else {
        fs.copyFileSync(fullPath, `${folderBackup}/${filePath}`);
        fs.unlinkSync(fullPath);
      }
      console.log(logger.color.bold(logger.color.red('[-]')), `${filePath}:`, logger.color.hex('#858585')(description));
    }
  }

  const { data: packageHTML } = await axios.get("https://github.com/sheikhtamimlover/STG-BOT/blob/main/package.json");
  const json = packageHTML.split('data-target="react-app.embeddedData">')[1].split('</script>')[0];
  const packageJSON = JSON.parse(json).payload.blob.rawLines.join('\n');

  fs.writeFileSync(`${process.cwd()}/package.json`, JSON.stringify(JSON.parse(packageJSON), null, 2));
  logger.success(`✅ Update successful! ${!reinstallDependencies ? 'Restart the bot to apply changes.' : ''}`);

  if (reinstallDependencies) {
    logger.info('📦 Installing packages...');
    const { execSync } = require('child_process');
    try {
      execSync('npm install', { stdio: 'inherit' });
      logger.success('✅ Packages installed successfully!');
    } catch (installError) {
      logger.error('❌ Package installation failed, initiating auto-restore...');
      throw new Error('Package installation failed');
    }
  }

  logger.success(`💾 Backup saved to ${logger.color.yellow(folderBackup)}`);
  logger.success('✅ Update completed successfully!');
  logger.info('🔄 You can now restart the bot to use the updated version.');

  // Mark update as successful
  fs.writeFileSync(`${process.cwd()}/tmp/last_update_success.txt`, createUpdate.version);

})().catch(error => {
  logger.error('❌ Update process failed:', error.message);
  logger.warn('🔄 Initiating automatic restore from backup...');

  // Auto-restore on failure
  try {
    const { autoRestore } = require('./restoreBackup');
    autoRestore();
  } catch (restoreError) {
    logger.error('❌ Auto-restore failed:', restoreError.message);
    logger.error('⚠️ Please manually restore using: node restoreBackup.js');
  }

  process.exit(1);
});