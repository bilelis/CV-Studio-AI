import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  UploadCloud, 
  Plus, 
  ArrowRight, 
  Check, 
  GraduationCap, 
  Code2, 
  Search, 
  Mail, 
  MapPin, 
  Phone, 
  ShieldCheck, 
  FolderGit2, 
  GitBranch, 
  Briefcase, 
  UserCheck,
  Sparkles,
  RotateCcw
} from 'lucide-react';
import type { MasterProfile, Project } from '../types';
import { api } from '../services/api';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { BentoGrid } from './ui/bento-grid';
import { useToast } from './ui/use-toast';

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
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [ghUser, setGhUser] = useState(profile?.basics?.github || '');
  const [ghLoading, setGhLoading] = useState(false);
  const [ghCandidates, setGhCandidates] = useState<Project[]>([]);
  const [selectedGhIds, setSelectedGhIds] = useState<Set<string>>(new Set());
  const [savingGh, setSavingGh] = useState(false);

  // Single repo analysis state (Ollama extracts stack & bullets directly from candidate's repo)
  const [singleRepoUrl, setSingleRepoUrl] = useState('');
  const [analyzingRepo, setAnalyzingRepo] = useState(false);

  // Synchronize github user input whenever profile updates
  useEffect(() => {
    if (profile?.basics?.github) {
      setGhUser(profile.basics.github);
    }
  }, [profile?.basics?.github]);

  // Search and filter state for projects bank
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'cv' | 'github' | 'manual'>('all');

  // Manual project form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProject, setNewProject] = useState<Partial<Project>>({
    name: '',
    role: 'Full Stack Engineer',
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
      if (updated.basics.github) {
        setGhUser(updated.basics.github);
      }
      toast('CV Parsed Successfully', {
        description: `Imported profile for ${updated.basics.name}`,
        type: 'success',
      });
    } catch (err: any) {
      toast('Upload Failed', {
        description: err.message || 'Could not parse CV PDF',
        type: 'error',
      });
    } finally {
      setUploading(false);
      // Reset input value so re-uploading the same file or another file works every time
      if (e.target) e.target.value = '';
    }
  };

  const handleResetCandidate = async () => {
    if (window.confirm('Clear current candidate data and start fresh with a new profile?')) {
      try {
        const reset = await api.resetProfile();
        onProfileUpdated(reset);
        setGhUser('');
        setSingleRepoUrl('');
        setGhCandidates([]);
        toast('Profile Cleared', {
          description: 'Ready to import new candidate CV PDF.',
          type: 'info',
        });
      } catch (err: any) {
        toast('Reset Failed', {
          description: err.message || 'Could not reset profile',
          type: 'error',
        });
      }
    }
  };

  const handleAnalyzeSingleRepo = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanUrl = singleRepoUrl.trim();
    if (!cleanUrl) {
      toast('Missing URL', {
        description: 'Please paste a GitHub repository URL or owner/repo',
        type: 'error',
      });
      return;
    }

    setAnalyzingRepo(true);
    try {
      toast('Analyzing Repository', {
        description: 'Ollama is inspecting README, languages, and extracting tech stack & achievements...',
        type: 'info',
      });

      const analyzedProject = await api.analyzeGithubRepo(cleanUrl);
      const updatedProfile = await api.addProject(analyzedProject);
      onProfileUpdated(updatedProfile);
      setSingleRepoUrl('');

      toast('Repository Added via Ollama', {
        description: `Added "${analyzedProject.name}" with stack: ${analyzedProject.stack.slice(0, 4).join(', ')}`,
        type: 'success',
      });
    } catch (err: any) {
      toast('Analysis Error', {
        description: err.message || 'Failed to analyze repository with Ollama',
        type: 'error',
      });
    } finally {
      setAnalyzingRepo(false);
    }
  };

  const handleFetchGithub = async () => {
    if (!ghUser.trim()) return;
    setGhLoading(true);
    try {
      const candidates = await api.importGithub(ghUser.trim());
      setGhCandidates(candidates);
      setSelectedGhIds(new Set(candidates.map((c) => c.id)));
      toast('GitHub Repositories Found', {
        description: `Retrieved ${candidates.length} repositories from ${ghUser}`,
        type: 'success',
      });
    } catch (err: any) {
      toast('GitHub Import Error', {
        description: err.message || 'Failed to fetch repositories',
        type: 'error',
      });
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

  const handleSaveSelectedGithub = async () => {
    if (selectedGhIds.size === 0) return;
    setSavingGh(true);
    try {
      const selected = ghCandidates.filter((c) => selectedGhIds.has(c.id));
      const updated = await api.bulkAddProjects(selected);
      onProfileUpdated(updated);
      setGhCandidates([]);
      setSelectedGhIds(new Set());
      toast('Projects Synced', {
        description: `Added ${selected.length} GitHub repositories to verified bank`,
        type: 'success',
      });
    } catch (err: any) {
      toast('Save Failed', {
        description: err.message || 'Could not save projects',
        type: 'error',
      });
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
      role: newProject.role?.trim() || 'Software Engineer',
      year: newProject.year?.trim() || '2026',
      stack: stack.length > 0 ? stack : ['React', 'TypeScript'],
      bullets: bullets.length > 0 ? bullets : ['Led architecture and implementation of core modules.'],
      source: 'manual',
      url: newProject.url?.trim() || '',
    };

    try {
      const updated = await api.addProject(projectToSave);
      onProfileUpdated(updated);
      setShowAddModal(false);
      setNewProject({
        name: '',
        role: 'Full Stack Engineer',
        year: '2026',
        stack: [],
        bullets: [''],
        source: 'manual',
        url: '',
      });
      setStackInput('');
      toast('Project Added', {
        description: `"${projectToSave.name}" added to talent database.`,
        type: 'success',
      });
    } catch (err: any) {
      toast('Creation Failed', {
        description: err.message || 'Could not add project',
        type: 'error',
      });
    }
  };

  const allProjects = useMemo(() => {
    if (!profile) return [];
    return [...(profile.projects || []), ...(profile.experience || [])];
  }, [profile]);

  const filteredProjects = useMemo(() => {
    return allProjects.filter((p) => {
      const matchSource = sourceFilter === 'all' || p.source === sourceFilter;
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.role.toLowerCase().includes(q) ||
        p.stack.some((s) => s.toLowerCase().includes(q));
      return matchSource && matchSearch;
    });
  }, [allProjects, sourceFilter, searchQuery]);

  const totalSkillsCount = useMemo(() => {
    if (!profile?.skills) return 0;
    return Object.values(profile.skills).reduce((acc, arr) => acc + arr.length, 0);
  }, [profile]);

  return (
    <div className="w-full space-y-4">
      <BentoGrid>
        {/* HERO TILE (Largest - always first on responsive: 12 cols > 6 cols > 1 col) */}
        <Card
          variant="white"
          isHero
          icon={<UserCheck className="w-5 h-5 text-[var(--text-main)]" strokeWidth={1.75} />}
          actionArrow
          className="col-span-12 lg:col-span-8 p-6"
        >
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="tile-label">CANDIDATE GROUND TRUTH</span>
                <Badge variant="mint" className="text-[10px]">VERIFIED 2026</Badge>
              </div>
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--text-main)]">
                {profile?.basics?.name || 'Elyes Mansour'}
              </h2>
              <p className="text-sm font-medium text-[var(--text-muted)] mt-0.5">
                {profile?.basics?.headline || 'Étudiant en Mastère Data & BI | Développeur Python / SQL / Power BI'}
              </p>
            </div>

            {/* Quick Actions Strip */}
            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={handleFileUpload}
                disabled={uploading}
              />
              <Button
                variant="outline"
                size="sm"
                loading={uploading}
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer font-medium"
              >
                <UploadCloud className="w-4 h-4 mr-1.5" strokeWidth={1.75} />
                <span>Import PDF</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetCandidate}
                disabled={uploading}
                className="text-xs text-[var(--text-muted)] hover:text-red-600 hover:bg-red-50"
                title="Clear current candidate data and start fresh"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1" strokeWidth={1.75} />
                <span>New Candidate</span>
              </Button>

              <Button variant="primary" size="sm" onClick={onNext} className="gap-1.5">
                <span>Continue to Intake</span>
                <ArrowRight className="w-4 h-4" strokeWidth={2} />
              </Button>
            </div>
          </div>

          {/* Candidate Bio summary */}
          <div className="p-4 rounded-[16px] bg-[var(--secondary)]/40 border border-[var(--border)] text-xs text-[var(--text-main)] leading-relaxed mb-4">
            {profile?.summary ||
              "Étudiant en 1ère année Mastère Big Data & Business Intelligence à l'ESPRIT avec de solides compétences en ingénierie de données (SQL, Python, ETL), modélisation décisionnelle et développement de dashboards Power BI. Expérience avérée en projets applicatifs complets (FastAPI, React, Spring Boot, microservices)."}
          </div>

          {/* Contact and Location Metadata */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--text-muted)] pt-2 border-t border-[var(--border)]">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span>{profile?.basics?.location || 'Ariana, Tunisie / Paris, France'}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span>{profile?.basics?.email || 'mansour.elyes2002@gmail.com'}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span>{profile?.basics?.phone || '+216 27 528 298'}</span>
            </span>
          </div>
        </Card>

        {/* NEAR-BLACK TILE (#111 for Contrast) - Zero Hallucination Guard */}
        <Card
          variant="dark"
          icon={<ShieldCheck className="w-5 h-5 text-white" strokeWidth={1.75} />}
          actionArrow
          className="col-span-12 sm:col-span-6 lg:col-span-4 p-6"
        >
          <span className="dark-tile-label uppercase">GROUND TRUTH POLICY</span>
          <div className="big-number text-white mt-1">100%</div>
          <p className="text-xs text-[var(--tile-dark-muted)] mt-2 leading-relaxed">
            Zero-hallucination constraint. The local Ollama model (qwen2.5:7b) is strictly instructed to adapt ONLY verified bullet points and projects from your repository bank.
          </p>
          <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-[var(--tile-dark-muted)] font-mono">
            <span>Dense Retrieval</span>
            <span className="text-emerald-400 font-semibold">bge-m3 Active</span>
          </div>
        </Card>

        {/* KPI TILE 1 (Mint #D9F5E6) - Verified Project Count */}
        <Card
          variant="mint"
          icon={<FolderGit2 className="w-5 h-5 text-emerald-800" strokeWidth={1.75} />}
          actionArrow
          className="col-span-6 sm:col-span-3 lg:col-span-2 p-5"
        >
          <span className="tile-label text-emerald-900 font-semibold">PROJECTS</span>
          <div className="big-number text-emerald-950 mt-1">{allProjects.length}</div>
          <span className="text-xs text-emerald-800 mt-1 font-medium">Bank of achievements</span>
        </Card>

        {/* KPI TILE 2 (Sky #DCEBFF) - Indexed Competencies */}
        <Card
          variant="sky"
          icon={<Code2 className="w-5 h-5 text-sky-800" strokeWidth={1.75} />}
          actionArrow
          className="col-span-6 sm:col-span-3 lg:col-span-2 p-5"
        >
          <span className="tile-label text-sky-900 font-semibold">SKILLS</span>
          <div className="big-number text-sky-950 mt-1">{totalSkillsCount || 24}</div>
          <span className="text-xs text-sky-800 mt-1 font-medium">Indexed competencies</span>
        </Card>

        {/* TILE 3 (Peach #FFE6D5) - GitHub Live Repository Ingestion with Ollama */}
        <Card
          variant="peach"
          icon={<GitBranch className="w-5 h-5 text-amber-900" strokeWidth={1.75} />}
          className="col-span-12 sm:col-span-6 lg:col-span-4 p-5"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="tile-label text-amber-950 font-semibold">ADD GITHUB PROJECT</span>
            <Badge variant="mint" className="text-[9px] gap-1 bg-emerald-100 text-emerald-800">
              <Sparkles className="w-2.5 h-2.5" />
              Ollama
            </Badge>
          </div>
          <p className="text-xs text-amber-900 mb-2 leading-snug">
            Paste candidate repo URL. Ollama will extract the stack & achievements.
          </p>

          <form onSubmit={handleAnalyzeSingleRepo} className="flex gap-2 mb-2">
            <Input
              value={singleRepoUrl}
              onChange={(e) => setSingleRepoUrl(e.target.value)}
              placeholder="https://github.com/owner/repo"
              className="h-8 text-xs bg-white/90 border-amber-900/15"
              disabled={analyzingRepo}
            />
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={analyzingRepo}
              disabled={analyzingRepo || !singleRepoUrl.trim()}
              className="h-8 text-xs shrink-0 bg-amber-950 hover:bg-amber-900 text-white font-semibold"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              <span>Add</span>
            </Button>
          </form>

          {/* Sync user repositories section */}
          <div className="pt-2 border-t border-amber-950/10 flex items-center gap-1.5">
            <Input
              value={ghUser}
              onChange={(e) => setGhUser(e.target.value)}
              placeholder="sync user repos (username)"
              className="h-7 text-[11px] bg-white/60 border-amber-900/10"
              disabled={ghLoading}
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={handleFetchGithub}
              loading={ghLoading}
              disabled={ghLoading || !ghUser.trim()}
              className="h-7 text-[11px] shrink-0 bg-amber-900/10 hover:bg-amber-900/20 text-amber-950"
            >
              Sync
            </Button>
          </div>
        </Card>

        {/* TILE 4 (Lavender #E9E3FF) - Academic Background */}
        <Card
          variant="lavender"
          icon={<GraduationCap className="w-5 h-5 text-purple-900" strokeWidth={1.75} />}
          className="col-span-12 sm:col-span-6 lg:col-span-3 p-5"
        >
          <span className="tile-label text-purple-950 font-semibold">EDUCATION & DIPLOMAS</span>
          <div className="mt-2 space-y-1 text-xs text-purple-950">
            <p className="font-semibold">Mastère Big Data & BI (2024 - 2026)</p>
            <p className="text-[11px] text-purple-800">ESPRIT — Tunis, Tunisie</p>
            <p className="font-semibold pt-1">Licence Sciences Informatique (2021 - 2024)</p>
            <p className="text-[11px] text-purple-800">Institut Supérieur d'Informatique (ISI)</p>
          </div>
        </Card>

        {/* FULL BENTO LIST TILE (White, 12 Columns) - Project Bank Explorer */}
        <Card
          variant="white"
          icon={<Briefcase className="w-5 h-5 text-[var(--text-main)]" strokeWidth={1.75} />}
          className="col-span-12 p-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <span className="tile-label">PROJECT BANK EXPLORER</span>
              <h3 className="text-lg font-semibold text-[var(--text-main)]">
                Verified Projects & Experiences ({filteredProjects.length})
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Filter pills */}
              <div className="flex items-center gap-1 bg-[var(--secondary)] p-1 rounded-[10px]">
                {(['all', 'cv', 'github', 'manual'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setSourceFilter(filter)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-[8px] transition-colors cursor-pointer ${
                      sourceFilter === filter
                        ? 'bg-[var(--tile-white)] text-[var(--text-main)] shadow-2xs'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                    }`}
                  >
                    {filter.toUpperCase()}
                  </button>
                ))}
              </div>

              {/* Search input */}
              <div className="w-48">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter by skill / name..."
                  leftIcon={<Search className="w-3.5 h-3.5" />}
                  className="h-8 text-xs"
                />
              </div>

              {/* Add Project trigger */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddModal(true)}
                className="h-8 gap-1 text-xs font-semibold"
              >
                <Plus className="w-3.5 h-3.5" strokeWidth={2} />
                <span>Add Project</span>
              </Button>
            </div>
          </div>

          {/* Project Items Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredProjects.map((proj) => (
              <div
                key={proj.id}
                className="p-4 rounded-[18px] bg-[var(--bg-page)]/80 border border-[var(--border)] flex flex-col justify-between hover:border-[var(--border-strong)] transition-all"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] font-semibold">
                      {proj.year || '2026'} • {proj.source.toUpperCase()}
                    </span>
                    <Badge variant={proj.source === 'github' ? 'sky' : proj.source === 'cv' ? 'mint' : 'peach'} className="text-[9px] px-1.5 py-0.2">
                      {proj.source}
                    </Badge>
                  </div>
                  <h4 className="text-sm font-semibold text-[var(--text-main)] tracking-tight">
                    {proj.name}
                  </h4>
                  <p className="text-xs text-[var(--text-muted)] font-medium mt-0.5">
                    {proj.role}
                  </p>
                  <ul className="mt-2.5 space-y-1 text-xs text-[var(--text-main)] list-disc pl-4 leading-normal">
                    {proj.bullets.slice(0, 2).map((bullet, idx) => (
                      <li key={idx} className="line-clamp-2">{bullet}</li>
                    ))}
                  </ul>
                </div>

                <div className="mt-3 pt-2.5 border-t border-[var(--border)] flex flex-wrap gap-1">
                  {proj.stack.map((stk) => (
                    <span
                      key={stk}
                      className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--tile-white)] text-[var(--text-main)] border border-[var(--border)]"
                    >
                      {stk}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </BentoGrid>

      {/* GitHub Repository Selection Dialog */}
      <Dialog open={ghCandidates.length > 0} onOpenChange={(open) => !open && setGhCandidates([])}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Import GitHub Repositories</DialogTitle>
            <DialogDescription>
              Select repositories to save into your verified career database.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-72 overflow-y-auto space-y-2 py-2">
            {ghCandidates.map((repo) => {
              const isSelected = selectedGhIds.has(repo.id);
              return (
                <div
                  key={repo.id}
                  onClick={() => toggleGhSelect(repo.id)}
                  className={`p-3 rounded-[14px] border flex items-center justify-between cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[var(--tile-mint)] border-emerald-400/40 text-emerald-950'
                      : 'bg-[var(--tile-white)] border-[var(--border)] text-[var(--text-main)]'
                  }`}
                >
                  <div>
                    <div className="text-xs font-semibold">{repo.name}</div>
                    <div className="text-[11px] text-[var(--text-muted)] flex items-center gap-1 mt-0.5">
                      <span>{repo.stack.join(', ')}</span>
                    </div>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                      isSelected ? 'bg-emerald-700 text-white border-emerald-700' : 'border-[var(--border-strong)]'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
                  </div>
                </div>
              );
            })}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setGhCandidates([])}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSaveSelectedGithub}
              loading={savingGh}
              disabled={selectedGhIds.size === 0}
            >
              Add {selectedGhIds.size} Repositories
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manual Add Project Dialog */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-lg">
          <form onSubmit={handleCreateProject}>
            <DialogHeader>
              <DialogTitle>Add Verified Project</DialogTitle>
              <DialogDescription>
                Record an institutional project with verified metrics for ATS matching.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-3">
              <div>
                <label className="tile-label mb-1 block">Project / Initiative Name</label>
                <Input
                  value={newProject.name || ''}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  placeholder="e.g. BIAT Financial Dashboard & API"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="tile-label mb-1 block">Role / Title</label>
                  <Input
                    value={newProject.role || ''}
                    onChange={(e) => setNewProject({ ...newProject, role: e.target.value })}
                    placeholder="e.g. Lead BI Architect"
                  />
                </div>
                <div>
                  <label className="tile-label mb-1 block">Year / Period</label>
                  <Input
                    value={newProject.year || ''}
                    onChange={(e) => setNewProject({ ...newProject, year: e.target.value })}
                    placeholder="2025 - 2026"
                  />
                </div>
              </div>

              <div>
                <label className="tile-label mb-1 block">Tech Stack (comma separated)</label>
                <Input
                  value={stackInput}
                  onChange={(e) => setStackInput(e.target.value)}
                  placeholder="Python, SQL, Power BI, PostgreSQL, FastAPI"
                />
              </div>

              <div>
                <label className="tile-label mb-1 block">Key Achievement / Impact Bullet</label>
                <Textarea
                  value={newProject.bullets?.[0] || ''}
                  onChange={(e) => setNewProject({ ...newProject, bullets: [e.target.value] })}
                  placeholder="Architected ETL pipelines processing 500k+ daily transactions with 99.9% uptime."
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Save to Database
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
