const { contextBridge, ipcRenderer, webFrame, webUtils } = require('electron');

// Lock visual zoom to 1.0 so desktop UI layout and titlebar remain pixel-perfect
try {
  webFrame.setVisualZoomLevelLimits(1, 1);
  webFrame.setZoomFactor(1);
} catch (e) {}

contextBridge.exposeInMainWorld('electronAPI', {
  getPathForFile: (file) => {
    try {
      if (webUtils && typeof webUtils.getPathForFile === 'function') {
        return webUtils.getPathForFile(file);
      }
    } catch (e) {}
    return file?.path || '';
  },
  // Window controls
  minimize: () => ipcRenderer.invoke('window:minimize'),
  maximize: () => ipcRenderer.invoke('window:maximize'),
  close: () => ipcRenderer.invoke('window:close'),
  isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
  isFullScreen: () => ipcRenderer.invoke('window:isFullScreen'),
  onWindowStateChanged: (callback) => {
    ipcRenderer.on('window:state-changed', (_, data) => callback(data));
  },
  onMenuAction: (channel, callback) => {
    ipcRenderer.on(`menu:${channel}`, () => callback());
  },

  // Desktop & OS integration
  openPath: (filePath) => ipcRenderer.invoke('os:openPath', filePath),
  revealInFinder: (filePath) => ipcRenderer.invoke('os:revealInFinder', filePath),
  copyToClipboard: (text) => ipcRenderer.invoke('os:copyToClipboard', text),
  selectFilesDialog: () => ipcRenderer.invoke('os:selectFilesDialog'),
  selectFolderDialog: () => ipcRenderer.invoke('os:selectFolderDialog'),
  showNotification: (title, body) => ipcRenderer.invoke('os:showNotification', { title, body }),
  readTextPreview: (filePath) => ipcRenderer.invoke('os:readTextPreview', filePath),
  getFileStats: (filePath) => ipcRenderer.invoke('os:getFileStats', filePath),
  changeFormat: (options) => ipcRenderer.invoke('os:changeFormat', options),
  getThumbnail: (filePath) => ipcRenderer.invoke('os:getThumbnail', filePath),
  quickLook: (filePath) => ipcRenderer.invoke('os:quickLook', filePath),
  getDiskSpace: () => ipcRenderer.invoke('os:getDiskSpace'),

  // Database operations (SQLite)
  addFiles: (filePaths) => ipcRenderer.invoke('db:addFiles', filePaths),
  getFiles: (filters) => ipcRenderer.invoke('db:getFiles', filters),
  deleteFile: (fileId) => ipcRenderer.invoke('db:deleteFile', fileId),
  deleteFiles: (fileIds) => ipcRenderer.invoke('db:deleteFiles', fileIds),
  attachTagToMultiple: (fileIds, tagId) => ipcRenderer.invoke('db:attachTagToMultiple', { fileIds, tagId }),
  toggleFavorite: (fileId) => ipcRenderer.invoke('db:toggleFavorite', fileId),
  updateNotes: (fileId, notes) => ipcRenderer.invoke('db:updateNotes', { fileId, notes }),
  getTags: () => ipcRenderer.invoke('db:getTags'),
  createTag: (name, color) => ipcRenderer.invoke('db:createTag', { name, color }),
  deleteTag: (tagId) => ipcRenderer.invoke('db:deleteTag', tagId),
  attachTag: (fileId, tagId) => ipcRenderer.invoke('db:attachTag', { fileId, tagId }),
  detachTag: (fileId, tagId) => ipcRenderer.invoke('db:detachTag', { fileId, tagId }),
  getStats: () => ipcRenderer.invoke('db:getStats'),
});
