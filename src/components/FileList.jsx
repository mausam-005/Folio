import React, { useRef, useEffect } from 'react';
import { 
  Search, LayoutGrid, List, ArrowUpDown, Star, Folder, FolderOpen, 
  Eye, FileText, Image, Code2, Music, Video, Archive, File, 
  Trash2, Copy, X, Plus, RefreshCw, ChevronDown, ChevronRight,
  MoreHorizontal, FolderTree, ChevronsDownUp, ChevronsUpDown,
  Layers, Tag, Calendar, Check, CheckSquare
} from 'lucide-react';
import { api } from '../api';
import { getFolioUrl } from '../utils/url';

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

// Smart Path Breadcrumb helper:
// Extracts meaningful ancestor folder hierarchy (e.g., "Physics › Lab 14")
function getSmartPathBreadcrumb(filePath, isFolder = false) {
  if (!filePath) return '';
  const parts = filePath.split(/[/\\]+/).filter(Boolean);
  if (parts.length === 0) return '';

  const dirParts = isFolder ? parts : parts.slice(0, -1);
  if (dirParts.length === 0) return parts[0] || '';

  // Skip Drive letter (e.g., C:) if present
  let startIdx = 0;
  if (dirParts[0].endsWith(':')) {
    startIdx = 1;
  }
  // Skip Users/<username> or home/<username>
  if (dirParts.length >= startIdx + 2) {
    const firstDir = dirParts[startIdx].toLowerCase();
    if (firstDir === 'users' || firstDir === 'home') {
      startIdx += 2;
    }
  }

  const meaningful = dirParts.slice(startIdx);
  if (meaningful.length === 0) {
    return dirParts[dirParts.length - 1] || 'Home';
  }
  if (meaningful.length === 1) {
    return meaningful[0];
  }
  return `${meaningful[meaningful.length - 2]} › ${meaningful[meaningful.length - 1]}`;
}

// Returns only immediate parent folder name (e.g. "Lab_11" instead of complete path chain)
function getSimpleFolderName(filePath, isFolder = false) {
  if (!filePath) return '';
  const parts = filePath.split(/[/\\]+/).filter(Boolean);
  if (parts.length === 0) return '';

  const dirParts = isFolder ? parts : parts.slice(0, -1);
  if (dirParts.length === 0) return '';

  const lastFolder = dirParts[dirParts.length - 1];
  if (!lastFolder || lastFolder.endsWith(':')) return '';
  const lower = lastFolder.toLowerCase();
  if (lower === 'users' || lower === 'home') return '';
  return lastFolder;
}

// Extracts relative subfolder name for nested files inside an expanded folder
function getSubFolderName(folderPath, childPath) {
  if (!folderPath || !childPath) return '';
  const normFolder = folderPath.replace(/\\/g, '/').replace(/\/+$/, '');
  const normChild = childPath.replace(/\\/g, '/');
  if (!normChild.startsWith(normFolder + '/')) return '';
  const rel = normChild.slice(normFolder.length + 1);
  const parts = rel.split('/');
  if (parts.length > 1) {
    return parts.slice(0, -1).join(' / ');
  }
  return '';
}

// Categorizes modified timestamp into chronological buckets
function getDateCategory(dateString) {
  if (!dateString) return 'Older';
  const fileDate = new Date(dateString);
  if (isNaN(fileDate.getTime())) return 'Older';

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const oneDayMs = 24 * 60 * 60 * 1000;
  const startOfYesterday = startOfToday - oneDayMs;
  const startOf7Days = startOfToday - 7 * oneDayMs;
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const startOfYear = new Date(now.getFullYear(), 0, 1).getTime();

  const fileTime = fileDate.getTime();
  if (fileTime >= startOfToday) return 'Today';
  if (fileTime >= startOfYesterday) return 'Yesterday';
  if (fileTime >= startOf7Days) return 'Previous 7 Days';
  if (fileTime >= startOfMonth) return 'This Month';
  if (fileTime >= startOfYear) return 'Earlier This Year';
  return 'Older';
}

// Renders the icon matching group type (Folder, Tag, Category, Date)
function GroupHeaderIcon({ group, isCollapsed }) {
  if (group.type === 'tag') {
    return (
      <div className="w-6 h-6 rounded bg-[#191D21] border border-[#30363C] flex items-center justify-center flex-shrink-0">
        <Tag className="w-3.5 h-3.5" style={{ color: group.tagColor || '#B7C7D8' }} />
      </div>
    );
  }
  if (group.type === 'date') {
    return (
      <div className="w-6 h-6 rounded bg-[#191D21] border border-[#30363C] flex items-center justify-center flex-shrink-0">
        <Calendar className="w-3.5 h-3.5 text-[#B7C7D8]" />
      </div>
    );
  }
  if (group.type === 'category') {
    const cat = group.categoryKey;
    const catColor = 
      cat === 'folder' ? 'text-amber-400' :
      cat === 'document' ? 'text-blue-400' :
      cat === 'image' ? 'text-emerald-400' :
      cat === 'video' ? 'text-purple-400' :
      cat === 'audio' ? 'text-pink-400' :
      cat === 'code' ? 'text-cyan-400' :
      cat === 'archive' ? 'text-yellow-400' : 'text-[#B7C7D8]';
    return (
      <div className="w-6 h-6 rounded bg-[#191D21] border border-[#30363C] flex items-center justify-center flex-shrink-0">
        {cat === 'folder' && <Folder className={`w-3.5 h-3.5 ${catColor}`} />}
        {cat === 'document' && <FileText className={`w-3.5 h-3.5 ${catColor}`} />}
        {cat === 'image' && <Image className={`w-3.5 h-3.5 ${catColor}`} />}
        {cat === 'video' && <Video className={`w-3.5 h-3.5 ${catColor}`} />}
        {cat === 'audio' && <Music className={`w-3.5 h-3.5 ${catColor}`} />}
        {cat === 'code' && <Code2 className={`w-3.5 h-3.5 ${catColor}`} />}
        {cat === 'archive' && <Archive className={`w-3.5 h-3.5 ${catColor}`} />}
        {cat === 'other' && <File className={`w-3.5 h-3.5 ${catColor}`} />}
      </div>
    );
  }
  // Default: Folder path group
  return (
    <div className="w-6 h-6 rounded bg-[#191D21] border border-[#30363C] flex items-center justify-center flex-shrink-0">
      {isCollapsed ? (
        <Folder className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
      ) : (
        <FolderOpen className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
      )}
    </div>
  );
}

