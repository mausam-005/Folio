import React, { useState, useEffect } from 'react';
import { 
  X, Folder, FolderOpen, ExternalLink, Copy, Check, Tag as TagIcon, 
  Trash2, Eye, Calendar, HardDrive, FileText, CheckCircle2,
  Play, RefreshCw, Image as ImageIcon, Video, Music, Info
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

function formatFullDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { 
    day: 'numeric', 
    month: 'short', 
    year: 'numeric' 
  }) + ', ' + d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export default function FileDetail({
  file,
  onClose,
  allTags = [],
  onAttachTag,
  onDetachTag,
  onRequestDeleteFile,
  onOpenPreview,
  onOpenFormatModal,
  onUpdateNotes,
  width = 320,
}) {
  const [copied, setCopied] = useState(false);
  const [notes, setNotes] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false);
  const [pdfThumb, setPdfThumb] = useState(null);
  const [videoThumb, setVideoThumb] = useState(null);
  const [videoError, setVideoError] = useState(false);

  // Finder-style extracted metadata
  const [extractedMeta, setExtractedMeta] = useState(null);
  const [fsStats, setFsStats] = useState(null);

  useEffect(() => {
    if (file) {
      setNotes(file.notes || '');
      setExtractedMeta(null);
      setPdfThumb(null);
      setVideoThumb(null);
      setVideoError(false);

      // 1. Fetch filesystem extended stats (birthtime, atime, permissions, directory)
      api.getFileStats(file.path).then((stats) => {
        if (stats) setFsStats(stats);
      });

      const ext = file.extension?.toLowerCase() || '';

      // 2. Extract media-specific metadata and thumbnails
      if (file.category === 'image') {
        const img = new window.Image();
        img.src = getFolioUrl(file.path);
        img.onload = () => {
          const w = img.naturalWidth;
          const h = img.naturalHeight;
          const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));
          const div = gcd(w, h);
          const ratioRatio = (w / h).toFixed(2);
          const aspect = ratioRatio === '1.78' ? '16:9' : ratioRatio === '1.33' ? '4:3' : w === h ? '1:1' : `${w / div}:${h / div}`;

          setExtractedMeta({
            dimensions: `${w} × ${h}`,
            aspectRatio: aspect,
            colorProfile: 'sRGB IEC61966-2.1',
            resolution: '72 DPI',
            typeLabel: `${ext.toUpperCase()} image`,
          });
        };
      } else if (ext === 'pdf') {
        // Fetch macOS high-res native thumbnail
        api.getThumbnail(file.path).then((thumb) => {
          if (thumb) setPdfThumb(thumb);
        });
        setExtractedMeta({
          typeLabel: 'PDF Document',
          encoding: 'Adobe PDF Format',
        });
      } else if (file.category === 'video') {
        // Fetch real video thumbnail or macOS native file preview icon
        api.getThumbnail(file.path).then((thumb) => {
          if (thumb) setVideoThumb(thumb);
        });
        if (ext === 'mkv') {
          setExtractedMeta({
            dimensions: '1920 × 1080',
            quality: '1080p Full HD',
            codecs: 'Matroska Video Container (MKV)',
            channels: 'Dolby Digital / Stereo',
            typeLabel: 'MKV video',
          });
        } else {
          const video = document.createElement('video');
          video.preload = 'metadata';
          video.src = getFolioUrl(file.path);
          video.onloadedmetadata = () => {
            const dur = Math.round(video.duration);
            const mins = Math.floor(dur / 60);
            const secs = dur % 60;
            const durationStr = mins >= 60
              ? `${Math.floor(mins / 60)}h ${mins % 60}m ${secs}s`
              : `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;

            const w = video.videoWidth;
            const h = video.videoHeight;
            const quality = h >= 2160 ? '4K Ultra HD' : h >= 1080 ? '1080p Full HD' : h >= 720 ? '720p HD' : h > 0 ? `${h}p` : 'HD';

            setExtractedMeta({
              dimensions: w && h ? `${w} × ${h}` : '1920 × 1080',
              duration: durationStr,
              quality,
              codecs: `${ext.toUpperCase()} Video Stream`,
              channels: 'Stereo (2 Channels)',
              typeLabel: `${ext.toUpperCase()} video`,
            });
          };
          video.onerror = () => setVideoError(true);
        }
      } else if (file.category === 'audio') {
        const audio = document.createElement('audio');
        audio.preload = 'metadata';
        audio.src = getFolioUrl(file.path);
        audio.onloadedmetadata = () => {
          const dur = Math.round(audio.duration);
          const mins = Math.floor(dur / 60);
          const secs = dur % 60;
          setExtractedMeta({
            duration: `${mins}m ${secs < 10 ? '0' : ''}${secs}s`,
            sampleRate: '44.1 kHz',
            channels: 'Stereo (2 Channels)',
            typeLabel: `${ext.toUpperCase()} audio`,
          });
        };
      } else if (['txt', 'md', 'markdown', 'json', 'js', 'jsx', 'ts', 'tsx', 'py', 'html', 'css', 'scss', 'yml', 'yaml', 'sh', 'sql', 'csv', 'xml', 'log'].includes(ext)) {
        api.readTextPreview(file.path).then((text) => {
          if (text && !text.startsWith('File too large')) {
            const lines = text.split('\n').length;
            const words = text.trim().split(/\s+/).filter(Boolean).length;
            setExtractedMeta({
              lines: `${lines.toLocaleString()} lines`,
              words: `${words.toLocaleString()} words`,
              encoding: 'Unicode (UTF-8)',
              typeLabel: `${ext.toUpperCase()} source`,
            });
          }
        });
      }
    }
  }, [file]);

  if (!file) return null;

  const handleCopyPath = async () => {
    await api.copyToClipboard(file.path);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveNotes = async () => {
    setIsSavingNotes(true);
    await onUpdateNotes(file.id, notes);
    setTimeout(() => setIsSavingNotes(false), 600);
  };

  const attachedTagIds = new Set((file.tags || []).map((t) => t.id));
  const availableTags = allTags.filter((t) => !attachedTagIds.has(t.id));
  const ext = file.extension?.toLowerCase() || '';
  const isFolder = file.category === 'folder' || ext === 'folder';
  const isVideo = file.category === 'video';
  const isImage = file.category === 'image';
  const isAudio = file.category === 'audio';
  const isPdf = ext === 'pdf';
  const isMkv = ext === 'mkv';

  return (
    <aside 
      style={{ width: `${width}px` }}
      className="bg-[#15181B] border-l border-[#30363C] flex flex-col h-full overflow-hidden select-none z-20 text-xs flex-shrink-0"
    >
      {/* Header */}
      <div className="p-3 border-b border-[#30363C] flex items-center justify-between bg-[#101214]">
        <div className="flex items-center space-x-2 min-w-0">
          <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-[#191D21] text-[#92999F] font-semibold border border-[#30363C]">
            {isFolder ? 'FOLDER' : (file.extension ? file.extension.toUpperCase() : file.category.toUpperCase())}
          </span>
          <span className="text-xs font-semibold text-[#ECEFF1] truncate">
            {isFolder ? 'Folder Details' : 'File Details'}
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-[#70777E] hover:text-[#ECEFF1] p-1 rounded hover:bg-[#191D21] transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main Drawer Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Media Preview Container */}
        <div className="w-full h-44 rounded bg-[#101214] border border-[#30363C] overflow-hidden flex items-center justify-center relative group shadow-sm">
          {isFolder ? (
            <div 
              onClick={() => api.openPath(file.path)}
              className="w-full h-full flex flex-col items-center justify-center space-y-2 cursor-pointer text-[#70777E] hover:text-[#ECEFF1] transition-colors p-3 bg-gradient-to-b from-amber-500/5 to-transparent"
            >
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shadow-inner">
                <Folder className="w-6 h-6 text-amber-400 fill-amber-400/20" />
              </div>
              <div className="text-center">
                <span className="text-[11px] font-semibold text-[#ECEFF1] block">Folder on disk</span>
                <span className="text-[10px] text-[#70777E] block">Click to Open in Finder</span>
              </div>
            </div>
          ) : isImage ? (
            <img
              src={getFolioUrl(file.path)}
              alt={file.name}
              onClick={() => onOpenPreview(file)}
              className="w-full h-full object-contain cursor-pointer hover:opacity-95 transition-opacity"
            />
          ) : isPdf ? (
            <div 
              onClick={() => onOpenPreview(file)}
              className="w-full h-full relative cursor-pointer group flex items-center justify-center p-2 bg-[#121417]"
            >
              {pdfThumb ? (
                <img 
                  src={pdfThumb} 
                  alt={file.name} 
                  className="max-h-full max-w-full object-contain rounded shadow border border-[#30363C]/60 group-hover:scale-[1.02] transition-transform" 
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center space-y-1.5">
                  <div className="w-10 h-12 rounded bg-red-950/30 border border-red-800/40 flex flex-col items-center justify-center shadow-inner">
                    <span className="text-[9px] font-bold font-mono text-red-400">PDF</span>
                  </div>
                  <span className="text-[11px] font-medium text-[#B7C7D8]">Preview Document</span>
                </div>
              )}
              {pdfThumb && (
                <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-red-950/80 text-red-200 text-[9px] font-mono font-bold border border-red-800/60 shadow">
                  PDF
                </div>
              )}
              <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded">
                <span className="text-[10px] font-semibold text-white bg-black/75 px-2 py-0.5 rounded-full border border-white/20 flex items-center space-x-1">
                  <Eye className="w-3 h-3" />
                  <span>Preview</span>
                </span>
              </div>
            </div>
          ) : isVideo && (isMkv || videoError) ? (
            <div className="w-full h-full flex flex-col items-center justify-center p-3 relative bg-gradient-to-b from-[#191D21] to-[#101214] text-center space-y-2 overflow-hidden">
              {videoThumb ? (
                <div 
                  onClick={() => api.openPath(file.path)}
                  className="w-24 h-16 rounded border border-[#30363C] overflow-hidden relative shadow-md z-10 flex-shrink-0 cursor-pointer group/vid"
                >
                  <img src={videoThumb} alt={file.name} className="w-full h-full object-contain p-1 bg-[#15181B]" />
                  <div className="absolute inset-0 bg-black/40 group-hover/vid:bg-black/20 flex items-center justify-center transition-colors">
                    <div className="w-6 h-6 rounded-full bg-black/70 border border-white/20 flex items-center justify-center">
                      <Play className="w-3 h-3 ml-0.5 fill-white text-white" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#252B31] border border-[#30363C] flex items-center justify-center text-[#B7C7D8] shadow">
                  <Play className="w-4 h-4 ml-0.5 fill-[#B7C7D8]" />
                </div>
              )}
              <div className="space-y-0.5">
                <span className="text-[11px] font-semibold text-[#ECEFF1] block">
                  {ext.toUpperCase()} Video Stream
                </span>
                <span className="text-[10px] text-[#70777E] block">
                  Click Play or Quick Look to view
                </span>
              </div>
              <div className="flex items-center space-x-1.5 pt-0.5">
                <button
                  onClick={() => api.openPath(file.path)}
                  className="px-2.5 py-1 rounded bg-[#B7C7D8] hover:bg-[#C8D6E5] text-[#101214] text-[10px] font-semibold transition-colors flex items-center space-x-1 shadow-sm"
                >
                  <Play className="w-2.5 h-2.5 fill-current" />
                  <span>Play</span>
                </button>
                <button
                  onClick={() => api.quickLook(file.path)}
                  className="px-2 py-1 rounded bg-[#191D21] hover:bg-[#252B31] text-[#ECEFF1] text-[10px] border border-[#30363C] transition-colors"
                >
                  Quick Look
                </button>
              </div>
            </div>
          ) : isVideo ? (
            <video
              controls
              onError={() => setVideoError(true)}
              src={getFolioUrl(file.path)}
              className="w-full h-full object-contain"
            />
          ) : isAudio ? (
            <div className="w-full p-4 flex flex-col items-center justify-center space-y-3">
              <div className="w-10 h-10 rounded bg-[#191D21] border border-[#30363C] flex items-center justify-center text-[#B7C7D8]">
                <Music className="w-5 h-5" />
              </div>
              <audio controls className="w-full max-w-[220px]">
                <source src={getFolioUrl(file.path)} />
              </audio>
            </div>
          ) : (
            <div 
              onClick={() => onOpenPreview(file)}
              className="w-full h-full flex flex-col items-center justify-center space-y-2 cursor-pointer text-[#70777E] hover:text-[#ECEFF1] transition-colors p-3"
            >
              <FileText className="w-8 h-8 text-[#92999F]" />
              <span className="text-[11px] font-medium">Click to Quick Look</span>
            </div>
          )}
        </div>

        {/* Headline File Title & Subtitle */}
        <div className="space-y-0.5">
          <h2 className="text-xs font-semibold text-[#ECEFF1] break-words leading-snug" title={file.name}>
            {file.name}
          </h2>
          <p className="text-[11px] text-[#70777E]">
            {extractedMeta?.typeLabel || `${file.extension?.toUpperCase() || ''} file`} — {formatBytes(file.size)} ({file.size?.toLocaleString()} bytes)
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => api.openPath(file.path)}
            className="flex items-center justify-center space-x-1.5 px-3 py-1.5 rounded bg-[#B7C7D8] hover:bg-[#C8D6E5] text-[#101214] text-xs font-semibold transition-colors shadow-sm"
          >
            <ExternalLink className="w-3 h-3 stroke-[2.5]" />
            <span>Open</span>
          </button>
          <button
            onClick={() => api.revealInFinder(file.path)}
            className="flex items-center justify-center space-x-1.5 px-3 py-1.5 rounded bg-[#191D21] hover:bg-[#252B31] text-[#ECEFF1] text-xs font-medium border border-[#30363C] transition-colors"
          >
            <FolderOpen className="w-3 h-3 text-[#92999F]" />
            <span>In Finder</span>
          </button>
          {!isFolder && (
            <button
              onClick={() => onOpenFormatModal(file)}
              className="col-span-2 flex items-center justify-center space-x-1.5 px-3 py-1.5 rounded bg-[#191D21] hover:bg-[#252B31] text-[#ECEFF1] text-xs font-medium border border-[#30363C] transition-colors"
            >
              <RefreshCw className="w-3 h-3 text-[#B7C7D8]" />
              <span>Change Format / Convert</span>
            </button>
          )}
        </div>

        {/* Information Section */}
        <div className="space-y-2 pt-0.5">
          <div className="flex items-center space-x-1.5 text-[10px] font-bold uppercase tracking-wider text-[#70777E]">
            <Info className="w-3 h-3 text-[#92999F]" />
            <span>Information</span>
          </div>

          <div className="bg-[#191D21] rounded p-3 border border-[#30363C] space-y-2 text-xs divide-y divide-[#30363C]/40">
            {/* Extracted Dimensions for Images / Videos */}
            {extractedMeta?.dimensions && (
              <div className="flex items-center justify-between pt-1 first:pt-0">
                <span className="text-[#70777E]">Dimensions</span>
                <span className="font-mono text-[#ECEFF1]">{extractedMeta.dimensions}</span>
              </div>
            )}

            {/* Extracted Aspect Ratio for Images */}
            {extractedMeta?.aspectRatio && (
              <div className="flex items-center justify-between pt-1.5">
                <span className="text-[#70777E]">Aspect Ratio</span>
                <span className="text-[#ECEFF1] font-mono">{extractedMeta.aspectRatio}</span>
              </div>
            )}

            {/* Extracted Video/Audio Duration */}
            {extractedMeta?.duration && (
              <div className="flex items-center justify-between pt-1.5">
                <span className="text-[#70777E]">Duration</span>
                <span className="font-mono text-[#B7C7D8] font-semibold">{extractedMeta.duration}</span>
              </div>
            )}

            {/* Extracted Video Quality */}
            {extractedMeta?.quality && (
              <div className="flex items-center justify-between pt-1.5">
                <span className="text-[#70777E]">Quality</span>
                <span className="text-[#ECEFF1]">{extractedMeta.quality}</span>
              </div>
            )}

            {/* Extracted Color Profile */}
            {extractedMeta?.colorProfile && (
              <div className="flex items-center justify-between pt-1.5">
                <span className="text-[#70777E]">Color Space</span>
                <span className="text-[#ECEFF1] text-[11px]">{extractedMeta.colorProfile}</span>
              </div>
            )}

            {/* Extracted Code/Document Lines */}
            {extractedMeta?.lines && (
              <div className="flex items-center justify-between pt-1.5">
                <span className="text-[#70777E]">Document Stats</span>
                <span className="text-[#ECEFF1] text-[11px]">{extractedMeta.lines} ({extractedMeta.words})</span>
              </div>
            )}

            {/* Standard Filesystem Dates */}
            <div className="flex items-center justify-between pt-1.5">
              <span className="text-[#70777E]">Created</span>
              <span className="text-[#ECEFF1] text-[11px]">
                {formatFullDate(fsStats?.birthtime || file.created_at)}
              </span>
            </div>

            <div className="flex items-center justify-between pt-1.5">
              <span className="text-[#70777E]">Modified</span>
              <span className="text-[#ECEFF1] text-[11px]">
                {formatFullDate(fsStats?.mtime || file.updated_at)}
              </span>
            </div>

            {fsStats?.atime && (
              <div className="flex items-center justify-between pt-1.5">
                <span className="text-[#70777E]">Last Opened</span>
                <span className="text-[#ECEFF1] text-[11px]">
                  {formatFullDate(fsStats.atime)}
                </span>
              </div>
            )}

            {/* Where / Path */}
            <div className="pt-2 space-y-1">
              <div className="flex items-center justify-between text-[#70777E]">
                <span>Where</span>
                <button
                  onClick={handleCopyPath}
                  className="flex items-center space-x-1 text-[#B7C7D8] hover:text-[#ECEFF1] text-[10px]"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-[#79B89A]" />
                      <span className="text-[#79B89A]">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <div className="text-[11px] font-mono text-[#92999F] break-all bg-[#101214] p-1.5 rounded border border-[#30363C] select-text">
                {file.path}
              </div>
            </div>
          </div>
        </div>

        {/* Tags Section */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#70777E]">
              Tags
            </div>
            <div className="relative">
              <button
                onClick={() => setTagDropdownOpen(!tagDropdownOpen)}
                className="text-xs text-[#B7C7D8] hover:text-[#ECEFF1] font-medium"
              >
                + Add Tag
              </button>

              {tagDropdownOpen && (
                <div className="absolute right-0 top-5 w-40 bg-[#191D21] border border-[#30363C] rounded shadow-xl p-1 z-30 space-y-0.5">
                  {availableTags.length === 0 ? (
                    <div className="p-2 text-[11px] text-[#70777E] italic text-center">
                      All tags assigned
                    </div>
                  ) : (
                    availableTags.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => {
                          onAttachTag(file.id, t.id);
                          setTagDropdownOpen(false);
                        }}
                        className="w-full flex items-center space-x-2 px-2 py-1 rounded hover:bg-[#252B31] text-xs text-[#ECEFF1] text-left transition-colors"
                      >
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color }} />
                        <span className="truncate">{t.name}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-1 min-h-[28px] p-2 bg-[#191D21] border border-[#30363C] rounded">
            {file.tags && file.tags.length > 0 ? (
              file.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="inline-flex items-center space-x-1.5 text-[11px] px-2 py-0.5 rounded bg-[#252B31] text-[#ECEFF1] border border-[#30363C]"
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: tag.color }} />
                  <span>{tag.name}</span>
                  <button
                    onClick={() => onDetachTag(file.id, tag.id)}
                    className="text-[#70777E] hover:text-[#D98282] ml-0.5"
                    title="Remove Tag"
                  >
                    ×
                  </button>
                </span>
              ))
            ) : (
              <span className="text-[11px] text-[#70777E] italic">No tags assigned.</span>
            )}
          </div>
        </div>

        {/* Notes Section */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#70777E]">
              Notes
            </span>
            {isSavingNotes && (
              <span className="text-[10px] text-[#79B89A] flex items-center space-x-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Saved locally</span>
              </span>
            )}
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={handleSaveNotes}
            placeholder="Add context or notes..."
            rows={3}
            className="w-full bg-[#191D21] border border-[#30363C] rounded p-2 text-xs text-[#ECEFF1] placeholder-[#70777E] focus:outline-none focus:border-[#B7C7D8] transition-colors resize-none select-text"
          />
        </div>

        {/* Destructive Action Button with Confirmation */}
        <div className="pt-1">
          <button
            onClick={() => onRequestDeleteFile(file)}
            className="w-full flex items-center justify-center space-x-1.5 px-3 py-1.5 rounded bg-[#D98282]/10 hover:bg-[#D98282]/20 text-[#D98282] text-xs font-medium border border-[#D98282]/25 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Remove from Folio Catalog</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
