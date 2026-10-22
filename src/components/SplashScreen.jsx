import React, { useState, useEffect, useRef } from 'react';
import { 
  Image, Film, FileText, Code2, Music, Archive, ArrowRight
} from 'lucide-react';
const folioLogo = '/Folio_icon_dock.png';

// Realistic brushed titanium / platinum tabbed file sheets strictly designed to match the 3D Folio logo
// Accurately themed for the 6 core Folio asset categories: Images, Videos, Documents, Code & Scripts, Audio, Archives
const FILE_CARDS = [
  {
    id: 'images',
    label: 'IMAGES',
    ext: '.raw',
    icon: Image,
    tabAlign: 'left',
    zIndex: 11,
    // Cool cyan-blue rim light matching the left edge of Folio squircle
    rimGlow: '0 0 22px rgba(56, 189, 248, 0.45), 0 14px 28px -4px rgba(0, 0, 0, 0.85)',
    tabBg: 'linear-gradient(180deg, #F0F9FF 0%, #BAE6FD 50%, #38BDF8 100%)',
    textColor: '#0369A1',
    x: -125,
    y: -64,
    rot: -22,
    delay: 0,
    returnDelay: 150,
  },
  {
    id: 'videos',
    label: 'VIDEOS',
    ext: '.mov',
    icon: Film,
    tabAlign: 'left',
    zIndex: 12,
    // Deep indigo / cobalt specular highlight
    rimGlow: '0 0 24px rgba(129, 140, 248, 0.45), 0 14px 28px -4px rgba(0, 0, 0, 0.85)',
    tabBg: 'linear-gradient(180deg, #EEF2FF 0%, #C7D2FE 50%, #818CF8 100%)',
    textColor: '#3730A3',
    x: -75,
    y: -84,
    rot: -13,
    delay: 25,
    returnDelay: 110,
  },
  {
    id: 'documents',
    label: 'DOCUMENTS',
    ext: '.pdf',
    icon: FileText,
    isHero: true,
    tabAlign: 'center',
    zIndex: 14,
    // Brilliant platinum chrome specular center
    rimGlow: '0 0 28px rgba(255, 255, 255, 0.65), 0 16px 32px -4px rgba(0, 0, 0, 0.9)',
    tabBg: 'linear-gradient(180deg, #FFFFFF 0%, #E2E8F0 50%, #94A3B8 100%)',
    textColor: '#0F172A',
    x: -25,
    y: -96,
    rot: -4,
    delay: 50,
    returnDelay: 70,
  },
  {
    id: 'code',
    label: 'CODE',
    ext: '.tsx',
    icon: Code2,
    tabAlign: 'center',
    zIndex: 14,
    // Mint / Emerald platinum digital glow
    rimGlow: '0 0 24px rgba(52, 211, 153, 0.45), 0 16px 32px -4px rgba(0, 0, 0, 0.9)',
    tabBg: 'linear-gradient(180deg, #ECFDF5 0%, #A7F3D0 50%, #34D399 100%)',
    textColor: '#065F46',
    x: 25,
    y: -96,
    rot: 4,
    delay: 75,
    returnDelay: 70,
  },
  {
    id: 'audio',
    label: 'AUDIO',
    ext: '.wav',
    icon: Music,
    tabAlign: 'right',
    zIndex: 12,
    // Bronze / warm amber titanium glow
    rimGlow: '0 0 22px rgba(245, 158, 11, 0.45), 0 14px 28px -4px rgba(0, 0, 0, 0.85)',
    tabBg: 'linear-gradient(180deg, #FFFBEB 0%, #FDE68A 50%, #F59E0B 100%)',
    textColor: '#92400E',
    x: 75,
    y: -84,
    rot: 13,
    delay: 100,
    returnDelay: 110,
  },
  {
    id: 'archives',
    label: 'ARCHIVES',
    ext: '.zip',
    icon: Archive,
    tabAlign: 'right',
    zIndex: 11,
    // Golden topaz / orange rim light matching the right edge of Folio squircle
    rimGlow: '0 0 24px rgba(249, 115, 22, 0.45), 0 14px 28px -4px rgba(0, 0, 0, 0.85)',
    tabBg: 'linear-gradient(180deg, #FFF7ED 0%, #FED7AA 50%, #F97316 100%)',
    textColor: '#9A3412',
    x: 125,
    y: -64,
    rot: 22,
    delay: 125,
    returnDelay: 150,
  },
];

