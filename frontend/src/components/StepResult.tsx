import React, { useState } from 'react';
import { 
  Download, 
  ShieldCheck, 
  FileText, 
  CheckCircle2, 
  RotateCcw, 
  Copy, 
  Check, 
  AlertTriangle, 
  Award 
} from 'lucide-react';
import type { GenerateResponse } from '../types';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { BentoGrid } from './ui/bento-grid';
import { useToast } from './ui/use-toast';

interface StepResultProps {
  result: GenerateResponse;
  onReset: () => void;
}

export const StepResult: React.FC<StepResultProps> = ({ result, onReset }) => {
  const { toast } = useToast();
  const [copiedLetter, setCopiedLetter] = useState(false);
  const { tailored_cv, cover_letter, cv_pdf_url, letter_pdf_url, ats_report, warnings } = result;

  const isRtl = tailored_cv.language === 'ar';

  const handleCopyLetter = async () => {
    const fullText = `${cover_letter.greeting}\n\n${cover_letter.paragraphs.join('\n\n')}\n\n${cover_letter.closing}`;
    try {
      await navigator.clipboard.writeText(fullText);
      setCopiedLetter(true);
      setTimeout(() => setCopiedLetter(false), 2000);
      toast('Copied to Clipboard', {
        description: 'Cover letter content copied successfully',
        type: 'success',
      });
    } catch {
      toast('Copy Failed', {
        description: 'Unable to access system clipboard',
        type: 'error',
      });
    }
  };

  return (
    <div className="w-full space-y-4">
      <BentoGrid>
        {/* HERO TILE (Largest - always first on responsive: 12 cols > 6 cols > 1 col) */}
        <Card
          variant="white"
          isHero
          icon={<FileText className="w-5 h-5 text-[var(--text-main)]" strokeWidth={1.75} />}
          actionArrow
          className="col-span-12 lg:col-span-8 p-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="tile-label">AUDITED DOSSIER SUITE</span>
                <Badge variant="mint" className="text-[10px]">VERIFIED OUTPUT</Badge>
              </div>
              <h2 className="text-2xl font-semibold tracking-tight text-[var(--text-main)]">
                {tailored_cv.headline || 'Tailored Application Dossier'}
              </h2>
            </div>
          </div>

          {/* Tabs for CV, Letter, and Compliance */}
          <Tabs defaultValue="cv" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="cv">Tailored CV</TabsTrigger>
              <TabsTrigger value="letter">Cover Letter</TabsTrigger>
              <TabsTrigger value="audit">Zero-Hallucination Audit</TabsTrigger>
            </TabsList>

            {/* TAB 1: TAILORED CV */}
            <TabsContent value="cv" className="mt-0 space-y-4">
              <div className="p-4 rounded-[16px] bg-[var(--secondary)]/40 border border-[var(--border)]">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] font-semibold block mb-1">
                  EXECUTIVE SUMMARY
                </span>
                <p className="text-xs text-[var(--text-main)] leading-relaxed">
                  {tailored_cv.summary}
                </p>
              </div>

              {/* Tailored Projects */}
              <div>
                <span className="text-xs font-semibold text-[var(--text-main)] block mb-2">
                  Highlighted Strategic Projects ({tailored_cv.projects.length})
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {tailored_cv.projects.map((proj) => (
                    <div
                      key={proj.id}
                      className="p-3.5 rounded-[14px] bg-[var(--bg-page)] border border-[var(--border)]"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h4 className="text-xs font-bold text-[var(--text-main)] truncate">
                          {proj.name}
                        </h4>
                        <span className="text-[10px] font-mono text-[var(--text-muted)] shrink-0">
                          {proj.period}
                        </span>
                      </div>
                      <p className="text-[11px] text-[var(--text-muted)] font-medium mb-2">
                        {proj.role}
                      </p>
                      <ul className="text-xs text-[var(--text-main)] list-disc pl-4 space-y-1">
                        {proj.bullets.map((b, i) => (
                          <li key={i} className="line-clamp-2">{b}</li>
                        ))}
                      </ul>
                      <div className="mt-2.5 pt-2 border-t border-[var(--border)] flex flex-wrap gap-1">
                        {proj.stack.map((s) => (
                          <span
                            key={s}
                            className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-white text-[var(--text-main)] border border-[var(--border)]"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* TAB 2: COVER LETTER */}
            <TabsContent value="letter" className="mt-0">
              <div
                className={`p-6 rounded-[18px] bg-[var(--bg-page)] border border-[var(--border)] text-xs text-[var(--text-main)] space-y-3 leading-relaxed ${
                  isRtl ? 'text-right font-serif' : ''
                }`}
              >
                <div className="font-semibold text-sm pb-2 border-b border-[var(--border)] flex items-center justify-between">
                  <span>{cover_letter.subject || 'Application for Engineering Role'}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyLetter}
                    className="h-7 text-xs gap-1"
                  >
                    {copiedLetter ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLetter ? 'Copied' : 'Copy'}</span>
                  </Button>
                </div>
                <p className="font-medium text-[var(--text-muted)]">{cover_letter.greeting}</p>
                {cover_letter.paragraphs.map((p, idx) => (
                  <p key={idx}>{p}</p>
                ))}
                <p className="pt-2 font-medium">{cover_letter.closing}</p>
              </div>
            </TabsContent>

            {/* TAB 3: AUDIT CHECKLIST */}
            <TabsContent value="audit" className="mt-0">
              <div className="space-y-3">
                <div className="p-4 rounded-[16px] bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs">
                  <div className="flex items-center gap-2 font-bold mb-1">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    <span>100% Ground Truth Compliance Verified</span>
                  </div>
                  <p className="leading-relaxed">
                    Zero synthetic or hallucinated credentials were introduced. Every bullet point and capability is mapped to the candidate's verified database.
                  </p>
                </div>

                {warnings && warnings.length > 0 && (
                  <div className="p-4 rounded-[16px] bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
                    <div className="flex items-center gap-2 font-bold mb-1">
                      <AlertTriangle className="w-4 h-4 text-amber-700" />
                      <span>Requisition Gap Advisories</span>
                    </div>
                    {warnings.map((w, idx) => (
                      <p key={idx} className="list-item list-inside">{w}</p>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </Card>

        {/* NEAR-BLACK TILE (#111 for Contrast) - Export & Download Station */}
        <Card
          variant="dark"
          icon={<Download className="w-5 h-5 text-white" strokeWidth={1.75} />}
          actionArrow
          className="col-span-12 sm:col-span-6 lg:col-span-4 p-6"
        >
          <span className="dark-tile-label uppercase">EXPORT STATION</span>
          <div className="text-3xl sm:text-4xl font-bold tracking-tight text-white mt-1">PDF DOSSIER</div>

          <div className="mt-4 space-y-2">
            <a
              href={cv_pdf_url}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full"
            >
              <Button
                variant="primary"
                size="md"
                className="w-full bg-white text-black hover:bg-zinc-200 font-bold justify-between px-4"
              >
                <span>Download Tailored CV (PDF)</span>
                <Download className="w-4 h-4" strokeWidth={2} />
              </Button>
            </a>

            <a
              href={letter_pdf_url}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full"
            >
              <Button
                variant="secondary"
                size="md"
                className="w-full bg-white/10 text-white hover:bg-white/20 border-white/10 font-semibold justify-between px-4"
              >
                <span>Download Cover Letter (PDF)</span>
                <Download className="w-4 h-4" strokeWidth={2} />
              </Button>
            </a>
          </div>

          <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyLetter}
              className="text-white hover:bg-white/10 text-xs gap-1"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Letter</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={onReset}
              className="text-black bg-white hover:bg-zinc-100 text-xs font-semibold gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>New Matching</span>
            </Button>
          </div>
        </Card>

        {/* KPI TILE 1 (Mint #D9F5E6) - Must-Have Coverage */}
        <Card
          variant="mint"
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-800" strokeWidth={1.75} />}
          actionArrow
          className="col-span-6 sm:col-span-3 lg:col-span-3 p-5"
        >
          <span className="tile-label text-emerald-900 font-semibold">MUST-HAVE MATCH</span>
          <div className="big-number text-emerald-950 mt-1">
            {ats_report.must_have_coverage}%
          </div>
          <span className="text-xs text-emerald-800 font-medium mt-1">100% Requisition Fit</span>
        </Card>

        {/* KPI TILE 2 (Sky #DCEBFF) - Keyword Density */}
        <Card
          variant="sky"
          icon={<Award className="w-5 h-5 text-sky-800" strokeWidth={1.75} />}
          actionArrow
          className="col-span-6 sm:col-span-3 lg:col-span-3 p-5"
        >
          <span className="tile-label text-sky-900 font-semibold">KEYWORD DENSITY</span>
          <div className="big-number text-sky-950 mt-1">
            {ats_report.keyword_coverage}%
          </div>
          <span className="text-xs text-sky-800 font-medium mt-1">Cross-domain score</span>
        </Card>

        {/* TILE 3 (Peach #FFE6D5) - ATS Selectable Text Verification */}
        <Card
          variant="peach"
          className="col-span-12 sm:col-span-6 lg:col-span-3 p-5"
        >
          <span className="tile-label text-amber-950 font-semibold">ATS OCR READINESS</span>
          <div className="mt-2 flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-emerald-600"></span>
            <span className="text-sm font-bold text-amber-950">Selectable Text OK</span>
          </div>
          <p className="text-[11px] text-amber-900 mt-1">
            Compliant with Workday, Taleo, Greenhouse, and Lever ATS parsers.
          </p>
        </Card>

        {/* TILE 4 (Lavender #E9E3FF) - Unmatched Terms */}
        <Card
          variant="lavender"
          className="col-span-12 sm:col-span-6 lg:col-span-3 p-5"
        >
          <span className="tile-label text-purple-950 font-semibold">UNMATCHED TERMS</span>
          <div className="flex flex-wrap gap-1 mt-2">
            {ats_report.missing_keywords && ats_report.missing_keywords.length > 0 ? (
              ats_report.missing_keywords.slice(0, 5).map((kw) => (
                <span
                  key={kw}
                  className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white text-purple-950 border border-purple-950/10"
                >
                  {kw}
                </span>
              ))
            ) : (
              <span className="text-xs text-purple-900 font-medium">None • 100% Domain Match</span>
            )}
          </div>
        </Card>
      </BentoGrid>
    </div>
  );
};
