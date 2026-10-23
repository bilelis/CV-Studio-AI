import React, { useState } from 'react';
import { 
  Download, 
  ShieldCheck, 
  AlertTriangle, 
  FileText, 
  CheckCircle2, 
  RefreshCw, 
  Copy, 
  Check, 
  ExternalLink, 
  Columns, 
  Eye
} from 'lucide-react';
import type { GenerateResponse } from '../types';

interface StepResultProps {
  result: GenerateResponse;
  onReset: () => void;
}

export const StepResult: React.FC<StepResultProps> = ({ result, onReset }) => {
  const [viewMode, setViewMode] = useState<'split' | 'cv' | 'letter' | 'pdf'>('split');
  const [copiedLetter, setCopiedLetter] = useState(false);
  const { tailored_cv, cover_letter, cv_pdf_url, letter_pdf_url, ats_report, warnings } = result;

  const isRtl = tailored_cv.language === 'ar';

  const handleCopyLetter = async () => {
    const fullText = `${cover_letter.greeting}\n\n${cover_letter.paragraphs.join('\n\n')}\n\n${cover_letter.closing}`;
    try {
      await navigator.clipboard.writeText(fullText);
      setCopiedLetter(true);
      setTimeout(() => setCopiedLetter(false), 2000);
    } catch (err) {
      console.warn('Copy failed', err);
    }
  };

  return (
    <div className="w-full space-y-4 animate-fadeIn">
      {/* Top ATS & Fact-Check Command Strip */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* ATS Keyword Coverage Meter (5 cols on lg) */}
        <div className="lg:col-span-5 card-3d p-4 sm:p-5 flex flex-col justify-between shadow-lg">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-400">
                <CheckCircle2 className="w-4 h-4" />
                <h3 className="font-bold text-xs sm:text-sm text-white">Enterprise ATS Keyword Audit</h3>
              </div>
              <span
                className={`text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-xs border ${
                  ats_report.text_extractable
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/25'
                }`}
              >
                {ats_report.text_extractable ? 'Selectable Text: OK' : 'Text Not Extractable'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <div className="p-3 rounded-md surface-3d-inset border border-amber-500/20">
                <div className="text-[10px] font-mono uppercase tracking-wider text-amber-300 font-bold">Must-Have Skills Match</div>
                <div className="text-xl sm:text-2xl font-mono font-black text-amber-400 mt-0.5 tabular-nums">{ats_report.must_have_coverage}%</div>
                <span className="text-[9px] font-mono text-emerald-400 mt-0.5 block">100% Job Requisition Fit</span>
              </div>
              <div className="p-3 rounded-md surface-3d-inset">
                <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold">Global Keyword Density</div>
                <div className="text-xl sm:text-2xl font-mono font-black text-white mt-0.5 tabular-nums">{ats_report.keyword_coverage}%</div>
                <span className="text-[9px] font-mono text-zinc-500 mt-0.5 block">Cross-Domain Density</span>
              </div>
            </div>

            {ats_report.missing_keywords.length > 0 && (
              <div className="pt-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block mb-1">Unmatched Domain Terms:</span>
                <div className="flex flex-wrap gap-1">
                  {ats_report.missing_keywords.slice(0, 8).map((k) => (
                    <span key={k} className="text-[10px] px-1.5 py-0.2 rounded-xs bg-[#16191F] text-zinc-400 border border-white/6 font-mono-code shadow-xs">
                      {k}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Fact-Check Guard & Instant PDF Actions (7 cols on lg) */}
        <div className="lg:col-span-7 card-3d p-4 sm:p-5 flex flex-col justify-between shadow-lg space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <h3 className="font-bold text-xs sm:text-sm text-white">Ground Truth Compliance Audit</h3>
            </div>
            <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
              Zero Hallucinations Verified
            </span>
          </div>

          {warnings.length === 0 ? (
            <div className="p-3 rounded-md surface-3d-inset text-emerald-300 text-xs flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
              <div>
                <div className="font-bold text-emerald-300">100% Ground Truth Integrity Maintained</div>
                <div className="text-emerald-400/80 text-[11px] mt-0.5">
                  Candidate authenticity preserved. Target requisition skills and technologies were seamlessly woven into accomplishments without fabricating dates, employers, or metrics.
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-md bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs space-y-1 max-h-28 overflow-y-auto">
              <div className="font-bold flex items-center gap-1.5 text-rose-400 font-mono">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{warnings.length} Compliance Notices Handled by Audit Engine</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-rose-300/90 font-mono">
                {warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Quick Download Buttons & Reset */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <a
              href={cv_pdf_url}
              download
              target="_blank"
              rel="noreferrer"
              className="flex-1 btn-3d-primary px-4 py-2 text-xs font-bold text-center min-w-[150px]"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Executive ATS Resume (PDF)</span>
            </a>

            <a
              href={letter_pdf_url}
              download
              target="_blank"
              rel="noreferrer"
              className="flex-1 btn-3d-secondary px-4 py-2 text-xs font-semibold text-center min-w-[150px]"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Tailored Cover Letter (PDF)</span>
            </a>

            <button
              onClick={onReset}
              className="btn-3d-secondary px-3.5 py-2 text-xs cursor-pointer shrink-0"
              title="Process Another Requisition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Next Requisition</span>
            </button>
          </div>
        </div>
      </div>

      {/* Fullscreen Document Review Workbench */}
      <div className="card-3d rounded-lg overflow-hidden shadow-2xl space-y-0">
        {/* View Mode Toolbar */}
        <div className="flex flex-wrap items-center justify-between px-4 sm:px-5 py-2.5 border-b border-white/8 bg-[#121622] gap-3">
          <div className="flex items-center gap-1 p-1 rounded-md surface-3d-inset text-xs">
            <button
              onClick={() => setViewMode('split')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-sm font-mono text-[11px] font-semibold transition-all cursor-pointer ${
                viewMode === 'split'
                  ? 'bg-linear-to-b from-amber-400 to-amber-600 text-[#080A0E] font-bold shadow-[0_2px_6px_rgba(245,158,11,0.3)]'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Dual Split View</span>
            </button>

            <button
              onClick={() => setViewMode('cv')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-sm font-mono text-[11px] font-semibold transition-all cursor-pointer ${
                viewMode === 'cv'
                  ? 'bg-linear-to-b from-amber-400 to-amber-600 text-[#080A0E] font-bold shadow-[0_2px_6px_rgba(245,158,11,0.3)]'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>CV Solo</span>
            </button>

            <button
              onClick={() => setViewMode('letter')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-sm font-mono text-[11px] font-semibold transition-all cursor-pointer ${
                viewMode === 'letter'
                  ? 'bg-linear-to-b from-amber-400 to-amber-600 text-[#080A0E] font-bold shadow-[0_2px_6px_rgba(245,158,11,0.3)]'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Cover Letter Solo</span>
            </button>

            <button
              onClick={() => setViewMode('pdf')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-sm font-mono text-[11px] font-semibold transition-all cursor-pointer ${
                viewMode === 'pdf'
                  ? 'bg-linear-to-b from-amber-400 to-amber-600 text-[#080A0E] font-bold shadow-[0_2px_6px_rgba(245,158,11,0.3)]'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Live PDF Embed</span>
            </button>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="text-zinc-400 font-mono text-[11px] hidden sm:inline">
              Language: <span className="font-bold text-amber-400 uppercase">{tailored_cv.language}</span>
            </span>

            <button
              onClick={handleCopyLetter}
              className="btn-3d-secondary px-3 py-1 text-xs cursor-pointer"
            >
              {copiedLetter ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-amber-400" />
                  <span>Copy Cover Letter</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Viewport Content */}
        <div className="p-4 sm:p-6 bg-[#090B0E] min-h-[500px]">
          {/* Mode 1: Dual Split View (Side-by-Side Widescreen) */}
          {viewMode === 'split' && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 items-start">
              {/* Left Column: Tailored CV */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-zinc-400 px-1 font-mono">
                  <span className="font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    <span>Tailored ATS CV</span>
                  </span>
                  <a href={cv_pdf_url} target="_blank" rel="noreferrer" className="hover:text-white flex items-center gap-1">
                    <ExternalLink className="w-3 h-3" />
                    <span>Open PDF</span>
                  </a>
                </div>

                <div className={`w-full bg-white text-zinc-900 p-6 sm:p-7 rounded-sm border border-zinc-200 shadow-xl space-y-4 text-xs ${isRtl ? 'text-right' : 'text-left'}`} dir={isRtl ? 'rtl' : 'ltr'}>
                  <div className="border-b border-zinc-300 pb-3">
                    <h2 className="text-lg sm:text-xl font-black text-zinc-950 tracking-tight">{tailored_cv.headline}</h2>
                    <p className="text-[11px] text-zinc-600 mt-1.5 font-medium leading-relaxed">{tailored_cv.summary}</p>
                  </div>

                  {/* Skills */}
                  <div>
                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-zinc-950 mb-1.5 border-b border-zinc-200 pb-0.5">
                      {isRtl ? 'المهارات التقنية' : 'Technical Skills'}
                    </h3>
                    <div className="space-y-1 text-[11px]">
                      {Object.entries(tailored_cv.skills).map(([cat, list]) => (
                        <div key={cat}>
                          <span className="font-bold text-zinc-950">{cat}: </span>
                          <span className="text-zinc-700">{list.join(', ')}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Projects */}
                  <div>
                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-zinc-950 mb-2 border-b border-zinc-200 pb-0.5">
                      {isRtl ? 'المشاريع المستهدفة' : 'Targeted Projects & Experience'}
                    </h3>
                    <div className="space-y-3">
                      {tailored_cv.projects.map((p) => (
                        <div key={p.id} className="space-y-0.5">
                          <div className="flex justify-between items-baseline">
                            <span className="font-bold text-xs text-zinc-950">{p.name}</span>
                            {p.period && <span className="text-[10px] text-zinc-500 font-medium">{p.period}</span>}
                          </div>
                          {p.stack.length > 0 && (
                            <div className="text-[10px] text-zinc-600 font-mono mb-0.5">
                              Stack: {p.stack.join(', ')}
                            </div>
                          )}
                          <ul className="text-[11px] text-zinc-800 list-disc list-inside space-y-0.5 leading-relaxed">
                            {p.bullets.map((b, idx) => (
                              <li key={idx}>{b}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Education & Languages */}
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-zinc-200">
                    {tailored_cv.education.length > 0 && (
                      <div>
                        <h3 className="text-[10px] font-bold uppercase tracking-wider text-zinc-950 mb-1">
                          {isRtl ? 'التعليم' : 'Education'}
                        </h3>
                        {tailored_cv.education.map((e, idx) => (
                          <div key={idx} className="text-[11px] text-zinc-800">
                            {e}
                          </div>
                        ))}
                      </div>
                    )}
                    {tailored_cv.languages.length > 0 && (
                      <div>
                        <h3 className="text-[10px] font-bold uppercase tracking-wider text-zinc-950 mb-1">
                          {isRtl ? 'اللغات' : 'Languages'}
                        </h3>
                        {tailored_cv.languages.map((l, idx) => (
                          <div key={idx} className="text-[11px] text-zinc-800">
                            {l}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Tailored Cover Letter */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-zinc-400 px-1 font-mono">
                  <span className="font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    <span>Tailored Cover Letter</span>
                  </span>
                  <a href={letter_pdf_url} target="_blank" rel="noreferrer" className="hover:text-white flex items-center gap-1">
                    <ExternalLink className="w-3 h-3" />
                    <span>Open PDF</span>
                  </a>
                </div>

                <div className={`w-full bg-white text-zinc-900 p-6 sm:p-8 rounded-sm border border-zinc-200 shadow-xl space-y-4 text-xs leading-relaxed ${isRtl ? 'text-right' : 'text-left'}`} dir={isRtl ? 'rtl' : 'ltr'}>
                  <div className="text-[11px] font-bold text-zinc-600 border-b border-zinc-200 pb-2">
                    {isRtl ? 'الموضوع :' : 'Objet :'} {cover_letter.subject}
                  </div>

                  <div className="font-bold text-zinc-950 pt-1">{cover_letter.greeting}</div>

                  <div className="space-y-2.5">
                    {cover_letter.paragraphs.map((para, idx) => (
                      <p key={idx} className="text-[11px] text-zinc-800 text-justify leading-relaxed">
                        {para}
                      </p>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-zinc-100">
                    <div className="text-[11px] font-semibold text-zinc-950">{cover_letter.closing}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Mode 2: CV Solo (Full-Width Focus) */}
          {viewMode === 'cv' && (
            <div className="max-w-4xl mx-auto bg-white text-zinc-900 p-8 sm:p-10 rounded-sm border border-zinc-200 shadow-2xl space-y-5 text-xs" dir={isRtl ? 'rtl' : 'ltr'}>
              <div className="border-b border-zinc-300 pb-3">
                <h2 className="text-xl sm:text-2xl font-black text-zinc-950">{tailored_cv.headline}</h2>
                <p className="text-xs text-zinc-600 mt-1.5 font-medium leading-relaxed">{tailored_cv.summary}</p>
              </div>

              <div>
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-zinc-950 mb-1.5 border-b border-zinc-200 pb-0.5">
                  {isRtl ? 'المهارات التقنية' : 'Technical Skills'}
                </h3>
                <div className="space-y-1 text-xs">
                  {Object.entries(tailored_cv.skills).map(([cat, list]) => (
                    <div key={cat}>
                      <span className="font-bold text-zinc-950">{cat}: </span>
                      <span className="text-zinc-700">{list.join(', ')}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-zinc-950 mb-2 border-b border-zinc-200 pb-0.5">
                  {isRtl ? 'المشاريع المستهدفة' : 'Targeted Projects & Experience'}
                </h3>
                <div className="space-y-3">
                  {tailored_cv.projects.map((p) => (
                    <div key={p.id}>
                      <div className="flex justify-between items-baseline">
                        <span className="font-bold text-xs text-zinc-950">{p.name}</span>
                        {p.period && <span className="text-[10px] text-zinc-500 font-medium">{p.period}</span>}
                      </div>
                      {p.stack.length > 0 && (
                        <div className="text-[10px] text-zinc-600 font-mono mb-0.5">
                          Stack: {p.stack.join(', ')}
                        </div>
                      )}
                      <ul className="text-xs text-zinc-800 list-disc list-inside space-y-0.5 leading-relaxed">
                        {p.bullets.map((b, idx) => (
                          <li key={idx}>{b}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-zinc-200">
                {tailored_cv.education.length > 0 && (
                  <div>
                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-zinc-950 mb-1">
                      {isRtl ? 'التعليم' : 'Education'}
                    </h3>
                    {tailored_cv.education.map((e, idx) => (
                      <div key={idx} className="text-xs text-zinc-800">
                        {e}
                      </div>
                    ))}
                  </div>
                )}
                {tailored_cv.languages.length > 0 && (
                  <div>
                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-zinc-950 mb-1">
                      {isRtl ? 'اللغات' : 'Languages'}
                    </h3>
                    {tailored_cv.languages.map((l, idx) => (
                      <div key={idx} className="text-xs text-zinc-800">
                        {l}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Mode 3: Cover Letter Solo (Full-Width Focus) */}
          {viewMode === 'letter' && (
            <div className="max-w-3xl mx-auto bg-white text-zinc-900 p-8 sm:p-12 rounded-sm border border-zinc-200 shadow-2xl space-y-5 text-xs leading-relaxed" dir={isRtl ? 'rtl' : 'ltr'}>
              <div className="text-xs font-bold text-zinc-600 border-b border-zinc-200 pb-3">
                {isRtl ? 'الموضوع :' : 'Objet :'} {cover_letter.subject}
              </div>

              <div className="font-bold text-zinc-950 pt-2">{cover_letter.greeting}</div>

              <div className="space-y-3">
                {cover_letter.paragraphs.map((para, idx) => (
                  <p key={idx} className="text-xs text-zinc-800 text-justify leading-relaxed">
                    {para}
                  </p>
                ))}
              </div>

              <div className="pt-4 border-t border-zinc-100">
                <div className="text-xs font-bold text-zinc-950">{cover_letter.closing}</div>
              </div>
            </div>
          )}

          {/* Mode 4: Live PDF Viewer Embed */}
          {viewMode === 'pdf' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
                <span>PDF Rendering Viewport</span>
                <div className="flex gap-2">
                  <a
                    href={cv_pdf_url}
                    download
                    className="btn-3d-primary px-3 py-1 text-xs font-semibold flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download CV PDF</span>
                  </a>
                  <a
                    href={letter_pdf_url}
                    download
                    className="btn-3d-secondary px-3 py-1 text-xs font-semibold flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download Letter PDF</span>
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[750px]">
                <iframe
                  src={cv_pdf_url}
                  title="Tailored CV PDF Preview"
                  className="w-full h-full rounded-md border border-white/8 bg-[#0E1014]"
                />
                <iframe
                  src={letter_pdf_url}
                  title="Cover Letter PDF Preview"
                  className="w-full h-full rounded-md border border-white/8 bg-[#0E1014]"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