export default function SplashScreen({ onComplete }) {
  // Cinematic startup sequence:
  // Phase 0: Initial folder glow (0 - 250ms)
  // Phase 1: Files emerge out of Folio folder and fan out (250ms - 1200ms)
  // Phase 2: Apex hover float (1200ms - 1800ms)
  // Phase 3: Files smoothly glide back into Folio folder (1800ms - 2250ms)
  // Phase 4: Platinum progress bar completes & folder settles (2250ms - 2650ms)
  // Phase 5: Fade-out into active workspace (2650ms)
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const debugPhaseParam = searchParams ? searchParams.get('debug_splash') : null;
  const isDebug = debugPhaseParam !== null;

  const [phase, setPhase] = useState(() => (isDebug ? parseInt(debugPhaseParam, 10) || 1 : 0));
  const [progress, setProgress] = useState(() => (isDebug ? (debugPhaseParam === '2' ? 70 : 45) : 15));
  const [statusText, setStatusText] = useState(() => (isDebug ? 'Cataloging media assets...' : 'Initializing Folio...'));
  const [fading, setFading] = useState(false);
  const completedRef = useRef(false);

  const finish = () => {
    if (completedRef.current) return;
    completedRef.current = true;
    setFading(true);
    setTimeout(() => {
      onComplete();
    }, 250);
  };

  useEffect(() => {
    if (isDebug) return; // Do not auto-advance if debugging splash screen visually

    // Phase 1: Files emerge out of Folio folder
    const t1 = setTimeout(() => {
      setPhase(1);
      setProgress(40);
      setStatusText('Cataloging media assets...');
    }, 250);

    // Phase 2: Apex hover float
    const t2 = setTimeout(() => {
      setPhase(2);
      setProgress(70);
      setStatusText('Indexing document metadata...');
    }, 1200);

    // Phase 3: Files glide smoothly back into Folio folder
    const t3 = setTimeout(() => {
      setPhase(3);
      setProgress(90);
      setStatusText('Securing workspace catalog...');
    }, 1800);

    // Phase 4: Platinum progress bar completes & folder settles
    const t4 = setTimeout(() => {
      setPhase(4);
      setProgress(100);
      setStatusText('Folio ready');
    }, 2250);

    // Phase 5: Fade out and open workspace
    const t5 = setTimeout(() => {
      finish();
    }, 2650);

    // Keyboard shortcut to skip intro
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
        finish();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#101214] select-none transition-opacity duration-250 overflow-hidden ${
        fading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Background subtle radial spotlight vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(35,44,54,0.4)_0%,rgba(16,18,20,0.98)_70%)] pointer-events-none" />

      {/* Central Visual Composition */}
      <div className="relative flex flex-col items-center justify-center mb-8">
        {/* Layer 1: Ambient Backlight Halo */}
        <div className="absolute w-56 h-56 bg-[#B7C7D8]/12 rounded-full blur-3xl pointer-events-none -translate-y-4" />

        {/* Layer 2: Emerging Fan-Out & Returning Metallic File Cards */}
        <div className="relative w-28 h-28 flex items-center justify-center">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            {FILE_CARDS.map((card) => {
              const Icon = card.icon;

              // Transform & opacity mapping per phase
              let transform = 'translate3d(0, 15px, 0) scale(0.2) rotate(0deg)';
              let opacity = 0;
              let transition = 'all 450ms cubic-bezier(0.16, 1, 0.3, 1)';

              if (phase === 1) {
                // Emerging out of the Folio folder and fanning out into a crown arc
                transform = `translate3d(${card.x}px, ${card.y}px, 0) rotate(${card.rot}deg) scale(1)`;
                opacity = 1;
                transition = `all 750ms cubic-bezier(0.16, 1, 0.3, 1) ${card.delay}ms`;
              } else if (phase === 2) {
                // Gentle breathing float at apex
                transform = `translate3d(${card.x * 1.02}px, ${card.y - 4}px, 0) rotate(${card.rot}deg) scale(1.02)`;
                opacity = 1;
                transition = 'all 600ms ease-in-out';
              } else if (phase >= 3) {
                // Smoothly returning back down into the mouth of the Folio folder
                transform = `translate3d(${card.x * 0.08}px, 18px, 0) rotate(${card.rot * 0.1}deg) scale(0.22)`;
                opacity = 0;
                transition = `all 520ms cubic-bezier(0.4, 0, 0.2, 1) ${card.returnDelay}ms`;
              }

              return (
                <div
                  key={card.id}
                  style={{
                    transform,
                    opacity,
                    transition,
                    boxShadow: card.rimGlow,
                    zIndex: card.zIndex || 10,
                  }}
                  className="absolute top-0 left-0 -ml-[30px] -mt-[41px] w-[60px] h-[82px] rounded-lg border border-white/60 flex flex-col justify-between p-2 will-change-transform overflow-visible select-none backdrop-blur-md"
                >
                  {/* Brushed Platinum Sheet Background */}
                  <div 
                    className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none"
                    style={{
                      background: 'linear-gradient(165deg, #F1F5F9 0%, #CBD5E1 20%, #94A3B8 55%, #475569 90%, #334155 100%)',
                    }}
                  >
                    {/* Horizontal Brushed Satin Grain */}
                    <div 
                      className="absolute inset-0 opacity-25"
                      style={{
                        backgroundImage: 'repeating-linear-gradient(180deg, rgba(255,255,255,0.7) 0px, rgba(255,255,255,0.7) 1px, transparent 1px, transparent 3px)',
                      }}
                    />
                    {/* Metallic Specular Sweep */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-transparent to-black/35 pointer-events-none" />
                    {/* Polished Chrome Inner Bevel */}
                    <div className="absolute inset-0 rounded-lg shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.95),inset_0_-1px_2px_rgba(0,0,0,0.5)] pointer-events-none" />
                  </div>

                  {/* Top Raised Index Tab - Matching Folio Logo Folder Tabs */}
                  <div
                    className={`absolute -top-3.5 h-4 px-1.5 rounded-t-[5px] border-t border-x border-white/80 flex items-center justify-center font-sans text-[7px] font-black tracking-wider uppercase z-20 shadow-[0_-2px_6px_rgba(0,0,0,0.25)] ${
                      card.tabAlign === 'left'
                        ? 'left-1'
                        : card.tabAlign === 'right'
                        ? 'right-1'
                        : 'left-1/2 -translate-x-1/2'
                    }`}
                    style={{
                      background: card.tabBg,
                      color: card.textColor,
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.9), 0 -1px 3px rgba(0,0,0,0.2)',
                    }}
                  >
                    {card.label}
                  </div>

                  {/* Embossed Metallic Icon & File Extension Chip */}
                  <div className="relative z-10 mt-0.5 flex items-center justify-between text-slate-800">
                    <Icon className="w-3.5 h-3.5 drop-shadow-[0_1px_0_rgba(255,255,255,0.6)]" />
                    <span 
                      className="text-[6.5px] font-mono font-bold px-1 py-0.2 rounded bg-white/40 border border-white/50 text-slate-700 tracking-tight shadow-sm"
                    >
                      {card.ext}
                    </span>
                  </div>

                  {/* Custom Themed Artwork Stamped Accurately for Each File Type */}
                  {card.id === 'images' && (
                    <div className="relative z-10 w-full h-4 rounded border border-slate-700/30 bg-slate-900/10 flex items-center justify-center p-0.5 mb-0.5">
                      <div className="w-full h-full flex items-center justify-center space-x-1 opacity-70">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-700/60 shadow-[0_1px_0_rgba(255,255,255,0.4)]" />
                        <div className="h-[2px] w-5 bg-slate-700/40 rounded-full" />
                      </div>
                    </div>
                  )}

                  {card.id === 'videos' && (
                    <div className="relative z-10 w-full h-4 rounded border border-slate-700/30 bg-slate-900/10 flex items-center justify-between px-1 mb-0.5">
                      <div className="flex flex-col space-y-[2px]">
                        <div className="w-1 h-[2px] bg-slate-700/60 rounded-[1px]" />
                        <div className="w-1 h-[2px] bg-slate-700/60 rounded-[1px]" />
                      </div>
                      <div className="w-0 h-0 border-y-[3px] border-y-transparent border-l-[5px] border-l-slate-700/70" />
                      <div className="flex flex-col space-y-[2px]">
                        <div className="w-1 h-[2px] bg-slate-700/60 rounded-[1px]" />
                        <div className="w-1 h-[2px] bg-slate-700/60 rounded-[1px]" />
                      </div>
                    </div>
                  )}

                  {card.id === 'documents' && (
                    <div className="relative z-10 w-full space-y-1 mb-1">
                      <div className="h-[2px] w-full rounded-full bg-slate-700/35 shadow-[0_1px_0_rgba(255,255,255,0.6)]" />
                      <div className="h-[2px] w-4/5 rounded-full bg-slate-700/25 shadow-[0_1px_0_rgba(255,255,255,0.5)]" />
                      <div className="h-[1.5px] w-3/5 rounded-full bg-slate-700/20 shadow-[0_1px_0_rgba(255,255,255,0.4)]" />
                    </div>
                  )}

                  {card.id === 'code' && (
                    <div className="relative z-10 w-full space-y-1 mb-1">
                      <div className="h-[2px] w-3/4 rounded-full bg-slate-700/35 shadow-[0_1px_0_rgba(255,255,255,0.6)]" />
                      <div className="h-[2px] w-1/2 ml-1.5 rounded-full bg-slate-700/30 shadow-[0_1px_0_rgba(255,255,255,0.5)]" />
                      <div className="h-[1.5px] w-1/3 ml-2.5 rounded-full bg-slate-700/25 shadow-[0_1px_0_rgba(255,255,255,0.4)]" />
                    </div>
                  )}

                  {card.id === 'audio' && (
                    <div className="relative z-10 w-full h-4 flex items-end justify-center space-x-[2px] mb-1">
                      <div className="w-[2px] h-2 bg-slate-700/40 rounded-full" />
                      <div className="w-[2px] h-3.5 bg-slate-700/60 rounded-full" />
                      <div className="w-[2px] h-2.5 bg-slate-700/50 rounded-full" />
                      <div className="w-[2px] h-4 bg-slate-700/70 rounded-full" />
                      <div className="w-[2px] h-3 bg-slate-700/50 rounded-full" />
                      <div className="w-[2px] h-1.5 bg-slate-700/40 rounded-full" />
                    </div>
                  )}

                  {card.id === 'archives' && (
                    <div className="relative z-10 w-full h-4 flex items-center justify-center mb-1">
                      <div className="w-full flex items-center justify-center space-x-[2px]">
                        <div className="w-2 h-[2px] bg-slate-700/40 rounded-sm" />
                        <div className="w-1 h-3 rounded-[2px] bg-slate-700/60 shadow-sm border border-slate-600/30" />
                        <div className="w-2 h-[2px] bg-slate-700/40 rounded-sm" />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Layer 3: The 3D Folio Logo (High-Res Folder Front with Alpha Transparency) */}
          <div className="relative z-20 flex items-center justify-center pointer-events-none">
            <img
              src={folioLogo}
              alt="Folio"
              className={`w-32 h-32 object-contain drop-shadow-[0_20px_35px_rgba(0,0,0,0.75)] transition-all duration-500 ease-out select-none ${
                phase === 4
                  ? 'scale-105 drop-shadow-[0_24px_45px_rgba(183,199,216,0.35)]'
                  : phase >= 1
                  ? 'scale-100'
                  : 'scale-95 opacity-90'
              }`}
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          </div>
        </div>
      </div>

      {/* Brand Identity */}
      <div className="text-center space-y-1.5 mb-7 z-20">
        <h1 className="text-2xl font-bold tracking-[0.25em] text-[#ECEFF1] uppercase font-sans">
          Folio
        </h1>
        <p className="text-xs text-[#70777E] tracking-wider font-medium">
          Desktop File & Asset Catalog
        </p>
      </div>

      {/* Sleek Minimalist Platinum Progress Bar (No Percentage) */}
      <div className="w-60 space-y-2.5 z-20">
        <div className="h-1 w-full bg-[#191D21] rounded-full overflow-hidden border border-[#30363C] shadow-inner p-[1px]">
          <div
            className="h-full bg-gradient-to-r from-[#70777E] via-[#ECEFF1] to-[#B7C7D8] rounded-full transition-all duration-400 ease-out shadow-[0_0_12px_rgba(236,239,241,0.5)]"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Minimalist Centered Status Indicator */}
        <div className="text-center text-[10.5px] font-mono text-[#70777E] tracking-wider uppercase">
          {statusText}
        </div>
      </div>

      {/* Dedicated Skip Button (in bottom right, prevents accidental clicks) */}
      <button
        onClick={finish}
        title="Skip intro (Esc)"
        className="absolute bottom-6 right-8 flex items-center space-x-1.5 text-xs text-[#70777E] hover:text-[#ECEFF1] transition-colors py-1.5 px-3 rounded-md bg-[#191D21]/60 hover:bg-[#1E2328] border border-[#30363C]/60 cursor-pointer"
      >
        <span>Skip</span>
        <ArrowRight className="w-3 h-3" />
      </button>
    </div>
  );
}

