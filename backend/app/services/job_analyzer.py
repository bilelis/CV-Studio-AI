from app.schemas import JobAnalysis
from app.llm import client, prompts
from fastapi import HTTPException

def analyze_job(job_text: str) -> JobAnalysis:
    if not job_text or not job_text.strip():
        raise HTTPException(status_code=400, detail="Job description text cannot be empty.")
    
    user_prompt = f"Analyze the following job description and extract requirements:\n\n{job_text}"
    return client.generate(
        JobAnalysis,
        prompts.JOB_ANALYZE_SYSTEM,
        user_prompt,
        temperature=0.2
    )
