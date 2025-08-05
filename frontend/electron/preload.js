const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  launchOnboard: () => ipcRenderer.send('launch-onboard'),
});