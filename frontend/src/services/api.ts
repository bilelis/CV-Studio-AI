import type {
  MasterProfile,
  Project,
  JobAnalysis,
  MatchResult,
  GenerateResponse,
  HealthResponse,
  Lang
} from '../types';

const API_BASE = '';

async function handleResponse<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!res.ok) {
    let detail = `Server responded with ${res.status}`;
    try {
      const errData = JSON.parse(text);
      detail = errData.detail || detail;
    } catch {
      if (text && text.length < 200 && !text.includes('<!DOCTYPE')) {
        detail = text;
      }
    }
    throw new Error(detail);
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

export const api = {
  async getHealth(): Promise<HealthResponse> {
    const res = await fetch(`${API_BASE}/health`);
    return handleResponse<HealthResponse>(res);
  },

  async getProfile(): Promise<MasterProfile> {
    const res = await fetch(`${API_BASE}/profile`);
    return handleResponse<MasterProfile>(res);
  },

  async updateProfile(profile: MasterProfile): Promise<MasterProfile> {
    const res = await fetch(`${API_BASE}/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    });
    return handleResponse<MasterProfile>(res);
  },

  async importCvPdf(file: File): Promise<MasterProfile> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/profile/import-cv`, {
      method: 'POST',
      body: formData,
    });
    return handleResponse<MasterProfile>(res);
  },

  async addProject(project: Project): Promise<MasterProfile> {
    const res = await fetch(`${API_BASE}/profile/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(project),
    });
    return handleResponse<MasterProfile>(res);
  },

  async bulkAddProjects(projects: Project[]): Promise<MasterProfile> {
    const res = await fetch(`${API_BASE}/profile/projects/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(projects),
    });
    return handleResponse<MasterProfile>(res);
  },

  async analyzeGithubRepo(url: string): Promise<Project> {
    const res = await fetch(`${API_BASE}/github/analyze-repo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    return handleResponse<Project>(res);
  },

  async resetProfile(): Promise<MasterProfile> {
    const empty: MasterProfile = {
      basics: {
        name: '',
        headline: '',
        email: '',
        phone: '',
        location: '',
        github: '',
        linkedin: '',
      },
      summary: '',
      skills: {},
      experience: [],
      projects: [],
      education: [],
      languages: [],
    };
    return this.updateProfile(empty);
  },

  async importGithub(username: string): Promise<Project[]> {
    const res = await fetch(`${API_BASE}/github/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username }),
    });
    return handleResponse<Project[]>(res);
  },

  async analyzeJob(text: string): Promise<JobAnalysis> {
    const res = await fetch(`${API_BASE}/job/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    return handleResponse<JobAnalysis>(res);
  },

  async matchJob(job: JobAnalysis): Promise<MatchResult> {
    const res = await fetch(`${API_BASE}/match`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(job),
    });
    return handleResponse<MatchResult>(res);
  },

  async generate(job: JobAnalysis, projectIds: string[], language: Lang): Promise<GenerateResponse> {
    const res = await fetch(`${API_BASE}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        job,
        project_ids: projectIds,
        language,
      }),
    });
    return handleResponse<GenerateResponse>(res);
  },
};
