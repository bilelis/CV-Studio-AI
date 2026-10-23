import json
from app.schemas import MasterProfile, Project, JobAnalysis, Lang, TailoredCV, CoverLetter
from app.llm import client, prompts
from app.services.fact_check import fact_check_generation
from app.services.matcher import normalize_token

def tailor_cv_and_letter(
    profile: MasterProfile,
    selected_project_ids: list[str],
    job: JobAnalysis,
    language: Lang
) -> tuple[TailoredCV, CoverLetter, list[str]]:
    # Filter projects to only user-selected
    chosen_projects: list[Project] = [
        p for p in profile.projects if p.id in selected_project_ids
    ]
    if not chosen_projects:
        # Fallback to first 3 projects if none selected
        chosen_projects = profile.projects[:3]

    cv_user_payload = {
        "candidate_basics": profile.basics.model_dump(),
        "skills": profile.skills,
        "experience": [e.model_dump() for e in profile.experience],
        "selected_projects": [p.model_dump() for p in chosen_projects],
        "education": [ed.model_dump() for ed in profile.education],
        "languages": profile.languages,
        "target_job": job.model_dump(),
        "target_language": language,
        "mandatory_must_have_skills": job.must_have_skills
    }
    
    # 1. Generate Tailored CV
    system_cv = prompts.TAILOR_SYSTEM.format(language=language)
    tailored_cv = client.generate(
        TailoredCV,
        system_cv,
        json.dumps(cv_user_payload, ensure_ascii=False, indent=2),
        temperature=0.2
    )
    tailored_cv.language = language
    if not tailored_cv.experience and profile.experience:
        tailored_cv.experience = profile.experience

    # Programmatic Guarantee for 100% ATS Must-Have & High-Density Keyword Coverage
    if job.must_have_skills:
        for skill in job.must_have_skills:
            skill_norm = normalize_token(skill)
            skill_found = False
            for cat_skills in tailored_cv.skills.values():
                if any(normalize_token(s) == skill_norm for s in cat_skills):
                    skill_found = True
                    break
            if not skill_found:
                if tailored_cv.skills:
                    first_cat = next(iter(tailored_cv.skills.keys()))
                    tailored_cv.skills[first_cat].append(skill)
                else:
                    target_cat = "Core Competencies" if language == "en" else "Compétences Clés" if language == "fr" else "المهارات التقنية"
                    tailored_cv.skills[target_cat] = [skill]

        # Ensure all must-have skills are represented across project stacks
        if tailored_cv.projects:
            for skill in job.must_have_skills:
                skill_norm = normalize_token(skill)
                already_in_project = any(normalize_token(s) == skill_norm for p in tailored_cv.projects for s in p.stack)
                if not already_in_project:
                    tailored_cv.projects[0].stack.append(skill)

    # Also infuse top nice-to-have skills into skills taxonomy to maximize ATS keyword scoring
    if job.nice_to_have_skills:
        for skill in job.nice_to_have_skills:
            skill_norm = normalize_token(skill)
            skill_found = False
            for cat_skills in tailored_cv.skills.values():
                if any(normalize_token(s) == skill_norm for s in cat_skills):
                    skill_found = True
                    break
            if not skill_found and tailored_cv.skills:
                first_cat = next(iter(tailored_cv.skills.keys()))
                tailored_cv.skills[first_cat].append(skill)

    # 2. Generate Cover Letter
    letter_user_payload = {
        "candidate_basics": profile.basics.model_dump(),
        "selected_projects": [
            {"name": p.name, "role": p.role, "stack": p.stack, "bullets": p.bullets}
            for p in chosen_projects
        ],
        "education": [ed.model_dump() for ed in profile.education],
        "target_job": job.model_dump(),
        "target_language": language,
        "mandatory_must_have_skills": job.must_have_skills
    }
    system_letter = prompts.COVER_SYSTEM.format(language=language)
    cover_letter = client.generate(
        CoverLetter,
        system_letter,
        json.dumps(letter_user_payload, ensure_ascii=False, indent=2),
        temperature=0.35
    )
    cover_letter.language = language

    # 3. Fact check & authorization enforcement (job requirements authorized)
    tailored_cv, cover_letter, warnings = fact_check_generation(
        profile,
        tailored_cv,
        cover_letter,
        job
    )

    return tailored_cv, cover_letter, warnings
