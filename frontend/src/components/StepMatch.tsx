import React, { useEffect, useState } from 'react';
import { 
  ArrowLeft, 
  Sparkles, 
  Check, 
  CheckCircle2, 
  Globe, 
  Layers, 
  ShieldCheck
} from 'lucide-react';
import type { MasterProfile, JobAnalysis, MatchResult, Lang } from '../types';
import { api } from '../services/api';

interface StepMatchProps {
  profile: MasterProfile;
  job: JobAnalysis;
  onGenerate: (selectedProjectIds: string[], targetLang: Lang) => void;
  generating: boolean;
  onBack: () => void;
}

export const StepMatch: React.FC<StepMatchProps> = ({
  profile,
  job,
  onGenerate,
  generating,
  onBack,
}) => {
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [loadingMatch, setLoadingMatch] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [targetLang, setTargetLang] = useState<Lang>(job.offer_language || 'fr');

  useEffect(() => {
    let isMounted = true;
    async function fetchMatch() {
      setLoadingMatch(true);
      try {
        const res = await api.matchJob(job);
        if (isMounted) {
          setMatchResult(res);
          setSelectedIds(new Set(res.suggested_project_ids));
        }
      } catch (err: any) {
        console.error('Match failed:', err);
      } finally {
        if (isMounted) setLoadingMatch(false);
      }
    }
    fetchMatch();
    return () => {
      isMounted = false;
    };
  }, [job]);

  const toggleProject = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      if (next.size <= 1) return;
      next.delete(id);
    } else {
      if (next.size >= 4) return;
      next.add(id);
    }
    setSelectedIds(next);
  };

  const projectMap = new Map(profile.projects.map((p) => [p.id, p]));

  return (
    <div className="w-full space-y-4 animate-fadeIn">
      {loadingMatch ? (
        <div className="card-3d p-12 sm:p-16 flex flex-col items-center justify-center text-center shadow-xl">
          <div className="relative mb-4">
            <div className="h-10 w-10 border-2 border-amber-500/20 border-t-amber-400 rounded-full animate-spin"></div>
            <Sparkles className="w-4 h-4 text-amber-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          <h3 className="font-bold text-white text-base">Computing Semantic Match & Ranking Projects...</h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-md font-mono">
            Evaluating cosine similarity with bge-m3 embeddings and validating skill requirements for {job.title}.
          </p>
        </div>
      ) : matchResult ? (
        <>
          {/* Top Panoramic Command Cockpit */}
          <div className="card-3d p-4 sm:p-5 shadow-xl space-y-4">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-white/8">
              {/* Left Score Gauge & Target Context */}
              <div className="flex items-center gap-4">
                <div
                  className={`w-18 h-18 rounded-md flex flex-col items-center justify-center font-mono font-bold shadow-md shrink-0 transition-transform ${
                    matchResult.global_score >= 75
                      ? 'bg-linear-to-b from-emerald-500/20 to-emerald-950/40 text-emerald-400 border border-emerald-500/40 shadow-[0_4px_12px_rgba(16,185,129,0.2)]'
                      : matchResult.global_score >= 50
                      ? 'bg-linear-to-b from-amber-500/20 to-amber-950/40 text-amber-400 border border-amber-500/40 shadow-[0_4px_12px_rgba(245,158,11,0.2)]'
                      : 'bg-linear-to-b from-rose-500/20 to-rose-950/40 text-rose-400 border border-rose-500/40 shadow-[0_4px_12px_rgba(244,63,94,0.2)]'
                  }`}
                >
                  <span className="text-xl leading-none tabular-nums tracking-tight">{matchResult.global_score}%</span>
                  <span className="text-[9px] font-mono uppercase tracking-wider mt-1 opacity-80">Match</span>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.2 rounded-xs bg-amber-500/10 text-amber-400 border border-amber-500/25">
                      Target Role
                    </span>
                    <span className="text-xs text-zinc-400">{job.company || 'Direct Employer'}</span>
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-white mt-0.5">{job.title}</h3>
                  <p className="text-[11px] text-zinc-400 mt-0.5 line-clamp-1 font-mono">
                    Deterministic hybrid score: 60% Must-Have + 15% Nice-to-Have + 25% semantic embedding keywords.
                  </p>
                </div>
              </div>

              {/* Right Export Language & Quick Generate CTA */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-mono font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
                    <Globe className="w-3 h-3 text-amber-400" />
                    <span>Document Language:</span>
                  </label>
                  <div className="flex gap-1 p-1 rounded-md surface-3d-inset text-xs">
                    <button
                      type="button"
                      onClick={() => setTargetLang('fr')}
                      className={`px-3 py-1 rounded-sm font-mono text-[11px] font-semibold transition-all cursor-pointer ${
                        targetLang === 'fr'
                          ? 'bg-linear-to-b from-amber-400 to-amber-600 text-[#080A0E] font-bold shadow-[0_2px_6px_rgba(245,158,11,0.3)]'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      FR (Français)
                    </button>
                    <button
                      type="button"
                      onClick={() => setTargetLang('en')}
                      className={`px-3 py-1 rounded-sm font-mono text-[11px] font-semibold transition-all cursor-pointer ${
                        targetLang === 'en'
                          ? 'bg-linear-to-b from-amber-400 to-amber-600 text-[#080A0E] font-bold shadow-[0_2px_6px_rgba(245,158,11,0.3)]'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      EN (English)
                    </button>
                    <button
                      type="button"
                      onClick={() => setTargetLang('ar')}
                      className={`px-3 py-1 rounded-sm font-mono text-[11px] font-semibold transition-all cursor-pointer ${
                        targetLang === 'ar'
                          ? 'bg-linear-to-b from-amber-400 to-amber-600 text-[#080A0E] font-bold shadow-[0_2px_6px_rgba(245,158,11,0.3)]'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      AR (العربية)
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => onGenerate(Array.from(selectedIds), targetLang)}
                  disabled={generating || selectedIds.size === 0}
                  className="btn-3d-primary px-5 py-2 text-xs font-bold cursor-pointer disabled:opacity-50 mt-1 sm:mt-0"
                >
                  {generating ? (
                    <>
                      <span className="h-3.5 w-3.5 border-2 border-[#080A0E] border-t-transparent rounded-full animate-spin"></span>
                      <span>Synthesizing Dossier Suite...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Generate Application ({targetLang.toUpperCase()})</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Matched vs Auto-Infused Requisition Competencies */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-md surface-3d-inset">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
                      Matched Candidate Skills ({matchResult.matched_skills.length})
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400">Verified Ground Truth</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {matchResult.matched_skills.length > 0 ? (
                    matchResult.matched_skills.map((s) => (
                      <span
                        key={s}
                        className="text-[10px] px-2 py-0.5 rounded-xs bg-emerald-500/10 text-emerald-300 border border-emerald-500/25 font-mono-code font-medium shadow-xs"
                      >
                        {s}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-zinc-500 italic">No direct overlap detected</span>
                  )}
                </div>
              </div>

              <div className="p-3.5 rounded-md surface-3d-inset border border-amber-500/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-300">
                      Requisition Skills to Auto-Infuse ({matchResult.missing_skills.length})
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono text-amber-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-amber-400" />
                    100% Target ATS Match
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 mb-2 font-mono">
                  Engine will weave these {matchResult.missing_skills.length} target job must-haves into your CV skills & projects.
                </p>
                <div className="flex flex-wrap gap-1">
                  {matchResult.missing_skills.length > 0 ? (
                    matchResult.missing_skills.map((s) => (
                      <span
                        key={s}
                        className="text-[10px] px-2 py-0.5 rounded-xs bg-amber-500/15 text-amber-300 border border-amber-500/35 font-mono-code font-semibold shadow-xs flex items-center gap-1"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                        <span>{s}</span>
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      All Requisition Must-Haves Already in Profile
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Ranked Projects Multi-Column Selection Matrix */}
          <div className="card-3d p-4 sm:p-5 space-y-3.5 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/8">
              <div>
                <h4 className="font-bold text-white text-sm sm:text-base flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-400" />
                  <span>Targeted Projects Selection</span>
                </h4>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Ranked by relevance. Select 1 to 4 projects to showcase in your tailored ATS CV (2-3 recommended).
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-bold text-amber-300 bg-[#16191F] px-2.5 py-1 rounded-sm border border-white/8 shadow-xs">
                  {selectedIds.size} / 4 Projects Selected
                </span>
                <button
                  onClick={() => setSelectedIds(new Set(matchResult.suggested_project_ids))}
                  className="text-xs text-zinc-400 hover:text-white px-2 py-1 rounded-sm hover:bg-[#16191F] transition-colors cursor-pointer"
                >
                  Reset to AI Picks
                </button>
              </div>
            </div>

            {/* Responsive 2 to 3-Column Projects Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
              {matchResult.ranked_projects.map((rp, rankIdx) => {
                const project = projectMap.get(rp.project_id);
                if (!project) return null;
                const isSelected = selectedIds.has(rp.project_id);

                return (
                  <div
                    key={rp.project_id}
                    onClick={() => toggleProject(rp.project_id)}
                    className={`card-3d-interactive p-4 sm:p-5 text-left cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-amber-500/70 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.18),0_8px_24px_rgba(245,158,11,0.2)]'
                        : 'text-zinc-400 hover:border-zinc-600'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className={`w-4 h-4 rounded-xs flex items-center justify-center border transition-all shrink-0 ${
                              isSelected ? 'bg-linear-to-b from-amber-400 to-amber-600 border-amber-400 text-[#080A0E] shadow-xs' : 'border-zinc-700'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 stroke-3" />}
                          </div>
                          <span className="text-[10px] font-mono font-bold text-zinc-500 shrink-0">#{rankIdx + 1}</span>
                          <h5 className="font-bold text-xs sm:text-sm text-white group-hover:text-amber-300 transition-colors truncate">
                            {project.name}
                          </h5>
                        </div>

                        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-xs shrink-0 border ${
                          rp.score >= 70
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                            : rp.score >= 40
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/25'
                            : 'bg-[#16191F] text-zinc-400 border-white/8'
                        }`}>
                          {rp.score}% fit
                        </span>
                      </div>

                      {project.role && (
                        <div className="text-[11px] text-amber-400 font-medium mb-2 pl-6">
                          {project.role}
                        </div>
                      )}

                      {/* Tech Stack Pills with Highlighted Matches */}
                      <div className="flex flex-wrap gap-1 mb-2.5 pl-6">
                        {project.stack.map((t) => {
                          const isMatched = rp.matched_skills.includes(t);
                          return (
                            <span
                              key={t}
                              className={`text-[9px] px-1.5 py-0.2 rounded-xs font-mono-code transition-colors ${
                                isMatched
                                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold'
                                  : 'bg-[#11141B] text-zinc-400 border border-white/6'
                              }`}
                            >
                              {t}
                            </span>
                          );
                        })}
                      </div>

                      {/* Accomplishment Bullets */}
                      <div className="pl-6 text-xs text-zinc-300 leading-relaxed">
                        <p className="line-clamp-2 text-[11px]">{project.bullets[0]}</p>
                      </div>
                    </div>

                    <div className="pl-6 pt-2.5 mt-2.5 border-t border-white/6 flex items-center justify-between text-[10px] font-mono">
                      <span className="text-zinc-500">{project.year}</span>
                      <span className={isSelected ? 'text-amber-400 font-semibold' : 'text-zinc-500'}>
                        {isSelected ? '✓ Selected for CV' : '+ Click to include'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Action Strip */}
          <div className="card-3d p-3.5 sm:p-4 flex items-center justify-between shadow-lg">
            <button
              onClick={onBack}
              disabled={generating}
              className="btn-3d-secondary px-4 py-2 text-xs cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Job Analysis</span>
            </button>

            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-zinc-500 hidden sm:inline">
                {selectedIds.size} projects chosen for 1-page ATS template
              </span>

              <button
                onClick={() => onGenerate(Array.from(selectedIds), targetLang)}
                disabled={generating || selectedIds.size === 0}
                className="btn-3d-primary px-5 py-2 text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                {generating ? (
                  <>
                    <span className="h-3.5 w-3.5 border-2 border-[#080A0E] border-t-transparent rounded-full animate-spin"></span>
                    <span>Generating Tailored CV & Letter...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate Application Documents</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};
