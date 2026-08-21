const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('atlas', {
  readCatalog: () => ipcRenderer.invoke('catalog:read'),
  ensureImage: (image) => ipcRenderer.invoke('image:ensure', image),
  exportRecords: (options) => ipcRenderer.invoke('export:records', options),
  archiveCapabilities: () => ipcRenderer.invoke('archive:capabilities')
  , runArchive: (options) => ipcRenderer.invoke('archive:run', options),
  updaterState: () => ipcRenderer.invoke('updater:state'),
  checkForUpdates: () => ipcRenderer.invoke('updater:check'),
  downloadUpdate: () => ipcRenderer.invoke('updater:download'),
  cancelUpdate: () => ipcRenderer.invoke('updater:cancel'),
  setUpdaterWorkState: (state) => ipcRenderer.invoke('updater:work-state', state),
  restartToInstallUpdate: () => ipcRenderer.invoke('updater:restart'),
  onUpdaterState: (listener) => {
    const handler = (_event, state) => listener(state);
    ipcRenderer.on('updater:state', handler);
    return () => ipcRenderer.removeListener('updater:state', handler);
  }
});
