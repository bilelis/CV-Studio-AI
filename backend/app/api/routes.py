from pathlib import Path
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import FileResponse

from app.config import settings
from app.schemas import (
    MasterProfile,
    Project,
    JobAnalysis,
    MatchResult,
    JobAnalyzeRequest,
    GenerateRequest,
    GenerateResponse,
    GitHubImportRequest,
    AnalyzeRepoRequest,
    RecruiterQuestion,
    HealthResponse
)
from app.llm.client import check_models_status
from app.services.cv_parser import extract_text_from_pdf
from app.services.profile import (
    load_profile,
    save_profile,
    extract_profile_from_cv,
    add_single_project,
    bulk_add_projects
)
from app.services.job_analyzer import analyze_job, generate_job_recruiter_questions
from app.services.matcher import match_profile_to_job
from app.services.tailor import tailor_cv_and_letter
from app.services.renderer import render_cv_pdf, render_letter_pdf
from app.services.ats_check import run_ats_check
from app.services.github import fetch_github_project_candidates, analyze_single_github_repo

router = APIRouter()

@router.get("/health", response_model=HealthResponse)
def health_check():
    ollama_ok, models_dict, err_msg = check_models_status()
    all_ok = ollama_ok and any(models_dict.values())
    return HealthResponse(
        ok=all_ok,
        ollama=ollama_ok,
        models_ready=models_dict,
        detail=err_msg
    )

@router.post("/profile/import-cv", response_model=MasterProfile)
async def import_cv(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    pdf_bytes = await file.read()
    raw_text = extract_text_from_pdf(pdf_bytes)
    profile = extract_profile_from_cv(raw_text)
    return profile

@router.get("/profile", response_model=MasterProfile)
def get_master_profile():
    return load_profile()

@router.put("/profile", response_model=MasterProfile)
def update_master_profile(profile: MasterProfile):
    return save_profile(profile)

@router.post("/profile/projects", response_model=MasterProfile)
def add_project(project: Project):
    return add_single_project(project)

@router.post("/profile/projects/bulk", response_model=MasterProfile)
def bulk_save_projects(projects: list[Project]):
    return bulk_add_projects(projects)

@router.post("/github/import", response_model=list[Project])
async def github_import(req: GitHubImportRequest):
    candidates = await fetch_github_project_candidates(req.username)
    return candidates

@router.post("/github/analyze-repo", response_model=Project)
async def github_analyze_repo(req: AnalyzeRepoRequest):
    project = await analyze_single_github_repo(req.url)
    return project

@router.post("/job/analyze", response_model=JobAnalysis)
def analyze_job_offer(req: JobAnalyzeRequest):
    return analyze_job(req.text)

@router.post("/job/questions", response_model=list[RecruiterQuestion])
def get_recruiter_questions(job: JobAnalysis):
    return generate_job_recruiter_questions(job)

@router.post("/match", response_model=MatchResult)
def match_cv(job: JobAnalysis):
    profile = load_profile()
    return match_profile_to_job(profile, job)

@router.post("/generate", response_model=GenerateResponse)
def generate_tailored_documents(req: GenerateRequest):
    profile = load_profile()
    tailored_cv, cover_letter, warnings = tailor_cv_and_letter(
        profile=profile,
        selected_project_ids=req.project_ids,
        job=req.job,
        language=req.language
    )
    
    # Render PDFs
    cv_filename, cv_path = render_cv_pdf(profile.basics, tailored_cv)
    letter_filename, _ = render_letter_pdf(profile.basics, cover_letter)
    
    # ATS Check on generated CV
    ats_report = run_ats_check(cv_path, req.job, req.language)
    
    # Attach 5 to 8 recruiter questions for the job
    questions = req.job.recruiter_questions
    if not questions:
        questions = generate_job_recruiter_questions(req.job)

    return GenerateResponse(
        tailored_cv=tailored_cv,
        cover_letter=cover_letter,
        cv_pdf_url=f"/files/{cv_filename}",
        letter_pdf_url=f"/files/{letter_filename}",
        ats_report=ats_report,
        warnings=warnings,
        recruiter_questions=questions
    )

@router.get("/files/{name}")
def download_output_file(name: str):
    file_path = settings.data_dir / "outputs" / name
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(
        path=str(file_path),
        filename=name,
        media_type="application/pdf"
    )
