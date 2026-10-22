import React from 'react';
import { AlertCircle, X } from 'lucide-react';

export default function ConfirmModal({
  isOpen,
  title = 'Confirm Removal',
  message = 'Are you sure you want to remove this item from the catalog?',
  confirmText = 'Remove',
  onConfirm,
  onClose,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-[#15181B] border border-[#30363C] rounded-lg w-full max-w-sm overflow-hidden shadow-2xl">
        <div className="px-5 py-3.5 border-b border-[#30363C] flex items-center justify-between bg-[#101214]">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-[#D98282]" />
            <h3 className="text-xs font-semibold text-[#ECEFF1]">{title}</h3>
          </div>
          <button onClick={onClose} className="text-[#92999F] hover:text-[#ECEFF1]">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="p-5 text-xs text-[#92999F] leading-relaxed">
          {message}
          <div className="mt-2 text-[11px] text-[#70777E]">
            Note: Files remain completely intact on your computer's disk.
          </div>
        </div>

        <div className="px-5 py-3 border-t border-[#30363C] bg-[#101214] flex items-center justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded text-xs font-medium text-[#92999F] hover:text-[#ECEFF1] hover:bg-[#191D21] transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-3.5 py-1.5 rounded text-xs font-medium bg-[#D98282]/20 hover:bg-[#D98282]/30 text-[#D98282] border border-[#D98282]/30 transition-colors"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
