import React, { useState } from 'react';
import { X, Check, Pipette } from 'lucide-react';

const PRESET_COLORS = [
  // Cool & Neutrals
  '#B7C7D8', '#88A2B8', '#60A5FA', '#38BDF8', '#06B6D4', '#2DD4BF',
  // Greens & Emeralds
  '#10B981', '#34D399', '#79B89A', '#84CC16', '#EAB308', '#FBBF24',
  // Ambers & Oranges
  '#D8B477', '#FB923C', '#F97316', '#D98282', '#EF4444', '#F43F5E',
  // Pinks & Violets
  '#EC4899', '#D946EF', '#A855F7', '#818CF8', '#6366F1', '#70777E',
];

export default function TagModal({ isOpen, onClose, onCreateTag }) {
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a tag name');
      return;
    }

    try {
      await onCreateTag(name.trim(), selectedColor);
      setName('');
      setError('');
      onClose();
    } catch (err) {
      setError('A tag with this name already exists.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#15181B] border border-[#30363C] rounded-xl w-full max-w-sm overflow-hidden shadow-2xl">
        <div className="px-4 py-3 border-b border-[#30363C] flex items-center justify-between bg-[#101214]">
          <h3 className="text-xs font-semibold text-[#ECEFF1] tracking-wide">Create Tag</h3>
          <button onClick={onClose} className="text-[#70777E] hover:text-[#ECEFF1] p-1 rounded hover:bg-[#191D21] transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4 text-xs">
          <div>
            <label className="block text-[11px] font-medium text-[#92999F] mb-1">Tag Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              placeholder="e.g. Suits LA, Project Alpha, Invoices"
              autoFocus
              className="w-full bg-[#191D21] border border-[#30363C] rounded-lg px-2.5 py-1.5 text-xs text-[#ECEFF1] placeholder-[#70777E] focus:outline-none focus:border-[#B7C7D8] transition-colors"
            />
            {error && <p className="text-[11px] text-[#D98282] mt-1">{error}</p>}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-medium text-[#92999F]">Preset Palette</label>
              <span className="text-[10px] font-mono text-[#70777E]">24 shades</span>
            </div>

            {/* 24 Vibrant Spectral Colors Grid */}
            <div className="grid grid-cols-6 gap-2 p-2 rounded-lg bg-[#101214] border border-[#30363C]/80">
              {PRESET_COLORS.map((color) => {
                const isSelected = selectedColor.toLowerCase() === color.toLowerCase();
                return (
                  <button
                    type="button"
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className="w-7 h-7 rounded-full flex items-center justify-center transition-all hover:scale-110 relative border border-black/30 shadow-sm"
                    style={{ backgroundColor: color }}
                    title={color}
                  >
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-[#101214] stroke-[3.5] drop-shadow" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Full RGB Color Spectrum & Hex Input */}
          <div>
            <label className="block text-[11px] font-medium text-[#92999F] mb-1.5">
              Custom RGB Color Spectrum
            </label>
            <div className="flex items-center space-x-2.5 p-2 rounded-lg bg-[#101214] border border-[#30363C]/80">
              {/* Native System Color Picker Trigger */}
              <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-[#30363C] flex items-center justify-center cursor-pointer flex-shrink-0 group shadow-sm">
                <input
                  type="color"
                  value={selectedColor.startsWith('#') && selectedColor.length === 7 ? selectedColor : '#B7C7D8'}
                  onChange={(e) => setSelectedColor(e.target.value.toUpperCase())}
                  className="absolute -inset-2 w-12 h-12 opacity-0 cursor-pointer z-10"
                  title="Pick Any RGB Color"
                />
                <div
                  className="w-full h-full flex items-center justify-center transition-transform group-hover:scale-105"
                  style={{ backgroundColor: selectedColor }}
                >
                  <Pipette className="w-3.5 h-3.5 text-black/75 drop-shadow-sm pointer-events-none" />
                </div>
              </div>

              {/* Hex Input */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center bg-[#191D21] border border-[#30363C] rounded-md px-2 py-1 text-xs">
                  <span className="text-[#70777E] font-mono mr-1">HEX</span>
                  <input
                    type="text"
                    value={selectedColor}
                    onChange={(e) => {
                      let val = e.target.value;
                      if (!val.startsWith('#') && val.length > 0) val = '#' + val;
                      setSelectedColor(val);
                    }}
                    placeholder="#RRGGBB"
                    maxLength={9}
                    className="w-full bg-transparent text-xs font-mono text-[#ECEFF1] focus:outline-none uppercase"
                  />
                </div>
              </div>

              <span className="text-[10px] text-[#70777E] font-mono">16.7M Colors</span>
            </div>
          </div>

          {/* Live Preview */}
          <div className="p-2.5 rounded-lg bg-[#101214] border border-[#30363C]/80 flex items-center justify-between">
            <span className="text-[11px] text-[#70777E] font-medium">Preview</span>
            <span className="inline-flex items-center space-x-1.5 text-xs px-2.5 py-0.5 rounded-md bg-[#191D21] text-[#ECEFF1] border border-[#30363C] shadow-sm">
              <span
                className="w-2 h-2 rounded-full shadow-sm"
                style={{ backgroundColor: selectedColor }}
              />
              <span className="font-medium">{name.trim() || 'Custom Tag'}</span>
            </span>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[#30363C]">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#92999F] hover:text-[#ECEFF1] hover:bg-[#191D21] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-[#B7C7D8] hover:bg-[#C8D6E5] text-[#101214] transition-colors shadow-sm"
            >
              Create Tag
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
