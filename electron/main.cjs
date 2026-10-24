const { app, BrowserWindow, ipcMain, shell, dialog, clipboard, Notification, protocol, Menu, nativeImage, net } = require('electron');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
const DatabaseManager = require('./database.cjs');

// Explicitly set application name for macOS Dock, Menu Bar, and OS Dialogs
app.name = 'Folio';
if (app.setName) app.setName('Folio');
try { process.title = 'Folio'; } catch (e) {}

// High performance GPU memory and zero-copy rasterization switches
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');
app.commandLine.appendSwitch('ignore-gpu-blocklist');

// Setup native macOS application menu with 'Folio' brand
function setupAppMenu() {
  const isMac = process.platform === 'darwin';
  const template = [
    ...(isMac ? [{ role: 'appMenu' }] : []),
    {
      label: 'File',
      submenu: [
        {
          label: 'Import...',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            if (mainWindow) mainWindow.webContents.send('menu:import-files');
          }
        },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit' }
      ]
    },
    { role: 'editMenu' },
    { role: 'viewMenu' },
    { role: 'windowMenu' }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// Register custom protocol for secure local asset streaming
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'folio',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      bypassCSP: true,
      stream: true,
    },
  },
]);

let mainWindow = null;
let dbManager = null;

const isDev = process.env.NODE_ENV !== 'production' && !app.isPackaged;

async function createWindow() {
  const icnsPath = path.join(__dirname, '../public/icon.icns');
  const dockIcon = path.join(__dirname, '../public/Folio_icon_dock.png');
  const logoPath = dockIcon;

  mainWindow = new BrowserWindow({
    width: 1220,
    height: 820,
    minWidth: 920,
    minHeight: 620,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 14, y: 13 },
    backgroundColor: '#101214',
    icon: fs.existsSync(logoPath) ? logoPath : undefined,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      plugins: true,
    },
  });

  // Set crisp Retina dock icon
  if (process.platform === 'darwin' && app.dock) {
    try {
      if (fs.existsSync(icnsPath)) {
        const icon = nativeImage.createFromPath(icnsPath);
        if (!icon.isEmpty()) app.dock.setIcon(icon);
      } else if (fs.existsSync(dockIcon)) {
        const icon = nativeImage.createFromPath(dockIcon);
        if (!icon.isEmpty()) app.dock.setIcon(icon);
      }
    } catch (e) {
      console.error('Failed to set dock icon:', e);
    }
  }

  // Window state event listeners
  mainWindow.on('maximize', () => {
    if (mainWindow) mainWindow.webContents.send('window:state-changed', { isMax: true, isFullScreen: mainWindow.isFullScreen() });
  });
  mainWindow.on('unmaximize', () => {
    if (mainWindow) mainWindow.webContents.send('window:state-changed', { isMax: false, isFullScreen: mainWindow.isFullScreen() });
  });
  mainWindow.on('enter-full-screen', () => {
    if (mainWindow) mainWindow.webContents.send('window:state-changed', { isMax: true, isFullScreen: true });
  });
  mainWindow.on('leave-full-screen', () => {
    if (mainWindow) mainWindow.webContents.send('window:state-changed', { isMax: false, isFullScreen: false });
  });

  // Prevent accidental drop-to-navigate
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('http://localhost:5173')) {
      event.preventDefault();
    }
  });

  // Open external links in default system browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Keep desktop layout crisp and prevent web-style zoom layout distortion
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.meta && (input.key === '=' || input.key === '+' || input.key === '-' || input.key === '_')) {
      event.preventDefault();
    }
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Initialize SQLite Database
async function initDatabase() {
  const userDataDir = app.getPath('userData');
  const dbPath = path.join(userDataDir, 'folio.db');
  console.log('Database storage path:', dbPath);
  dbManager = new DatabaseManager(dbPath);
  await dbManager.init();
}

