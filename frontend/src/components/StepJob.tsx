import React, { useState } from 'react';
import { 
  ArrowLeft, 
  ArrowRight, 
  Building, 
  Briefcase, 
  FileText, 
  CheckCircle2, 
  Layers, 
  AlertCircle,
  Cpu,
  ClipboardPaste,
  RotateCcw,
  Sparkles,
  Check
} from 'lucide-react';
import type { JobAnalysis } from '../types';
import { api } from '../services/api';

interface StepJobProps {
  job: JobAnalysis | null;
  onJobAnalyzed: (analyzed: JobAnalysis) => void;
  onBack: () => void;
  onNext: () => void;
}

const BENCHMARK_TEMPLATES = [
  {
    id: 'fr-bi',
    label: 'BI & Data Engineer (Paris - FR)',
    text: `Offre d'alternance : Data Analyst / Ingénieur BI (F/H)
Entreprise : Nexa Analytics Paris
Lieu : Paris, France (Hybride)
Type de contrat : Contrat d'apprentissage / Alternance (12 à 24 mois)

Vos missions principales :
- Développer, maintenir et optimiser des tableaux de bord interactifs sous Power BI.
- Concevoir et exécuter des requêtes SQL complexes pour l'extraction et l'agrégation de données multi-sources.
- Mettre en place des pipelines ETL automatisés avec Python et SQL pour alimenter le Data Warehouse.
- Participer à l'intégration de modèles d'intelligence artificielle et d'analyse prédictive.
- Rédiger la documentation technique et former les utilisateurs métiers aux outils d'analyse.

Profil recherché :
- Étudiant(e) en dernière année de cursus ingénieur ou master spécialisé en Business Intelligence ou Génie Logiciel.
- Maîtrise solide de SQL (PostgreSQL, MySQL) et de Python pour la manipulation de données.
- Forte appétence et expérience avec Power BI et la modélisation de données (étoile/flocon).
- Connaissances pratiques en ETL, API REST et Git.`
  },
  {
    id: 'en-fs',
    label: 'Full Stack Engineer (Cloud / LLM - EN)',
    text: `Job Opportunity: Full Stack Developer Intern (M/F)
Company: CloudScale Technologies
Location: Paris / Remote (France)
Contract Type: End-of-studies Internship (Stage de fin d'études - 6 months)

Key Responsibilities:
- Build responsive, modern web interfaces using React, TypeScript, and modern CSS frameworks.
- Design, implement, and maintain high-performance REST APIs using Node.js or Python (FastAPI).
- Integrate backend microservices with relational and document databases (PostgreSQL, MongoDB).
- Implement asynchronous task pipelines and explore integrations with local/cloud LLMs.
- Collaborate with the team on CI/CD automation, unit testing, and Docker containerization.

Requirements:
- Final year Computer Science or Software Engineering student.
- Hands-on experience with modern JavaScript/TypeScript and React.
- Good understanding of backend engineering with Python (FastAPI) or Node.js.
- Familiarity with SQL/NoSQL databases, RESTful APIs, Git, and Docker.
- Fluent in English with good written communication skills.`
  }
];

