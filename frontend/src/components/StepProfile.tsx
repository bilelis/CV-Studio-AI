import React, { useState, useMemo } from 'react';
import { 
  UploadCloud, 
  Plus, 
  ArrowRight, 
  Check, 
  GraduationCap, 
  Code2, 
  Globe, 
  Search, 
  ExternalLink, 
  Mail, 
  MapPin, 
  Phone, 
  Sparkles,
  Layers,
  X
} from 'lucide-react';
import type { MasterProfile, Project } from '../types';
import { api } from '../services/api';

interface StepProfileProps {
  profile: MasterProfile | null;
  onProfileUpdated: (updated: MasterProfile) => void;
  onNext: () => void;
}

export const StepProfile: React.FC<StepProfileProps> = ({
  profile,
  onProfileUpdated,
  onNext,
}) => {
  const [uploading, setUploading] = useState(false);
  const [ghUser, setGhUser] = useState(profile?.basics?.github || 'https://github.com/bilelis');
  const [ghLoading, setGhLoading] = useState(false);
  const [ghCandidates, setGhCandidates] = useState<Project[]>([]);
  const [selectedGhIds, setSelectedGhIds] = useState<Set<string>>(new Set());
  const [savingGh, setSavingGh] = useState(false);

  // Search and filter state for projects bank
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'cv' | 'github' | 'manual'>('all');

  // Manual project form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProject, setNewProject] = useState<Partial<Project>>({
    name: '',
    role: 'Developer',
    year: '2026',
    stack: [],
    bullets: [''],
    source: 'manual',
    url: '',
  });
  const [stackInput, setStackInput] = useState('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const updated = await api.importCvPdf(file);
      onProfileUpdated(updated);
    } catch (err: any) {
      alert(`CV Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleFetchGithub = async () => {
    if (!ghUser.trim()) return;
    setGhLoading(true);
    try {
      const candidates = await api.importGithub(ghUser.trim());
      setGhCandidates(candidates);
      setSelectedGhIds(new Set(candidates.map((c) => c.id)));
    } catch (err: any) {
      alert(`GitHub import failed: ${err.message}`);
    } finally {
      setGhLoading(false);
    }
  };

  const toggleGhSelect = (id: string) => {
    const next = new Set(selectedGhIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedGhIds(next);
  };

  const toggleAllGh = () => {
    if (selectedGhIds.size === ghCandidates.length) {
      setSelectedGhIds(new Set());
    } else {
      setSelectedGhIds(new Set(ghCandidates.map((c) => c.id)));
    }
  };

  const handleSaveSelectedGithub = async () => {
    if (selectedGhIds.size === 0) return;
    setSavingGh(true);
    try {
      const selected = ghCandidates.filter((c) => selectedGhIds.has(c.id));
      const updated = await api.bulkAddProjects(selected);
      onProfileUpdated(updated);
      setGhCandidates([]);
      setSelectedGhIds(new Set());
    } catch (err: any) {
      alert(`Failed to save repos: ${err.message}`);
    } finally {
      setSavingGh(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.name?.trim()) return;

    const stack = stackInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const bullets = (newProject.bullets || []).map((b) => b.trim()).filter(Boolean);

    const projectToSave: Project = {
      id: `manual_${Date.now()}`,
      name: newProject.name.trim(),
      role: newProject.role?.trim() || 'Developer',
      year: newProject.year?.trim() || '2026',
      stack: stack.length > 0 ? stack : ['General'],
      bullets: bullets.length > 0 ? bullets : ['Led technical execution.'],
      source: 'manual',
      url: '',
    };

    try {
      const updated = await api.addProject(projectToSave);
      onProfileUpdated(updated);
      setShowAddModal(false);
      setNewProject({
        name: '',
        role: 'Developer',
        year: '2026',
        stack: [],
        bullets: [''],
        source: 'manual',
        url: '',
      });
      setStackInput('');
    } catch (err: any) {
      alert(`Failed to add project: ${err.message}`);
    }
  };

  // Filter projects based on search query and source filter
  const filteredProjects = useMemo(() => {
    if (!profile?.projects) return [];
    return profile.projects.filter((p) => {
      const matchesSource = sourceFilter === 'all' || p.source === sourceFilter;
      const query = searchQuery.toLowerCase().trim();
      if (!query) return matchesSource;
      const matchesName = p.name.toLowerCase().includes(query);
      const matchesStack = p.stack.some((s) => s.toLowerCase().includes(query));
      const matchesRole = p.role?.toLowerCase().includes(query);
      const matchesBullets = p.bullets.some((b) => b.toLowerCase().includes(query));
      return matchesSource && (matchesName || matchesStack || matchesRole || matchesBullets);
    });
  }, [profile?.projects, searchQuery, sourceFilter]);

  return (
    <div className="w-full space-y-4 animate-fadeIn">
      {/* Top Header: Clean Title & 3D Tactile Actions (Removed awkward stat badge boxes) */}
      <div className="card-3d p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Candidate Dossier & Project Bank
            </h2>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
              <span>Ground Truth Ready</span>
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Verified master profile and repository assets indexed for semantic ATS alignment.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex-1 sm:flex-none btn-3d-secondary px-4 py-2 text-xs"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" />
            <span>Add Custom Project</span>
          </button>

          <button
            onClick={onNext}
            className="flex-1 sm:flex-none btn-3d-primary px-5 py-2 text-xs"
          >
            <span>Proceed to Job Offer</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* GitHub Candidates Selection Modal / Expansive Drawer */}
      {ghCandidates.length > 0 && (
        <div className="card-3d p-5 border-amber-500/50 shadow-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h4 className="font-bold text-white text-sm">
                  Discovered {ghCandidates.length} GitHub Repositories
                </h4>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Select repositories to index into your Master Project Bank for ATS matching.
              </p>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                onClick={toggleAllGh}
                className="px-2.5 py-1 text-xs text-amber-400 hover:text-amber-300 font-medium cursor-pointer"
              >
                {selectedGhIds.size === ghCandidates.length ? 'Deselect All' : 'Select All'}
              </button>
              <button
                onClick={() => setGhCandidates([])}
                className="px-2.5 py-1 text-xs text-zinc-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSelectedGithub}
                disabled={savingGh || selectedGhIds.size === 0}
                className="btn-3d-primary px-4 py-1.5 text-xs disabled:opacity-50"
              >
                {savingGh ? 'Saving...' : `Import ${selectedGhIds.size} Repos`}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 max-h-96 overflow-y-auto pr-1">
            {ghCandidates.map((c) => {
              const isChecked = selectedGhIds.has(c.id);
              return (
                <div
                  key={c.id}
                  onClick={() => toggleGhSelect(c.id)}
                  className={`card-3d-interactive p-3.5 text-left cursor-pointer transition-all ${
                    isChecked
                      ? 'border-amber-500/70 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15),0_6px_18px_rgba(245,158,11,0.2)]'
                      : 'text-zinc-400 hover:border-zinc-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-xs text-white truncate">{c.name}</span>
                    <div
                      className={`w-4 h-4 rounded-xs flex items-center justify-center border transition-all ${
                        isChecked ? 'bg-linear-to-b from-amber-400 to-amber-600 border-amber-400 text-[#080A0E] shadow-xs' : 'border-zinc-700'
                      }`}
                    >
                      {isChecked && <Check className="w-3 h-3 stroke-3" />}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {c.stack.map((t) => (
                      <span key={t} className="text-[9px] px-1.5 py-0.2 rounded-xs bg-[#16191F] text-amber-300 font-mono-code border border-white/5">
                        {t}
                      </span>
                    ))}
                  </div>
                  <p className="text-[11px] text-zinc-400 line-clamp-2">{c.bullets[0]}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Fullscreen 2-Column Workstation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Column: Candidate Dossier & Ingestion Tools (5 cols on lg, 4 cols on 2xl) */}
        <div className="lg:col-span-5 2xl:col-span-4 space-y-4">
          {/* Candidate Profile Card */}
          {profile && (
            <div className="card-3d p-4 sm:p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-md bg-linear-to-b from-[#242C3D] to-[#121622] border border-amber-500/50 flex items-center justify-center text-amber-400 font-mono font-bold text-sm shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2),0_4px_12px_rgba(0,0,0,0.5)]">
                    {profile.basics.name
                      ? profile.basics.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()
                      : 'CV'}
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">{profile.basics.name}</h2>
                    <p className="text-xs text-amber-400 font-medium">{profile.basics.headline}</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-sm text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-xs">
                  Verified
                </span>
              </div>

              {/* Contact Info (3D Inset Box) */}
              <div className="space-y-1.5 text-xs text-zinc-300 surface-3d-inset p-3 rounded-md">
                <div className="flex items-center gap-2 text-zinc-400">
                  <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                  <span className="truncate">{profile.basics.location || 'Not specified'}</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-400">
                  <Mail className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                  <span className="truncate">{profile.basics.email}</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-400">
                  <Phone className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                  <span>{profile.basics.phone}</span>
                </div>
                {profile.basics.github && (
                  <div className="flex items-center gap-2 text-amber-400 pt-0.5">
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    <a
                      href={profile.basics.github.startsWith('http') ? profile.basics.github : `https://${profile.basics.github}`}
                      target="_blank"
                      rel="noreferrer"
                      className="truncate hover:underline font-mono text-[11px]"
                    >
                      {profile.basics.github}
                    </a>
                  </div>
                )}
              </div>

              {/* Summary */}
              {profile.summary && (
                <div>
                  <h3 className="text-[10px] font-mono font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                    Executive Profile Summary
                  </h3>
                  <p className="text-xs text-zinc-300 leading-relaxed surface-3d-inset p-3 rounded-md">
                    {profile.summary}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Ingestion Station: CV Upload & GitHub Importer */}
          <div className="card-3d p-4 sm:p-5 space-y-3.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
              <UploadCloud className="w-4 h-4 text-amber-400" />
              <span>Import & Synchronize Data</span>
            </h3>

            {/* CV PDF Upload Zone */}
            <div className="p-3.5 rounded-md surface-3d-inset space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">Import CV Document (PDF)</span>
                <span className="text-[10px] font-mono text-zinc-400">FR / EN format</span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Extract sections, metrics, and bullets via local Qwen 2.5 parser.
              </p>
              <label className="btn-3d-secondary w-full py-2.5 text-xs cursor-pointer">
                {uploading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-3 w-3 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></span>
                    <span>Extracting PDF Data...</span>
                  </span>
                ) : (
                  <>
                    <UploadCloud className="w-3.5 h-3.5 text-amber-400" />
                    <span>Upload & Parse CV PDF</span>
                  </>
                )}
                <input type="file" accept=".pdf" className="hidden" onChange={handleFileUpload} disabled={uploading} />
              </label>
            </div>

            {/* GitHub Repos Importer */}
            <div className="p-3.5 rounded-md surface-3d-inset space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">GitHub Repositories</span>
                <span className="text-[10px] font-mono text-zinc-400">Public profile</span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Fetch and index public repositories with technology stack detection.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={ghUser}
                  onChange={(e) => setGhUser(e.target.value)}
                  placeholder="github.com/username"
                  className="flex-1 px-3 py-1.5 text-xs rounded-md bg-[#07090C] border border-white/10 text-white focus:outline-none focus:border-amber-500 font-mono shadow-inner"
                />
                <button
                  onClick={handleFetchGithub}
                  disabled={ghLoading}
                  className="btn-3d-secondary px-3.5 py-1.5 text-xs font-medium cursor-pointer"
                >
                  {ghLoading ? (
                    <span className="h-3 w-3 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    'Fetch'
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Core Skills Bank */}
          {profile?.skills && (
            <div className="card-3d p-4 sm:p-5 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                <Code2 className="w-4 h-4 text-amber-400" />
                <span>Verified Skills Taxonomy</span>
              </h3>
              <div className="space-y-2.5">
                {Object.entries(profile.skills).map(([cat, skills]) => (
                  <div key={cat} className="p-2.5 rounded-md surface-3d-inset">
                    <div className="text-[11px] font-mono font-semibold text-zinc-300 mb-1.5">{cat}</div>
                    <div className="flex flex-wrap gap-1">
                      {skills.map((s) => (
                        <span
                          key={s}
                          className="text-[10px] px-2 py-0.5 rounded-xs bg-[#121620] text-zinc-300 border border-white/6 font-mono-code shadow-xs"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Education & Languages */}
          {profile && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="card-3d p-3.5 space-y-2">
                <h4 className="text-[10px] font-mono font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Education</span>
                </h4>
                {profile.education.map((e, idx) => (
                  <div key={idx} className="text-xs text-zinc-300">
                    <div className="font-bold text-white text-[11px]">{e.degree}</div>
                    <div className="text-zinc-400 text-[10px]">{e.period} • {e.location}</div>
                  </div>
                ))}
              </div>

              <div className="card-3d p-3.5 space-y-2">
                <h4 className="text-[10px] font-mono font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-amber-400" />
                  <span>Languages</span>
                </h4>
                <ul className="text-xs text-zinc-300 space-y-1">
                  {profile.languages.map((l, idx) => (
                    <li key={idx} className="flex items-center gap-1.5 text-[11px]">
                      <span className="w-1.5 h-1.5 rounded-xs bg-amber-400"></span>
                      <span>{l}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Master Projects Bank (7 cols on lg, 8 cols on 2xl) */}
        <div className="lg:col-span-7 2xl:col-span-8 space-y-3.5">
          {/* Projects Bank Header with Real-Time Search & Source Filters */}
          <div className="card-3d p-4 sm:p-5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-400" />
                  <span>Master Projects Bank</span>
                  <span className="text-[11px] font-mono px-2 py-0.2 rounded-xs bg-[#16191F] text-amber-300 border border-white/10 shadow-xs">
                    {filteredProjects.length} / {profile?.projects.length || 0}
                  </span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Ground-truth candidate repositories and projects available for semantic ATS matching.
                </p>
              </div>

              {/* Source Filters (3D Pill Segmented Control) */}
              <div className="flex items-center gap-1 surface-3d-inset p-1 rounded-md text-xs self-start sm:self-auto">
                {(['all', 'cv', 'github', 'manual'] as const).map((source) => (
                  <button
                    key={source}
                    onClick={() => setSourceFilter(source)}
                    className={`px-3 py-1 rounded-sm font-mono font-medium transition-all uppercase text-[10px] cursor-pointer ${
                      sourceFilter === source
                        ? 'bg-linear-to-b from-amber-400 to-amber-600 text-[#080A0E] font-bold shadow-[0_2px_6px_rgba(245,158,11,0.3)]'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {source}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Input Bar (3D Inset) */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects by name, technology (e.g. React, Python, Power BI), or role..."
                className="w-full pl-9 pr-4 py-2 text-xs rounded-md surface-3d-inset text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Responsive Multi-Column Project Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredProjects.map((p) => (
              <div
                key={p.id}
                className="card-3d-interactive p-4 sm:p-5 flex flex-col justify-between group cursor-pointer"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h4 className="font-bold text-xs sm:text-sm text-white group-hover:text-amber-400 transition-colors">
                      {p.name}
                    </h4>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-xs bg-[#16191F] text-zinc-400 border border-white/6">
                        {p.year}
                      </span>
                      <span className={`text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.2 rounded-xs border ${
                        p.source === 'github'
                          ? 'bg-[#16191F] text-amber-300 border-amber-500/30'
                          : p.source === 'cv'
                          ? 'bg-[#16191F] text-zinc-300 border-white/10'
                          : 'bg-[#16191F] text-emerald-300 border-emerald-500/30'
                      }`}>
                        {p.source}
                      </span>
                    </div>
                  </div>

                  {p.role && (
                    <div className="text-[11px] text-amber-400/90 font-medium mb-2">
                      {p.role}
                    </div>
                  )}

                  {/* Stack Pills */}
                  <div className="flex flex-wrap gap-1 mb-2.5">
                    {p.stack.map((s) => (
                      <span
                        key={s}
                        className="text-[9px] px-1.5 py-0.2 rounded-xs bg-[#11141B] text-zinc-300 border border-white/6 font-mono-code shadow-xs"
                      >
                        {s}
                      </span>
                    ))}
                  </div>

                  {/* Bullets */}
                  <ul className="text-xs text-zinc-300 space-y-1 list-disc list-inside">
                    {p.bullets.map((b, idx) => (
                      <li key={idx} className="line-clamp-2 text-[11px] text-zinc-300 leading-relaxed">
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>

                {p.url && (
                  <div className="pt-2.5 mt-2.5 border-t border-white/6 flex items-center justify-between">
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-mono font-medium"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>View Repository</span>
                    </a>
                  </div>
                )}
              </div>
            ))}

            {filteredProjects.length === 0 && (
              <div className="col-span-full card-3d p-8 text-center text-zinc-400 space-y-2">
                <Layers className="w-8 h-8 text-zinc-600 mx-auto" />
                <div className="font-bold text-white text-sm">No matching projects found</div>
                <p className="text-xs text-zinc-500">
                  Try adjusting your search query or source filter, or click &ldquo;Add Custom Project&rdquo;.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Manual Project Modal (3D Layered) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="card-3d w-full max-w-xl p-5 sm:p-6 border-white/15 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-amber-400" />
                <span>Add Custom Project to Ground Truth Bank</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Project Name</label>
                <input
                  type="text"
                  required
                  value={newProject.name || ''}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  placeholder="e.g. Distributed Analytics Engine"
                  className="w-full px-3 py-2 text-xs rounded-md surface-3d-inset text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">Role</label>
                  <input
                    type="text"
                    value={newProject.role || ''}
                    onChange={(e) => setNewProject({ ...newProject, role: e.target.value })}
                    placeholder="e.g. Full Stack Developer"
                    className="w-full px-3 py-2 text-xs rounded-md surface-3d-inset text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">Year</label>
                  <input
                    type="text"
                    value={newProject.year || ''}
                    onChange={(e) => setNewProject({ ...newProject, year: e.target.value })}
                    placeholder="e.g. 2026"
                    className="w-full px-3 py-2 text-xs rounded-md surface-3d-inset text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Technologies (comma separated)</label>
                <input
                  type="text"
                  value={stackInput}
                  onChange={(e) => setStackInput(e.target.value)}
                  placeholder="e.g. React, TypeScript, FastAPI, PostgreSQL, Docker"
                  className="w-full px-3 py-2 text-xs rounded-md surface-3d-inset text-white focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Bullet Point 1 (Truthful Fact)</label>
                <input
                  type="text"
                  required
                  value={newProject.bullets?.[0] || ''}
                  onChange={(e) => {
                    const bullets = [...(newProject.bullets || [''])];
                    bullets[0] = e.target.value;
                    setNewProject({ ...newProject, bullets });
                  }}
                  placeholder="Developed automated ETL pipelines processing 100k daily records..."
                  className="w-full px-3 py-2 text-xs rounded-md surface-3d-inset text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Bullet Point 2 (Optional)</label>
                <input
                  type="text"
                  value={newProject.bullets?.[1] || ''}
                  onChange={(e) => {
                    const bullets = [...(newProject.bullets || ['', ''])];
                    bullets[1] = e.target.value;
                    setNewProject({ ...newProject, bullets });
                  }}
                  placeholder="Integrated Ollama embeddings for semantic search retrieval..."
                  className="w-full px-3 py-2 text-xs rounded-md surface-3d-inset text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-3d-secondary px-4 py-2 text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-3d-primary px-5 py-2 text-xs cursor-pointer"
                >
                  Save Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
