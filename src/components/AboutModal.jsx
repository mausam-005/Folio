import React from 'react';
import { X, Database, Zap, Tag, ShieldCheck } from 'lucide-react';
const folioLogo = '/Folio_icon_dock.png';

export default function AboutModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4 transition-all"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-[#15181B] border border-[#30363C] rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl p-6 text-center space-y-4 relative"
      >
        {/* Close Button */}
        <div className="absolute top-3.5 right-3.5 z-20">
          <button 
            onClick={onClose} 
            className="text-[#70777E] hover:text-[#ECEFF1] p-1.5 rounded-lg hover:bg-[#1E2328] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Ambient Glow & Center Logo */}
        <div className="relative flex flex-col items-center pt-1">
          <div className="absolute top-6 w-24 h-24 bg-[#B7C7D8]/15 rounded-full blur-2xl pointer-events-none" />
          <img
            src={folioLogo}
            alt=""
            className="w-20 h-20 object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.6)] relative z-10 transition-transform hover:scale-105 duration-300 select-none"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />

          <div className="flex items-center space-x-2 mt-3">
            <h2 className="text-lg font-bold text-[#ECEFF1] tracking-tight">Folio</h2>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-[#20252A] text-[#B7C7D8] border border-white/10 shadow-sm">
              v1.0.0
            </span>
          </div>
          <span className="text-[11px] text-[#70777E] mt-0.5 font-medium">
            Desktop Asset & Media Tagging Organizer
          </span>
        </div>

        {/* Feature Specs Matrix (2x2 Grid) */}
        <div className="grid grid-cols-2 gap-2 text-left pt-1">
          <div className="p-2.5 rounded-xl bg-[#101214] border border-[#30363C]/80 flex items-center space-x-2">
            <Database className="w-3.5 h-3.5 text-[#B7C7D8] flex-shrink-0" />
            <div className="min-w-0">
              <div className="text-[11px] font-medium text-[#ECEFF1] truncate">SQLite Engine</div>
              <div className="text-[9px] font-mono text-[#70777E]">Instant persistence</div>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-[#101214] border border-[#30363C]/80 flex items-center space-x-2">
            <Zap className="w-3.5 h-3.5 text-[#D8B477] flex-shrink-0" />
            <div className="min-w-0">
              <div className="text-[11px] font-medium text-[#ECEFF1] truncate">Native IPC</div>
              <div className="text-[9px] font-mono text-[#70777E]">Sub-millisecond shell</div>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-[#101214] border border-[#30363C]/80 flex items-center space-x-2">
            <Tag className="w-3.5 h-3.5 text-[#79B89A] flex-shrink-0" />
            <div className="min-w-0">
              <div className="text-[11px] font-medium text-[#ECEFF1] truncate">Custom Tagging</div>
              <div className="text-[9px] font-mono text-[#70777E]">16.7M RGB colors</div>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-[#101214] border border-[#30363C]/80 flex items-center space-x-2">
            <ShieldCheck className="w-3.5 h-3.5 text-[#818CF8] flex-shrink-0" />
            <div className="min-w-0">
              <div className="text-[11px] font-medium text-[#ECEFF1] truncate">Private & Offline</div>
              <div className="text-[9px] font-mono text-[#70777E]">Zero tracking</div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            onClick={onClose}
            className="w-full py-2 rounded-xl text-xs font-semibold bg-[#B7C7D8] text-[#101214] hover:bg-[#C8D6E5] active:scale-[0.98] transition-all shadow-md font-sans"
          >
            Done
          </button>
        </div>

        {/* macOS Silicon Tagline */}
        <div className="text-[10px] text-[#70777E]/80 font-mono tracking-wider pt-0.5">
          Engineered for macOS Apple Silicon
        </div>
      </div>
    </div>
  );
}
