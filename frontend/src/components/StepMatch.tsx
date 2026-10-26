import React, { useEffect, useState } from 'react';
import { 
  ArrowLeft, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  FolderGit2,
  FileCheck2,
  ArrowRight
} from 'lucide-react';
import type { MasterProfile, JobAnalysis, MatchResult, Lang } from '../types';
import { api } from '../services/api';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { BentoGrid } from './ui/bento-grid';
import { BentoDonut, BentoSlimBars } from './ui/charts';
import { Checkbox } from './ui/checkbox';
import { useToast } from './ui/use-toast';

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
  const { toast } = useToast();
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [loadingMatch, setLoadingMatch] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [targetLang, setTargetLang] = useState<Lang>(job.offer_language || 'fr');

  const fetchedJobKeyRef = React.useRef<string | null>(null);
  const toastRef = React.useRef(toast);
  toastRef.current = toast;

  useEffect(() => {
    const jobKey = `${job.title}::${job.company || ''}`;
    // Guard against duplicate fetches for the same job offer
    if (fetchedJobKeyRef.current === jobKey) {
      return;
    }
    fetchedJobKeyRef.current = jobKey;

    let isMounted = true;
    async function fetchMatch() {
      setLoadingMatch(true);
      try {
        const res = await api.matchJob(job);
        if (isMounted) {
          setMatchResult(res);
          const fallbackIds = (res.suggested_project_ids && res.suggested_project_ids.length > 0)
            ? res.suggested_project_ids
            : (profile?.projects || []).slice(0, 3).map((p) => p.id);
          setSelectedIds(new Set(fallbackIds));
          toastRef.current('Match Computed', {
            description: `Global semantic fit: ${res.global_score}% with ${res.matched_skills.length} skills aligned`,
            type: 'success',
          });
        }
      } catch (err: any) {
        toastRef.current('Matching Error', {
          description: err.message || 'Failed to compute semantic match',
          type: 'error',
        });
        // Even on error, preselect top projects so user can proceed
        if (isMounted && profile?.projects?.length) {
          setSelectedIds(new Set(profile.projects.slice(0, 3).map((p) => p.id)));
        }
      } finally {
        if (isMounted) setLoadingMatch(false);
      }
    }
    fetchMatch();
    return () => {
      isMounted = false;
    };
  }, [job, profile]);

  const handleBuildDossier = () => {
    let idsToUse = Array.from(selectedIds);
    if (idsToUse.length === 0 && (profile?.projects?.length || 0) > 0) {
      idsToUse = profile.projects.slice(0, 3).map((p) => p.id);
      setSelectedIds(new Set(idsToUse));
    }
    onGenerate(idsToUse, targetLang);
  };

  const toggleProject = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      if (next.size >= 4) {
        toast('Maximum Projects', { description: 'Select up to 4 high-impact projects for 1-page CV limit.', type: 'info' });
        return;
      }
      next.add(id);
    }
    setSelectedIds(next);
  };

  const projectMap = new Map((profile?.projects || []).map((p) => [p.id, p]));

  // Prepare chart data for ranked projects
  const slimBarData = (matchResult?.ranked_projects || []).slice(0, 5).map((rp, i) => {
    const proj = projectMap.get(rp.project_id);
    const shortName = proj?.name ? (proj.name.length > 10 ? proj.name.slice(0, 8) + '..' : proj.name) : `P${i + 1}`;
    return {
      label: shortName,
      value: rp.score,
    };
  });

  return (
    <div className="w-full space-y-4">
      <BentoGrid>
        {/* HERO TILE (Largest - always first on responsive: 12 cols > 6 cols > 1 col) */}
        <Card
          variant="white"
          isHero
          icon={<Sparkles className="w-5 h-5 text-[var(--text-main)]" strokeWidth={1.75} />}
          actionArrow
          className="col-span-12 lg:col-span-8 p-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="tile-label">SEMANTIC ATS MATCH</span>
                <Badge variant="mint" className="text-[10px]">STAGE 03</Badge>
              </div>
              <h2 className="text-2xl font-semibold tracking-tight text-[var(--text-main)]">
                Global Requisition Alignment
              </h2>
              <p className="text-xs text-[var(--text-muted)] mt-1 font-mono">
                Requisition: <span className="text-[var(--text-main)] font-semibold">{job.title}</span> • {job.company || 'Enterprise'}
              </p>
            </div>

            {/* Score Donut Chart */}
            <div className="shrink-0 flex items-center justify-center">
              <BentoDonut
                percentage={matchResult?.global_score || 0}
                color={
                  (matchResult?.global_score || 0) >= 75
                    ? '#059669'
                    : (matchResult?.global_score || 0) >= 50
                    ? '#D97706'
                    : '#DC2626'
                }
                size={95}
                strokeWidth={9}
                label="FIT"
              />
            </div>
          </div>

          <div className="p-3.5 rounded-[16px] bg-[var(--secondary)]/40 border border-[var(--border)] text-xs text-[var(--text-muted)] leading-relaxed">
            Dense semantic embeddings calculated via <span className="font-mono font-semibold text-[var(--text-main)]">bge-m3</span>. Hard constraints and required skills are mapped directly against your ground truth profile.
          </div>
        </Card>

        {/* NEAR-BLACK TILE (#111 for Contrast) - Generation Dispatcher */}
        <Card
          variant="dark"
          icon={<FileCheck2 className="w-5 h-5 text-white" strokeWidth={1.75} />}
          actionArrow
          className="col-span-12 sm:col-span-6 lg:col-span-4 p-6"
        >
          <span className="dark-tile-label uppercase">DOSSIER DISPATCHER</span>
          <div className="text-3xl sm:text-4xl font-bold tracking-tight text-white mt-1">GENERATE</div>

          <div className="mt-3">
            <span className="dark-tile-label block mb-1.5">TARGET LANGUAGE</span>
            <div className="flex flex-wrap items-center gap-1.5">
              {(['fr', 'en', 'ar'] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setTargetLang(l)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold uppercase transition-all cursor-pointer ${
                    targetLang === l
                      ? 'bg-white text-black font-bold shadow-xs'
                      : 'bg-white/10 text-[var(--tile-dark-muted)] hover:text-white hover:bg-white/15'
                  }`}
                >
                  {l === 'fr' ? 'Français' : l === 'en' ? 'English' : 'العربية'}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 flex items-center gap-2">
            <Button
              variant="secondary"
              size="md"
              onClick={onBack}
              className="bg-white/10 text-white hover:bg-white/20 border-white/10 shrink-0"
              aria-label="Back to Job Intake"
            >
              <ArrowLeft className="w-4 h-4" strokeWidth={1.75} />
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleBuildDossier}
              loading={generating}
              disabled={generating}
              className="w-full bg-white text-black hover:bg-zinc-200 font-bold truncate justify-center"
            >
              <span className="truncate">Build Dossier & PDFs</span>
              <ArrowRight className="w-4 h-4 ml-1.5 shrink-0" strokeWidth={2} />
            </Button>
          </div>
        </Card>

        {/* KPI TILE 1 (Mint #D9F5E6) - Matched Requirements */}
        <Card
          variant="mint"
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-800" strokeWidth={1.75} />}
          actionArrow
          className="col-span-6 sm:col-span-3 lg:col-span-3 p-5"
        >
          <span className="tile-label text-emerald-900 font-semibold">MATCHED SKILLS</span>
          <div className="big-number text-emerald-950 mt-1">
            {matchResult?.matched_skills?.length || 0}
          </div>
          <span className="text-xs text-emerald-800 font-medium mt-1">Directly satisfied</span>
        </Card>

        {/* KPI TILE 2 (Peach #FFE6D5) - Missing Gaps */}
        <Card
          variant="peach"
          icon={<AlertCircle className="w-5 h-5 text-amber-900" strokeWidth={1.75} />}
          actionArrow
          className="col-span-6 sm:col-span-3 lg:col-span-3 p-5"
        >
          <span className="tile-label text-amber-950 font-semibold">SKILL GAPS</span>
          <div className="big-number text-amber-950 mt-1">
            {matchResult?.missing_skills?.length || 0}
          </div>
          <span className="text-xs text-amber-900 font-medium mt-1">To bridge in letter</span>
        </Card>

        {/* CHART TILE (Sky #DCEBFF) - Project Ranking Slim Bars */}
        <Card
          variant="sky"
          className="col-span-12 sm:col-span-6 lg:col-span-6 p-5"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="tile-label text-sky-950 font-semibold">
              PROJECT RELEVANCE RANKING
            </span>
            <span className="text-[10px] font-mono font-semibold text-sky-800">bge-m3 Cosine</span>
          </div>
          {slimBarData.length > 0 ? (
            <BentoSlimBars data={slimBarData} color="#0284C7" height={85} />
          ) : (
            <div className="h-20 flex items-center justify-center text-xs text-sky-700">
              Computing rankings...
            </div>
          )}
        </Card>

        {/* LIST TILE (Lavender #E9E3FF) - Matched & Missing Chips */}
        <Card
          variant="lavender"
          className="col-span-12 sm:col-span-6 lg:col-span-6 p-5"
        >
          <span className="tile-label text-purple-950 font-semibold">
            GROUND TRUTH ALIGNED CHIPS
          </span>
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {matchResult?.matched_skills?.slice(0, 8).map((ms) => (
              <span
                key={ms}
                className="text-xs font-mono font-medium px-2.5 py-0.5 rounded-full bg-white text-purple-900 border border-purple-900/10 shadow-2xs"
              >
                ✓ {ms}
              </span>
            ))}
            {matchResult?.missing_skills?.slice(0, 3).map((ms) => (
              <span
                key={ms}
                className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-purple-200/60 text-purple-950 line-through opacity-70"
              >
                {ms}
              </span>
            ))}
          </div>
        </Card>

        {/* INTERACTIVE PROJECTS SELECTOR TILE (White, 12 Columns) */}
        <Card
          variant="white"
          icon={<FolderGit2 className="w-5 h-5 text-[var(--text-main)]" strokeWidth={1.75} />}
          className="col-span-12 p-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="tile-label">PROJECT BANK TAILORING</span>
                {loadingMatch && (
                  <Badge variant="sky" className="text-[10px] animate-pulse">
                    Computing Fit...
                  </Badge>
                )}
              </div>
              <h3 className="text-base font-semibold text-[var(--text-main)]">
                Selected Projects for Generated CV ({selectedIds.size} / 4)
              </h3>
            </div>
            <span className="text-xs text-[var(--text-muted)] font-mono">
              Click cards to toggle inclusion in the final CV
            </span>
          </div>

          {(!profile?.projects || profile.projects.length === 0) ? (
            <div className="p-8 text-center rounded-[18px] bg-[var(--secondary)]/40 border border-dashed border-[var(--border)]">
              <FolderGit2 className="w-8 h-8 mx-auto text-[var(--text-muted)] mb-2" strokeWidth={1.5} />
              <p className="text-sm font-medium text-[var(--text-main)]">
                No repository projects in current candidate profile.
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-1 max-w-md mx-auto">
                Your dossier and cover letter will be built based on candidate experience, skills, and education. You can also add projects via GitHub repository link in Step 1.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {profile.projects.map((proj) => {
                const isSelected = selectedIds.has(proj.id);
                const scoreObj = matchResult?.ranked_projects.find((r) => r.project_id === proj.id);
                const score = scoreObj ? scoreObj.score : 70;

                return (
                  <div
                    key={proj.id}
                    onClick={() => toggleProject(proj.id)}
                    className={`p-4 rounded-[18px] border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-[var(--tile-mint)] border-emerald-400/50 shadow-xs scale-[1.01]'
                        : 'bg-[var(--tile-white)] border-[var(--border)] hover:border-[var(--border-strong)] opacity-75'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <Checkbox checked={isSelected} />
                          <span className="text-xs font-semibold text-[var(--text-main)]">
                            {proj.name}
                          </span>
                        </div>
                        <Badge
                          variant={score >= 75 ? 'mint' : 'sky'}
                          className="text-[10px] font-mono font-bold"
                        >
                          {score}% FIT
                        </Badge>
                      </div>

                      <p className="text-xs text-[var(--text-muted)] font-medium mb-2 pl-6">
                        {proj.role} • {proj.year}
                      </p>

                      <ul className="text-xs text-[var(--text-main)] list-disc pl-8 space-y-1">
                        {proj.bullets.slice(0, 2).map((b, i) => (
                          <li key={i} className="line-clamp-2">{b}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-[var(--border)] flex flex-wrap gap-1 pl-6">
                      {proj.stack.slice(0, 4).map((s) => (
                        <span
                          key={s}
                          className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white text-[var(--text-main)] border border-[var(--border)]"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </BentoGrid>
    </div>
  );
};
