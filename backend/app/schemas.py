from typing import Literal
from pydantic import BaseModel, Field

Lang = Literal["fr", "en", "ar"]

class Basics(BaseModel):
    name: str
    headline: str = ""
    email: str = ""
    phone: str = ""
    location: str = ""
    github: str = ""
    linkedin: str = ""

class Project(BaseModel):
    id: str
    name: str
    role: str = ""
    year: str = ""
    stack: list[str] = []
    bullets: list[str] = []
    source: Literal["cv", "github", "manual"] = "cv"
    url: str = ""

class Education(BaseModel):
    degree: str
    school: str = ""
    location: str = ""
    period: str = ""
    details: str = ""

class MasterProfile(BaseModel):
    basics: Basics
    summary: str = ""
    skills: dict[str, list[str]] = {}
    experience: list[Project] = []
    projects: list[Project] = []
    education: list[Education] = []
    languages: list[str] = []

class RecruiterQuestion(BaseModel):
    question: str
    category: str = "Technical"
    why_asked: str = ""
    talking_points: list[str] = []
    ideal_answer: str = ""

class JobAnalysis(BaseModel):
    title: str
    company: str = ""
    offer_language: Lang = "fr"
    level: Literal["internship", "alternance", "junior", "mid", "senior", "unknown"] = "unknown"
    must_have_skills: list[str] = []
    nice_to_have_skills: list[str] = []
    keywords: list[str] = []
    responsibilities: list[str] = Field(default=[], max_length=5)
    recruiter_questions: list[RecruiterQuestion] = []

class ProjectScore(BaseModel):
    project_id: str
    score: int
    matched_skills: list[str]

class MatchResult(BaseModel):
    global_score: int
    matched_skills: list[str]
    missing_skills: list[str]
    ranked_projects: list[ProjectScore]
    suggested_project_ids: list[str]

class TailoredItem(BaseModel):
    id: str
    name: str
    role: str = ""
    period: str = ""
    stack: list[str] = []
    bullets: list[str] = Field(default=[], max_length=3)

class TailoredCV(BaseModel):
    language: Lang
    headline: str
    summary: str
    skills: dict[str, list[str]]
    experience: list[TailoredItem] = []
    projects: list[TailoredItem]
    education: list[str]
    languages: list[str]

class CoverLetter(BaseModel):
    language: Lang
    subject: str
    greeting: str
    paragraphs: list[str] = Field(min_length=3, max_length=4)
    closing: str

# API Payloads & Responses
class JobAnalyzeRequest(BaseModel):
    text: str

class GenerateRequest(BaseModel):
    job: JobAnalysis
    project_ids: list[str]
    language: Lang = "fr"

class ATSReport(BaseModel):
    text_extractable: bool
    must_have_coverage: float
    keyword_coverage: float
    missing_keywords: list[str]
    sections_found: list[str]

class GenerateResponse(BaseModel):
    tailored_cv: TailoredCV
    cover_letter: CoverLetter
    cv_pdf_url: str
    letter_pdf_url: str
    ats_report: ATSReport
    warnings: list[str]
    recruiter_questions: list[RecruiterQuestion] = []

class GitHubImportRequest(BaseModel):
    username: str

class AnalyzeRepoRequest(BaseModel):
    url: str

class HealthResponse(BaseModel):
    ok: bool
    ollama: bool
    models_ready: dict[str, bool]
    detail: str | None = None
