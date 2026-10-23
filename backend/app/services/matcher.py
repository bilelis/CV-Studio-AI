import json
import re
from pathlib import Path
import numpy as np
from app.schemas import MasterProfile, JobAnalysis, MatchResult, ProjectScore
from app.llm.client import embed

ALIASES_FILE = Path(__file__).parent.parent / "data" / "skill_aliases.json"
_ALIASES: dict[str, str] = {}

def load_aliases() -> dict[str, str]:
    global _ALIASES
    if not _ALIASES and ALIASES_FILE.exists():
        with open(ALIASES_FILE, "r", encoding="utf-8") as f:
            _ALIASES = json.load(f)
    return _ALIASES

def normalize_token(s: str) -> str:
    cleaned = s.lower().strip()
    cleaned = re.sub(r"[\s\-_]+", " ", cleaned)
    aliases = load_aliases()
    return aliases.get(cleaned, cleaned)

def normalize_list(items: list[str]) -> set[str]:
    return {normalize_token(i) for i in items if i and i.strip()}

def compute_overlap(job_skills: set[str], candidate_skills: set[str]) -> float:
    if not job_skills:
        return 1.0
    matched = job_skills.intersection(candidate_skills)
    return len(matched) / len(job_skills)

def cosine_similarity(v1: list[float], v2: list[float]) -> float:
    a = np.array(v1, dtype=float)
    b = np.array(v2, dtype=float)
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0:
        return 0.5
    cos = float(np.dot(a, b) / (norm_a * norm_b))
    return max(0.0, min(1.0, (cos + 1.0) / 2.0))

def extract_project_terms(p) -> set[str]:
    terms = set(p.stack)
    for b in p.bullets:
        words = re.findall(r"[a-zA-Z0-9+#\.]+", b)
        terms.update(words)
    return normalize_list(list(terms))

def match_profile_to_job(profile: MasterProfile, job: JobAnalysis) -> MatchResult:
    # 1. Gather all profile skills
    profile_raw_skills: list[str] = []
    for cat_skills in profile.skills.values():
        profile_raw_skills.extend(cat_skills)
    for p in profile.projects:
        profile_raw_skills.extend(p.stack)
    for exp in profile.experience:
        profile_raw_skills.extend(exp.stack)
    
    profile_skills_norm = normalize_list(profile_raw_skills)
    
    # 2. Normalize job skills
    must_norm = normalize_list(job.must_have_skills)
    nice_norm = normalize_list(job.nice_to_have_skills)
    kw_norm = normalize_list(job.keywords)
    all_job_skills_norm = must_norm.union(nice_norm).union(kw_norm)
    
    # 3. Skill Overlap Score
    overlap_must = compute_overlap(must_norm, profile_skills_norm)
    overlap_nice = compute_overlap(nice_norm, profile_skills_norm)
    overlap_kw = compute_overlap(kw_norm, profile_skills_norm)
    skill_score = 0.6 * overlap_must + 0.15 * overlap_nice + 0.25 * overlap_kw
    
    # 4. Multilingual Embeddings via Ollama
    job_summary_text = f"{job.title} {job.company}. Requirements: {' '.join(job.must_have_skills)} {' '.join(job.keywords)}. Responsibilities: {' '.join(job.responsibilities)}"
    
    profile_text_parts = [profile.summary]
    profile_text_parts.extend(profile_raw_skills)
    for p in profile.projects:
        profile_text_parts.append(f"{p.name}: {' '.join(p.bullets)}")
    profile_full_text = " ".join(profile_text_parts)
    
    # Prepare batch embed
    texts_to_embed = [job_summary_text, profile_full_text]
    project_texts = []
    for p in profile.projects:
        p_text = f"{p.name} ({', '.join(p.stack)}): {' '.join(p.bullets)}"
        project_texts.append(p_text)
        texts_to_embed.append(p_text)
        
    embeddings = embed(texts_to_embed)
    job_vec = embeddings[0] if len(embeddings) > 0 else []
    profile_vec = embeddings[1] if len(embeddings) > 1 else []
    
    embed_score = cosine_similarity(job_vec, profile_vec)
    global_score = round(100 * (0.7 * skill_score + 0.3 * embed_score))
    global_score = max(5, min(100, global_score))
    
    # 5. Project Scoring & Ranking
    project_scores: list[ProjectScore] = []
    for idx, p in enumerate(profile.projects):
        p_terms = extract_project_terms(p)
        p_matched = [item for item in (job.must_have_skills + job.nice_to_have_skills + job.keywords)
                     if normalize_token(item) in p_terms]
        
        overlap_proj = compute_overlap(all_job_skills_norm, p_terms)
        proj_vec = embeddings[2 + idx] if len(embeddings) > (2 + idx) else []
        proj_embed_score = cosine_similarity(job_vec, proj_vec)
        
        score_val = round(100 * (0.6 * overlap_proj + 0.4 * proj_embed_score))
        project_scores.append(ProjectScore(
            project_id=p.id,
            score=max(0, min(100, score_val)),
            matched_skills=list(dict.fromkeys(p_matched))
        ))
        
    # Sort descending
    project_scores.sort(key=lambda x: x.score, reverse=True)
    suggested_ids = [ps.project_id for ps in project_scores[:3]]
    
    # 6. Matched and Missing Skills
    matched_skills = [s for s in (job.must_have_skills + job.nice_to_have_skills)
                      if normalize_token(s) in profile_skills_norm]
    
    # Missing must-have skills in original job wording
    missing_skills = [s for s in job.must_have_skills
                      if normalize_token(s) not in profile_skills_norm]
    
    return MatchResult(
        global_score=global_score,
        matched_skills=list(dict.fromkeys(matched_skills)),
        missing_skills=list(dict.fromkeys(missing_skills)),
        ranked_projects=project_scores,
        suggested_project_ids=suggested_ids
    )
