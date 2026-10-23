import React, { useState, useEffect } from 'react';
import { 
  Files, Star, Folder, FileText, Image, Code2, Music, Video, Archive, Plus, Trash2, HardDrive
} from 'lucide-react';
import { api } from '../api';

const CATEGORIES = [
  { id: 'all', label: 'All Files', icon: Files },
  { id: 'favorites', label: 'Starred', icon: Star },
  { id: 'folder', label: 'Folders', icon: Folder },
  { id: 'document', label: 'Documents', icon: FileText },
  { id: 'image', label: 'Images & Photos', icon: Image },
  { id: 'code', label: 'Code & Scripts', icon: Code2 },
  { id: 'audio', label: 'Audio & Music', icon: Music },
  { id: 'video', label: 'Videos', icon: Video },
  { id: 'archive', label: 'Archives & Zips', icon: Archive },
];

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export default function Sidebar({
  selectedCategory,
  onSelectCategory,
  selectedTagId,
  onSelectTag,
  tags = [],
  onOpenTagModal,
  onDeleteTag,
  stats,
  categoryCounts = {},
  width = 200,
}) {
  const [diskSpace, setDiskSpace] = useState(null);

  useEffect(() => {
    let active = true;
    api.getDiskSpace().then((res) => {
      if (active && res) setDiskSpace(res);
    });
    return () => { active = false; };
  }, []);

  return (
    <aside 
      style={{ width: `${width}px` }}
      className="bg-[#15181B] border-r border-[#30363C] flex flex-col justify-between h-full select-none text-xs flex-shrink-0"
    >
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-5">
        {/* Categories Section */}
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#70777E] px-2.5 mb-1.5">
            Library
          </div>
          <nav className="space-y-0.5">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = selectedCategory === cat.id && !selectedTagId;
              const count = cat.id === 'all'
                ? (stats?.totalFiles || 0)
                : cat.id === 'favorites'
                ? (stats?.favCount || 0)
                : (categoryCounts[cat.id] || 0);

              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    onSelectTag(null);
                    onSelectCategory(cat.id);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded transition-colors text-xs ${
                    isActive
                      ? 'bg-[#191D21] text-[#ECEFF1] font-medium'
                      : 'text-[#92999F] hover:text-[#ECEFF1] hover:bg-[#191D21]/60'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                    <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-[#B7C7D8]' : 'text-[#92999F]'}`} />
                    <span className="truncate text-left">{cat.label}</span>
                  </div>
                  {count > 0 && (
                    <span className="text-[11px] font-mono text-[#70777E] flex-shrink-0 ml-1.5">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tags Section */}
        <div>
          <div className="flex items-center justify-between px-2.5 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#70777E]">
              Tags
            </span>
            <button
              onClick={onOpenTagModal}
              title="Create New Tag"
              className="text-[#70777E] hover:text-[#ECEFF1] p-0.5 rounded hover:bg-[#191D21] transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-0.5">
            {tags.length === 0 ? (
              <div className="px-2.5 py-1 text-[11px] text-[#70777E] italic">No tags</div>
            ) : (
              tags.map((tag) => {
                const isActive = selectedTagId === tag.id;
                return (
                  <div
                    key={tag.id}
                    className={`group w-full flex items-center justify-between px-2.5 py-1.5 rounded transition-colors cursor-pointer text-xs ${
                      isActive
                        ? 'bg-[#191D21] text-[#ECEFF1] font-medium'
                        : 'text-[#92999F] hover:text-[#ECEFF1] hover:bg-[#191D21]/60'
                    }`}
                    onClick={() => {
                      onSelectCategory('all');
                      onSelectTag(isActive ? null : tag.id);
                    }}
                  >
                    <div className="flex items-center space-x-2 min-w-0 flex-1">
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span className="truncate text-left">{tag.name}</span>
                    </div>

                    <div className="flex items-center space-x-1 flex-shrink-0 ml-1.5">
                      <span className="text-[11px] font-mono text-[#70777E] group-hover:hidden">
                        {tag.count || 0}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteTag(tag.id);
                        }}
                        title="Delete Tag"
                        className="hidden group-hover:block text-[#70777E] hover:text-[#D98282] p-0.5 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Disk Storage & Workspace Info Footer */}
      {api.isElectron && diskSpace ? (
        <div className="p-3 border-t border-[#30363C] bg-[#101214] select-none space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <div className="flex items-center space-x-1.5 text-[#ECEFF1] font-medium min-w-0 truncate">
              <HardDrive className="w-3.5 h-3.5 text-[#B7C7D8] flex-shrink-0" />
              <span className="truncate">{diskSpace?.diskName || 'Macintosh HD'}</span>
            </div>
            <span className="text-[10px] font-mono text-[#92999F] flex-shrink-0 ml-1">
              {formatBytes(diskSpace?.freeBytes)} free
            </span>
          </div>

          {/* Disk Usage Gauge */}
          <div className="w-full bg-[#191D21] h-1.5 rounded-full overflow-hidden border border-[#30363C]">
            <div 
              className="bg-gradient-to-r from-[#70777E] via-[#92999F] to-[#B7C7D8] h-full rounded-full transition-all duration-300"
              style={{ width: `${diskSpace?.percentUsed || 50}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] text-[#70777E] font-mono">
            <span className="truncate">{formatBytes(diskSpace?.usedBytes)} used</span>
            <span className="text-[#ECEFF1] font-semibold flex-shrink-0 ml-1">
              {stats?.totalFiles || 0} files
            </span>
          </div>
        </div>
      ) : (
        <div className="p-3 border-t border-[#30363C] bg-[#101214] select-none flex items-center justify-between text-[11px]">
          <span className="text-[#70777E]">Catalog</span>
          <span className="text-[#ECEFF1] font-mono font-medium">
            {stats?.totalFiles || 0} {stats?.totalFiles === 1 ? 'file' : 'files'}
          </span>
        </div>
      )}
    </aside>
  );
}