export const StepJob: React.FC<StepJobProps> = ({
  job,
  onJobAnalyzed,
  onBack,
  onNext,
}) => {
  const [jobText, setJobText] = useState(BENCHMARK_TEMPLATES[0].text);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedNotification, setCopiedNotification] = useState(false);

  const wordCount = jobText.trim() ? jobText.trim().split(/\s+/).length : 0;
  const charCount = jobText.length;

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setJobText(text);
        setCopiedNotification(true);
        setTimeout(() => setCopiedNotification(false), 2000);
      }
    } catch (err) {
      console.warn('Clipboard read failed:', err);
    }
  };

  const handleAnalyze = async () => {
    if (!jobText.trim()) return;
    setAnalyzing(true);
    setError(null);
    try {
      const analyzed = await api.analyzeJob(jobText);
      onJobAnalyzed(analyzed);
    } catch (err: any) {
      setError(err.message || 'Requisition analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="w-full space-y-4 animate-fadeIn">
      {/* Enterprise Requisition Intake Control Bar */}
      <div className="card-3d p-3.5 sm:p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-md">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-zinc-300 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-400"></span>
            <span>Requisition Intake Buffer</span>
          </span>

          <span className="text-zinc-600 hidden sm:inline">•</span>

          {/* Institutional Template Selector */}
          <div className="flex items-center gap-1.5">
            {BENCHMARK_TEMPLATES.map((tmpl) => (
              <button
                key={tmpl.id}
                onClick={() => setJobText(tmpl.text)}
                className={`btn-3d-secondary px-2.5 py-1 text-xs font-mono transition-colors cursor-pointer ${
                  jobText === tmpl.text ? 'border-amber-500/50 text-amber-300' : 'text-zinc-400'
                }`}
              >
                {tmpl.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 ml-1">
            <button
              onClick={handlePasteClipboard}
              className="btn-3d-secondary px-2.5 py-1 text-xs text-zinc-300 hover:text-white flex items-center gap-1 cursor-pointer"
              title="Paste raw text from clipboard"
            >
              {copiedNotification ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400">Pasted</span>
                </>
              ) : (
                <>
                  <ClipboardPaste className="w-3 h-3 text-amber-400" />
                  <span>Paste Clipboard</span>
                </>
              )}
            </button>

            <button
              onClick={() => setJobText('')}
              className="px-2 py-1 text-xs text-zinc-500 hover:text-rose-400 transition-colors flex items-center gap-1 cursor-pointer"
              title="Clear text buffer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Clear</span>
            </button>
          </div>
        </div>

        {/* Real-time Document Diagnostics */}
        <div className="flex items-center gap-3 text-xs font-mono text-zinc-400 self-end md:self-auto">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-xs surface-3d-inset">
            <span className="text-zinc-500">TOKENS:</span>
            <span className="text-zinc-200 font-bold">{wordCount} words</span>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-xs surface-3d-inset">
            <span className="text-zinc-500">CHARS:</span>
            <span className="text-zinc-200 font-bold">{charCount}</span>
          </div>
          <div className="hidden lg:flex items-center gap-1.5 px-2 py-0.5 rounded-xs surface-3d-inset">
            <span className="text-zinc-500">PARSER:</span>
            <span className="text-amber-400 font-bold">Qwen 2.5 (7B)</span>
          </div>
        </div>
      </div>

      {/* 2-Column Split Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
        {/* Left Column: Job Input Terminal */}
        <div className="card-3d p-4 sm:p-5 flex flex-col justify-between shadow-lg">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2.5 border-b border-white/8">
              <label className="flex items-center gap-2 text-sm font-bold text-white">
                <FileText className="w-4 h-4 text-amber-400" />
                <span>Job Requisition Raw Ingestion</span>
              </label>
              <span className="text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-xs bg-[#16191F] text-amber-400 border border-amber-500/25">
                Target Requisition
              </span>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Enter or paste the target job requisition, vacancy notice, or RFP scope. The on-premise AI will parse all mandatory technical requirements, stack tokens, and ATS criteria.
            </p>

            <textarea
              rows={16}
              value={jobText}
              onChange={(e) => setJobText(e.target.value)}
              placeholder="Paste raw requisition text (LinkedIn, Job Portal, Internal RFP)..."
              className="w-full p-3.5 text-xs font-mono-code rounded-md surface-3d-inset text-zinc-200 focus:outline-none focus:border-amber-500 leading-relaxed resize-y min-h-90"
            />
          </div>

          {error && (
            <div className="mt-3 p-3 rounded-md bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-3 mt-3 border-t border-white/8">
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Profile Bank</span>
            </button>

            <button
              onClick={handleAnalyze}
              disabled={analyzing || !jobText.trim()}
              className="btn-3d-primary px-5 py-2 text-xs font-bold cursor-pointer disabled:opacity-50"
            >
              {analyzing ? (
                <>
                  <span className="h-3.5 w-3.5 border-2 border-[#080A0E] border-t-transparent rounded-full animate-spin"></span>
                  <span>Dissecting Requisition via Qwen 2.5...</span>
                </>
              ) : (
                <>
                  <Cpu className="w-4 h-4" />
                  <span>Analyze Requisition Requirements</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Structured Requisition Intelligence */}
        <div className="card-3d p-4 sm:p-5 flex flex-col justify-between shadow-lg">
          {job ? (
            <div className="space-y-4 animate-fadeIn">
              {/* Header Badges */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/8">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-xs text-[10px] font-mono font-semibold bg-amber-500/10 text-amber-400 uppercase border border-amber-500/25">
                      {job.level}
                    </span>
                    <span className="px-2 py-0.5 rounded-xs text-[10px] font-mono font-semibold bg-[#16191F] text-zinc-300 uppercase border border-white/8">
                      {job.offer_language.toUpperCase()}
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Dissected & Validated
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white mt-1.5">{job.title}</h3>
                  {job.company && (
                    <div className="text-xs text-zinc-400 flex items-center gap-1.5 mt-0.5">
                      <Building className="w-3.5 h-3.5 text-zinc-500" />
                      <span>{job.company}</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={onNext}
                  className="self-start sm:self-auto btn-3d-primary px-4 py-1.5 text-xs font-semibold cursor-pointer"
                >
                  <span>Proceed to Match</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Skills Matrices */}
              <div className="space-y-3">
                {/* Must-Have Skills */}
                <div className="p-3.5 rounded-md surface-3d-inset">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Mandatory Requisition Competencies ({job.must_have_skills.length})</span>
                    </h4>
                    <span className="text-[10px] font-mono text-emerald-400 font-semibold">
                      Auto-Infused into CV: 100%
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mb-2 font-mono">
                    Every required skill will be directly woven into your tailored CV skills matrix, project technical stacks, and accomplishment statements.
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {job.must_have_skills.map((s) => (
                      <span
                        key={s}
                        className="text-[11px] px-2.5 py-0.5 rounded-xs bg-amber-500/10 text-amber-300 border border-amber-500/30 font-mono-code font-semibold shadow-xs"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Nice-to-Have Skills */}
                <div className="p-3.5 rounded-md surface-3d-inset">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-xs bg-zinc-400"></span>
                      <span>Secondary Competencies & Stack ({job.nice_to_have_skills.length})</span>
                    </h4>
                    <span className="text-[10px] font-mono text-zinc-500">Competitive ATS Advantage</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {job.nice_to_have_skills.length > 0 ? (
                      job.nice_to_have_skills.map((s) => (
                        <span
                          key={s}
                          className="text-[11px] px-2 py-0.5 rounded-xs bg-[#16191F] text-zinc-300 border border-white/8 font-mono-code shadow-xs"
                        >
                          {s}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-zinc-500 italic">None specified in offer</span>
                    )}
                  </div>
                </div>

                {/* Key Responsibilities */}
                {job.responsibilities && job.responsibilities.length > 0 && (
                  <div className="p-3.5 rounded-md surface-3d-inset">
                    <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300 mb-2 flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Extracted Core Missions & Scope</span>
                    </h4>
                    <ul className="text-xs text-zinc-300 space-y-1 list-disc list-inside">
                      {job.responsibilities.slice(0, 5).map((r, idx) => (
                        <li key={idx} className="line-clamp-2 text-zinc-300 text-[11px] leading-relaxed">
                          {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Empty State Guide */
            <div className="h-full min-h-90 flex flex-col items-center justify-center text-center p-8 space-y-3.5 text-zinc-500">
              <div className="w-12 h-12 rounded-md bg-[#161922] border border-white/8 flex items-center justify-center text-zinc-500 shadow-inner">
                <Layers className="w-6 h-6 text-amber-500/70" />
              </div>
              <div className="max-w-sm space-y-1">
                <h4 className="text-sm font-bold text-zinc-300">Awaiting Requisition Dissection</h4>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Click &ldquo;Analyze Requisition Requirements&rdquo; on the left panel. Local Qwen 2.5 extracts must-have competencies, nice-to-have technologies, and ATS keywords.
                </p>
              </div>
              <button
                onClick={handleAnalyze}
                disabled={analyzing || !jobText.trim()}
                className="btn-3d-secondary px-4 py-1.5 text-xs font-medium cursor-pointer"
              >
                Dissect Ingested Text →
              </button>
            </div>
          )}

          {job && (
            <div className="pt-3 border-t border-white/8 flex justify-end">
              <button
                onClick={onNext}
                className="btn-3d-primary px-5 py-2 text-xs font-bold cursor-pointer"
              >
                <span>Continue to Match & Select Projects</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
