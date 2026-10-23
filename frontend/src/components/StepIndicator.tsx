import React from 'react';
import { UserCheck, FileSearch, Sparkles, CheckCircle2, ChevronRight } from 'lucide-react';

interface StepIndicatorProps {
  currentStep: number;
  onSelectStep: (step: number) => void;
  maxReachedStep: number;
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  currentStep,
  onSelectStep,
  maxReachedStep,
}) => {
  const steps = [
    { id: 1, label: 'Talent Bank', desc: 'Ground Truth & Skills', icon: UserCheck },
    { id: 2, label: 'Requisition Intake', desc: 'Requirements & Scope', icon: FileSearch },
    { id: 3, label: 'ATS Gap Resolution', desc: 'Project Fit & Auto-Infusion', icon: Sparkles },
    { id: 4, label: 'Audited Dossier Suite', desc: '100% Match PDF Exports', icon: CheckCircle2 },
  ];

  return (
    <div className="w-full mb-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        {steps.map((s, idx) => {
          const Icon = s.icon;
          const isActive = currentStep === s.id;
          const isDone = currentStep > s.id;
          const isClickable = s.id <= maxReachedStep;

          return (
            <button
              key={s.id}
              onClick={() => isClickable && onSelectStep(s.id)}
              disabled={!isClickable}
              className={`relative flex items-center gap-3 p-3 sm:p-3.5 rounded-lg text-left transition-all duration-200 overflow-hidden ${
                isActive
                  ? 'bg-linear-to-b from-[#1E2535] to-[#121622] border border-amber-500/70 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.18),0_8px_20px_-3px_rgba(245,158,11,0.22),0_2px_4px_rgba(0,0,0,0.6)]'
                  : isDone
                  ? 'bg-linear-to-b from-[#141822] to-[#0E1117] border border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_4px_12px_rgba(0,0,0,0.45)] hover:border-zinc-500 cursor-pointer hover:-translate-y-0.5'
                  : isClickable
                  ? 'bg-linear-to-b from-[#13161F] to-[#0C0E14] border border-white/5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] hover:border-zinc-700 cursor-pointer hover:-translate-y-0.5'
                  : 'bg-[#090B0E] border border-white/4 text-zinc-600 cursor-not-allowed opacity-40'
              }`}
            >
              {/* Active top amber glowing rim */}
              {isActive && (
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-linear-to-r from-amber-400 via-amber-500 to-amber-600 shadow-[0_0_10px_rgba(245,158,11,0.8)]"></div>
              )}

              <div
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-md flex items-center justify-center shrink-0 font-bold text-xs transition-all duration-200 ${
                  isActive
                    ? 'bg-linear-to-b from-amber-300 via-amber-400 to-amber-600 text-[#080A0E] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.5),0_2px_6px_rgba(0,0,0,0.5)] font-mono font-bold scale-105'
                    : isDone
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]'
                    : 'bg-[#181D27] text-zinc-400 border border-white/8 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]'
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </div>

              <div className="overflow-hidden flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-[9px] font-mono uppercase tracking-wider font-semibold ${
                      isActive ? 'text-amber-400' : isDone ? 'text-emerald-400' : 'text-zinc-500'
                    }`}
                  >
                    Stage 0{s.id}
                  </span>
                  {isDone && (
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 font-medium">
                      Done
                    </span>
                  )}
                  {isActive && (
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-xs bg-amber-500/15 text-amber-300 border border-amber-500/35 font-medium shadow-[0_0_8px_rgba(245,158,11,0.2)]">
                      Active
                    </span>
                  )}
                </div>
                <div
                  className={`text-xs font-bold truncate mt-0.5 ${
                    isActive ? 'text-white' : isDone ? 'text-zinc-200' : 'text-zinc-400'
                  }`}
                >
                  {s.label}
                </div>
                <div className="text-[10px] text-zinc-500 truncate hidden sm:block">
                  {s.desc}
                </div>
              </div>

              {idx < steps.length - 1 && (
                <div className="hidden xl:block text-zinc-700 ml-1">
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
