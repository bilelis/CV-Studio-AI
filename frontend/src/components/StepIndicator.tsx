import React from 'react';
import { UserCheck, FileSearch, Sparkles, CheckCircle2 } from 'lucide-react';
import { cn } from './ui/utils';

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
    { id: 1, label: 'Talent Bank', desc: 'Ground Truth Profile', icon: UserCheck },
    { id: 2, label: 'Requisition Intake', desc: 'Job Parsing & Skills', icon: FileSearch },
    { id: 3, label: 'Semantic Match', desc: 'Project Scoring & ATS Fit', icon: Sparkles },
    { id: 4, label: 'Audited Dossier', desc: 'PDFs & Verified Exports', icon: CheckCircle2 },
  ];

  return (
    <nav className="w-full mb-6" aria-label="Workflow Stages">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {steps.map((s) => {
          const Icon = s.icon;
          const isActive = currentStep === s.id;
          const isDone = currentStep > s.id;
          const isClickable = s.id <= maxReachedStep;

          return (
            <button
              key={s.id}
              onClick={() => isClickable && onSelectStep(s.id)}
              disabled={!isClickable}
              className={cn(
                'group relative flex items-center gap-3 p-3.5 rounded-[20px] text-left transition-all duration-200 select-none border',
                isActive &&
                  'bg-[var(--tile-dark)] text-white border-[var(--tile-dark)] shadow-[var(--shadow-tile-hover)] scale-[1.01]',
                isDone &&
                  'bg-[var(--tile-mint)] text-[#064E3B] border-black/5 hover:scale-[1.01] cursor-pointer',
                !isActive &&
                  !isDone &&
                  isClickable &&
                  'bg-[var(--tile-white)] text-[var(--text-main)] border-[var(--border)] hover:scale-[1.01] cursor-pointer',
                !isClickable &&
                  'bg-[var(--tile-white)]/60 text-[var(--text-muted)] border-[var(--border)] opacity-50 cursor-not-allowed'
              )}
            >
              {/* 40px circle icon chip */}
              <div
                className={cn(
                  'w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105',
                  isActive && 'bg-white/15 text-white',
                  isDone && 'bg-white text-emerald-700 shadow-2xs',
                  !isActive && !isDone && 'bg-[var(--secondary)] text-[var(--text-muted)]'
                )}
              >
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" strokeWidth={2} />
                ) : (
                  <Icon className="w-4 h-4" strokeWidth={1.75} />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      'text-[10px] font-mono uppercase tracking-wider font-semibold',
                      isActive ? 'text-[var(--tile-dark-muted)]' : isDone ? 'text-emerald-800' : 'text-[var(--text-muted)]'
                    )}
                  >
                    Stage 0{s.id}
                  </span>
                  {isDone && (
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-emerald-700/10 text-emerald-800 font-bold">
                      ✓ Done
                    </span>
                  )}
                  {isActive && (
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-white/20 text-white font-bold">
                      Active
                    </span>
                  )}
                </div>
                <div className="text-xs font-semibold truncate mt-0.5">{s.label}</div>
                <div
                  className={cn(
                    'text-[11px] truncate hidden lg:block',
                    isActive ? 'text-[var(--tile-dark-muted)]' : 'text-[var(--text-muted)]'
                  )}
                >
                  {s.desc}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
