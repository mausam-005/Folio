// Unified API gateway with graceful browser fallback

const isElectron = typeof window !== 'undefined' && Boolean(window.electronAPI);

export const api = {
  isElectron,

  getPathForFile: (file) => {
    if (isElectron && window.electronAPI.getPathForFile) {
      return window.electronAPI.getPathForFile(file);
    }
    return file?.path || file?.webkitRelativePath || file?.name || '';
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
      api.showNotification('Open File', 'Opening files in native desktop apps is enabled in the Folio macOS Desktop app.');
    } catch (err) {
      if (isElectron) {
        window.electronAPI.showNotification('File Not Found', `The file at "${filePath}" is no longer on disk.`);
      }
    }
  },
  revealInFinder: async (filePath) => {
    try {
      if (isElectron) return await window.electronAPI.revealInFinder(filePath);
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(filePath);
      }
      api.showNotification('Path Copied', 'Direct Finder integration is active in the Folio macOS Desktop app.');
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
      input.oncancel = () => {
        resolve([]);
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
      input.oncancel = () => {
        resolve([]);
      };
      input.click();
    });
  },
  showNotification: async (title, body) => {
    // 1. Dispatch custom event for rich in-app toast notification
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('folio-notification', {
          detail: {
            id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            title,
            body,
            timestamp: Date.now(),
          },
        })
      );
    }

    // 2. Desktop Electron notification
    if (isElectron && window.electronAPI?.showNotification) {
      return window.electronAPI.showNotification(title, body);
    }

    // 3. Browser native Notification if permission granted
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, { body });
      } catch (err) {
        // Handled gracefully via in-app toast
      }
    } else {
      console.log('[Notification]', title, body);
    }
  },
  readTextPreview: async (filePath) => {
    if (isElectron) return window.electronAPI.readTextPreview(filePath);
    return 'Text preview is active in the desktop Electron app.';
  },
  showSaveDialog: async (options) => {
    if (isElectron && window.electronAPI?.showSaveDialog) {
      return window.electronAPI.showSaveDialog(options);
    }
    return null;
  },
  readFullText: async (filePath) => {
    if (isElectron && window.electronAPI?.readFullText) {
      return window.electronAPI.readFullText(filePath);
    }
    return null;
  },
  getFileStats: async (filePath) => {
    if (isElectron) return window.electronAPI.getFileStats(filePath);
    return null;
  },
  changeFormat: async (options) => {
    if (isElectron) return window.electronAPI.changeFormat(options);

    // Web browser fallback: trigger download and update localStorage catalog
    try {
      const { oldPath, newExtension, dataBase64, textContent } = options;
      const cleanExt = (newExtension || '').replace(/^\./, '').toLowerCase();
      const baseName = oldPath ? oldPath.split('/').pop().replace(/\.[^/.]+$/, '') : 'file';
      const targetFileName = `${baseName}_converted.${cleanExt}`;
      
      let blob;
      if (dataBase64) {
        const parts = dataBase64.split(',');
        const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/png';
        const bstr = atob(parts[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        blob = new Blob([u8arr], { type: mime });
      } else if (textContent !== null && textContent !== undefined) {
        blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
      } else {
        blob = new Blob([`Converted content for ${targetFileName}`], { type: 'text/plain;charset=utf-8' });
      }

      // Download file to browser Downloads
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = targetFileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 10000);

      // Add to Folio browser catalog
      const stored = typeof window !== 'undefined' ? localStorage.getItem('folio_browser_files') : null;
      const files = stored ? JSON.parse(stored) : [];
      const newFileItem = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        name: targetFileName,
        path: '/' + targetFileName,
        size: blob.size,
        extension: cleanExt,
        category: ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg', 'bmp', 'avif'].includes(cleanExt)
          ? 'image'
          : ['pdf', 'doc', 'docx', 'txt', 'md', 'csv', 'tsv'].includes(cleanExt)
          ? 'document'
          : ['js', 'jsx', 'ts', 'tsx', 'py', 'json', 'html', 'css', 'yaml', 'yml'].includes(cleanExt)
          ? 'code'
          : ['mp4', 'mov', 'mkv', 'webm'].includes(cleanExt)
          ? 'video'
          : ['mp3', 'wav', 'm4a', 'ogg'].includes(cleanExt)
          ? 'audio'
          : 'other',
        is_favorite: 0,
        notes: `Converted to .${cleanExt}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        tags: [],
      };
      files.unshift(newFileItem);
      localStorage.setItem('folio_browser_files', JSON.stringify(files));

      return { success: true, path: '/' + targetFileName, isNew: true, file: newFileItem };
    } catch (err) {
      console.error('Web format conversion error:', err);
      return { success: false, error: err.message };
    }
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
    return null;
  },

  // Database operations
  addFiles: async (filePaths) => {
    if (isElectron) return window.electronAPI.addFiles(filePaths);
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem('folio_browser_files') : null;
      const files = stored ? JSON.parse(stored) : [];
      const newItems = [];
      const seenFolderPaths = new Set(files.filter((f) => f.category === 'folder').map((f) => f.path));

      filePaths.forEach((fp, idx) => {
        const name = typeof fp === 'string' ? fp.split('/').pop() : fp.name || 'imported_file';
        const isFolder = fp.category === 'folder' || fp.isDirectory || (!name.includes('.') && !fp.type);
        const ext = isFolder ? 'folder' : (name.includes('.') ? name.split('.').pop().toLowerCase() : 'txt');
        const rawRelPath = typeof fp === 'string' ? fp : (fp.webkitRelativePath ? '/' + fp.webkitRelativePath : '/' + name);
        const relPath = rawRelPath.startsWith('/') ? rawRelPath : '/' + rawRelPath;

        // Auto-create any parent folders from relative path hierarchy (e.g. /Documents/Projects/file.txt)
        const segments = relPath.split('/').filter(Boolean);
        if (segments.length > 1) {
          let running = '';
          for (let i = 0; i < segments.length - 1; i++) {
            running += '/' + segments[i];
            if (!seenFolderPaths.has(running)) {
              seenFolderPaths.add(running);
              newItems.push({
                id: Date.now() + 50000 + newItems.length,
                name: segments[i],
                path: running,
                size: 0,
                extension: 'folder',
                category: 'folder',
                is_favorite: 0,
                notes: 'Imported folder directory',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                tags: [],
              });
            }
          }
        }

        if (isFolder) {
          if (seenFolderPaths.has(relPath)) return;
          seenFolderPaths.add(relPath);
        }

        newItems.push({
          id: Date.now() + idx,
          name,
          path: relPath,
          size: fp.size || (isFolder ? 0 : 2048),
          extension: ext,
          category: isFolder
            ? 'folder'
            : ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(ext)
            ? 'image'
            : ['pdf', 'doc', 'docx', 'txt', 'md', 'csv'].includes(ext)
            ? 'document'
            : ['js', 'jsx', 'ts', 'tsx', 'py', 'json', 'html', 'css'].includes(ext)
            ? 'code'
            : ['zip', 'tar', 'gz', 'rar', '7z'].includes(ext)
            ? 'archive'
            : ['mp4', 'mov', 'mkv', 'webm'].includes(ext)
            ? 'video'
            : ['mp3', 'wav', 'flac', 'aac'].includes(ext)
            ? 'audio'
            : 'other',
          is_favorite: 0,
          notes: '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          tags: [],
        });
      });

      const updated = [...files, ...newItems];
      localStorage.setItem('folio_browser_files', JSON.stringify(updated));
      return newItems;
    } catch (e) {
      console.error('Error adding files to browser storage:', e);
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
        files = files.filter((f) => f.tags && f.tags.some((t) => String(t.id) === String(filters.tagId)));
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
      files = files.filter((f) => String(f.id) !== String(fileId));
      localStorage.setItem('folio_browser_files', JSON.stringify(files));
      return true;
    } catch (e) {
      return false;
    }
  },
  deleteFiles: async (fileIds) => {
    if (isElectron) return window.electronAPI.deleteFiles(fileIds);
    try {
      const idsSet = new Set(fileIds.map(String));
      const stored = localStorage.getItem('folio_browser_files');
      let files = stored ? JSON.parse(stored) : [];
      files = files.filter((f) => !idsSet.has(String(f.id)));
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
      files = files.map((f) => (String(f.id) === String(fileId) ? { ...f, is_favorite: f.is_favorite ? 0 : 1 } : f));
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
      files = files.map((f) => (String(f.id) === String(fileId) ? { ...f, notes } : f));
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
