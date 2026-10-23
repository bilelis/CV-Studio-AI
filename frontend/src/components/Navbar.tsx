import React, { useState, useEffect } from 'react';
import { ShieldCheck, Cpu, AlertTriangle, Maximize2, Minimize2 } from 'lucide-react';
import type { HealthResponse } from '../types';

interface NavbarProps {
  health: HealthResponse | null;
  loading: boolean;
  currentStep?: number;
  onReset?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ health, loading, onReset }) => {
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.warn('Fullscreen error:', err);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-[#090B0E]/95 backdrop-blur-md border-b border-white/8 px-4 sm:px-6 lg:px-8 py-2.5 shadow-[0_4px_20px_rgba(0,0,0,0.6)]">
      <div className="w-full flex items-center justify-between gap-4">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="relative group cursor-pointer" onClick={onReset} title="Reset to Step 2">
            <div className="h-9 w-9 rounded-md bg-linear-to-b from-[#252C3D] to-[#121622] border border-amber-500/50 group-hover:border-amber-400 flex items-center justify-center font-mono font-bold text-sm text-amber-400 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25),0_3px_8px_rgba(0,0,0,0.6)] transition-all group-hover:scale-105">
              CV
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-[#090B0E]" title="System Active"></span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                <span>CV Studio</span>
                <span className="text-amber-400 font-semibold">Pro</span>
              </h1>
              <span className="hidden sm:inline-flex text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded-xs bg-[#161A24] text-zinc-400 border border-white/8 shadow-xs">
                Local Enterprise
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 hidden sm:block">
              Institutional ATS Matching & Tailoring Suite • Zero-Hallucination Policy
            </p>
          </div>
        </div>

        {/* Right utility cluster */}
        <div className="flex items-center gap-2 sm:gap-2.5 text-xs">
          {/* Privacy badge */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#131722] text-emerald-400 border border-emerald-500/20 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="font-medium text-[11px]">100% Air-Gapped (Private)</span>
          </div>

          {/* Ollama status */}
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#131722] border border-white/8 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]">
            <Cpu className="w-3.5 h-3.5 text-zinc-400" />
            {loading ? (
              <span className="text-zinc-400 text-xs font-mono">Checking Ollama...</span>
            ) : health?.ollama ? (
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]"></span>
                <span className="text-zinc-200 font-mono text-[11px]">
                  qwen2.5:7b online
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-rose-400 text-[11px] font-mono">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Ollama offline</span>
              </div>
            )}
          </div>

          {/* Fullscreen Toggle Button */}
          <button
            onClick={toggleFullscreen}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all border cursor-pointer ${
              isFullscreen
                ? 'btn-3d-primary text-[#080A0E] font-bold'
                : 'btn-3d-secondary text-zinc-200'
            }`}
            title={isFullscreen ? 'Exit Fullscreen (Esc)' : 'Enter Fullscreen Mode (F11)'}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5 text-[#080A0E]" />
                <span className="hidden sm:inline">Exit Fullscreen</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5 text-zinc-400" />
                <span className="hidden sm:inline">Fullscreen</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
