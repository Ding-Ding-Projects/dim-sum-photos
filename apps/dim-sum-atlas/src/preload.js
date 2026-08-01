const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('atlas', {
  readCatalog: () => ipcRenderer.invoke('catalog:read'),
  ensureImage: (image) => ipcRenderer.invoke('image:ensure', image),
  exportRecords: (options) => ipcRenderer.invoke('export:records', options),
  archiveCapabilities: () => ipcRenderer.invoke('archive:capabilities')
  , runArchive: (options) => ipcRenderer.invoke('archive:run', options)
});
