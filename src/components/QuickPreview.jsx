import React, { useState, useEffect } from 'react';
import { X, ExternalLink, Folder, FolderOpen, Music } from 'lucide-react';
import { api } from '../api';
import { getFolioUrl } from '../utils/url';

export default function QuickPreview({ file, onClose }) {
  const [textContent, setTextContent] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!file) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    if (file.category === 'code' || file.category === 'document' || ['txt', 'md', 'json', 'js', 'jsx', 'ts', 'tsx', 'py', 'html', 'css', 'yml', 'yaml'].includes(file.extension?.toLowerCase())) {
      setLoading(true);
      api.readTextPreview(file.path)
        .then((content) => {
          setTextContent(content || 'No text preview available.');
        })
        .catch((err) => {
          setTextContent('Failed to read preview: ' + err.message);
        })
        .finally(() => setLoading(false));
    }

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [file, onClose]);

  if (!file) return null;

  const isImage = file.category === 'image';
  const isAudio = file.category === 'audio';
  const isVideo = file.category === 'video';
  const isPdf = file.extension?.toLowerCase() === 'pdf';
  const isMkv = file.extension?.toLowerCase() === 'mkv';

  const textExtensions = ['txt', 'md', 'markdown', 'json', 'js', 'jsx', 'ts', 'tsx', 'py', 'html', 'css', 'scss', 'yml', 'yaml', 'sh', 'bash', 'zsh', 'sql', 'csv', 'tsv', 'xml', 'svg', 'log', 'ini', 'env', 'conf'];
  const isTextFile = textExtensions.includes(file.extension?.toLowerCase());

  useEffect(() => {
    if (!file) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    if (isTextFile) {
      setLoading(true);
      api.readTextPreview(file.path)
        .then((content) => {
          setTextContent(content || 'No text preview available.');
        })
        .catch((err) => {
          setTextContent('Failed to read preview: ' + err.message);
        })
        .finally(() => setLoading(false));
    }

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [file, onClose, isTextFile]);

  if (!file) return null;

  return (
    <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-6">
      <div className="bg-[#15181B] border border-[#30363C] rounded-lg w-full max-w-4xl max-h-[88vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="h-11 border-b border-[#30363C] px-4 flex items-center justify-between bg-[#101214]">
          <div className="flex items-center space-x-2.5 min-w-0">
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-[#191D21] text-[#92999F] font-semibold border border-[#30363C]">
              {file.extension || file.category}
            </span>
            <h3 className="text-xs font-semibold text-[#ECEFF1] truncate" title={file.name}>
              {file.name}
            </h3>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => api.quickLook(file.path)}
              className="px-2.5 py-1 rounded bg-[#191D21] hover:bg-[#252B31] text-[#ECEFF1] text-xs font-medium border border-[#30363C] transition-colors"
              title="Open in macOS Quick Look"
            >
              Quick Look
            </button>
            <button
              onClick={() => api.openPath(file.path)}
              className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-[#B7C7D8] hover:bg-[#C8D6E5] text-[#101214] text-xs font-semibold transition-colors"
            >
              <ExternalLink className="w-3 h-3 stroke-[2.5]" />
              <span>Open in Default App</span>
            </button>
            <button
              onClick={() => api.revealInFinder(file.path)}
              className="p-1.5 rounded text-[#70777E] hover:text-[#ECEFF1] hover:bg-[#191D21] transition-colors"
              title="Reveal in Finder"
            >
              <FolderOpen className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded text-[#70777E] hover:text-[#ECEFF1] hover:bg-[#191D21] transition-colors"
              title="Close (Esc)"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Modal Preview Body */}
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-[#101214]">
          {file.category === 'folder' || file.extension === 'folder' ? (
            <div className="w-full max-w-md p-8 bg-[#15181B] border border-[#30363C] rounded-xl text-center space-y-4 shadow-xl">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-400 shadow-inner">
                <Folder className="w-8 h-8 fill-amber-400/20" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-[#ECEFF1]">{file.name}</h4>
                <p className="text-xs text-[#70777E]">Folder on disk</p>
              </div>
              <div className="flex items-center justify-center space-x-2 pt-2">
                <button
                  onClick={() => api.openPath(file.path)}
                  className="px-4 py-2 rounded-lg bg-[#B7C7D8] hover:bg-[#C8D6E5] text-[#101214] text-xs font-semibold transition-colors flex items-center space-x-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Folder</span>
                </button>
                <button
                  onClick={() => api.revealInFinder(file.path)}
                  className="px-4 py-2 rounded-lg bg-[#191D21] hover:bg-[#252B31] text-[#ECEFF1] text-xs border border-[#30363C] transition-colors flex items-center space-x-1.5"
                >
                  <FolderOpen className="w-3.5 h-3.5 text-[#92999F]" />
                  <span>Reveal in Finder</span>
                </button>
              </div>
            </div>
          ) : isImage ? (
            <div className="max-w-full max-h-[64vh] flex items-center justify-center">
              <img
                src={getFolioUrl(file.path)}
                alt={file.name}
                className="max-h-[64vh] max-w-full object-contain rounded border border-[#30363C]"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.style.display = 'none';
                }}
              />
            </div>
          ) : isPdf ? (
            <div className="w-full h-[66vh] flex flex-col rounded border border-[#30363C] overflow-hidden bg-white">
              <iframe
                src={getFolioUrl(file.path)}
                title={file.name}
                className="w-full h-full border-0"
              />
            </div>
          ) : isAudio ? (
            <div className="flex flex-col items-center justify-center p-8 space-y-4">
              <div className="w-12 h-12 rounded bg-[#191D21] text-[#B7C7D8] border border-[#30363C] flex items-center justify-center">
                <Music className="w-6 h-6" />
              </div>
              <audio controls className="w-72">
                <source src={getFolioUrl(file.path)} />
                Your browser does not support audio playback.
              </audio>
            </div>
          ) : isVideo && !isMkv ? (
            <div className="max-w-full max-h-[64vh] flex items-center justify-center">
              <video controls className="max-h-[64vh] max-w-full rounded border border-[#30363C]">
                <source src={getFolioUrl(file.path)} />
                Your browser does not support video playback.
              </video>
            </div>
          ) : isMkv ? (
            <div className="w-full max-w-md p-6 bg-[#15181B] border border-[#30363C] rounded-lg text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-[#191D21] border border-[#30363C] flex items-center justify-center mx-auto text-[#B7C7D8]">
                <ExternalLink className="w-6 h-6 text-[#B7C7D8]" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-[#ECEFF1]">{file.name}</h4>
                <p className="text-xs text-[#70777E] mt-1">
                  MKV (Matroska) containers use external system codecs. Open directly in your media player (e.g. VLC, IINA, QuickTime).
                </p>
              </div>
              <div className="flex items-center justify-center space-x-2 pt-2">
                <button
                  onClick={() => api.openPath(file.path)}
                  className="px-4 py-2 rounded bg-[#B7C7D8] hover:bg-[#C8D6E5] text-[#101214] text-xs font-semibold transition-colors"
                >
                  Play in Default Player
                </button>
                <button
                  onClick={() => api.quickLook(file.path)}
                  className="px-4 py-2 rounded bg-[#191D21] hover:bg-[#252B31] text-[#ECEFF1] text-xs border border-[#30363C] transition-colors"
                >
                  Quick Look
                </button>
              </div>
            </div>
          ) : isTextFile ? (
            <div className="w-full h-full min-h-[260px] max-h-[64vh] overflow-auto bg-[#15181B] p-4 rounded border border-[#30363C] font-mono text-xs text-[#ECEFF1] select-text">
              {loading ? (
                <div className="flex items-center justify-center h-40 text-[#70777E]">
                  Loading preview...
                </div>
              ) : (
                <pre className="whitespace-pre-wrap leading-relaxed">{textContent || 'No text preview available.'}</pre>
              )}
            </div>
          ) : (
            <div className="w-full max-w-sm p-6 bg-[#15181B] border border-[#30363C] rounded text-center space-y-3">
              <div className="text-xs text-[#ECEFF1] font-semibold">{file.name}</div>
              <p className="text-xs text-[#70777E]">Preview not directly available in viewer.</p>
              <button
                onClick={() => api.openPath(file.path)}
                className="px-3 py-1.5 rounded bg-[#B7C7D8] text-[#101214] text-xs font-semibold"
              >
                Open in Default App
              </button>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="h-9 border-t border-[#30363C] px-4 flex items-center justify-between text-xs text-[#70777E] bg-[#101214]">
          <span className="truncate max-w-md font-mono text-[11px]">{file.path}</span>
          <span className="text-[11px]">Press Esc to exit</span>
        </div>
      </div>
    </div>
  );
}
