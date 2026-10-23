// Unified API gateway with graceful browser fallback

const isElectron = typeof window !== 'undefined' && Boolean(window.electronAPI);

export const api = {
  isElectron,

  getPathForFile: (file) => {
    if (isElectron && window.electronAPI.getPathForFile) {
      return window.electronAPI.getPathForFile(file);
    }
    return file?.path || '';
  },

  // Window Controls
  minimize: async () => {
    if (isElectron) return window.electronAPI.minimize();
    console.log('[Browser Fallback] Minimize');
  },
  maximize: async () => {
    if (isElectron) return window.electronAPI.maximize();
    console.log('[Browser Fallback] Maximize');
  },
  close: async () => {
    if (isElectron) return window.electronAPI.close();
    console.log('[Browser Fallback] Close');
  },
  isMaximized: async () => {
    if (isElectron) return window.electronAPI.isMaximized();
    return false;
  },
  isFullScreen: async () => {
    if (isElectron && window.electronAPI.isFullScreen) return window.electronAPI.isFullScreen();
    return Boolean(document.fullscreenElement);
  },
  onWindowStateChanged: (callback) => {
    if (isElectron && window.electronAPI.onWindowStateChanged) {
      window.electronAPI.onWindowStateChanged(callback);
    }
  },

  // Desktop OS APIs
  openPath: async (filePath) => {
    try {
      if (isElectron) return await window.electronAPI.openPath(filePath);
      console.log('Open file action in browser demo:', filePath);
    } catch (err) {
      if (isElectron) {
        window.electronAPI.showNotification('File Not Found', `The file at "${filePath}" is no longer on disk.`);
      }
    }
  },
  revealInFinder: async (filePath) => {
    try {
      if (isElectron) return await window.electronAPI.revealInFinder(filePath);
      console.log('Reveal in Finder action in browser demo:', filePath);
    } catch (err) {
      if (isElectron) {
        window.electronAPI.showNotification('File Not Found', `Cannot locate "${filePath}" in Finder.`);
      }
    }
  },
  copyToClipboard: async (text) => {
    if (isElectron) return window.electronAPI.copyToClipboard(text);
    return navigator.clipboard.writeText(text);
  },
  selectFilesDialog: async () => {
    if (isElectron) return window.electronAPI.selectFilesDialog();
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = true;
      input.onchange = (e) => {
        const files = Array.from(e.target.files || []);
        resolve(files);
      };
      input.click();
    });
  },
  selectFolderDialog: async () => {
    if (isElectron && window.electronAPI.selectFolderDialog) return window.electronAPI.selectFolderDialog();
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.webkitdirectory = true;
      input.directory = true;
      input.multiple = true;
      input.onchange = (e) => {
        const files = Array.from(e.target.files || []);
        resolve(files);
      };
      input.click();
    });
  },
  showNotification: async (title, body) => {
    if (isElectron) return window.electronAPI.showNotification(title, body);
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body });
    } else {
      console.log('[Notification]', title, body);
    }
  },
  readTextPreview: async (filePath) => {
    if (isElectron) return window.electronAPI.readTextPreview(filePath);
    return 'Text preview is active in the desktop Electron app.';
  },
  getFileStats: async (filePath) => {
    if (isElectron) return window.electronAPI.getFileStats(filePath);
    return null;
  },
  changeFormat: async (options) => {
    if (isElectron) return window.electronAPI.changeFormat(options);
    return { success: false };
  },
  getThumbnail: async (filePath) => {
    if (isElectron) return window.electronAPI.getThumbnail(filePath);
    return null;
  },
  quickLook: async (filePath) => {
    if (isElectron) return window.electronAPI.quickLook(filePath);
    return false;
  },
  getDiskSpace: async () => {
    if (isElectron) return window.electronAPI.getDiskSpace();
    return {
      totalBytes: 500 * 1024 * 1024 * 1024,
      freeBytes: 92 * 1024 * 1024 * 1024,
      usedBytes: 408 * 1024 * 1024 * 1024,
      percentUsed: 81,
      diskName: 'Macintosh HD',
    };
  },

  // Database operations
  addFiles: async (filePaths) => {
    if (isElectron) return window.electronAPI.addFiles(filePaths);
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem('folio_browser_files') : null;
      const files = stored ? JSON.parse(stored) : [];
      const newItems = filePaths.map((fp, idx) => {
        const name = typeof fp === 'string' ? fp.split('/').pop() : fp.name || 'imported_file';
        const ext = name.includes('.') ? name.split('.').pop().toLowerCase() : 'txt';
        return {
          id: Date.now() + idx,
          name,
          path: typeof fp === 'string' ? fp : '/' + name,
          size: fp.size || 2048,
          extension: ext,
          category: ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(ext)
            ? 'image'
            : ['pdf', 'doc', 'docx', 'txt', 'md', 'csv'].includes(ext)
            ? 'document'
            : ['js', 'jsx', 'ts', 'tsx', 'py', 'json', 'html', 'css'].includes(ext)
            ? 'code'
            : 'other',
          is_favorite: 0,
          notes: '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          tags: [],
        };
      });
      const updated = [...files, ...newItems];
      localStorage.setItem('folio_browser_files', JSON.stringify(updated));
      return newItems;
    } catch (e) {
      return [];
    }
  },
  getFiles: async (filters = {}) => {
    if (isElectron) return window.electronAPI.getFiles(filters);
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem('folio_browser_files') : null;
      let files = stored ? JSON.parse(stored) : [];
      if (filters.category && filters.category !== 'all') {
        files = files.filter((f) => f.category === filters.category);
      }
      if (filters.favoriteOnly) {
        files = files.filter((f) => f.is_favorite);
      }
      if (filters.tagId) {
        files = files.filter((f) => f.tags && f.tags.some((t) => t.id === filters.tagId));
      }
      if (filters.search) {
        const q = filters.search.toLowerCase();
        files = files.filter((f) => f.name.toLowerCase().includes(q) || (f.notes && f.notes.toLowerCase().includes(q)));
      }
      return files;
    } catch (e) {
      return [];
    }
  },
  deleteFile: async (fileId) => {
    if (isElectron) return window.electronAPI.deleteFile(fileId);
    try {
      const stored = localStorage.getItem('folio_browser_files');
      let files = stored ? JSON.parse(stored) : [];
      files = files.filter((f) => f.id !== fileId);
      localStorage.setItem('folio_browser_files', JSON.stringify(files));
      return true;
    } catch (e) {
      return false;
    }
  },
  deleteFiles: async (fileIds) => {
    if (isElectron) return window.electronAPI.deleteFiles(fileIds);
    try {
      const idsSet = new Set(fileIds);
      const stored = localStorage.getItem('folio_browser_files');
      let files = stored ? JSON.parse(stored) : [];
      files = files.filter((f) => !idsSet.has(f.id));
      localStorage.setItem('folio_browser_files', JSON.stringify(files));
      return true;
    } catch (e) {
      return false;
    }
  },
  attachTagToMultiple: async (fileIds, tagId) => {
    if (isElectron) return window.electronAPI.attachTagToMultiple(fileIds, tagId);
    return true;
  },
  toggleFavorite: async (fileId) => {
    if (isElectron) return window.electronAPI.toggleFavorite(fileId);
    try {
      const stored = localStorage.getItem('folio_browser_files');
      let files = stored ? JSON.parse(stored) : [];
      files = files.map((f) => (f.id === fileId ? { ...f, is_favorite: f.is_favorite ? 0 : 1 } : f));
      localStorage.setItem('folio_browser_files', JSON.stringify(files));
      return true;
    } catch (e) {
      return false;
    }
  },
  updateNotes: async (fileId, notes) => {
    if (isElectron) return window.electronAPI.updateNotes(fileId, notes);
    try {
      const stored = localStorage.getItem('folio_browser_files');
      let files = stored ? JSON.parse(stored) : [];
      files = files.map((f) => (f.id === fileId ? { ...f, notes } : f));
      localStorage.setItem('folio_browser_files', JSON.stringify(files));
      return true;
    } catch (e) {
      return false;
    }
  },
  getTags: async () => {
    if (isElectron) return window.electronAPI.getTags();
    return [
      { id: 1, name: 'Design', color: '#EC4899', count: 0 },
      { id: 2, name: 'Production', color: '#6366F1', count: 0 },
      { id: 3, name: 'Important', color: '#EF4444', count: 0 },
      { id: 4, name: 'Archive', color: '#10B981', count: 0 },
    ];
  },
  createTag: async (name, color) => {
    if (isElectron) return window.electronAPI.createTag(name, color);
    return { id: Date.now(), name, color, count: 0 };
  },
  deleteTag: async (tagId) => {
    if (isElectron) return window.electronAPI.deleteTag(tagId);
    return true;
  },
  attachTag: async (fileId, tagId) => {
    if (isElectron) return window.electronAPI.attachTag(fileId, tagId);
    return true;
  },
  detachTag: async (fileId, tagId) => {
    if (isElectron) return window.electronAPI.detachTag(fileId, tagId);
    return true;
  },
  getStats: async () => {
    if (isElectron) return window.electronAPI.getStats();
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem('folio_browser_files') : null;
      const files = stored ? JSON.parse(stored) : [];
      return {
        totalFiles: files.length,
        totalSize: files.reduce((acc, f) => acc + (f.size || 0), 0),
        favCount: files.filter((f) => f.is_favorite).length,
        tagCount: 4,
      };
    } catch (e) {
      return { totalFiles: 0, totalSize: 0, favCount: 0, tagCount: 4 };
    }
  },
};
