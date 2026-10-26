import React, { useState, useEffect } from 'react';
import { ShieldCheck, Cpu, AlertTriangle, Maximize2, Minimize2, RotateCcw } from 'lucide-react';
import type { HealthResponse } from '../types';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

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
    <TooltipProvider>
      <header className="sticky top-0 z-40 w-full bg-[var(--tile-white)]/90 backdrop-blur-md border-b border-[var(--border)] px-6 py-3.5 flex items-center justify-between">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div
            onClick={onReset}
            className="w-10 h-10 rounded-full bg-[var(--tile-dark)] text-white flex items-center justify-center font-bold text-sm tracking-tight cursor-pointer hover:scale-105 transition-transform select-none shadow-xs"
            title="Reset to New Matching"
          >
            CV
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold tracking-tight text-[var(--text-main)]">
                CV Matcher Studio
              </h1>
              <Badge variant="dark" className="hidden sm:inline-flex text-[10px] px-2 py-0.5">
                BENTO AI
              </Badge>
            </div>
            <p className="text-[12px] text-[var(--text-muted)] hidden sm:block">
              Zero-Hallucination Requisition Tailoring & ATS Intelligence Suite
            </p>
          </div>
        </div>

        {/* Right utility cluster */}
        <div className="flex items-center gap-2.5">
          {/* Air-gapped badge */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--tile-mint)] text-[#065F46] border border-black/5 text-xs font-medium">
            <ShieldCheck className="w-3.5 h-3.5" strokeWidth={2} />
            <span>100% Private (Local AI)</span>
          </div>

          {/* Ollama inference status */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--secondary)] border border-[var(--border)] text-xs font-mono">
            <Cpu className="w-3.5 h-3.5 text-[var(--text-muted)]" strokeWidth={1.75} />
            {loading ? (
              <span className="text-[var(--text-muted)]">Ollama...</span>
            ) : health?.ollama ? (
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[var(--text-main)] font-semibold text-[11px]">
                  qwen2.5:7b
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-rose-600 font-semibold text-[11px]">
                <AlertTriangle className="w-3.5 h-3.5" strokeWidth={2} />
                <span>Offline</span>
              </div>
            )}
          </div>

          {/* Fullscreen toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleFullscreen}
                aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
              >
                {isFullscreen ? (
                  <Minimize2 className="w-4 h-4" strokeWidth={1.75} />
                ) : (
                  <Maximize2 className="w-4 h-4" strokeWidth={1.75} />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            </TooltipContent>
          </Tooltip>

          {/* Reset button */}
          {onReset && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onReset}
                  className="gap-1.5 text-xs font-semibold"
                >
                  <RotateCcw className="w-3.5 h-3.5" strokeWidth={2} />
                  <span className="hidden sm:inline">Reset</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Reset current job & matching</TooltipContent>
            </Tooltip>
          )}
        </div>
      </header>
    </TooltipProvider>
  );
};
