import React, { useState } from 'react';
import { X, RefreshCw, FileText, Image, Video, Music, Check, AlertTriangle } from 'lucide-react';
import { api } from '../api';
import { getFolioUrl } from '../utils/url';

const PRESET_CONVERSIONS = {
  image: ['png', 'jpg', 'webp'],
  video: ['mp4', 'mkv', 'mov', 'webm'],
  audio: ['mp3', 'wav', 'm4a', 'ogg'],
  document: ['md', 'txt', 'json', 'html'],
  code: ['ts', 'js', 'tsx', 'jsx', 'json'],
};

export default function FormatModal({ file, isOpen, onClose, onConverted }) {
  const [selectedExt, setSelectedExt] = useState('');
  const [customExt, setCustomExt] = useState('');
  const [inPlace, setInPlace] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !file) return null;

  const currentExt = (file.extension || '').toLowerCase();
  const presets = PRESET_CONVERSIONS[file.category] || ['png', 'jpg', 'txt', 'mp4'];
  const targetExt = customExt ? customExt.replace(/^\./, '').toLowerCase() : selectedExt;

  const handleConvert = async () => {
    if (!targetExt) {
      setError('Please select or specify a target format.');
      return;
    }
    if (targetExt === currentExt) {
      setError(`File is already in .${currentExt} format.`);
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      let dataBase64 = null;

      // If it's an image and target is png/jpg/webp, do in-browser canvas re-encoding
      if (file.category === 'image' && ['png', 'jpg', 'jpeg', 'webp'].includes(targetExt)) {
        dataBase64 = await new Promise((resolve, reject) => {
          const img = new window.Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);

            let mimeType = 'image/png';
            if (targetExt === 'jpg' || targetExt === 'jpeg') mimeType = 'image/jpeg';
            if (targetExt === 'webp') mimeType = 'image/webp';

            const dataUrl = canvas.toDataURL(mimeType, 0.95);
            resolve(dataUrl);
          };
          img.onerror = () => reject(new Error('Failed to load image for canvas encoding.'));
          img.src = getFolioUrl(file.path);
        }).catch((e) => {
          console.warn('Canvas encode fallback to direct rename:', e);
          return null;
        });
      }

      await api.changeFormat({
        fileId: file.id,
        oldPath: file.path,
        newExtension: targetExt,
        inPlace,
        dataBase64,
      });

      api.showNotification('Format Updated', `Converted "${file.name}" to .${targetExt}`);
      onConverted();
      onClose();
    } catch (err) {
      setError('Failed to change format: ' + (err.message || 'Unknown error'));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-[#15181B] border border-[#30363C] rounded-lg w-full max-w-md overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-[#30363C] flex items-center justify-between bg-[#101214]">
          <h3 className="text-sm font-semibold text-[#ECEFF1]">Change File Format</h3>
          <button 
            onClick={onClose}
            className="text-[#92999F] hover:text-[#ECEFF1] p-1 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 text-xs">
          {/* File summary */}
          <div className="p-3 bg-[#191D21] border border-[#30363C] rounded-md space-y-1">
            <div className="text-[11px] text-[#70777E]">Target File</div>
            <div className="text-xs font-medium text-[#ECEFF1] truncate">{file.name}</div>
            <div className="text-[11px] font-mono text-[#92999F]">Current Extension: .{currentExt || 'none'}</div>
          </div>

          {/* Quick presets */}
          <div>
            <label className="block text-xs font-medium text-[#92999F] mb-2">
              Common Formats
            </label>
            <div className="flex flex-wrap gap-2">
              {presets.map((ext) => (
                <button
                  key={ext}
                  type="button"
                  onClick={() => {
                    setSelectedExt(ext);
                    setCustomExt('');
                    setError('');
                  }}
                  className={`px-3 py-1.5 rounded text-xs font-mono transition-colors border ${
                    targetExt === ext
                      ? 'bg-[#B7C7D8] text-[#101214] border-[#B7C7D8] font-semibold'
                      : 'bg-[#191D21] text-[#ECEFF1] border-[#30363C] hover:border-[#70777E]'
                  }`}
                >
                  .{ext}
                </button>
              ))}
            </div>
          </div>

          {/* Custom extension */}
          <div>
            <label className="block text-xs font-medium text-[#92999F] mb-1.5">
              Custom Extension
            </label>
            <input
              type="text"
              value={customExt}
              onChange={(e) => {
                setCustomExt(e.target.value);
                setSelectedExt('');
                setError('');
              }}
              placeholder="e.g. mp4, webp, csv, py"
              className="w-full bg-[#191D21] border border-[#30363C] rounded px-3 py-1.5 text-xs text-[#ECEFF1] placeholder-[#70777E] focus:outline-none focus:border-[#B7C7D8]"
            />
          </div>

          {/* In-place option */}
          <div className="flex items-center space-x-2 pt-1">
            <input
              type="checkbox"
              id="inplace"
              checked={inPlace}
              onChange={(e) => setInPlace(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-[#30363C] bg-[#191D21] text-[#B7C7D8] focus:ring-0 cursor-pointer"
            />
            <label htmlFor="inplace" className="text-xs text-[#92999F] cursor-pointer">
              Modify file in-place (replaces original extension on disk)
            </label>
          </div>

          {error && (
            <div className="flex items-center space-x-2 text-xs text-[#D98282] p-2 bg-[#D98282]/10 border border-[#D98282]/20 rounded">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-[#30363C] bg-[#101214] flex items-center justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-3 py-1.5 rounded text-xs font-medium text-[#92999F] hover:text-[#ECEFF1] hover:bg-[#191D21] transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConvert}
            disabled={isProcessing || !targetExt}
            className="px-4 py-1.5 rounded text-xs font-semibold bg-[#B7C7D8] hover:bg-[#C8D6E5] text-[#101214] disabled:opacity-50 transition-colors flex items-center space-x-1.5"
          >
            {isProcessing && <RefreshCw className="w-3 h-3 animate-spin" />}
            <span>{isProcessing ? 'Updating...' : inPlace ? 'Change Format' : 'Export as New Format'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