// Setup IPC Listeners
function setupIPC() {
  // Window Controls
  ipcMain.handle('window:minimize', () => {
    if (mainWindow) mainWindow.minimize();
  });

  ipcMain.handle('window:maximize', () => {
    if (!mainWindow) return;
    if (process.platform === 'darwin') {
      mainWindow.setFullScreen(!mainWindow.isFullScreen());
    } else {
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
      } else {
        mainWindow.maximize();
      }
    }
  });

  ipcMain.handle('window:close', () => {
    if (mainWindow) mainWindow.close();
  });

  ipcMain.handle('window:isMaximized', () => {
    if (!mainWindow) return false;
    return process.platform === 'darwin' ? mainWindow.isFullScreen() : mainWindow.isMaximized();
  });

  ipcMain.handle('window:isFullScreen', () => {
    if (!mainWindow) return false;
    return mainWindow.isFullScreen();
  });

  // OS Desktop APIs
  ipcMain.handle('os:openPath', async (_, filePath) => {
    if (!filePath || !fs.existsSync(filePath)) {
      throw new Error('File does not exist: ' + filePath);
    }
    return shell.openPath(filePath);
  });

  ipcMain.handle('os:revealInFinder', async (_, filePath) => {
    if (!filePath) return;
    if (fs.existsSync(filePath)) {
      shell.showItemInFolder(filePath);
    } else {
      throw new Error('File path not found: ' + filePath);
    }
  });

  ipcMain.handle('os:copyToClipboard', (_, text) => {
    if (typeof text === 'string') {
      clipboard.writeText(text);
      return true;
    }
    return false;
  });

  ipcMain.handle('os:selectFilesDialog', async () => {
    if (!mainWindow) return [];
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Select Files or Folders to Tag',
      properties: ['openFile', 'openDirectory', 'multiSelections'],
      buttonLabel: 'Import to Folio',
    });
    return result.canceled ? [] : result.filePaths;
  });

  ipcMain.handle('os:selectFolderDialog', async () => {
    if (!mainWindow) return [];
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Select Folders to Import to Folio',
      properties: ['openDirectory', 'multiSelections'],
      buttonLabel: 'Import Folder(s)',
    });
    return result.canceled ? [] : result.filePaths;
  });

  ipcMain.handle('os:showSaveDialog', async (_, options = {}) => {
    if (!mainWindow) return null;
    const result = await dialog.showSaveDialog(mainWindow, {
      title: options.title || 'Save Converted File',
      defaultPath: options.defaultPath,
      buttonLabel: options.buttonLabel || 'Save',
    });
    return result.canceled ? null : result.filePath;
  });

  ipcMain.handle('os:readFullText', async (_, filePath) => {
    try {
      if (!filePath || !fs.existsSync(filePath)) return null;
      return fs.readFileSync(filePath, 'utf8');
    } catch (err) {
      console.error('Failed to read full text:', err);
      return null;
    }
  });

  ipcMain.handle('os:showNotification', (_, { title, body }) => {
    if (Notification.isSupported()) {
      new Notification({
        title: title || 'Folio',
        body: body || '',
        silent: false,
      }).show();
    }
    return true;
  });

  ipcMain.handle('os:readTextPreview', async (_, filePath) => {
    try {
      if (!filePath || !fs.existsSync(filePath)) return null;
      const ext = path.extname(filePath).toLowerCase().replace(/^\./, '');
      const binaryExtensions = [
        'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'zip', 'tar', 'gz', 
        'dmg', 'exe', 'iso', 'bin', 'mkv', 'mp4', 'avi', 'mov', 'mp3', 'wav', 
        'png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'tiff', 'psd', 'ai'
      ];
      if (binaryExtensions.includes(ext)) {
        return null;
      }
      const stats = fs.statSync(filePath);
      // Read at most 20KB for preview to keep performance ultra fast
      if (stats.size > 1024 * 1024 * 3) {
        return 'File too large to preview (> 3MB)';
      }
      const buffer = Buffer.alloc(Math.min(stats.size, 20480));
      const fd = fs.openSync(filePath, 'r');
      const bytesRead = fs.readSync(fd, buffer, 0, buffer.length, 0);
      fs.closeSync(fd);

      // Check for binary null bytes
      for (let i = 0; i < Math.min(bytesRead, 512); i++) {
        if (buffer[i] === 0) {
          return null; // Binary file
        }
      }
      return buffer.slice(0, bytesRead).toString('utf8');
    } catch (err) {
      return null;
    }
  });

  ipcMain.handle('os:getThumbnail', async (_, filePath) => {
    try {
      if (!filePath || !fs.existsSync(filePath)) return null;
      const ext = path.extname(filePath).toLowerCase().replace(/^\./, '');
      const imgExtensions = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'heic', 'heif', 'tiff'];
      if (imgExtensions.includes(ext)) {
        const img = nativeImage.createFromPath(filePath);
        if (!img.isEmpty()) {
          return img.resize({ width: 120, quality: 'good' }).toDataURL();
        }
      }

      const qlExtensions = [
        'pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'key', 'pages', 'numbers'
      ];

      if (qlExtensions.includes(ext)) {
        const userDataDir = app.getPath('userData');
        const cacheDir = path.join(userDataDir, 'cache_thumbs');
        if (!fs.existsSync(cacheDir)) {
          fs.mkdirSync(cacheDir, { recursive: true });
        }
        const crypto = require('crypto');
        const stat = fs.statSync(filePath);
        const hash = crypto.createHash('md5').update(`${filePath}_${stat.mtimeMs}`).digest('hex');
        const targetThumb = path.join(cacheDir, `${hash}.png`);

        if (fs.existsSync(targetThumb)) {
          const buf = fs.readFileSync(targetThumb);
          return `data:image/png;base64,${buf.toString('base64')}`;
        }
      }

      return null;
    } catch (err) {
      return null;
    }
  });

  ipcMain.handle('os:quickLook', async (_, filePath) => {
    try {
      if (!filePath || !fs.existsSync(filePath)) return false;
      const { spawn } = require('child_process');
      const child = spawn('qlmanage', ['-p', filePath], {
        detached: true,
        stdio: 'ignore',
      });
      child.unref();
      return true;
    } catch (e) {
      return false;
    }
  });

  ipcMain.handle('os:getDiskSpace', async () => {
    try {
      const { execSync } = require('child_process');
      const stdout = execSync('df -k /', { encoding: 'utf8', timeout: 2000 });
      const lines = stdout.trim().split('\n');
      if (lines.length > 1) {
        const parts = lines[1].replace(/\s+/g, ' ').split(' ');
        const totalBytes = parseInt(parts[1], 10) * 1024;
        const usedBytes = parseInt(parts[2], 10) * 1024;
        const freeBytes = parseInt(parts[3], 10) * 1024;
        const percentUsed = Math.min(100, Math.round(((totalBytes - freeBytes) / totalBytes) * 100));
        return {
          totalBytes,
          freeBytes,
          usedBytes: totalBytes - freeBytes,
          percentUsed,
          diskName: 'Macintosh HD',
        };
      }
    } catch (e) {}
    return {
      totalBytes: 500 * 1024 * 1024 * 1024,
      freeBytes: 85 * 1024 * 1024 * 1024,
      usedBytes: 415 * 1024 * 1024 * 1024,
      percentUsed: 83,
      diskName: 'Macintosh HD',
    };
  });

  ipcMain.handle('os:getFileStats', async (_, filePath) => {
    try {
      if (!fs.existsSync(filePath)) return null;
      const s = fs.statSync(filePath);
      return {
        size: s.size,
        birthtime: s.birthtime,
        mtime: s.mtime,
        atime: s.atime,
        isDirectory: s.isDirectory(),
        isFile: s.isFile(),
        folder: path.dirname(filePath),
        filename: path.basename(filePath),
        mode: (s.mode & 0o777).toString(8),
      };
    } catch (e) {
      return null;
    }
  });

  ipcMain.handle('os:changeFormat', async (_, { fileId, oldPath, newExtension, inPlace = true, dataBase64 = null, destinationPath = null, textContent = null }) => {
    try {
      if (!fs.existsSync(oldPath)) {
        throw new Error('Original file does not exist on disk.');
      }
      const dir = path.dirname(oldPath);
      const extWithDot = path.extname(oldPath);
      const baseName = path.basename(oldPath, extWithDot);
      const cleanExt = newExtension.replace(/^\./, '').toLowerCase();
      
      let targetPath;
      if (destinationPath) {
        targetPath = destinationPath;
      } else if (inPlace) {
        targetPath = path.join(dir, `${baseName}.${cleanExt}`);
      } else {
        const candidate = path.join(dir, `${baseName}.${cleanExt}`);
        if (candidate !== oldPath && !fs.existsSync(candidate)) {
          targetPath = candidate;
        } else {
          targetPath = path.join(dir, `${baseName}_converted_${Date.now()}.${cleanExt}`);
        }
      }

      const newCategory = dbManager.categorizeExtension(cleanExt);

      if (dataBase64) {
        // Base64 image conversion (PNG / JPEG / WebP / AVIF / BMP)
        const base64Data = dataBase64.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        fs.writeFileSync(targetPath, buffer);

        if (inPlace) {
          if (oldPath !== targetPath && fs.existsSync(oldPath)) {
            fs.unlinkSync(oldPath);
          }
          dbManager.updateFileInfo(fileId, {
            name: path.basename(targetPath),
            path: targetPath,
            extension: cleanExt,
            category: newCategory,
          });
          return { success: true, path: targetPath, isNew: false };
        } else {
          const added = dbManager.addFiles([targetPath]);
          return { success: true, path: targetPath, isNew: true, file: added[0] };
        }
      } else if (textContent !== null && typeof textContent === 'string') {
        // Converted text content (e.g. JSON <-> CSV, Markdown <-> HTML)
        fs.writeFileSync(targetPath, textContent, 'utf8');

        if (inPlace) {
          if (oldPath !== targetPath && fs.existsSync(oldPath)) {
            fs.unlinkSync(oldPath);
          }
          dbManager.updateFileInfo(fileId, {
            name: path.basename(targetPath),
            path: targetPath,
            extension: cleanExt,
            category: newCategory,
          });
          return { success: true, path: targetPath, isNew: false };
        } else {
          const added = dbManager.addFiles([targetPath]);
          return { success: true, path: targetPath, isNew: true, file: added[0] };
        }
      } else {
        // Direct file operation (rename for inPlace, safe copy for export copy)
        if (inPlace) {
          fs.renameSync(oldPath, targetPath);
          dbManager.updateFileInfo(fileId, {
            name: path.basename(targetPath),
            path: targetPath,
            extension: cleanExt,
            category: newCategory,
          });
          return { success: true, path: targetPath, isNew: false };
        } else {
          fs.copyFileSync(oldPath, targetPath);
          const added = dbManager.addFiles([targetPath]);
          return { success: true, path: targetPath, isNew: true, file: added[0] };
        }
      }
    } catch (err) {
      console.error('Failed to change file format:', err);
      throw err;
    }
  });

  // Database operations
  ipcMain.handle('db:addFiles', async (_, filePaths) => {
    const added = dbManager.addFiles(filePaths);
    return added;
  });

  ipcMain.handle('db:getFiles', async (_, filters) => {
    return dbManager.getFiles(filters);
  });

  ipcMain.handle('db:deleteFile', async (_, fileId) => {
    return dbManager.deleteFile(fileId);
  });

  ipcMain.handle('db:deleteFiles', async (_, fileIds) => {
    return dbManager.deleteFiles(fileIds);
  });

  ipcMain.handle('db:attachTagToMultiple', async (_, { fileIds, tagId }) => {
    return dbManager.attachTagToMultiple(fileIds, tagId);
  });

  ipcMain.handle('db:toggleFavorite', async (_, fileId) => {
    return dbManager.toggleFavorite(fileId);
  });

  ipcMain.handle('db:updateNotes', async (_, { fileId, notes }) => {
    return dbManager.updateNotes(fileId, notes);
  });

  ipcMain.handle('db:getTags', async () => {
    return dbManager.getTags();
  });

  ipcMain.handle('db:createTag', async (_, { name, color }) => {
    return dbManager.createTag(name, color);
  });

  ipcMain.handle('db:deleteTag', async (_, tagId) => {
    return dbManager.deleteTag(tagId);
  });

  ipcMain.handle('db:attachTag', async (_, { fileId, tagId }) => {
    return dbManager.attachTag(fileId, tagId);
  });

  ipcMain.handle('db:detachTag', async (_, { fileId, tagId }) => {
    return dbManager.detachTag(fileId, tagId);
  });

  ipcMain.handle('db:getStats', async () => {
    return dbManager.getStats();
  });
}

