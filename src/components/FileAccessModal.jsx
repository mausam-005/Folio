import React from 'react';
import { X, ShieldCheck, Lock, HardDrive } from 'lucide-react';

export default function FileAccessModal({ isOpen, onClose, onConfirm }) {
  if (!isOpen) return null;

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4 transition-all animate-in fade-in duration-150"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-[#15181B] border border-[#30363C] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-4 relative text-left"
      >
        {/* Close Button */}
        <div className="absolute top-4 right-4 z-20">
          <button 
            type="button"
            onClick={onClose} 
            className="text-[#70777E] hover:text-[#ECEFF1] p-1.5 rounded-lg hover:bg-[#1E2328] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Header with Icon and Badge */}
        <div className="flex items-start space-x-3.5 pt-1">
          <div className="w-10 h-10 rounded-xl bg-[#20252A] border border-[#30363C] flex items-center justify-center text-[#B7C7D8] flex-shrink-0 shadow-inner">
            <ShieldCheck className="w-5 h-5 stroke-[2]" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-semibold text-[#ECEFF1] tracking-tight">
                Local File Access Permission
              </h3>
              <span className="text-[9px] font-mono font-semibold uppercase px-1.5 py-0.5 rounded bg-[#20252A] text-[#79B89A] border border-white/5">
                Private
              </span>
            </div>
            <p className="text-xs text-[#92999F] mt-1 leading-relaxed">
              Folio is a client-side catalog organizer. Before indexing files for the first time, please grant permission to read your selected files.
            </p>
          </div>
        </div>

        {/* Security & Privacy Highlights */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="p-3 rounded-xl bg-[#101214] border border-[#30363C]/80 flex items-start space-x-2.5">
            <Lock className="w-4 h-4 text-[#B7C7D8] flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-medium text-[#ECEFF1]">100% Client-Side</div>
              <div className="text-[10px] text-[#70777E] leading-snug mt-0.5">Files stay inside your local browser sandbox</div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#101214] border border-[#30363C]/80 flex items-start space-x-2.5">
            <HardDrive className="w-4 h-4 text-[#79B89A] flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-medium text-[#ECEFF1]">Zero Remote Uploads</div>
              <div className="text-[10px] text-[#70777E] leading-snug mt-0.5">No data is ever sent to external servers</div>
            </div>
          </div>
        </div>

        {/* Explanatory note */}
        <div className="text-[11px] text-[#70777E] bg-[#101214]/60 p-2.5 rounded-lg border border-[#30363C]/40 leading-relaxed">
          This permission is requested only once. Once granted, you will not be prompted again on this device.
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-medium text-[#92999F] hover:text-[#ECEFF1] rounded-lg hover:bg-[#20252A] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-1.5 text-xs font-semibold text-[#101214] bg-[#B7C7D8] hover:bg-[#C8D6E5] active:scale-95 rounded-lg shadow-sm transition-all cursor-pointer"
          >
            Allow Access &amp; Import
          </button>
        </div>
      </div>
    </div>
  );
}
