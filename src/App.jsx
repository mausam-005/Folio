import React, { useState, useEffect, useCallback } from 'react';
import { Info, X } from 'lucide-react';
import Titlebar from './components/Titlebar';
import Sidebar from './components/Sidebar';
import FileList from './components/FileList';
import FileDetail from './components/FileDetail';
import QuickPreview from './components/QuickPreview';
import TagModal from './components/TagModal';
import DropZone from './components/DropZone';
import SplashScreen from './components/SplashScreen';
import FormatModal from './components/FormatModal';
import ConfirmModal from './components/ConfirmModal';
import AboutModal from './components/AboutModal';
import FileAccessModal from './components/FileAccessModal';
import { api } from './api';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [files, setFiles] = useState([]);
  const [tags, setTags] = useState([]);
  const [stats, setStats] = useState({ totalFiles: 0, totalSize: 0, favCount: 0, tagCount: 0 });
  const [categoryCounts, setCategoryCounts] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const [formatFile, setFormatFile] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isFullScreen, setIsFullScreen] = useState(false);

  // One-time File Access Permission state (Web only)
  const [fileAccessModalOpen, setFileAccessModalOpen] = useState(false);
  const [pendingDropPaths, setPendingDropPaths] = useState(null);

  // In-App Toast Notifications state
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handleNotification = (e) => {
      const { id, title, body } = e.detail || {};
      if (!title) return;
      const toastId = id || `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev.slice(-3), { id: toastId, title, body }]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toastId));
      }, 3500);
    };

    window.addEventListener('folio-notification', handleNotification);
    return () => window.removeEventListener('folio-notification', handleNotification);
  }, []);

  const handleDismissToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Fullscreen state listener for dynamic macOS Titlebar alignment
  useEffect(() => {
    api.isFullScreen().then((fs) => setIsFullScreen(Boolean(fs)));

    api.onWindowStateChanged((data) => {
      if (typeof data?.isFullScreen === 'boolean') {
        setIsFullScreen(data.isFullScreen);
      }
    });

    const handleResize = () => {
      const isFs = Boolean(
        document.fullscreenElement ||
        (window.innerWidth === screen.width && window.innerHeight === screen.height)
      );
      setIsFullScreen(isFs);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Confirm modal state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Remove',
    onConfirm: () => {},
  });

  // About modal state
  const [aboutOpen, setAboutOpen] = useState(false);

  // Filters & layout
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTagId, setSelectedTagId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date_desc');
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('folio_view_mode') || 'list');

  // Resizable Sidebars Width State
  const [leftSidebarWidth, setLeftSidebarWidth] = useState(() => {
    const saved = localStorage.getItem('folio_left_width');
    return saved ? Math.max(160, Math.min(380, parseInt(saved, 10))) : 200;
  });
  const [rightSidebarWidth, setRightSidebarWidth] = useState(() => {
    const saved = localStorage.getItem('folio_right_width');
    return saved ? Math.max(240, Math.min(540, parseInt(saved, 10))) : 320;
  });

  const handleLeftResizeStart = (e) => {
    e.preventDefault();
    const startX = e.clientX;
    const startW = leftSidebarWidth;

    const onMouseMove = (moveEvent) => {
      const delta = moveEvent.clientX - startX;
      const nextW = Math.max(150, Math.min(380, startW + delta));
      setLeftSidebarWidth(nextW);
      try {
        localStorage.setItem('folio_left_width', String(nextW));
      } catch (err) {}
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const handleRightResizeStart = (e) => {
    e.preventDefault();
    const startX = e.clientX;
    const startW = rightSidebarWidth;

    const onMouseMove = (moveEvent) => {
      const delta = startX - moveEvent.clientX;
      const nextW = Math.max(240, Math.min(560, startW + delta));
      setRightSidebarWidth(nextW);
      try {
        localStorage.setItem('folio_right_width', String(nextW));
      } catch (err) {}
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Modals & overlay
  const [tagModalOpen, setTagModalOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Load database data
  const refreshData = useCallback(async () => {
    try {
      const isFav = selectedCategory === 'favorites';
      const cat = isFav ? 'all' : selectedCategory;

      const loadedFiles = await api.getFiles({
        category: cat,
        favoriteOnly: isFav,
        tagId: selectedTagId,
        search: searchQuery,
        sortBy,
      });
      setFiles(loadedFiles || []);

      const loadedTags = await api.getTags();
      setTags(loadedTags || []);

      const loadedStats = await api.getStats();
      setStats(loadedStats || { totalFiles: 0, totalSize: 0, favCount: 0, tagCount: 0 });

      // Compute category counts
      const allFilesList = await api.getFiles({ category: 'all' });
      const counts = {};
      (allFilesList || []).forEach((f) => {
        counts[f.category] = (counts[f.category] || 0) + 1;
      });
      setCategoryCounts(counts);

      // Update selected file reference if currently selected
      if (selectedFile) {
        const updated = (loadedFiles || []).find((f) => f.id === selectedFile.id);
        setSelectedFile(updated || null);
      }
    } catch (err) {
      console.error('Failed to load Folio data:', err);
    }
  }, [selectedCategory, selectedTagId, searchQuery, sortBy, selectedFile]);

  useEffect(() => {
    refreshData();
  }, [selectedCategory, selectedTagId, searchQuery, sortBy]);

  // Handle View Mode persistence
  const handleSetViewMode = (mode) => {
    setViewMode(mode);
    try {
      localStorage.setItem('folio_view_mode', mode);
    } catch (e) {}
  };

  // Global Drag and Drop event listeners for native OS files
  useEffect(() => {
    let dragCounter = 0;

    const handleDragEnter = (e) => {
      e.preventDefault();
      dragCounter++;
      if (e.dataTransfer.types && e.dataTransfer.types.includes('Files')) {
        setIsDragging(true);
      }
    };

    const handleDragLeave = (e) => {
      e.preventDefault();
      dragCounter--;
      if (dragCounter <= 0) {
        setIsDragging(false);
        dragCounter = 0;
      }
    };

    const handleDragOver = (e) => {
      e.preventDefault();
    };

    const handleDrop = async (e) => {
      e.preventDefault();
      dragCounter = 0;
      setIsDragging(false);

      if (e.dataTransfer) {
        let paths = [];
        if (api.isElectron) {
          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            paths = Array.from(e.dataTransfer.files)
              .map((f) => api.getPathForFile(f))
              .filter(Boolean);
          }
        } else {
          // Web browser recursive parser for dropped folders and files from Finder
          const items = e.dataTransfer.items;
          if (items && items.length > 0) {
            const collected = [];
            const readDirEntries = (reader) => {
              return new Promise((resolve) => {
                reader.readEntries(
                  (entries) => resolve(entries || []),
                  () => resolve([])
                );
              });
            };

            const traverseEntry = async (entry, currentPath = '') => {
              if (!entry) return;
              const fullPath = currentPath ? `${currentPath}/${entry.name}` : entry.name;
              if (entry.isFile) {
                const file = await new Promise((resolve) => entry.file(resolve, () => resolve(null)));
                if (file) {
                  Object.defineProperty(file, 'webkitRelativePath', {
                    value: fullPath,
                    writable: true,
                    configurable: true,
                  });
                  collected.push(file);
                }
              } else if (entry.isDirectory) {
                collected.push({
                  name: entry.name,
                  path: '/' + fullPath,
                  webkitRelativePath: fullPath,
                  category: 'folder',
                  extension: 'folder',
                  size: 0,
                  isDirectory: true,
                });
                const dirReader = entry.createReader();
                let entriesChunk = await readDirEntries(dirReader);
                while (entriesChunk.length > 0) {
                  for (const child of entriesChunk) {
                    await traverseEntry(child, fullPath);
                  }
                  entriesChunk = await readDirEntries(dirReader);
                }
              }
            };

            const promises = [];
            for (let i = 0; i < items.length; i++) {
              const item = items[i];
              if (typeof item.webkitGetAsEntry === 'function') {
                const entry = item.webkitGetAsEntry();
                if (entry) {
                  promises.push(traverseEntry(entry));
                  continue;
                }
              }
              if (item.kind === 'file') {
                const file = item.getAsFile();
                if (file) collected.push(file);
              }
            }
            if (promises.length > 0) {
              await Promise.all(promises);
            }
            paths = collected;
          }

          if (paths.length === 0 && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            paths = Array.from(e.dataTransfer.files);
          }
        }

        if (paths.length > 0) {
          if (!hasFileAccessConsent()) {
            setPendingDropPaths(paths);
            setFileAccessModalOpen(true);
            return;
          }
          const added = await api.addFiles(paths);
          await refreshData();
          api.showNotification('Folio Import', `Successfully imported ${added.length} item(s).`);
        }
      }
    };

    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('drop', handleDrop);
    };
  }, [refreshData]);

  // Check if one-time file access consent was granted (Desktop skips this)
  const hasFileAccessConsent = () => {
    if (api.isElectron) return true;
    try {
      return localStorage.getItem('folio_file_access_granted') === 'true';
    } catch (e) {
      return false;
    }
  };

  const executeImport = async () => {
    const paths = await api.selectFilesDialog();
    if (paths && paths.length > 0) {
      const added = await api.addFiles(paths);
      await refreshData();
      api.showNotification('Folio Import', `Imported ${added.length} file(s) into Folio.`);
    }
  };

  // Handler: Open OS Import Files Dialog (prompts on first use on web)
  const handleImportDialog = async () => {
    if (!hasFileAccessConsent()) {
      setPendingDropPaths(null);
      setFileAccessModalOpen(true);
      return;
    }
    await executeImport();
  };

  const handleGrantFileAccess = async () => {
    try {
      localStorage.setItem('folio_file_access_granted', 'true');
    } catch (e) {}
    setFileAccessModalOpen(false);

    if (pendingDropPaths && pendingDropPaths.length > 0) {
      const added = await api.addFiles(pendingDropPaths);
      setPendingDropPaths(null);
      await refreshData();
      api.showNotification('Folio Import', `Successfully imported ${added.length} item(s).`);
    } else {
      await executeImport();
    }
  };

  // Listen to native macOS Menu shortcut (Cmd+O)
  useEffect(() => {
    if (window.electronAPI && window.electronAPI.onMenuAction) {
      window.electronAPI.onMenuAction('import-files', handleImportDialog);
    }
  }, []);

  // Handler: Toggle Favorite
  const handleToggleFavorite = async (fileId) => {
    await api.toggleFavorite(fileId);
    await refreshData();
  };

  // Handler: Attach Tag
  const handleAttachTag = async (fileId, tagId) => {
    await api.attachTag(fileId, tagId);
    await refreshData();
  };

  // Handler: Detach Tag
  const handleDetachTag = async (fileId, tagId) => {
    await api.detachTag(fileId, tagId);
    await refreshData();
  };

  // Handler: Save notes to SQLite
  const handleUpdateNotes = async (fileId, notes) => {
    await api.updateNotes(fileId, notes);
    await refreshData();
  };

  // Handler: Confirmed Delete Single File
  const handleDeleteFile = async (fileId) => {
    await api.deleteFile(fileId);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(String(fileId));
      next.delete(fileId);
      return next;
    });
    if (selectedFile && String(selectedFile.id) === String(fileId)) {
      setSelectedFile(null);
    }
    await refreshData();
    api.showNotification('Folio Catalog', 'Item removed from catalog.');
  };

  // Handler: Confirmed Batch Delete Files
  const handleDeleteSelectedFiles = async (fileIds) => {
    if (!fileIds || fileIds.length === 0) return;
    await api.deleteFiles(fileIds);
    setSelectedIds(new Set());
    if (selectedFile && fileIds.some((id) => String(id) === String(selectedFile.id))) {
      setSelectedFile(null);
    }
    await refreshData();
    api.showNotification('Folio Catalog', `Removed ${fileIds.length} item(s) from catalog.`);
  };

  // Trigger single file delete confirmation
  const handleRequestDeleteFile = (file) => {
    setConfirmModal({
      isOpen: true,
      title: 'Remove from Catalog',
      message: `Are you sure you want to remove "${file.name}" from the Folio catalog?`,
      confirmText: 'Remove',
      onConfirm: () => handleDeleteFile(file.id),
    });
  };

  // Trigger batch delete confirmation
  const handleRequestDeleteSelectedFiles = (fileIds) => {
    setConfirmModal({
      isOpen: true,
      title: 'Remove Selected Items',
      message: `Are you sure you want to remove ${fileIds.length} item(s) from the Folio catalog?`,
      confirmText: `Remove (${fileIds.length})`,
      onConfirm: () => handleDeleteSelectedFiles(fileIds),
    });
  };

  // Handler: Create Tag
  const handleCreateTag = async (name, color) => {
    await api.createTag(name, color);
    await refreshData();
  };

  // Handler: Delete Tag
  const handleDeleteTag = async (tagId) => {
    await api.deleteTag(tagId);
    if (selectedTagId === tagId) {
      setSelectedTagId(null);
    }
    await refreshData();
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-[#101214] text-[#ECEFF1] overflow-hidden font-sans select-none">
      {/* App Opening Animation */}
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}

      {/* Frameless Window Titlebar */}
      <Titlebar
        onAddFilesClick={handleImportDialog}
        stats={stats}
        onOpenAbout={() => setAboutOpen(true)}
        isFullScreen={isFullScreen}
      />

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Navigation Sidebar */}
        <Sidebar
          width={leftSidebarWidth}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          selectedTagId={selectedTagId}
          onSelectTag={setSelectedTagId}
          tags={tags}
          onOpenTagModal={() => setTagModalOpen(true)}
          onDeleteTag={handleDeleteTag}
          stats={stats}
          categoryCounts={categoryCounts}
        />

        {/* Left Sidebar Resize Handle */}
        <div
          onMouseDown={handleLeftResizeStart}
          className="w-1 bg-[#30363C]/80 hover:bg-[#B7C7D8] cursor-col-resize transition-colors z-20 flex-shrink-0 relative group select-none"
          title="Drag to resize sidebar"
        >
          <div className="absolute inset-y-0 -left-1 -right-1" />
        </div>

        {/* Central File Browser */}
        <FileList
          files={files}
          selectedFileId={selectedFile?.id}
          onSelectFile={(file) => setSelectedFile(file)}
          viewMode={viewMode}
          setViewMode={handleSetViewMode}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          sortBy={sortBy}
          setSortBy={setSortBy}
          onToggleFavorite={handleToggleFavorite}
          onOpenPreview={(file) => setPreviewFile(file)}
          onRequestDeleteFile={handleRequestDeleteFile}
          onRequestDeleteSelectedFiles={handleRequestDeleteSelectedFiles}
          onOpenFormatModal={(file) => setFormatFile(file)}
          onAddFilesClick={handleImportDialog}
          selectedIds={selectedIds}
          setSelectedIds={setSelectedIds}
        />

        {/* Right Sidebar Resize Handle & File Detail Drawer */}
        {selectedFile && (
          <>
            <div
              onMouseDown={handleRightResizeStart}
              className="w-1 bg-[#30363C]/80 hover:bg-[#B7C7D8] cursor-col-resize transition-colors z-20 flex-shrink-0 relative group select-none"
              title="Drag to resize details"
            >
              <div className="absolute inset-y-0 -left-1 -right-1" />
            </div>

            <FileDetail
              width={rightSidebarWidth}
              file={selectedFile}
              onClose={() => setSelectedFile(null)}
              allTags={tags}
              onAttachTag={handleAttachTag}
              onDetachTag={handleDetachTag}
              onRequestDeleteFile={handleRequestDeleteFile}
              onOpenPreview={(file) => setPreviewFile(file)}
              onOpenFormatModal={(file) => setFormatFile(file)}
              onUpdateNotes={handleUpdateNotes}
            />
          </>
        )}
      </div>

      {/* Quick Preview Modal */}
      {previewFile && (
        <QuickPreview file={previewFile} onClose={() => setPreviewFile(null)} />
      )}

      {/* Change Format / Convert Modal */}
      {formatFile && (
        <FormatModal
          file={formatFile}
          isOpen={Boolean(formatFile)}
          onClose={() => setFormatFile(null)}
          onConverted={refreshData}
        />
      )}

      {/* Destructive Action Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        onConfirm={confirmModal.onConfirm}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* About Application Modal */}
      <AboutModal
        isOpen={aboutOpen}
        onClose={() => setAboutOpen(false)}
      />

      {/* Tag Creation Modal */}
      <TagModal
        isOpen={tagModalOpen}
        onClose={() => setTagModalOpen(false)}
        onCreateTag={handleCreateTag}
      />

      {/* Drag & Drop Visual Overlay */}
      <DropZone isDragging={isDragging} />

      {/* In-App Toast Notifications Stack */}
      <div className="fixed top-12 right-4 z-50 flex flex-col space-y-2 pointer-events-none max-w-sm w-full">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto bg-[#181C20]/95 backdrop-blur-md border border-[#30363C] shadow-2xl rounded-lg p-3 flex items-start space-x-3 animate-in fade-in slide-in-from-top-2 duration-150"
          >
            <div className="p-1 rounded bg-[#20252A] text-[#B7C7D8] flex-shrink-0 mt-0.5">
              <Info className="w-3.5 h-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-[#ECEFF1] truncate">{toast.title}</div>
              {toast.body && (
                <div className="text-[11px] text-[#92999F] mt-0.5 leading-snug line-clamp-2">{toast.body}</div>
              )}
            </div>
            <button
              onClick={() => handleDismissToast(toast.id)}
              className="text-[#70777E] hover:text-[#ECEFF1] p-0.5 rounded transition-colors flex-shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* First-Time File Access & Privacy Modal (Web Only, One-Time) */}
      <FileAccessModal
        isOpen={fileAccessModalOpen}
        onClose={() => {
          setPendingDropPaths(null);
          setFileAccessModalOpen(false);
        }}
        onConfirm={handleGrantFileAccess}
      />
    </div>
  );
}
