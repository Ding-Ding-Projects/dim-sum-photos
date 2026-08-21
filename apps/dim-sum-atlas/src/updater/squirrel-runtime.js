'use strict';

const fs = require('fs');
const { spawn } = require('child_process');

function createSquirrelRuntime({ updateExe, processStart, spawnProcess = spawn, quit = () => {}, fsModule = fs } = {}) {
  return {
    installPackage(feedDirectory, identity) {
      if (!feedDirectory || !identity || !identity.packagePath || !identity.releasesLine) throw new Error('Squirrel feed identity is incomplete.');
      if (!updateExe || !fsModule.existsSync(updateExe)) throw new Error('Squirrel Update.exe is not present in this installed package.');
      if (typeof processStart !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9 ._-]{0,127}\.exe$/i.test(processStart) || processStart !== require('path').basename(processStart)) throw new Error('Squirrel restart executable identity is invalid.');
      if (!fs.existsSync(feedDirectory) || !fs.existsSync(`${feedDirectory}/RELEASES`) || !fs.existsSync(identity.packagePath)) throw new Error('Squirrel feed directory is incomplete.');
      return new Promise((resolve, reject) => {
        const update = spawnProcess(updateExe, ['--update', feedDirectory], { windowsHide: true, stdio: 'ignore', shell: false });
        update.once('error', reject);
        update.once('close', (code) => {
          if (code !== 0) { reject(new Error(`Squirrel update exited with code ${code}.`)); return; }
          const restart = spawnProcess(updateExe, ['--processStart', processStart], { detached: true, windowsHide: true, stdio: 'ignore', shell: false });
          restart.once('error', reject);
          restart.once('spawn', () => { restart.unref(); quit(); resolve({ feedDirectory, packagePath: identity.packagePath, releasesLine: identity.releasesLine }); });
        });
      });
    }
  };
}

module.exports = { createSquirrelRuntime };