// Exact outline Eye icon matching user reference screenshot
function EyeActionIcon({ className = "w-4 h-4" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M2 12s3.8-7 10-7 10 7 10 7-3.8 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

// Exact outline Folder icon with horizontal slit/crease matching user reference screenshot
function FolderActionIcon({ className = "w-4 h-4" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M3 7v11a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-6.5l-2-2H5a2 2 0 0 0-2 2Z" />
      <line x1="3" y1="11" x2="21" y2="11" />
    </svg>
  );
}

// Exact [Eye] [Folder] [•••] Action Bar matching user reference screenshot
function FileRowActionBar({
  file,
  activeActionId,
  setActiveActionId,
  onOpenPreview,
  onOpenFormatModal,
  onRequestDeleteFile,
}) {
  const isMenuOpen = activeActionId === file.id;

  return (
    <div className="flex items-center justify-end space-x-1.5 flex-shrink-0">
      {/* Eye button (Quick Preview) */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onOpenPreview(file);
        }}
        title="Quick Preview"
        className="p-1 rounded text-[#92999F] hover:text-[#ECEFF1] hover:bg-[#252B31] transition-colors flex-shrink-0"
      >
        <EyeActionIcon className="w-4 h-4" />
      </button>

      {/* Folder button (Reveal in Finder) */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          api.revealInFinder(file.path);
        }}
        title="Reveal in Finder"
        className="p-1 rounded text-[#92999F] hover:text-[#ECEFF1] hover:bg-[#252B31] transition-colors flex-shrink-0"
      >
        <FolderActionIcon className="w-4 h-4" />
      </button>

      {/* Squircle Pill ••• button matching screenshot */}
      <div className="relative group/action flex-shrink-0">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setActiveActionId(isMenuOpen ? null : file.id);
          }}
          className="w-7 h-7 rounded-xl bg-[#20252A] hover:bg-[#2B3239] active:bg-[#1A1E22] border border-white/5 hover:border-white/10 text-white transition-all shadow-sm flex items-center justify-center space-x-0.5 cursor-pointer"
        >
          <span className="w-1 h-1 rounded-full bg-[#E5E9EE]"></span>
          <span className="w-1 h-1 rounded-full bg-[#E5E9EE]"></span>
          <span className="w-1 h-1 rounded-full bg-[#E5E9EE]"></span>
        </button>

        {/* Action Popover Menu (Click only, no hover trigger, no native tooltip) */}
        {isMenuOpen && (
          <div
            className="absolute right-0 top-full mt-1.5 z-50 bg-[#15181B] border border-[#30363C] rounded-lg shadow-2xl py-1 px-1 min-w-[200px] text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-2.5 py-1 text-[10px] font-semibold tracking-wider uppercase text-[#70777E] border-b border-[#30363C]/60 mb-0.5">
              Action
            </div>
            {file.category !== 'folder' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveActionId(null);
                  onOpenFormatModal(file);
                }}
                className="w-full flex items-center space-x-2 px-2.5 py-1.5 text-xs text-[#ECEFF1] hover:bg-[#252B31] rounded transition-colors text-left cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-[#B7C7D8]" />
                <span>Change Format / Convert</span>
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveActionId(null);
                api.copyToClipboard(file.path);
                api.showNotification('Folio', 'Copied full path to clipboard');
              }}
              className="w-full flex items-center space-x-2 px-2.5 py-1.5 text-xs text-[#ECEFF1] hover:bg-[#252B31] rounded transition-colors text-left cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5 text-[#B7C7D8]" />
              <span>Copy Full Path</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveActionId(null);
                onOpenPreview(file);
              }}
              className="w-full flex items-center space-x-2 px-2.5 py-1.5 text-xs text-[#ECEFF1] hover:bg-[#252B31] rounded transition-colors text-left cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-[#B7C7D8]" />
              <span>Quick Preview</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveActionId(null);
                api.revealInFinder(file.path);
              }}
              className="w-full flex items-center space-x-2 px-2.5 py-1.5 text-xs text-[#ECEFF1] hover:bg-[#252B31] rounded transition-colors text-left cursor-pointer"
            >
              <FolderOpen className="w-3.5 h-3.5 text-[#B7C7D8]" />
              <span>Reveal in Finder</span>
            </button>
            <div className="h-[1px] bg-[#30363C]/60 my-0.5" />
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveActionId(null);
                onRequestDeleteFile(file);
              }}
              className="w-full flex items-center space-x-2 px-2.5 py-1.5 text-xs text-[#D98282] hover:bg-[#252B31] rounded transition-colors text-left cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 text-[#D98282]" />
              <span>Remove from Catalog</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}


// Global client thumbnail & icon cache to avoid duplicate IPC queries
const clientThumbCache = new Map();

// Clean, restrained thumbnail with real media preview support
function FileThumbnail({ file }) {
  const ext = file.extension?.toLowerCase() || '';
  const isFolder = file.category === 'folder' || ext === 'folder';
  const isImage = file.category === 'image';
  const isVideo = file.category === 'video';
  const isPdf = ext === 'pdf';
  const [thumb, setThumb] = React.useState(() => clientThumbCache.get(file.path) || null);
  const [loadFailed, setLoadFailed] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    if (isFolder) return;
    // Query IPC thumbnail for video, PDF, or if folio:// protocol failed to load
    if (!thumb && (isVideo || isPdf || loadFailed)) {
      api.getThumbnail(file.path).then((t) => {
        if (active && t) {
          clientThumbCache.set(file.path, t);
          setThumb(t);
        }
      });
    }
    return () => { active = false; };
  }, [file.path, ext, isFolder, isVideo, isPdf, thumb, loadFailed]);

  // If item is a folder, render warm amber folder icon
  if (isFolder) {
    return (
      <div className="w-9 h-7 rounded bg-[#191D21] border border-[#30363C] flex items-center justify-center flex-shrink-0 relative shadow-sm">
        <Folder className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
      </div>
    );
  }

  // If we have an IPC-cached base64 thumbnail, render it
  if (thumb) {
    return (
      <div className="w-9 h-7 rounded bg-[#191D21] border border-[#30363C] flex items-center justify-center flex-shrink-0 overflow-hidden relative shadow-sm">
        <img
          src={thumb}
          alt={file.name}
          className="w-full h-full object-cover"
        />
        {isVideo && (
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center pointer-events-none">
            <div className="w-3.5 h-3.5 rounded-full bg-black/70 flex items-center justify-center shadow">
              <div className="w-0 h-0 border-y-[2px] border-y-transparent border-l-[4px] border-l-white ml-0.5" />
            </div>
          </div>
        )}
      </div>
    );
  }

  // If it's an image and hasn't failed to load via folio://
  if (isImage && !loadFailed) {
    return (
      <div className="w-9 h-7 rounded bg-[#191D21] border border-[#30363C] flex-shrink-0 overflow-hidden relative shadow-sm">
        <img
          src={getFolioUrl(file.path, true)}
          alt={file.name}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover"
          onError={() => {
            setLoadFailed(true);
          }}
        />
      </div>
    );
  }

  // Fallback while thumbnail is loading or if unavailable
  return (
    <div className="w-9 h-7 rounded bg-[#191D21] border border-[#30363C] flex items-center justify-center flex-shrink-0 relative">
      {isFolder ? (
        <Folder className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
      ) : isImage ? (
        <Image className="w-3.5 h-3.5 text-[#B7C7D8]" />
      ) : isVideo ? (
        <Video className="w-3.5 h-3.5 text-[#B7C7D8]" />
      ) : isPdf ? (
        <span className="text-[8px] font-bold font-mono text-red-400">PDF</span>
      ) : file.category === 'document' ? (
        <FileText className="w-3.5 h-3.5 text-[#92999F]" />
      ) : file.category === 'code' ? (
        <Code2 className="w-3.5 h-3.5 text-[#92999F]" />
      ) : file.category === 'audio' ? (
        <Music className="w-3.5 h-3.5 text-[#92999F]" />
      ) : file.category === 'archive' ? (
        <Archive className="w-3.5 h-3.5 text-[#92999F]" />
      ) : (
        <File className="w-3.5 h-3.5 text-[#70777E]" />
      )}
    </div>
  );
}

const GROUP_OPTIONS = [
  {
    id: 'folder',
    label: 'Folder Path',
    icon: FolderTree,
    iconColor: 'text-amber-400',
    description: 'Group files by folder ancestry (e.g. Physics › Lab 14)',
  },
  {
    id: 'tag',
    label: 'Tag',
    icon: Tag,
    iconColor: 'text-blue-400',
    description: 'Group files by Folio tags (#Work, #Urgent, etc.)',
  },
  {
    id: 'category',
    label: 'Category',
    icon: FileText,
    iconColor: 'text-emerald-400',
    description: 'Group by file kind (Documents, Images, Code, etc.)',
  },
  {
    id: 'date',
    label: 'Date',
    icon: Calendar,
    iconColor: 'text-sky-400',
    description: 'Group by timeline (Today, This Month, Older)',
  },
  {
    id: 'none',
    label: 'None (Flat List)',
    icon: List,
    iconColor: 'text-[#70777E]',
    description: 'Show all files in a single flat list without headers',
    isDividerAbove: true,
  },
];

