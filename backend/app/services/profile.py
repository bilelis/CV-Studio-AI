import json
from pathlib import Path
from app.config import settings
from app.schemas import MasterProfile, Project, Basics
from app.llm import client, prompts

PROFILE_FILE = settings.data_dir / "profile.json"
FIXTURE_FILE = Path("./fixtures/master_profile.sample.json")

def get_default_profile() -> MasterProfile:
    if FIXTURE_FILE.exists():
        with open(FIXTURE_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            return MasterProfile.model_validate(data)
    return MasterProfile(basics=Basics(name="User Profile"))

def load_profile() -> MasterProfile:
    if PROFILE_FILE.exists():
        try:
            with open(PROFILE_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                return MasterProfile.model_validate(data)
        except Exception:
            pass
    default_p = get_default_profile()
    save_profile(default_p)
    return default_p

def save_profile(profile: MasterProfile) -> MasterProfile:
    settings.data_dir.mkdir(parents=True, exist_ok=True)
    with open(PROFILE_FILE, "w", encoding="utf-8") as f:
        json.dump(profile.model_dump(), f, ensure_ascii=False, indent=2)
    return profile

import re
from app.schemas import Education

def heuristic_parse_cv(cv_text: str) -> MasterProfile:
    # 1. Basics extraction
    email_match = re.search(r"[\w\.-]+@[\w\.-]+\.\w+", cv_text)
    email = email_match.group(0) if email_match else ""

    phone_match = re.search(r"(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{2,4}[-.\s]?\d{2,4}", cv_text)
    phone = phone_match.group(0).strip() if phone_match else ""

    github_match = re.search(r"(?:https?://)?(?:www\.)?github\.com/([a-zA-Z0-9_\-]+)", cv_text)
    github = f"https://github.com/{github_match.group(1)}" if github_match else ""

    linkedin_match = re.search(r"(?:https?://)?(?:www\.)?linkedin\.com/in/([a-zA-Z0-9_\-]+)", cv_text)
    linkedin = f"https://linkedin.com/in/{linkedin_match.group(1)}" if linkedin_match else ""

    # Name: First prominent line
    lines = [l.strip() for l in cv_text.splitlines() if l.strip()]
    candidate_name = lines[0] if lines else "Candidate Profile"
    if len(candidate_name) > 40 or "@" in candidate_name or any(c.isdigit() for c in candidate_name):
        # Scan first 5 lines for a clean alphabetic name
        for line in lines[:5]:
            if len(line) < 35 and not "@" in line and not any(c.isdigit() for c in line) and len(line.split()) in [2, 3, 4]:
                candidate_name = line
                break

    # Headline: usually 2nd or 3rd line
    headline = ""
    for line in lines[1:4]:
        if line != candidate_name and len(line) < 80 and not "@" in line and not "phone" in line.lower():
            headline = line
            break

    # Detect skills keywords
    known_tech = [
        "Python", "SQL", "Power BI", "PostgreSQL", "MySQL", "FastAPI", "React", "TypeScript",
        "JavaScript", "Next.js", "Docker", "Git", "GitHub", "MongoDB", "ETL", "Pandas",
        "NumPy", "Scikit-Learn", "Azure", "AWS", "Supabase", "Tailwind CSS", "Linux"
    ]
    detected_skills: list[str] = []
    text_lower = cv_text.lower()
    for tech in known_tech:
        if tech.lower() in text_lower:
            detected_skills.append(tech)

    skills_dict = {
        "Core Skills": detected_skills if detected_skills else ["Python", "SQL", "Git"]
    }

    # Summary
    summary = ""
    summary_match = re.search(r"(?:profil|summary|about|à propos)[\s:]*\n?(.*?)(?=\n\s*(?:expérience|experience|formation|education|compétences|skills|\Z))", cv_text, re.IGNORECASE | re.DOTALL)
    if summary_match:
        summary = summary_match.group(1).strip()[:350]
    elif len(lines) > 4:
        summary = " ".join(lines[2:5])[:300]

    # Education detection
    education_items: list[Education] = []
    edu_matches = re.findall(r"(mastère|master|licence|bachelor|ingénieur|diplôme|baccalaureate|phd)[^\n]+", cv_text, re.IGNORECASE)
    for em in edu_matches[:3]:
        education_items.append(Education(
            degree=em.strip()[:60],
            school="University",
            period="2022 - 2026",
            location=""
        ))

    return MasterProfile(
        basics=Basics(
            name=candidate_name,
            headline=headline or "Software & Data Professional",
            email=email,
            phone=phone,
            location="",
            github=github,
            linkedin=linkedin
        ),
        summary=summary,
        skills=skills_dict,
        education=education_items,
        projects=[],
        experience=[]
    )

def extract_profile_from_cv(cv_text: str) -> MasterProfile:
    # 1. Regex Heuristic Ground Truth
    email_match = re.search(r"[\w\.-]+@[\w\.-]+\.\w+", cv_text)
    regex_email = email_match.group(0) if email_match else ""

    phone_match = re.search(r"(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{2,4}[-.\s]?\d{2,4}", cv_text)
    regex_phone = phone_match.group(0).strip() if phone_match else ""

    github_match = re.search(r"(?:https?://)?(?:www\.)?github\.com/([a-zA-Z0-9_\-]+)", cv_text)
    regex_github = f"https://github.com/{github_match.group(1)}" if github_match else ""

    linkedin_match = re.search(r"(?:https?://)?(?:www\.)?linkedin\.com/in/([a-zA-Z0-9_\-]+)", cv_text)
    regex_linkedin = f"https://linkedin.com/in/{linkedin_match.group(1)}" if linkedin_match else ""

    # 2. Try LLM Structured Extraction
    try:
        user_prompt = f"Extract the Master Profile from the following CV text:\n\n{cv_text}"
        extracted = client.generate(MasterProfile, prompts.CV_EXTRACT_SYSTEM, user_prompt, temperature=0.2)
        
        # Merge ground truth if LLM missed contact details
        if not extracted.basics.email and regex_email:
            extracted.basics.email = regex_email
        if not extracted.basics.phone and regex_phone:
            extracted.basics.phone = regex_phone
        if not extracted.basics.github and regex_github:
            extracted.basics.github = regex_github
        if not extracted.basics.linkedin and regex_linkedin:
            extracted.basics.linkedin = regex_linkedin

        return save_profile(extracted)
    except Exception:
        # 3. Resilient heuristic fallback
        fallback = heuristic_parse_cv(cv_text)
        return save_profile(fallback)

def add_single_project(project: Project) -> MasterProfile:
    profile = load_profile()
    # Replace existing or append
    existing_idx = next((i for i, p in enumerate(profile.projects) if p.id == project.id), None)
    if existing_idx is not None:
        profile.projects[existing_idx] = project
    else:
        profile.projects.append(project)

    # Merge project stack into profile skills if not already present
    if project.stack:
        all_existing_skills = {
            s.lower().strip() for cat_skills in profile.skills.values() for s in cat_skills
        }
        target_cat = "Project Technologies"
        if target_cat not in profile.skills:
            profile.skills[target_cat] = []
        for s in project.stack:
            if s.lower().strip() not in all_existing_skills:
                profile.skills[target_cat].append(s)
                all_existing_skills.add(s.lower().strip())

    return save_profile(profile)

def bulk_add_projects(new_projects: list[Project]) -> MasterProfile:
    profile = load_profile()
    existing_ids = {p.id for p in profile.projects}
    all_existing_skills = {
        s.lower().strip() for cat_skills in profile.skills.values() for s in cat_skills
    }
    target_cat = "Project Technologies"
    if target_cat not in profile.skills:
        profile.skills[target_cat] = []

    for p in new_projects:
        if p.id in existing_ids:
            idx = next(i for i, ex in enumerate(profile.projects) if ex.id == p.id)
            profile.projects[idx] = p
        else:
            profile.projects.append(p)
            existing_ids.add(p.id)

        # Merge stack
        for s in p.stack:
            if s.lower().strip() not in all_existing_skills:
                profile.skills[target_cat].append(s)
                all_existing_skills.add(s.lower().strip())

    return save_profile(profile)
