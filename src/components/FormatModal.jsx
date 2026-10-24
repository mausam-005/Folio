import React, { useState } from 'react';
import { 
  X, 
  RefreshCw, 
  Folder, 
  ExternalLink, 
  CheckCircle2, 
  AlertTriangle, 
  Save, 
  FileText, 
  Image as ImageIcon, 
  Code as CodeIcon, 
  Video as VideoIcon, 
  Music as MusicIcon,
  Check
} from 'lucide-react';
import { api } from '../api';
import { getFolioUrl } from '../utils/url';
import { FORMAT_PRESETS, convertImage, convertTextDocument } from '../utils/formatConverter';

export default function FormatModal({ file, isOpen, onClose, onConverted }) {
  const currentExt = (file?.extension || '').toLowerCase().replace(/^\./, '');
  const initialCategory = file?.category && FORMAT_PRESETS[file.category] ? file.category : 'document';
  
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [selectedExt, setSelectedExt] = useState('');
  const [customExt, setCustomExt] = useState('');
  const [saveMode, setSaveMode] = useState('new_copy'); // 'new_copy' | 'custom' | 'inplace'
  const [customSavePath, setCustomSavePath] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [successResult, setSuccessResult] = useState(null);

  if (!isOpen || !file) return null;

  const targetExt = (customExt ? customExt.replace(/^\./, '') : selectedExt).toLowerCase();
  const presets = FORMAT_PRESETS[activeCategory] || FORMAT_PRESETS.document;

  const isImageReencode = 
    file.category === 'image' && 
    ['png', 'jpg', 'jpeg', 'webp', 'avif', 'bmp'].includes(targetExt);

  const isDataTransform = 
    (currentExt === 'json' && ['csv', 'tsv', 'txt'].includes(targetExt)) ||
    (currentExt === 'csv' && ['json', 'tsv', 'txt'].includes(targetExt)) ||
    (currentExt === 'tsv' && ['json', 'csv', 'txt'].includes(targetExt)) ||
    (currentExt === 'md' && ['html', 'txt'].includes(targetExt)) ||
    (currentExt === 'html' && ['md', 'txt'].includes(targetExt));

  const handlePickCustomDestination = async () => {
    try {
      setError('');
      const baseName = file.name ? file.name.replace(/\.[^/.]+$/, '') : 'converted_file';
      const cleanExt = targetExt || currentExt || 'file';
      const suggestedName = `${baseName}.${cleanExt}`;

      const pickedPath = await api.showSaveDialog({
        title: 'Choose Save Location for Converted File',
        defaultPath: suggestedName,
      });

      if (pickedPath) {
        setCustomSavePath(pickedPath);
        setSaveMode('custom');
      }
    } catch (err) {
      console.warn('Failed to pick save destination:', err);
    }
  };

  const handleConvert = async () => {
    if (!targetExt) {
      setError('Please select or specify a target format.');
      return;
    }
    if (targetExt === currentExt && saveMode === 'inplace') {
      setError(`File is already in .${currentExt} format.`);
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      let dataBase64 = null;
      let textContent = null;

      // 1. Canvas Image Re-encoding
      if (isImageReencode) {
        try {
          dataBase64 = await convertImage(getFolioUrl(file.path), targetExt);
        } catch (e) {
          console.warn('Canvas re-encoding error, falling back to direct export:', e);
        }
      }

      // 2. Structured Data / Document Transformation
      if (isDataTransform) {
        try {
          let rawText = await api.readFullText(file.path);
          if (!rawText && typeof window !== 'undefined') {
            // Fallback: fetch content via url if available
            const res = await fetch(getFolioUrl(file.path));
            rawText = await res.text();
          }
          if (rawText) {
            textContent = convertTextDocument(rawText, currentExt, targetExt);
          }
        } catch (e) {
          console.warn('Text transform read error, falling back:', e);
        }
      }

      const inPlace = saveMode === 'inplace';
      const destinationPath = saveMode === 'custom' && customSavePath ? customSavePath : null;

      const result = await api.changeFormat({
        fileId: file.id,
        oldPath: file.path,
        newExtension: targetExt,
        inPlace,
        destinationPath,
        dataBase64,
        textContent,
      });

      if (!result || result.success === false) {
        throw new Error(result?.error || 'Failed to convert file format.');
      }

      const finalPath = result.path || destinationPath || file.path;

      // Trigger Folio refresh immediately so the new/updated file appears in library
      if (typeof onConverted === 'function') {
        onConverted();
      }

      // Notify system
      api.showNotification(
        'Format Converted',
        `Successfully converted "${file.name}" to .${targetExt}`
      );

      // Transition to Success Screen
      setSuccessResult({
        name: finalPath.split('/').pop(),
        path: finalPath,
        extension: targetExt,
        isNew: result.isNew,
      });
    } catch (err) {
      setError(err.message || 'Unknown error occurred while changing format.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRevealInFinder = async () => {
    if (successResult?.path) {
      await api.revealInFinder(successResult.path);
    }
  };

  const handleOpenFile = async () => {
    if (successResult?.path) {
      await api.openPath(successResult.path);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#15181B] border border-[#30363C] rounded-xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-[#30363C] flex items-center justify-between bg-[#101214]">
          <div className="flex items-center space-x-2">
            <RefreshCw className="w-4 h-4 text-[#B7C7D8]" />
            <h3 className="text-sm font-semibold text-[#ECEFF1]">Change File Format</h3>
          </div>
          <button 
            onClick={onClose}
            className="text-[#92999F] hover:text-[#ECEFF1] p-1 rounded-md hover:bg-[#191D21] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto custom-scrollbar flex-1 text-xs">
          {successResult ? (
            /* ================= SUCCESS VIEW ================= */
            <div className="py-4 space-y-5 text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-[#4E9F76]/15 border border-[#4E9F76]/30 flex items-center justify-center text-[#4E9F76]">
                <CheckCircle2 className="w-7 h-7" />
              </div>

              <div>
                <h4 className="text-base font-semibold text-[#ECEFF1]">Conversion Complete</h4>
                <p className="text-xs text-[#92999F] mt-1">
                  File format was successfully converted and cataloged in Folio.
                </p>
              </div>

              {/* Converted File Card */}
              <div className="p-3.5 bg-[#191D21] border border-[#30363C] rounded-lg text-left space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[#70777E]">Converted File</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#4E9F76]/20 text-[#4E9F76] border border-[#4E9F76]/30 uppercase font-semibold">
                    .{successResult.extension}
                  </span>
                </div>
                <div className="text-xs font-medium text-[#ECEFF1] truncate">{successResult.name}</div>
                <div className="text-[11px] font-mono text-[#92999F] break-all bg-[#101214] p-2 rounded border border-[#30363C]/60 select-all">
                  {successResult.path}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={handleRevealInFinder}
                  className="px-4 py-2 rounded-lg text-xs font-medium bg-[#191D21] border border-[#30363C] text-[#ECEFF1] hover:border-[#B7C7D8] hover:text-[#B7C7D8] transition-colors flex items-center justify-center space-x-2"
                >
                  <Folder className="w-4 h-4" />
                  <span>Reveal in Finder</span>
                </button>
                <button
                  type="button"
                  onClick={handleOpenFile}
                  className="px-4 py-2 rounded-lg text-xs font-medium bg-[#191D21] border border-[#30363C] text-[#ECEFF1] hover:border-[#B7C7D8] hover:text-[#B7C7D8] transition-colors flex items-center justify-center space-x-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Open File</span>
                </button>
              </div>
            </div>
          ) : (
            /* ================= CONVERSION CONFIG VIEW ================= */
            <>
              {/* Target File Summary */}
              <div className="p-3.5 bg-[#191D21] border border-[#30363C] rounded-lg space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[#70777E]">Source File</span>
                  <span className="text-[11px] font-mono text-[#92999F]">
                    Current: .{currentExt || 'none'}
                  </span>
                </div>
                <div className="text-xs font-medium text-[#ECEFF1] truncate">{file.name}</div>
                <div className="text-[11px] text-[#70777E] truncate font-mono">{file.path}</div>
              </div>

              {/* Format Category Tabs */}
              <div>
                <label className="block text-xs font-medium text-[#92999F] mb-1.5">
                  Select Format Category
                </label>
                <div className="grid grid-cols-5 gap-1.5 p-1 bg-[#101214] border border-[#30363C] rounded-lg">
                  {[
                    { key: 'image', label: 'Images', icon: ImageIcon },
                    { key: 'document', label: 'Docs', icon: FileText },
                    { key: 'code', label: 'Code', icon: CodeIcon },
                    { key: 'video', label: 'Video', icon: VideoIcon },
                    { key: 'audio', label: 'Audio', icon: MusicIcon },
                  ].map((cat) => {
                    const Icon = cat.icon;
                    const isActive = activeCategory === cat.key;
                    return (
                      <button
                        key={cat.key}
                        type="button"
                        onClick={() => {
                          setActiveCategory(cat.key);
                          setError('');
                        }}
                        className={`flex items-center justify-center space-x-1.5 py-1.5 rounded-md text-[11px] font-medium transition-colors ${
                          isActive
                            ? 'bg-[#B7C7D8] text-[#101214] font-semibold'
                            : 'text-[#92999F] hover:text-[#ECEFF1] hover:bg-[#191D21]'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Common Format Grid */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-[#92999F]">
                    Target Extensions
                  </label>
                  {isImageReencode && (
                    <span className="text-[10px] text-[#4E9F76] font-medium">
                      Canvas Re-encoded
                    </span>
                  )}
                  {isDataTransform && (
                    <span className="text-[10px] text-[#4E9F76] font-medium">
                      Structured Data Transform
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {presets.map((item) => {
                    const isSelected = targetExt === item.ext;
                    const isCurrent = currentExt === item.ext;
                    return (
                      <button
                        key={item.ext}
                        type="button"
                        onClick={() => {
                          setSelectedExt(item.ext);
                          setCustomExt('');
                          setError('');
                        }}
                        className={`p-2 rounded-lg text-left border transition-all ${
                          isSelected
                            ? 'bg-[#B7C7D8]/15 border-[#B7C7D8] text-[#ECEFF1] shadow-sm'
                            : 'bg-[#191D21] border-[#30363C] text-[#ECEFF1] hover:border-[#70777E]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-semibold text-xs uppercase">
                            .{item.ext}
                          </span>
                          {isCurrent && (
                            <span className="text-[9px] text-[#70777E] uppercase">Current</span>
                          )}
                          {isSelected && !isCurrent && (
                            <Check className="w-3.5 h-3.5 text-[#B7C7D8]" />
                          )}
                        </div>
                        <div className="text-[10px] text-[#92999F] truncate mt-0.5">
                          {item.desc}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Extension Input */}
              <div>
                <label className="block text-xs font-medium text-[#92999F] mb-1">
                  Or Custom Extension
                </label>
                <input
                  type="text"
                  value={customExt}
                  onChange={(e) => {
                    setCustomExt(e.target.value);
                    setSelectedExt('');
                    setError('');
                  }}
                  placeholder="e.g. webp, avif, csv, json, md, py"
                  className="w-full bg-[#191D21] border border-[#30363C] rounded-lg px-3 py-1.5 text-xs text-[#ECEFF1] placeholder-[#70777E] focus:outline-none focus:border-[#B7C7D8]"
                />
              </div>

              {/* Save Destination Position */}
              <div className="p-3.5 bg-[#191D21] border border-[#30363C] rounded-lg space-y-2.5">
                <label className="block text-xs font-medium text-[#ECEFF1]">
                  Save Destination
                </label>

                <div className="space-y-2">
                  {/* Mode 1: New copy in same directory */}
                  <label className="flex items-start space-x-2.5 cursor-pointer">
                    <input
                      type="radio"
                      name="saveMode"
                      value="new_copy"
                      checked={saveMode === 'new_copy'}
                      onChange={() => setSaveMode('new_copy')}
                      className="mt-0.5 text-[#B7C7D8] focus:ring-0 bg-[#101214] border-[#30363C]"
                    />
                    <div>
                      <div className="text-xs text-[#ECEFF1] font-medium">Save as new file in same directory</div>
                      <div className="text-[11px] text-[#70777E]">Preserves the original file untouched and saves a converted copy.</div>
                    </div>
                  </label>

                  {/* Mode 2: Custom chosen location */}
                  <label className="flex items-start space-x-2.5 cursor-pointer">
                    <input
                      type="radio"
                      name="saveMode"
                      value="custom"
                      checked={saveMode === 'custom'}
                      onChange={() => setSaveMode('custom')}
                      className="mt-0.5 text-[#B7C7D8] focus:ring-0 bg-[#101214] border-[#30363C]"
                    />
                    <div className="flex-1">
                      <div className="text-xs text-[#ECEFF1] font-medium flex items-center justify-between">
                        <span>Choose custom save location</span>
                        <button
                          type="button"
                          onClick={handlePickCustomDestination}
                          className="px-2.5 py-0.5 rounded text-[11px] font-medium bg-[#101214] border border-[#30363C] text-[#B7C7D8] hover:border-[#B7C7D8] transition-colors"
                        >
                          Browse...
                        </button>
                      </div>
                      <div className="text-[11px] text-[#70777E] mt-0.5">
                        {customSavePath ? (
                          <span className="text-[#ECEFF1] font-mono break-all">{customSavePath}</span>
                        ) : (
                          'Pick any destination folder on your Mac or system.'
                        )}
                      </div>
                    </div>
                  </label>

                  {/* Mode 3: In-place replace */}
                  <label className="flex items-start space-x-2.5 cursor-pointer pt-1 border-t border-[#30363C]/60">
                    <input
                      type="radio"
                      name="saveMode"
                      value="inplace"
                      checked={saveMode === 'inplace'}
                      onChange={() => setSaveMode('inplace')}
                      className="mt-0.5 text-[#B7C7D8] focus:ring-0 bg-[#101214] border-[#30363C]"
                    />
                    <div>
                      <div className="text-xs text-[#ECEFF1] font-medium">Modify original file in-place</div>
                      <div className="text-[11px] text-[#D98282]">Overwrites and updates original file directly on disk.</div>
                    </div>
                  </label>
                </div>
              </div>

              {error && (
                <div className="flex items-center space-x-2 text-xs text-[#D98282] p-2.5 bg-[#D98282]/10 border border-[#D98282]/20 rounded-lg">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 border-t border-[#30363C] bg-[#101214] flex items-center justify-end space-x-2">
          {successResult ? (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-[#B7C7D8] hover:bg-[#C8D6E5] text-[#101214] transition-colors"
            >
              Done
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                disabled={isProcessing}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#92999F] hover:text-[#ECEFF1] hover:bg-[#191D21] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConvert}
                disabled={isProcessing || !targetExt}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-[#B7C7D8] hover:bg-[#C8D6E5] text-[#101214] disabled:opacity-50 transition-colors flex items-center space-x-1.5"
              >
                {isProcessing && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>
                  {isProcessing
                    ? 'Converting...'
                    : saveMode === 'inplace'
                    ? 'Change Format In-Place'
                    : `Export as .${targetExt || 'format'}`}
                </span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
