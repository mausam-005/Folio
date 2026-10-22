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
      alert('Desktop Action: Open file via default system application: ' + filePath);
    } catch (err) {
      if (isElectron) {
        window.electronAPI.showNotification('File Not Found', `The file at "${filePath}" is no longer on disk.`);
      } else {
        alert('File not found: ' + filePath);
      }
    }
  },
  revealInFinder: async (filePath) => {
    try {
      if (isElectron) return await window.electronAPI.revealInFinder(filePath);
      alert('Desktop Action: Reveal in Finder / File Explorer: ' + filePath);
    } catch (err) {
      if (isElectron) {
        window.electronAPI.showNotification('File Not Found', `Cannot locate "${filePath}" in Finder.`);
      } else {
        alert('File path not found: ' + filePath);
      }
    }
  },
  copyToClipboard: async (text) => {
    if (isElectron) return window.electronAPI.copyToClipboard(text);
    return navigator.clipboard.writeText(text);
  },
  selectFilesDialog: async () => {
    if (isElectron) return window.electronAPI.selectFilesDialog();
    alert('Native OS file picker requires running inside the Electron window.');
    return [];
  },
  selectFolderDialog: async () => {
    if (isElectron && window.electronAPI.selectFolderDialog) return window.electronAPI.selectFolderDialog();
    alert('Native OS folder picker requires running inside the Electron window.');
    return [];
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
    return 'Text preview is available in the desktop Electron app.';
  },
  getFileStats: async (filePath) => {
    if (isElectron) return window.electronAPI.getFileStats(filePath);
    return null;
  },
  changeFormat: async (options) => {
    if (isElectron) return window.electronAPI.changeFormat(options);
    alert('Format conversion is available in the desktop Electron app.');
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
    return [];
  },
  getFiles: async (filters = {}) => {
    if (isElectron) return window.electronAPI.getFiles(filters);
    const mockFiles = [
      {
        id: 1,
        name: 'DesignSystem-v2',
        path: '/Users/developer/Projects/DesignSystem-v2',
        size: 8400000,
        extension: 'folder',
        category: 'folder',
        is_favorite: 1,
        notes: 'Core design system tokens and component specs',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        tags: [{ id: 1, name: 'Design', color: '#EC4899' }],
      },
      {
        id: 2,
        name: 'design_tokens.json',
        path: '/Users/developer/Projects/DesignSystem-v2/tokens/design_tokens.json',
        size: 420000,
        extension: 'json',
        category: 'code',
        is_favorite: 0,
        notes: 'Color palettes, typography scales, and shadows',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        tags: [{ id: 2, name: 'Production', color: '#6366F1' }],
      },
      {
        id: 3,
        name: 'brand_guidelines.pdf',
        path: '/Users/developer/Projects/DesignSystem-v2/specs/brand_guidelines.pdf',
        size: 1850000,
        extension: 'pdf',
        category: 'document',
        is_favorite: 1,
        notes: 'Brand typography, layout grid, and icon styles',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        tags: [{ id: 1, name: 'Design', color: '#EC4899' }],
      },
      {
        id: 4,
        name: 'color_palette.png',
        path: '/Users/developer/Projects/DesignSystem-v2/assets/color_palette.png',
        size: 320000,
        extension: 'png',
        category: 'image',
        is_favorite: 0,
        notes: 'Exported dark luxury palette preview',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        tags: [{ id: 1, name: 'Design', color: '#EC4899' }],
      },
      {
        id: 5,
        name: 'MobileApp-Core',
        path: '/Users/developer/Projects/MobileApp-Core',
        size: 5100000,
        extension: 'folder',
        category: 'folder',
        is_favorite: 0,
        notes: 'Cross-platform mobile workspace',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        tags: [],
      },
      {
        id: 6,
        name: 'release_notes.md',
        path: '/Users/developer/Projects/MobileApp-Core/docs/release_notes.md',
        size: 6400,
        extension: 'md',
        category: 'document',
        is_favorite: 0,
        notes: 'Version 2.4 changelog and migration guide',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        tags: [],
      },
      {
        id: 7,
        name: 'App.jsx',
        path: '/Users/developer/Projects/MobileApp-Core/src/App.jsx',
        size: 19800,
        extension: 'jsx',
        category: 'code',
        is_favorite: 1,
        notes: 'Main application container and navigation layout',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        tags: [{ id: 2, name: 'Production', color: '#6366F1' }],
      },
      {
        id: 8,
        name: 'analytics_metrics.csv',
        path: '/Users/developer/Projects/MobileApp-Core/data/analytics_metrics.csv',
        size: 1250000,
        extension: 'csv',
        category: 'document',
        is_favorite: 0,
        notes: 'Q3 user retention and performance telemetry',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        tags: [{ id: 3, name: 'Important', color: '#EF4444' }],
      },
    ];

    if (filters.category && filters.category !== 'all') {
      return mockFiles.filter((f) => f.category === filters.category);
    }
    if (filters.favoriteOnly) {
      return mockFiles.filter((f) => f.is_favorite);
    }
    return mockFiles;
  },
  deleteFile: async (fileId) => {
    if (isElectron) return window.electronAPI.deleteFile(fileId);
    return true;
  },
  deleteFiles: async (fileIds) => {
    if (isElectron) return window.electronAPI.deleteFiles(fileIds);
    return true;
  },
  attachTagToMultiple: async (fileIds, tagId) => {
    if (isElectron) return window.electronAPI.attachTagToMultiple(fileIds, tagId);
    return true;
  },
  toggleFavorite: async (fileId) => {
    if (isElectron) return window.electronAPI.toggleFavorite(fileId);
    return false;
  },
  updateNotes: async (fileId, notes) => {
    if (isElectron) return window.electronAPI.updateNotes(fileId, notes);
    return true;
  },
  getTags: async () => {
    if (isElectron) return window.electronAPI.getTags();
    return [
      { id: 1, name: 'Design', color: '#EC4899', count: 3 },
      { id: 2, name: 'Production', color: '#6366F1', count: 2 },
      { id: 3, name: 'Important', color: '#EF4444', count: 1 },
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
    return { totalFiles: 8, totalSize: 17400000, favCount: 3, tagCount: 3 };
  },
};
