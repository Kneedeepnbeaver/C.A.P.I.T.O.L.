const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    selectFolder: () => ipcRenderer.invoke('select-dirs'),
    selectFiles: () => ipcRenderer.invoke('select-files'),
    saveFile: (options) => ipcRenderer.invoke('save-file', options),
});
