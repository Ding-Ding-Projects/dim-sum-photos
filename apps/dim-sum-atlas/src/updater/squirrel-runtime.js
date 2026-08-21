'use strict';

const fs = require('fs');
const { spawn } = require('child_process');

function createSquirrelRuntime({ updateExe, spawnProcess = spawn, quit = () => {} } = {}) {
  return {
    installPackage(feedDirectory, identity) {
      if (!feedDirectory || !identity || !identity.packagePath || !identity.releasesLine) throw new Error('Squirrel feed identity is incomplete.');
      if (!fs.existsSync(feedDirectory) || !fs.existsSync(`${feedDirectory}/RELEASES`) || !fs.existsSync(identity.packagePath)) throw new Error('Squirrel feed directory is incomplete.');
      return new Promise((resolve, reject) => {
        const child = spawnProcess(updateExe, ['--update', feedDirectory], { detached: true, windowsHide: true, stdio: 'ignore', shell: false });
        child.once('error', reject);
        child.once('spawn', () => { child.unref(); quit(); resolve({ feedDirectory, packagePath: identity.packagePath, releasesLine: identity.releasesLine }); });
      });
    }
  };
}

module.exports = { createSquirrelRuntime };