const SORT_OPTIONS = [
  { id: 'date_desc', label: 'Date Modified (Newest)' },
  { id: 'date_asc', label: 'Date Modified (Oldest)' },
  { id: 'name_asc', label: 'Name (A–Z)', isDividerAbove: true },
  { id: 'name_desc', label: 'Name (Z–A)' },
  { id: 'size_desc', label: 'Size (Largest)', isDividerAbove: true },
  { id: 'size_asc', label: 'Size (Smallest)' },
];

export default function FileList({
  files = [],
  selectedFileId,
  onSelectFile,
  viewMode,
  setViewMode,
  searchQuery,
  setSearchQuery,
  sortBy,
  setSortBy,
  onToggleFavorite,
  onOpenPreview,
  onRequestDeleteFile,
  onRequestDeleteSelectedFiles,
  onOpenFormatModal,
  onAddFilesClick,
  onAddFolderClick,
  selectedIds,
  setSelectedIds,
}) {
  const [activeActionId, setActiveActionId] = React.useState(null);
  const [isGroupMenuOpen, setIsGroupMenuOpen] = React.useState(false);
  const [isSortMenuOpen, setIsSortMenuOpen] = React.useState(false);
  const [hoveredGroupOpt, setHoveredGroupOpt] = React.useState(null);
  const [expandedFolders, setExpandedFolders] = React.useState(new Set());
  const groupMenuRef = useRef(null);
  const sortMenuRef = useRef(null);

  const [groupBy, setGroupBy] = React.useState(() => {
    const saved = localStorage.getItem('folio_group_by');
    if (saved) return saved;
    const oldAutoCompile = localStorage.getItem('folio_auto_compile');
    if (oldAutoCompile === 'false') return 'none';
    return 'folder';
  });
  const [collapsedGroups, setCollapsedGroups] = React.useState(new Set());
  const searchInputRef = useRef(null);

  const currentGroupOption = GROUP_OPTIONS.find((opt) => opt.id === groupBy) || GROUP_OPTIONS[0];
  const currentSortOption = SORT_OPTIONS.find((opt) => opt.id === sortBy) || SORT_OPTIONS[0];
  const CurrentGroupIcon = currentGroupOption.icon || FolderTree;

  const handleGroupByChange = (mode) => {
    setGroupBy(mode);
    setCollapsedGroups(new Set()); // Expand all groups when switching basis
    setExpandedFolders(new Set()); // Reset folder expansion
    try {
      localStorage.setItem('folio_group_by', mode);
    } catch (e) {}
  };

  const toggleFolderExpand = (folderId, e) => {
    if (e) e.stopPropagation();
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  // Finds all files nested inside a given folder directory
  const getFolderChildren = (folderPath) => {
    if (!folderPath || !files) return [];
    const normFolder = folderPath.replace(/\\/g, '/').replace(/\/+$/, '');
    return files.filter((f) => {
      if (!f.path || f.path === folderPath) return false;
      const normF = f.path.replace(/\\/g, '/');
      return normF.startsWith(normFolder + '/');
    });
  };

  // Multi-basis compilation: Folder Path, Tag, Category/Kind, Date, or Flat List
  const compiledGroups = React.useMemo(() => {
    if (groupBy === 'none') {
      return [{
        key: 'all_files',
        name: 'All Files',
        files,
        totalSize: files.reduce((acc, f) => acc + (f.size || 0), 0),
        isCompiled: false,
      }];
    }

    if (groupBy === 'folder') {
      const groupMap = new Map();
      files.forEach((file) => {
        let breadcrumb = getSmartPathBreadcrumb(file.path, file.category === 'folder') || 'General Files';
        
        // Smart sub-cluster for generic Downloads/Desktop series or episode patterns
        if (breadcrumb === 'Downloads' || breadcrumb === 'Desktop' || breadcrumb === 'Home') {
          const base = (file.name || '').replace(/\.[^/.]+$/, '').trim();
          const seasonMatch = base.match(/^(.+?)[._\s-]+S\d+/i);
          if (seasonMatch) {
            breadcrumb = `${breadcrumb} › ${seasonMatch[0].replace(/[._-]+/g, ' ').trim()}`;
          }
        }

        if (!groupMap.has(breadcrumb)) {
          groupMap.set(breadcrumb, []);
        }
        groupMap.get(breadcrumb).push(file);
      });

      const result = [];
      for (const [name, gFiles] of groupMap.entries()) {
        const totalSize = gFiles.reduce((acc, f) => acc + (f.size || 0), 0);
        result.push({
          key: `folder_${name}`,
          name,
          type: 'folder',
          files: gFiles,
          totalSize,
          isCompiled: true,
        });
      }
      result.sort((a, b) => a.name.localeCompare(b.name));
      return result.length > 0 ? result : [{ key: 'all_files', name: 'All Files', files, totalSize: 0, isCompiled: false }];
    }

    if (groupBy === 'tag') {
      const groupMap = new Map();
      const untagged = [];

      files.forEach((file) => {
        if (file.tags && file.tags.length > 0) {
          file.tags.forEach((tag) => {
            const tagName = tag.name || 'Untitled Tag';
            if (!groupMap.has(tagName)) {
              groupMap.set(tagName, { tag, files: [] });
            }
            groupMap.get(tagName).files.push(file);
          });
        } else {
          untagged.push(file);
        }
      });

      const result = [];
      for (const [name, { tag, files: gFiles }] of groupMap.entries()) {
        const totalSize = gFiles.reduce((acc, f) => acc + (f.size || 0), 0);
        result.push({
          key: `tag_${name}`,
          name: `#${name.replace(/^#/, '')}`,
          tagColor: tag?.color || '#3B82F6',
          type: 'tag',
          files: gFiles,
          totalSize,
          isCompiled: true,
        });
      }
      result.sort((a, b) => a.name.localeCompare(b.name));

      if (untagged.length > 0) {
        const totalSize = untagged.reduce((acc, f) => acc + (f.size || 0), 0);
        result.push({
          key: 'tag_untagged',
          name: 'Untagged',
          tagColor: '#70777E',
          type: 'tag',
          files: untagged,
          totalSize,
          isCompiled: true,
        });
      }
      return result.length > 0 ? result : [{ key: 'all_files', name: 'All Files', files, totalSize: 0, isCompiled: false }];
    }

    if (groupBy === 'category') {
      const order = ['folder', 'document', 'image', 'video', 'audio', 'code', 'archive', 'other'];
      const categoryLabels = {
        folder: 'Folders',
        document: 'Documents',
        image: 'Images',
        video: 'Videos',
        audio: 'Audio',
        code: 'Code & Scripts',
        archive: 'Archives',
        other: 'Other Files',
      };

      const groupMap = new Map();
      files.forEach((file) => {
        const cat = file.category || 'other';
        const validCat = order.includes(cat) ? cat : 'other';
        if (!groupMap.has(validCat)) {
          groupMap.set(validCat, []);
        }
        groupMap.get(validCat).push(file);
      });

      const result = [];
      order.forEach((cat) => {
        if (groupMap.has(cat)) {
          const gFiles = groupMap.get(cat);
          const totalSize = gFiles.reduce((acc, f) => acc + (f.size || 0), 0);
          result.push({
            key: `cat_${cat}`,
            name: categoryLabels[cat] || cat,
            categoryKey: cat,
            type: 'category',
            files: gFiles,
            totalSize,
            isCompiled: true,
          });
        }
      });
      return result.length > 0 ? result : [{ key: 'all_files', name: 'All Files', files, totalSize: 0, isCompiled: false }];
    }

    if (groupBy === 'date') {
      const dateBins = ['Today', 'Yesterday', 'Previous 7 Days', 'This Month', 'Earlier This Year', 'Older'];
      const groupMap = new Map();
      files.forEach((file) => {
        const bin = getDateCategory(file.updated_at || file.created_at);
        if (!groupMap.has(bin)) {
          groupMap.set(bin, []);
        }
        groupMap.get(bin).push(file);
      });

      const result = [];
      dateBins.forEach((bin) => {
        if (groupMap.has(bin)) {
          const gFiles = groupMap.get(bin);
          const totalSize = gFiles.reduce((acc, f) => acc + (f.size || 0), 0);
          result.push({
            key: `date_${bin.replace(/\s+/g, '_')}`,
            name: bin,
            type: 'date',
            files: gFiles,
            totalSize,
            isCompiled: true,
          });
        }
      });
      return result.length > 0 ? result : [{ key: 'all_files', name: 'All Files', files, totalSize: 0, isCompiled: false }];
    }

    return [{ key: 'all_files', name: 'All Files', files, totalSize: 0, isCompiled: false }];
  }, [files, groupBy]);

  const compiledMultiGroups = compiledGroups.filter((g) => g.isCompiled);
  const allFolded = compiledMultiGroups.length > 0 && compiledMultiGroups.every((g) => collapsedGroups.has(g.key));

  const toggleGroupCollapse = (groupKey) => {
    const next = new Set(collapsedGroups);
    if (next.has(groupKey)) {
      next.delete(groupKey);
    } else {
      next.add(groupKey);
    }
    setCollapsedGroups(next);
  };

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (groupMenuRef.current && !groupMenuRef.current.contains(e.target)) {
        setIsGroupMenuOpen(false);
      }
      if (sortMenuRef.current && !sortMenuRef.current.contains(e.target)) {
        setIsSortMenuOpen(false);
      }
      setActiveActionId(null);
    };
    window.addEventListener('mousedown', handleOutsideClick);
    return () => window.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const isItemChecked = React.useCallback(
    (id) => selectedIds.has(String(id)),
    [selectedIds]
  );

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Cmd/Ctrl + K: Focus Search
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K' || e.code === 'KeyK')) {
        e.preventDefault();
        searchInputRef.current?.focus();
      } 
      // Cmd/Ctrl + A: Select All Files and Folders
      else if ((e.metaKey || e.ctrlKey) && (e.key === 'a' || e.key === 'A' || e.code === 'KeyA')) {
        const activeTag = document.activeElement?.tagName;
        const activeEl = document.activeElement;
        const isTextInput = activeTag === 'INPUT' || activeTag === 'TEXTAREA' || activeEl?.isContentEditable;
        
        // If the user is inside an input with text, allow default text selection. Otherwise select all files & folders.
        if (!isTextInput || (activeEl && !activeEl.value)) {
          if (files && files.length > 0) {
            e.preventDefault();
            e.stopPropagation();
            setSelectedIds(new Set(files.map((f) => String(f.id))));
          }
        }
      } 
      // Escape: Clear Selection
      else if (e.key === 'Escape') {
        if (selectedIds.size > 0) {
          e.preventDefault();
          setSelectedIds(new Set());
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [files, selectedIds, setSelectedIds]);

  const allSelected = files.length > 0 && files.every((f) => isItemChecked(f.id));
  const isIndeterminate = files.length > 0 && selectedIds.size > 0 && !allSelected;

  const handleToggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(files.map((f) => String(f.id))));
    }
  };

  const handleToggleSelectItem = (id, e) => {
    if (e) e.stopPropagation();
    const sId = String(id);
    const next = new Set(selectedIds);

    // Identify if clicked item is a folder with children
    const targetFile = files?.find((f) => String(f.id) === sId);
    const isFolder = targetFile && (targetFile.category === 'folder' || targetFile.extension === 'folder');
    const folderChildren = isFolder ? getFolderChildren(targetFile.path) : [];

    if (next.has(sId)) {
      next.delete(sId);
      if (folderChildren.length > 0) {
        folderChildren.forEach((child) => next.delete(String(child.id)));
      }
    } else {
      next.add(sId);
      if (folderChildren.length > 0) {
        folderChildren.forEach((child) => next.add(String(child.id)));
      }
    }
    setSelectedIds(next);
  };

  const handleCopySelectedPaths = async () => {
    const paths = files
      .filter((f) => isItemChecked(f.id))
      .map((f) => f.path)
      .join('\n');
    await api.copyToClipboard(paths);
    api.showNotification('Folio Clipboard', `Copied path(s) to clipboard.`);
  };

  return (
    <div className="flex-1 min-w-0 flex flex-col h-full bg-[#101214] overflow-hidden relative">
      {/* Top Filter and Search Bar */}
      <div className="px-4 py-3 border-b border-[#30363C] flex flex-wrap items-center justify-between gap-3 bg-[#15181B] z-10">
        {/* Search Input with Cmd+K hint */}
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="w-3.5 h-3.5 text-[#70777E] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === 'Escape') {
                e.currentTarget.blur();
              }
            }}
            placeholder="Search by name, tags, or notes..."
            className="w-full bg-[#191D21] border border-[#30363C] rounded pl-8 pr-12 py-1 text-xs text-[#ECEFF1] placeholder-[#70777E] focus:outline-none focus:border-[#B7C7D8] transition-colors"
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center space-x-1">
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery('')}
                className="text-[#70777E] hover:text-[#ECEFF1] text-xs p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            ) : (
              <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-[#252B31] text-[#70777E] border border-[#30363C]">
                ⌘K
              </span>
            )}
          </div>
        </div>

        {/* Controls: Group by Folder, Fold/Unfold, Sort, and Layout View Switcher */}
        <div className="flex items-center space-x-2">
          {/* Custom Group By Basis Selector & Smart Contextual Expand/Collapse Pill */}
          <div className="flex items-center rounded-md bg-[#191D21] border border-[#30363C] p-0.5 shadow-sm">
            <div className="relative" ref={groupMenuRef} onMouseDown={(e) => e.stopPropagation()}>
              <button
                id="group-by-button"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsGroupMenuOpen((prev) => !prev);
                  setIsSortMenuOpen(false);
                }}
                title={`Group files: ${currentGroupOption.label} — ${currentGroupOption.description}`}
                className={`flex items-center space-x-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer select-none ${
                  isGroupMenuOpen
                    ? 'bg-[#252B31] text-[#ECEFF1]'
                    : 'text-[#ECEFF1] hover:bg-[#252B31]/70'
                }`}
              >
                <CurrentGroupIcon className={`w-3.5 h-3.5 ${currentGroupOption.iconColor || 'text-[#B7C7D8]'}`} />
                <span className="text-[#70777E] hidden sm:inline">Group:</span>
                <span className="font-semibold text-[#ECEFF1]">{currentGroupOption.label}</span>
                <ChevronDown className={`w-3 h-3 text-[#70777E] transition-transform duration-150 ${isGroupMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Rich Group By Dropdown Menu with Explanatory Hover Effect */}
              {isGroupMenuOpen && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute left-0 top-full mt-1.5 w-64 rounded-lg bg-[#181C20] border border-[#30363C] shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100"
                >
                  <div className="px-2.5 py-1 text-[10px] font-semibold text-[#70777E] uppercase tracking-wider">
                    Group Files By
                  </div>
                  <div className="space-y-0.5 mt-0.5">
                    {GROUP_OPTIONS.map((opt) => {
                      const isSelected = groupBy === opt.id;
                      const Icon = opt.icon;
                      return (
                        <React.Fragment key={opt.id}>
                          {opt.isDividerAbove && <div className="h-[1px] bg-[#30363C]/60 my-1" />}
                          <button
                            id={`group-option-${opt.id}`}
                            type="button"
                            onMouseEnter={() => setHoveredGroupOpt(opt)}
                            onMouseLeave={() => setHoveredGroupOpt(null)}
                            onClick={() => {
                              handleGroupByChange(opt.id);
                              setIsGroupMenuOpen(false);
                            }}
                            title={opt.description}
                            className={`group w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-left transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-[#252B31] text-[#ECEFF1]'
                                : 'text-[#ECEFF1] hover:bg-[#22272C]'
                            }`}
                          >
                            <div className="flex items-center space-x-2.5 min-w-0">
                              <div className="w-5 h-5 rounded bg-[#101214] border border-[#30363C] flex items-center justify-center flex-shrink-0">
                                <Icon className={`w-3 h-3 ${opt.iconColor}`} />
                              </div>
                              <span className={`text-xs ${isSelected ? 'text-[#ECEFF1] font-semibold' : 'text-[#ECEFF1]'}`}>
                                {opt.label}
                              </span>
                            </div>
                            {isSelected && (
                              <Check className="w-3.5 h-3.5 text-[#B7C7D8] flex-shrink-0 ml-1.5" />
                            )}
                          </button>
                        </React.Fragment>
                      );
                    })}
                  </div>

                  {/* Hover Explanation Bar - Only visible info on hover without bloating list items */}
                  <div className="mt-1.5 pt-1.5 border-t border-[#30363C]/60 px-2 py-1.5 rounded bg-[#101214]/70 text-[11px] text-[#92999F] leading-tight min-h-[38px] flex items-center">
                    <p className="transition-opacity duration-150">
                      <span className="text-[#ECEFF1] font-medium mr-1">
                        {(hoveredGroupOpt || currentGroupOption).label}:
                      </span>
                      {(hoveredGroupOpt || currentGroupOption).description}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Smart Contextual Toggle: Only Show Expand OR Collapse Based on Current State */}
            {groupBy !== 'none' && compiledMultiGroups.length > 0 && (
              <>
                <div className="w-[1px] h-3.5 bg-[#30363C] mx-1" />
                {allFolded ? (
                  <button
                    type="button"
                    onClick={() => setCollapsedGroups(new Set())}
                    title="Expand all sections"
                    className="flex items-center space-x-1.5 px-2 py-1 rounded text-xs font-medium text-[#B7C7D8] hover:text-[#ECEFF1] hover:bg-[#252B31] transition-colors cursor-pointer"
                  >
                    <ChevronsUpDown className="w-3.5 h-3.5 text-[#B7C7D8]" />
                    <span>Expand All</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setCollapsedGroups(new Set(compiledMultiGroups.map((g) => g.key)))}
                    title="Collapse all sections"
                    className="flex items-center space-x-1.5 px-2 py-1 rounded text-xs font-medium text-[#92999F] hover:text-[#ECEFF1] hover:bg-[#252B31] transition-colors cursor-pointer"
                  >
                    <ChevronsDownUp className="w-3.5 h-3.5 text-[#B7C7D8]" />
                    <span>Collapse All</span>
                  </button>
                )}
              </>
            )}
          </div>

          {/* Custom Sort Dropdown */}
          <div className="relative" ref={sortMenuRef} onMouseDown={(e) => e.stopPropagation()}>
            <button
              id="sort-by-button"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsSortMenuOpen((prev) => !prev);
                setIsGroupMenuOpen(false);
              }}
              title={`Sort files: ${currentSortOption.label}`}
              className={`flex items-center space-x-1.5 bg-[#191D21] border border-[#30363C] rounded px-2.5 py-1 text-xs transition-colors cursor-pointer select-none ${
                isSortMenuOpen
                  ? 'border-[#70777E] text-[#ECEFF1] bg-[#252B31]'
                  : 'text-[#92999F] hover:text-[#ECEFF1] hover:border-[#70777E]/50'
              }`}
            >
              <ArrowUpDown className="w-3 h-3 text-[#70777E]" />
              <span className="text-[#ECEFF1] font-medium">{currentSortOption.label}</span>
              <ChevronDown className={`w-3 h-3 text-[#70777E] transition-transform duration-150 ${isSortMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Custom Sort Menu Popover (Clean labels without bulky descriptions) */}
            {isSortMenuOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-full mt-1.5 w-52 rounded-lg bg-[#181C20] border border-[#30363C] shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100"
              >
                <div className="px-2.5 py-1 text-[10px] font-semibold text-[#70777E] uppercase tracking-wider">
                  Sort By
                </div>
                <div className="space-y-0.5 mt-0.5">
                  {SORT_OPTIONS.map((opt) => {
                    const isSelected = sortBy === opt.id;
                    return (
                      <React.Fragment key={opt.id}>
                        {opt.isDividerAbove && <div className="h-[1px] bg-[#30363C]/60 my-1" />}
                        <button
                          type="button"
                          onClick={() => {
                            setSortBy(opt.id);
                            setIsSortMenuOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-[#252B31] text-[#ECEFF1] font-semibold'
                              : 'text-[#ECEFF1] hover:bg-[#22272C]'
                          }`}
                        >
                          <span>{opt.label}</span>
                          {isSelected && (
                            <Check className="w-3.5 h-3.5 text-[#B7C7D8] flex-shrink-0 ml-2" />
                          )}
                        </button>
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Select All Toggle Action (⌘A shortcut indicator) */}
          {files.length > 0 && (
            <button
              type="button"
              onClick={handleToggleSelectAll}
              title={allSelected ? 'Deselect All (Esc)' : 'Select All (⌘A)'}
              className={`flex items-center space-x-1 px-2 py-1 rounded text-xs border transition-colors cursor-pointer select-none ${
                allSelected
                  ? 'bg-[#252B31] border-[#B7C7D8] text-[#ECEFF1]'
                  : selectedIds.size > 0
                  ? 'bg-[#191D21] border-[#70777E] text-[#ECEFF1]'
                  : 'bg-[#191D21] border-[#30363C] text-[#92999F] hover:text-[#ECEFF1] hover:border-[#70777E]/50'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5 text-[#B7C7D8]" />
              <span className="hidden sm:inline font-medium">
                {allSelected ? 'Deselect' : 'Select All'}
              </span>
            </button>
          )}

          {/* Grid / List Switcher */}
          <div className="flex items-center bg-[#191D21] border border-[#30363C] rounded p-0.5">
            <button
              onClick={() => setViewMode('list')}
              title="List View"
              className={`p-1 rounded transition-colors ${
                viewMode === 'list'
                  ? 'bg-[#252B31] text-[#ECEFF1]'
                  : 'text-[#70777E] hover:text-[#ECEFF1]'
              }`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              title="Grid View"
              className={`p-1 rounded transition-colors ${
                viewMode === 'grid'
                  ? 'bg-[#252B31] text-[#ECEFF1]'
                  : 'text-[#70777E] hover:text-[#ECEFF1]'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main File Content Area with Hardware Accelerated Scrolling */}
      <div className="flex-1 overflow-y-auto p-3 pb-36 file-scroll-container">
        {files.length === 0 ? (
          /* Restrained Empty State */
          <div className="h-full flex flex-col items-center justify-center text-center p-8 border border-dashed border-[#30363C] rounded bg-[#15181B]/40">
            <div className="w-12 h-12 rounded bg-[#191D21] border border-[#30363C] flex items-center justify-center mb-3">
              <FolderOpen className="w-6 h-6 text-[#92999F]" />
            </div>
            <h3 className="text-xs font-semibold text-[#ECEFF1] mb-1">
              {searchQuery ? 'No matching files found' : 'Catalog is empty'}
            </h3>
            <p className="text-xs text-[#70777E] max-w-sm mb-4">
              {searchQuery
                ? 'Check your spelling or reset the filter.'
                : 'Drag and drop files from Finder to begin indexing.'}
            </p>
            {!searchQuery && (
              <div className="flex items-center justify-center">
                <button
                  type="button"
                  onClick={onAddFilesClick}
                  className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-[#B7C7D8] hover:bg-[#C8D6E5] text-[#101214] text-xs font-semibold shadow-sm transition-all active:scale-95 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Import Files or Folders</span>
                </button>
              </div>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View with Collapsible Folder Groups */
          <div className="space-y-4">
            {compiledGroups.map((group) => {
              const isCollapsed = collapsedGroups.has(group.key);

              return (
                <div key={group.key} className="space-y-2">
                  {/* Collapsible Folder Header for Compiled Groups */}
                  {group.isCompiled && (
                    <div
                      onClick={() => toggleGroupCollapse(group.key)}
                      className="flex items-center justify-between p-2 rounded bg-[#15181B] border border-[#30363C] hover:bg-[#191D21] cursor-pointer select-none transition-colors shadow-sm"
                    >
                      <div className="flex items-center space-x-2 min-w-0">
                        <span className="text-[#B7C7D8] flex-shrink-0">
                          {isCollapsed ? (
                            <ChevronRight className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </span>
                        <GroupHeaderIcon group={group} isCollapsed={isCollapsed} />
                        <span className="font-semibold text-xs text-[#ECEFF1] tracking-wide truncate">
                          {group.name}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#191D21] border border-[#30363C] text-[#92999F] flex-shrink-0">
                          {group.files.length} {group.files.length === 1 ? 'file' : 'files'}
                        </span>
                      </div>

                      <div className="flex items-center space-x-3 text-[11px] font-mono text-[#70777E] flex-shrink-0">
                        <span>{formatBytes(group.totalSize)}</span>
                      </div>
                    </div>
                  )}

                  {/* Cards Grid (Hidden when group is collapsed) */}
                  {!isCollapsed && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                      {group.files.map((file) => {
                        const isSelected = selectedFileId === file.id;
                        const isChecked = isItemChecked(file.id);
                        const isFolder = file.category === 'folder' || file.extension === 'folder';
                        const isFolderExpanded = expandedFolders.has(file.id);
                        const folderChildren = isFolder ? getFolderChildren(file.path) : [];

                        return (
                          <div
                            key={`${group.key}_${file.id}`}
                            onClick={() => {
                              onSelectFile(file);
                              if (isFolder) {
                                toggleFolderExpand(file.id);
                              }
                            }}
                            onDoubleClick={() => api.openPath(file.path)}
                            className={`group relative p-3 rounded border transition-colors cursor-pointer select-none grid-file-card ${
                              activeActionId === file.id ? 'z-40' : 'z-0'
                            } ${
                              isChecked
                                ? 'bg-[#191D21] border-[#B7C7D8]'
                                : isSelected
                                ? 'bg-[#191D21] border-[#70777E]'
                                : 'bg-[#15181B] border-[#30363C] hover:bg-[#191D21] hover:border-[#70777E]/50'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => handleToggleSelectItem(file.id, e)}
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-3.5 h-3.5 rounded border-[#30363C] bg-[#191D21] text-[#B7C7D8] focus:ring-0 cursor-pointer"
                                />
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleFavorite(file.id);
                                  }}
                                  className={`p-1 rounded hover:bg-[#252B31] transition-colors ${
                                    file.is_favorite ? 'text-[#D8B477]' : 'text-[#70777E] hover:text-[#ECEFF1]'
                                  }`}
                                >
                                  <Star className={`w-3.5 h-3.5 ${file.is_favorite ? 'fill-[#D8B477]' : ''}`} />
                                </button>
                              </div>

                              {/* Exact [Eye] [Folder] [•••] Action Bar */}
                              <FileRowActionBar
                                file={file}
                                activeActionId={activeActionId}
                                setActiveActionId={setActiveActionId}
                                onOpenPreview={onOpenPreview}
                                onOpenFormatModal={onOpenFormatModal}
                                onRequestDeleteFile={onRequestDeleteFile}
                              />
                            </div>

                            <div className="mb-2 flex items-center space-x-2.5">
                              <FileThumbnail file={file} />
                              <div className="flex-1 min-w-0">
                                <h4 className="text-xs font-medium text-[#ECEFF1] truncate" title={file.name}>
                                  {file.name}
                                </h4>
                                <span className="text-[10px] font-mono text-[#70777E] uppercase">
                                  {file.extension || 'file'}
                                </span>
                              </div>
                            </div>

                            {/* Simple immediate parent folder name (hidden if already grouped by folder or if folder item) */}
                            {file.path && groupBy !== 'folder' && !isFolder && (
                              <div
                                className="flex items-center space-x-1 text-[10px] text-[#858E96] font-mono truncate mb-2 px-1.5 py-0.5 rounded bg-[#101214] border border-[#252B31]"
                                title={file.path}
                              >
                                <Folder className="w-2.5 h-2.5 text-[#B7C7D8]/70 flex-shrink-0" />
                                <span className="truncate">{getSimpleFolderName(file.path, false)}</span>
                              </div>
                            )}

                            {/* Folder Interactive Nested Child Files */}
                            {isFolder && (
                              <div className="mt-2 pt-2 border-t border-[#30363C]">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-mono text-[#858E96]">
                                    {folderChildren.length} {folderChildren.length === 1 ? 'file' : 'files'}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleFolderExpand(file.id);
                                    }}
                                    className="flex items-center space-x-1 text-[10px] text-amber-400 hover:text-amber-300 font-medium px-2 py-0.5 rounded bg-[#101214] border border-[#30363C]"
                                  >
                                    <span>{isFolderExpanded ? 'Hide Files' : 'Show Files'}</span>
                                    <ChevronDown className={`w-3 h-3 transition-transform duration-150 ${isFolderExpanded ? 'rotate-180' : ''}`} />
                                  </button>
                                </div>
                                {isFolderExpanded && (
                                  <div className="mt-2 pt-2 border-t border-[#30363C]/60 max-h-48 overflow-y-auto space-y-1">
                                    {folderChildren.length > 0 ? (
                                      folderChildren.map((child) => (
                                        <div
                                          key={child.id}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            onSelectFile(child);
                                          }}
                                          onDoubleClick={(e) => {
                                            e.stopPropagation();
                                            api.openPath(child.path);
                                          }}
                                          className="flex items-center space-x-2 p-1.5 rounded hover:bg-[#252B31] transition-colors cursor-pointer bg-[#101214]/60 border border-[#252B31]"
                                        >
                                          <FileThumbnail file={child} />
                                          <div className="min-w-0 flex-1">
                                            <p className="text-xs text-[#ECEFF1] truncate" title={child.name}>{child.name}</p>
                                            <span className="text-[10px] text-[#70777E] font-mono">{formatBytes(child.size)}</span>
                                          </div>
                                        </div>
                                      ))
                                    ) : (
                                      <p className="text-[10px] text-[#70777E] italic text-center py-1">No files inside folder</p>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}

                            <div className="flex flex-wrap gap-1 mb-2 min-h-[16px]">
                              {file.tags && file.tags.length > 0 ? (
                                file.tags.map((tag) => (
                                  <span
                                    key={tag.id}
                                    className="inline-flex items-center space-x-1 text-[10px] px-1.5 py-0.2 rounded bg-[#191D21] text-[#92999F] border border-[#30363C]"
                                  >
                                    <span
                                      className="w-1.5 h-1.5 rounded-full"
                                      style={{ backgroundColor: tag.color }}
                                    />
                                    <span>{tag.name}</span>
                                  </span>
                                ))
                              ) : null}
                            </div>

                            <div className="flex items-center justify-between text-[10px] text-[#70777E] border-t border-[#30363C] pt-2 font-mono whitespace-nowrap">
                              <span>{formatBytes(file.size)}</span>
                              <span>{formatDate(file.updated_at)}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* List View (Table with Foldable Folder Rows) */
          <div className="border border-[#30363C] rounded bg-[#15181B] overflow-visible">
            <table className="w-full text-left text-xs table-fixed">
              <thead className="bg-[#101214] border-b border-[#30363C] text-[#70777E] text-[10px] uppercase font-medium">
                <tr>
                  <th className="py-2.5 px-2 w-9 text-center">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = isIndeterminate;
                      }}
                      onChange={handleToggleSelectAll}
                      className="w-3.5 h-3.5 rounded border-[#30363C] bg-[#191D21] text-[#B7C7D8] focus:ring-0 cursor-pointer"
                    />
                  </th>
                  <th className="py-2.5 px-2.5">Name</th>
                  <th className="py-2.5 px-2 w-28 lg:w-32 whitespace-nowrap">Tags</th>
                  <th className="py-2.5 px-2 w-24 text-right whitespace-nowrap">Size</th>
                  <th className="py-2.5 px-2 w-28 text-right whitespace-nowrap hidden lg:table-cell">Modified</th>
                  <th className="py-2.5 px-3 w-32 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#30363C]/60">
                {compiledGroups.map((group) => {
                  const isCollapsed = collapsedGroups.has(group.key);

                  return (
                    <React.Fragment key={group.key}>
                      {/* Collapsible Folder Row Header aligned with Table Columns */}
                      {group.isCompiled && (
                        <tr
                          onClick={() => toggleGroupCollapse(group.key)}
                          className="bg-[#121417] hover:bg-[#181B1F] border-y border-[#30363C] cursor-pointer select-none transition-colors"
                        >
                          <td className="py-2 px-2 text-center w-9">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleGroupCollapse(group.key);
                              }}
                              className="text-[#B7C7D8] p-0.5 hover:text-[#ECEFF1] transition-colors"
                            >
                              {isCollapsed ? (
                                <ChevronRight className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </td>

                          <td className="py-2 px-2.5 min-w-0 overflow-hidden">
                            <div className="flex items-center space-x-2 min-w-0">
                              <GroupHeaderIcon group={group} isCollapsed={isCollapsed} />
                              <span className="font-semibold text-xs text-[#ECEFF1] tracking-wide truncate">
                                {group.name}
                              </span>
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#191D21] border border-[#30363C] text-[#92999F] flex-shrink-0">
                                {group.files.length} {group.files.length === 1 ? 'file' : 'files'}
                              </span>
                            </div>
                          </td>

                          <td className="py-2 px-2 w-28 lg:w-32 overflow-hidden text-[10px] text-[#70777E]">
                            <span className="italic opacity-60 capitalize">{group.type || 'Folder'}</span>
                          </td>

                          <td className="py-2 px-2 w-24 text-right font-mono text-[11px] font-medium text-[#ECEFF1] whitespace-nowrap">
                            {formatBytes(group.totalSize)}
                          </td>

                          <td className="py-2 px-2 w-28 text-right font-mono text-[11px] text-[#70777E]/50 whitespace-nowrap hidden lg:table-cell">
                            —
                          </td>

                          <td className="py-2 px-3 w-32 text-right whitespace-nowrap">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleGroupCollapse(group.key);
                              }}
                              className="text-[10px] text-[#92999F] hover:text-[#ECEFF1] px-2 py-0.5 rounded bg-[#191D21] border border-[#30363C] hover:bg-[#252B31] transition-colors"
                            >
                              {isCollapsed ? 'Expand' : 'Collapse'}
                            </button>
                          </td>
                        </tr>
                      )}

                      {/* File rows (hidden when group is collapsed) */}
                      {!isCollapsed && group.files.map((file) => {
                        const isSelected = selectedFileId === file.id;
                        const isChecked = isItemChecked(file.id);
                        const isFolder = file.category === 'folder' || file.extension === 'folder';
                        const isFolderExpanded = expandedFolders.has(file.id);
                        const folderChildren = isFolder ? getFolderChildren(file.path) : [];

                        return (
                          <React.Fragment key={`${group.key}_${file.id}`}>
                            <tr
                              onClick={() => {
                                onSelectFile(file);
                                if (isFolder) {
                                  toggleFolderExpand(file.id);
                                }
                              }}
                              onDoubleClick={() => api.openPath(file.path)}
                              className={`group relative hover:bg-[#191D21] transition-colors cursor-pointer table-file-row ${
                                activeActionId === file.id ? 'z-40' : 'z-0'
                              } ${
                                isChecked
                                  ? 'bg-[#191D21] text-[#ECEFF1]'
                                  : isSelected
                                  ? 'bg-[#191D21] text-[#ECEFF1]'
                                  : 'text-[#ECEFF1]'
                              }`}
                            >
                              <td className="py-2 px-2 text-center w-9">
                                <div
                                  onClick={(e) => handleToggleSelectItem(file.id, e)}
                                  className="flex items-center justify-center cursor-pointer"
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={(e) => handleToggleSelectItem(file.id, e)}
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-3.5 h-3.5 rounded border-[#30363C] bg-[#191D21] text-[#B7C7D8] focus:ring-0 cursor-pointer"
                                  />
                                </div>
                              </td>

                              <td className="py-2 px-2.5 min-w-0 overflow-hidden">
                                {isFolder ? (
                                  <div className="flex items-center space-x-2 min-w-0 overflow-hidden">
                                    <button
                                      type="button"
                                      onClick={(e) => toggleFolderExpand(file.id, e)}
                                      className="p-1 -ml-1 text-[#858E96] hover:text-[#ECEFF1] rounded hover:bg-[#252B31] transition-transform flex-shrink-0 cursor-pointer"
                                      title={isFolderExpanded ? 'Collapse folder' : 'Expand folder to view contents'}
                                    >
                                      <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-150 ${isFolderExpanded ? 'rotate-90 text-amber-400' : 'text-[#70777E]'}`} />
                                    </button>
                                    <FileThumbnail file={file} />
                                    <div className="min-w-0 flex-1 flex items-center space-x-2">
                                      <span className="font-semibold text-xs text-[#ECEFF1] truncate" title={file.name}>
                                        {file.name}
                                      </span>
                                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#101214] border border-[#252B31] text-[#858E96] flex-shrink-0">
                                        {folderChildren.length} {folderChildren.length === 1 ? 'file' : 'files'}
                                      </span>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-center space-x-2.5 min-w-0 overflow-hidden">
                                    <FileThumbnail file={file} />
                                    <div className="min-w-0 flex-1">
                                      <span className="font-medium text-xs text-[#ECEFF1] truncate block" title={file.name}>
                                        {file.name}
                                      </span>
                                      {/* Simple immediate parent folder name (e.g. Lab_11) instead of complete path chain */}
                                      {file.path && groupBy !== 'folder' && (
                                        <div
                                          className="flex items-center space-x-1 text-[10px] text-[#70777E] font-mono truncate mt-0.5"
                                          title={file.path}
                                        >
                                          <Folder className="w-2.5 h-2.5 text-[#70777E] flex-shrink-0" />
                                          <span className="truncate">{getSimpleFolderName(file.path, false)}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </td>

                              <td className="py-2 px-2 w-28 lg:w-32 overflow-hidden">
                                <div className="flex items-center gap-1 overflow-hidden">
                                  {file.tags && file.tags.length > 0 ? (
                                    file.tags.map((tag) => (
                                      <span
                                        key={tag.id}
                                        className="text-[10px] px-1.5 py-0.2 rounded bg-[#191D21] text-[#92999F] border border-[#30363C] flex items-center space-x-1 flex-shrink-0 max-w-[85px]"
                                      >
                                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: tag.color }} />
                                        <span className="truncate">{tag.name}</span>
                                      </span>
                                    ))
                                  ) : (
                                    <span className="text-[11px] text-[#70777E]/60">—</span>
                                  )}
                                </div>
                              </td>

                              {/* Size */}
                              <td className="py-2 px-2 w-24 text-right font-mono text-[11px] text-[#92999F] whitespace-nowrap">
                                {formatBytes(file.size)}
                              </td>

                              {/* Modified */}
                              <td className="py-2 px-2 w-28 text-right font-mono text-[11px] text-[#70777E] whitespace-nowrap hidden lg:table-cell">
                                {formatDate(file.updated_at)}
                              </td>

                              {/* Actions: Exact [Eye] [Folder] [•••] matching user reference screenshot */}
                              <td className="py-2 px-3 w-32 text-right whitespace-nowrap">
                                <FileRowActionBar
                                  file={file}
                                  activeActionId={activeActionId}
                                  setActiveActionId={setActiveActionId}
                                  onOpenPreview={onOpenPreview}
                                  onOpenFormatModal={onOpenFormatModal}
                                  onRequestDeleteFile={onRequestDeleteFile}
                                />
                              </td>
                            </tr>

                            {/* Nested Child Rows when Folder is Clicked / Expanded */}
                            {isFolder && isFolderExpanded && (
                              folderChildren.length > 0 ? (
                                folderChildren.map((child) => {
                                  const isChildSelected = selectedFileId === child.id;
                                  const isChildChecked = isItemChecked(child.id);
                                  const subFolder = getSubFolderName(file.path, child.path);

                                  return (
                                    <tr
                                      key={`nested_${file.id}_${child.id}`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onSelectFile(child);
                                      }}
                                      onDoubleClick={(e) => {
                                        e.stopPropagation();
                                        api.openPath(child.path);
                                      }}
                                      className={`group relative hover:bg-[#181C20] transition-colors cursor-pointer table-file-row ${
                                        activeActionId === child.id ? 'z-40' : 'z-0'
                                      } ${
                                        isChildChecked
                                          ? 'bg-[#181C20] text-[#ECEFF1]'
                                          : isChildSelected
                                          ? 'bg-[#181C20] text-[#ECEFF1]'
                                          : 'bg-[#131518]/70 text-[#ECEFF1]'
                                      }`}
                                    >
                                      <td className="py-1.5 px-2 text-center w-9">
                                        <div
                                          onClick={(e) => handleToggleSelectItem(child.id, e)}
                                          className="flex items-center justify-center pl-2 cursor-pointer"
                                        >
                                          <input
                                            type="checkbox"
                                            checked={isChildChecked}
                                            onChange={(e) => handleToggleSelectItem(child.id, e)}
                                            onClick={(e) => e.stopPropagation()}
                                            className="w-3.5 h-3.5 rounded border-[#30363C] bg-[#191D21] text-[#B7C7D8] focus:ring-0 cursor-pointer"
                                          />
                                        </div>
                                      </td>

                                      <td className="py-1.5 px-2.5 min-w-0 overflow-hidden">
                                        <div className="flex items-center space-x-2 min-w-0 pl-6">
                                          {/* Tree branch connector line */}
                                          <div className="w-2.5 h-3 border-l-2 border-b-2 border-[#30363C]/80 rounded-bl-sm flex-shrink-0 -mt-1.5" />
                                          <FileThumbnail file={child} />
                                          <div className="min-w-0 flex-1 flex items-center space-x-2">
                                            <span className="font-medium text-xs text-[#ECEFF1] truncate" title={child.name}>
                                              {child.name}
                                            </span>
                                            {subFolder && (
                                              <span className="text-[10px] text-[#70777E] font-mono px-1 py-0.2 rounded bg-[#101214] border border-[#252B31] flex-shrink-0">
                                                {subFolder}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </td>

                                      <td className="py-1.5 px-2 w-28 lg:w-32 overflow-hidden">
                                        <div className="flex items-center gap-1 overflow-hidden">
                                          {child.tags && child.tags.length > 0 ? (
                                            child.tags.map((tag) => (
                                              <span
                                                key={tag.id}
                                                className="text-[10px] px-1.5 py-0.2 rounded bg-[#191D21] text-[#92999F] border border-[#30363C] flex items-center space-x-1 flex-shrink-0 max-w-[85px]"
                                              >
                                                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: tag.color }} />
                                                <span className="truncate">{tag.name}</span>
                                              </span>
                                            ))
                                          ) : (
                                            <span className="text-[11px] text-[#70777E]/60">—</span>
                                          )}
                                        </div>
                                      </td>

                                      <td className="py-1.5 px-2 w-24 text-right font-mono text-[11px] text-[#92999F] whitespace-nowrap">
                                        {formatBytes(child.size)}
                                      </td>

                                      <td className="py-1.5 px-2 w-28 text-right font-mono text-[11px] text-[#70777E] whitespace-nowrap hidden lg:table-cell">
                                        {formatDate(child.updated_at)}
                                      </td>

                                      <td className="py-1.5 px-3 w-32 text-right whitespace-nowrap">
                                        <FileRowActionBar
                                          file={child}
                                          activeActionId={activeActionId}
                                          setActiveActionId={setActiveActionId}
                                          onOpenPreview={onOpenPreview}
                                          onOpenFormatModal={onOpenFormatModal}
                                          onRequestDeleteFile={onRequestDeleteFile}
                                        />
                                      </td>
                                    </tr>
                                  );
                                })
                              ) : (
                                <tr key={`nested_empty_${file.id}`} className="bg-[#121417]/50">
                                  <td></td>
                                  <td colSpan="5" className="py-2 pl-8 text-xs text-[#70777E] italic">
                                    No imported files found inside this folder
                                  </td>
                                </tr>
                              )
                            )}
                          </React.Fragment>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Floating Batch Action Bar */}
      {selectedIds.size > 0 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-[#191D21] border border-[#30363C] shadow-lg rounded-md px-4 py-2 flex items-center space-x-3 z-40">
          <div className="flex items-center space-x-2 text-xs text-[#ECEFF1] pr-2 border-r border-[#30363C]">
            <span className="font-mono text-[#B7C7D8] font-semibold">{selectedIds.size}</span>
            <span>selected</span>
          </div>

          <button
            onClick={() => onRequestDeleteSelectedFiles(Array.from(selectedIds))}
            className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-[#D98282]/15 hover:bg-[#D98282]/25 text-[#D98282] border border-[#D98282]/30 text-xs font-medium transition-colors"
          >
            <Trash2 className="w-3 h-3" />
            <span>Remove ({selectedIds.size})</span>
          </button>

          <button
            onClick={handleCopySelectedPaths}
            className="flex items-center space-x-1 px-2.5 py-1 rounded bg-[#252B31] hover:bg-[#30363C] text-[#ECEFF1] text-xs font-medium border border-[#30363C] transition-colors"
          >
            <Copy className="w-3 h-3 text-[#B7C7D8]" />
            <span>Copy Paths</span>
          </button>

          <button
            onClick={() => setSelectedIds(new Set())}
            title="Deselect All (Esc)"
            className="p-1 text-[#70777E] hover:text-[#ECEFF1] transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
