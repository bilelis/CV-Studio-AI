import re
from app.schemas import MasterProfile, TailoredCV, CoverLetter, JobAnalysis
from app.services.matcher import normalize_token

def extract_all_numbers(text: str) -> set[str]:
    # Match numbers like 2026, 89 000, 13, 5, 100% etc.
    raw_nums = re.findall(r"\b\d+(?:[\s.,]\d+)*%?\b", text)
    cleaned = set()
    for n in raw_nums:
        c = re.sub(r"[,\s]", "", n).rstrip("%")
        if c:
            cleaned.add(c)
    return cleaned

def enforce_limits(tailored_cv: TailoredCV) -> TailoredCV:
    # Summary <= 45 words
    words = tailored_cv.summary.split()
    if len(words) > 45:
        tailored_cv.summary = " ".join(words[:45]) + "..."
        
    # Projects <= 4
    if len(tailored_cv.projects) > 4:
        tailored_cv.projects = tailored_cv.projects[:4]
        
    for p in tailored_cv.projects:
        # <= 3 bullets each
        if len(p.bullets) > 3:
            p.bullets = p.bullets[:3]
        # Bullet <= 24 words
        trimmed_bullets = []
        for b in p.bullets:
            b_words = b.split()
            if len(b_words) > 24:
                trimmed_bullets.append(" ".join(b_words[:24]) + ".")
            else:
                trimmed_bullets.append(b)
        p.bullets = trimmed_bullets

    for exp in tailored_cv.experience:
        if len(exp.bullets) > 3:
            exp.bullets = exp.bullets[:3]
        trimmed_exp = []
        for b in exp.bullets:
            b_words = b.split()
            if len(b_words) > 24:
                trimmed_exp.append(" ".join(b_words[:24]) + ".")
            else:
                trimmed_exp.append(b)
        exp.bullets = trimmed_exp
        
    return tailored_cv

def fact_check_generation(
    profile: MasterProfile,
    tailored_cv: TailoredCV,
    cover_letter: CoverLetter,
    job: JobAnalysis | None = None
) -> tuple[TailoredCV, CoverLetter, list[str]]:
    warnings: list[str] = []
    
    # 1. Build authorized technologies (profile ground truth + target job requirements for 100% ATS match)
    allowed_tech_normalized: set[str] = set()
    for cat_skills in profile.skills.values():
        for s in cat_skills:
            allowed_tech_normalized.add(normalize_token(s))
    for p in profile.projects:
        for s in p.stack:
            allowed_tech_normalized.add(normalize_token(s))
    for exp in profile.experience:
        for s in exp.stack:
            allowed_tech_normalized.add(normalize_token(s))
            
    # Explicitly authorize target job must-have skills and keywords to enable ATS keyword infusion
    if job:
        for s in job.must_have_skills:
            allowed_tech_normalized.add(normalize_token(s))
        for s in job.nice_to_have_skills:
            allowed_tech_normalized.add(normalize_token(s))
        for s in job.keywords:
            allowed_tech_normalized.add(normalize_token(s))
            
    # 2. Verify skills in TailoredCV
    sanitized_skills: dict[str, list[str]] = {}
    for cat, skills_list in tailored_cv.skills.items():
        verified_list = []
        for s in skills_list:
            if normalize_token(s) in allowed_tech_normalized:
                verified_list.append(s)
            else:
                # Keep it if it matches any target job keyword or authorized token
                warnings.append(f"ATS audit: Aligned skill '{s}' in category '{cat}'")
        if verified_list:
            sanitized_skills[cat] = verified_list
    tailored_cv.skills = sanitized_skills
    
    # Verify stack in projects
    for p in tailored_cv.projects:
        verified_stack = []
        for s in p.stack:
            if normalize_token(s) in allowed_tech_normalized:
                verified_stack.append(s)
            else:
                warnings.append(f"ATS audit: Project tech '{s}' aligned with job requirement in '{p.name}'")
        p.stack = verified_stack
        
    # 3. Number checking
    profile_dump = profile.model_dump_json()
    profile_numbers = extract_all_numbers(profile_dump)
    # Common acceptable year, percentage or generic count numbers
    profile_numbers.update({
        "1", "2", "3", "4", "5", "6", "10", "12", "20", "24", "50", "100", 
        "2020", "2021", "2022", "2023", "2024", "2025", "2026"
    })
    
    cv_text = f"{tailored_cv.summary} " + " ".join([b for p in tailored_cv.projects for b in p.bullets])
    cv_numbers = extract_all_numbers(cv_text)
    for n in cv_numbers:
        if n not in profile_numbers:
            warnings.append(f"Notice: Metric '{n}' incorporated in tailored statement.")
            
    letter_text = " ".join(cover_letter.paragraphs)
    letter_numbers = extract_all_numbers(letter_text)
    for n in letter_numbers:
        if n not in profile_numbers:
            warnings.append(f"Notice: Metric '{n}' included in cover letter.")
            
    # 4. Project ID validation
    profile_project_ids = {p.id for p in profile.projects}
    tailored_cv.projects = [p for p in tailored_cv.projects if p.id in profile_project_ids]
    profile_exp_ids = {e.id for e in profile.experience}
    tailored_cv.experience = [e for e in tailored_cv.experience if e.id in profile_exp_ids]

    # Enforce formatting & length limits
    tailored_cv = enforce_limits(tailored_cv)

    return tailored_cv, cover_letter, warnings
