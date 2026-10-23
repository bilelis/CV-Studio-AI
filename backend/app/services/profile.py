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

def extract_profile_from_cv(cv_text: str) -> MasterProfile:
    user_prompt = f"Extract the Master Profile from the following CV text:\n\n{cv_text}"
    extracted = client.generate(MasterProfile, prompts.CV_EXTRACT_SYSTEM, user_prompt, temperature=0.2)
    return save_profile(extracted)

def add_single_project(project: Project) -> MasterProfile:
    profile = load_profile()
    # Replace existing or append
    existing_idx = next((i for i, p in enumerate(profile.projects) if p.id == project.id), None)
    if existing_idx is not None:
        profile.projects[existing_idx] = project
    else:
        profile.projects.append(project)
    return save_profile(profile)

def bulk_add_projects(new_projects: list[Project]) -> MasterProfile:
    profile = load_profile()
    existing_ids = {p.id for p in profile.projects}
    for p in new_projects:
        if p.id in existing_ids:
            idx = next(i for i, ex in enumerate(profile.projects) if ex.id == p.id)
            profile.projects[idx] = p
        else:
            profile.projects.append(p)
            existing_ids.add(p.id)
    return save_profile(profile)