// App lifecycle
app.whenReady().then(async () => {
  // Setup folio:// protocol handler with native downsampled thumbnail caching
  protocol.handle('folio', (request) => {
    try {
      const isThumb = request.url.includes('thumb=1');
      const cleanUrl = request.url.split('?')[0];
      let urlPath = cleanUrl.replace(/^folio:\/\//, '');
      let decodedPath = decodeURIComponent(urlPath);
      if (!decodedPath.startsWith('/')) decodedPath = '/' + decodedPath;
      const safePath = path.normalize(decodedPath);

      if (!fs.existsSync(safePath)) {
        return new Response('File not found', { status: 404 });
      }

      const ext = path.extname(safePath).toLowerCase().replace(/^\./, '');

      // Ultra-fast, lightweight 120px downsampled thumbnail for list/grid scrolling
      if (isThumb && ['png', 'jpg', 'jpeg', 'webp', 'bmp', 'tiff', 'gif', 'heic', 'heif'].includes(ext)) {
        try {
          const img = nativeImage.createFromPath(safePath);
          if (!img.isEmpty()) {
            const thumbBuffer = img.resize({ width: 120, quality: 'good' }).toJPEG(80);
            return new Response(thumbBuffer, {
              headers: {
                'Content-Type': 'image/jpeg',
                'Cache-Control': 'public, max-age=604800, immutable',
                'Access-Control-Allow-Origin': '*',
              },
            });
          }
        } catch (e) {
          // Fallback to normal stream
        }
      }

      return net.fetch(pathToFileURL(safePath).toString());
    } catch (err) {
      console.error('Error in folio protocol handler:', err);
      return new Response('File not found', { status: 404 });
    }
  });

  await initDatabase();
  setupIPC();
  setupAppMenu();
  await createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (dbManager) {
    dbManager.save();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
