import React from 'react';
import { UploadCloud } from 'lucide-react';

export default function DropZone({ isDragging }) {
  if (!isDragging) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#101214]/90 backdrop-blur-sm flex items-center justify-center border-2 border-dashed border-[#B7C7D8] m-3 rounded-lg pointer-events-none">
      <div className="flex flex-col items-center justify-center text-center p-6 space-y-3">
        <div className="w-12 h-12 rounded bg-[#191D21] border border-[#30363C] text-[#B7C7D8] flex items-center justify-center">
          <UploadCloud className="w-6 h-6 stroke-[1.75]" />
        </div>
        <h2 className="text-sm font-semibold text-[#ECEFF1]">
          Drop Files to Import into Folio
        </h2>
        <p className="text-xs text-[#70777E] max-w-xs">
          Files will be indexed locally with metadata into SQLite.
        </p>
      </div>
    </div>
  );
}
