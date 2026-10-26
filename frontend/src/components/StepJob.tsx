import React, { useState } from 'react';
import { 
  ArrowLeft, 
  ArrowRight, 
  Briefcase, 
  CheckCircle2, 
  Cpu, 
  ClipboardPaste, 
  Sparkles,
  FileSearch
} from 'lucide-react';
import type { JobAnalysis } from '../types';
import { api } from '../services/api';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { BentoGrid } from './ui/bento-grid';
import { useToast } from './ui/use-toast';

interface StepJobProps {
  job: JobAnalysis | null;
  onJobAnalyzed: (analyzed: JobAnalysis) => void;
  onBack: () => void;
  onNext: () => void;
}

const BENCHMARK_TEMPLATES = [
  {
    id: 'fr-bi',
    label: 'BI & Data Engineer (Paris - 48k EUR)',
    text: `Offre d'alternance : Data Analyst / Ingénieur BI (F/H)
Entreprise : Nexa Analytics Paris
Lieu : Paris, France (Hybride)
Type de contrat : Contrat d'apprentissage / Alternance (12 à 24 mois) - Rémunération : 48,000 EUR / an

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
    label: 'Full Stack Engineer (Cloud / LLM - 4,500 TND)',
    text: `Job Opportunity: Full Stack Developer (M/F)
Company: Carthage Cloud & AI Labs
Location: Tunis, Tunisia / Remote (Hybrid)
Contract Type: CDI - Compensation: 4,500 TND / month + Bonus

Key Responsibilities:
- Build responsive, modern web interfaces using React, TypeScript, and modern CSS frameworks.
- Design, implement, and maintain high-performance REST APIs using Python (FastAPI) and Node.js.
- Integrate backend microservices with relational and document databases (PostgreSQL, MongoDB).
- Implement asynchronous task pipelines and explore integrations with local LLMs (Ollama / vLLM).
- Collaborate with the engineering team on CI/CD automation, unit testing, and Docker containerization.

Requirements:
- Final year or graduate in Computer Science or Software Engineering.
- Hands-on experience with modern TypeScript, React, and Python (FastAPI).
- Good understanding of backend microservices, SQL databases, Git, and Docker.
- Fluent in French and English with good written communication skills.`
  }
];

export const StepJob: React.FC<StepJobProps> = ({
  job,
  onJobAnalyzed,
  onBack,
  onNext,
}) => {
  const { toast } = useToast();
  const [jobText, setJobText] = useState(BENCHMARK_TEMPLATES[0].text);
  const [analyzing, setAnalyzing] = useState(false);
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
        toast('Clipboard Pasted', {
          description: `Loaded ${text.length} characters from clipboard`,
          type: 'info',
        });
      }
    } catch (err) {
      console.warn('Clipboard read failed:', err);
    }
  };

  const handleAnalyze = async () => {
    if (!jobText.trim() || analyzing) return;
    setAnalyzing(true);
    try {
      const result = await api.analyzeJob(jobText.trim());
      onJobAnalyzed(result);
      toast('Requisition Parsed', {
        description: `Extracted ${result.must_have_skills.length} mandatory skills for ${result.title}`,
        type: 'success',
      });
    } catch (err: any) {
      toast('Analysis Failed', {
        description: err.message || 'Error communicating with Ollama parser',
        type: 'error',
      });
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="w-full space-y-4">
      <BentoGrid>
        {/* HERO TILE (Largest - always first on responsive: 12 cols > 6 cols > 1 col) */}
        <Card
          variant="white"
          isHero
          icon={<FileSearch className="w-5 h-5 text-[var(--text-main)]" strokeWidth={1.75} />}
          actionArrow
          className="col-span-12 lg:col-span-8 p-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="tile-label">REQUISITION INTAKE</span>
                <Badge variant="sky" className="text-[10px]">STAGE 02</Badge>
              </div>
              <h2 className="text-2xl font-semibold tracking-tight text-[var(--text-main)]">
                Job Offer Intake & Parsing
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePasteClipboard}
                className="h-8 gap-1.5 text-xs font-semibold"
              >
                <ClipboardPaste className="w-3.5 h-3.5" strokeWidth={1.75} />
                <span>{copiedNotification ? 'Pasted!' : 'Paste'}</span>
              </Button>
            </div>
          </div>

          {/* Benchmark Presets Selector */}
          <div className="flex flex-wrap items-center gap-1.5 mb-3">
            <span className="text-[11px] font-semibold text-[var(--text-muted)] mr-1">Presets:</span>
            {BENCHMARK_TEMPLATES.map((tmpl) => (
              <button
                key={tmpl.id}
                onClick={() => setJobText(tmpl.text)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-all cursor-pointer font-medium ${
                  jobText === tmpl.text
                    ? 'bg-[var(--tile-dark)] text-white border-[var(--tile-dark)]'
                    : 'bg-[var(--secondary)] text-[var(--text-main)] border-transparent hover:border-[var(--border-strong)]'
                }`}
              >
                {tmpl.label}
              </button>
            ))}
          </div>

          {/* Offer text area */}
          <Textarea
            value={jobText}
            onChange={(e) => setJobText(e.target.value)}
            placeholder="Paste complete job description, requirements, or offer link details..."
            className="min-h-[220px] text-xs font-mono leading-relaxed"
          />

          {/* Bottom stats and action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4 pt-3 border-t border-[var(--border)]">
            <div className="text-[11px] text-[var(--text-muted)] font-mono">
              <span>{wordCount} words</span>
              <span className="mx-2">•</span>
              <span>{charCount} characters</span>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={onBack}>
                <ArrowLeft className="w-4 h-4 mr-1" strokeWidth={1.75} />
                Back
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleAnalyze}
                loading={analyzing}
                disabled={!jobText.trim()}
                className="gap-2 font-semibold"
              >
                <Sparkles className="w-4 h-4" strokeWidth={2} />
                <span>Extract Requisition Requirements</span>
              </Button>
            </div>
          </div>
        </Card>

        {/* NEAR-BLACK TILE (#111 for Contrast) - Deep Parsing Engine */}
        <Card
          variant="dark"
          icon={<Cpu className="w-5 h-5 text-white" strokeWidth={1.75} />}
          actionArrow
          className="col-span-12 sm:col-span-6 lg:col-span-4 p-6"
        >
          <span className="dark-tile-label uppercase">DEEP PARSING ENGINE</span>
          <div className="text-3xl sm:text-4xl font-bold tracking-tight text-white mt-1">OLLAMA</div>
          <p className="text-xs text-[var(--tile-dark-muted)] mt-2 leading-relaxed">
            Local qwen2.5:7b extracts role level, required hard skills, nice-to-have tools, and business responsibilities with strict structured JSON output.
          </p>
          <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-[var(--tile-dark-muted)] font-mono">
            <span>Model Spec</span>
            <span className="text-emerald-400 font-semibold">qwen2.5:7b-instruct</span>
          </div>
        </Card>

        {/* Dynamic Analysis Tiles (Rendered when job is analyzed) */}
        {job && (
          <>
            {/* KPI TILE 1 (Peach #FFE6D5) - Seniority Level */}
            <Card
              variant="peach"
              icon={<Briefcase className="w-5 h-5 text-amber-900" strokeWidth={1.75} />}
              actionArrow
              className="col-span-6 sm:col-span-3 lg:col-span-3 p-5"
            >
              <span className="tile-label text-amber-950 font-semibold">ROLE LEVEL</span>
              <div className="big-number-sm text-amber-950 mt-1 uppercase font-mono">
                {job.level || 'MID'}
              </div>
              <span className="text-xs text-amber-900 font-medium mt-1">
                {job.company || 'Enterprise'}
              </span>
            </Card>

            {/* KPI TILE 2 (Sky #DCEBFF) - Mandatory Skills Count */}
            <Card
              variant="sky"
              icon={<CheckCircle2 className="w-5 h-5 text-sky-800" strokeWidth={1.75} />}
              actionArrow
              className="col-span-6 sm:col-span-3 lg:col-span-3 p-5"
            >
              <span className="tile-label text-sky-900 font-semibold">MANDATORY REQS</span>
              <div className="big-number text-sky-950 mt-1">
                {job.must_have_skills?.length || 0}
              </div>
              <span className="text-xs text-sky-800 font-medium mt-1">Skills extracted</span>
            </Card>

            {/* TILE 3 (Mint #D9F5E6) - Must Have Skills Chips */}
            <Card
              variant="mint"
              className="col-span-12 sm:col-span-6 lg:col-span-6 p-5"
            >
              <span className="tile-label text-emerald-950 font-semibold">
                MUST-HAVE SKILLS ({job.must_have_skills?.length || 0})
              </span>
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {job.must_have_skills?.map((skill) => (
                  <span
                    key={skill}
                    className="text-xs font-mono font-medium px-2.5 py-1 rounded-full bg-white text-emerald-900 border border-emerald-900/10 shadow-2xs"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </Card>

            {/* TILE 4 (Lavender #E9E3FF) - Nice-to-Have & Keywords */}
            <Card
              variant="lavender"
              className="col-span-12 sm:col-span-6 lg:col-span-6 p-5"
            >
              <span className="tile-label text-purple-950 font-semibold">
                NICE-TO-HAVE & KEYWORDS
              </span>
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {(job.nice_to_have_skills || []).concat(job.keywords || []).slice(0, 10).map((kw) => (
                  <span
                    key={kw}
                    className="text-xs font-mono px-2 py-0.5 rounded-full bg-white text-purple-900 border border-purple-900/10 shadow-2xs"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </Card>

            {/* BOTTOM PROCEED TILE (White, 12 Columns) */}
            <Card variant="white" className="col-span-12 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="tile-label">REQUISITION ANALYZED</span>
                <h4 className="text-base font-semibold text-[var(--text-main)]">
                  {job.title} — {job.company || 'Target Organization'}
                </h4>
              </div>

              <Button variant="primary" size="lg" onClick={onNext} className="gap-2 font-semibold">
                <span>Proceed to Semantic Match</span>
                <ArrowRight className="w-4 h-4" strokeWidth={2} />
              </Button>
            </Card>
          </>
        )}
      </BentoGrid>
    </div>
  );
};
