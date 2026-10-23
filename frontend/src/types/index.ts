export type Lang = 'fr' | 'en' | 'ar';

export interface Basics {
  name: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  github: string;
  linkedin: string;
}

export interface Project {
  id: string;
  name: string;
  role: string;
  year: string;
  stack: string[];
  bullets: string[];
  source: 'cv' | 'github' | 'manual';
  url: string;
}

export interface Education {
  degree: string;
  school: string;
  location: string;
  period: string;
  details: string;
}

export interface MasterProfile {
  basics: Basics;
  summary: string;
  skills: Record<string, string[]>;
  experience: Project[];
  projects: Project[];
  education: Education[];
  languages: string[];
}

export interface JobAnalysis {
  title: string;
  company: string;
  offer_language: Lang;
  level: 'internship' | 'alternance' | 'junior' | 'mid' | 'senior' | 'unknown';
  must_have_skills: string[];
  nice_to_have_skills: string[];
  keywords: string[];
  responsibilities: string[];
}

export interface ProjectScore {
  project_id: string;
  score: number;
  matched_skills: string[];
}

export interface MatchResult {
  global_score: number;
  matched_skills: string[];
  missing_skills: string[];
  ranked_projects: ProjectScore[];
  suggested_project_ids: string[];
}

export interface TailoredItem {
  id: string;
  name: string;
  role: string;
  period: string;
  stack: string[];
  bullets: string[];
}

export interface TailoredCV {
  language: Lang;
  headline: string;
  summary: string;
  skills: Record<string, string[]>;
  experience: TailoredItem[];
  projects: TailoredItem[];
  education: string[];
  languages: string[];
}

export interface CoverLetter {
  language: Lang;
  subject: string;
  greeting: string;
  paragraphs: string[];
  closing: string;
}

export interface ATSReport {
  text_extractable: boolean;
  must_have_coverage: number;
  keyword_coverage: number;
  missing_keywords: string[];
  sections_found: string[];
}

export interface GenerateResponse {
  tailored_cv: TailoredCV;
  cover_letter: CoverLetter;
  cv_pdf_url: string;
  letter_pdf_url: string;
  ats_report: ATSReport;
  warnings: string[];
}

export interface HealthResponse {
  ok: boolean;
  ollama: boolean;
  models_ready: Record<string, boolean>;
  detail?: string | null;
}
