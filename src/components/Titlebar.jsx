import React from 'react';
import { Plus, Info, PanelLeft } from 'lucide-react';
import { api } from '../api';

const appIcon = '/app_icon.png';

export default function Titlebar({ 
  onAddFilesClick, 
  stats, 
  onOpenAbout, 
  isFullScreen = false,
  onToggleSidebar,
}) {
  const showTrafficLightPadding = api.isElectron && !isFullScreen;

  return (
    <header 
      className="h-10 bg-[#101214] border-b border-[#30363C] flex items-center justify-between px-2.5 sm:px-3 select-none app-drag-region z-30 flex-shrink-0 relative"
    >
      {/* Left: Positioned dynamically (pl-1 in browser, pl-[76px] in Electron windowed mode beside traffic lights) */}
      <div 
        className={`flex items-center space-x-1 sm:space-x-2 transition-[padding] duration-200 ${
          showTrafficLightPadding ? 'pl-[76px]' : 'pl-0.5 sm:pl-1'
        } app-no-drag`}
        style={{ WebkitAppRegion: 'no-drag' }}
      >
        {/* Responsive Sidebar Drawer Toggle Button */}
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            onMouseDown={(e) => e.stopPropagation()}
            title="Toggle Library Sidebar"
            style={{ WebkitAppRegion: 'no-drag' }}
            className="p-1.5 rounded text-[#92999F] hover:text-[#ECEFF1] hover:bg-[#1E2328] transition-colors cursor-pointer"
          >
            <PanelLeft className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={onOpenAbout}
          onMouseDown={(e) => e.stopPropagation()}
          title="About Folio"
          style={{ WebkitAppRegion: 'no-drag' }}
          className="flex items-center space-x-2 text-left hover:opacity-85 transition-opacity py-0.5 px-1.5 rounded-lg cursor-pointer group"
        >
          {/* Crisp, Bundled App Icon */}
          <img 
            src={appIcon} 
            alt="" 
            className="w-5 h-5 object-contain select-none drop-shadow-sm" 
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
          <span className="text-xs font-semibold tracking-wide text-[#ECEFF1]">Folio</span>
        </button>
      </div>

      {/* Middle: Mathematically Centered Catalog Status Pill */}
      <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center space-x-2 px-3 py-1 rounded-full bg-[#15181B] border border-[#30363C]/80 text-xs text-[#92999F] font-mono shadow-inner pointer-events-none">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
        <span>{stats?.totalFiles || 0} files cataloged</span>
      </div>

      {/* Right: Restrained Platinum Action Button & Info */}
      <div 
        className="flex items-center space-x-1.5 sm:space-x-2 app-no-drag"
        style={{ WebkitAppRegion: 'no-drag' }}
      >
        {/* Single Unified Import Button for Files & Folders */}
        <button
          onClick={onAddFilesClick}
          onMouseDown={(e) => e.stopPropagation()}
          title="Import files or folders (⌘O)"
          style={{ WebkitAppRegion: 'no-drag' }}
          className="flex items-center space-x-1 sm:space-x-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-md bg-[#B7C7D8] text-[#101214] hover:bg-[#C8D6E5] text-xs font-semibold shadow-sm transition-all active:scale-95 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span className="hidden xs:inline">Import</span>
        </button>

        <button
          onClick={onOpenAbout}
          onMouseDown={(e) => e.stopPropagation()}
          title="About Folio"
          style={{ WebkitAppRegion: 'no-drag' }}
          className="p-1.5 rounded text-[#70777E] hover:text-[#ECEFF1] hover:bg-[#1E2328] transition-colors cursor-pointer"
        >
          <Info className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
