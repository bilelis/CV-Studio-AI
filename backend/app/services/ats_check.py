from pathlib import Path
import pymupdf
from app.schemas import JobAnalysis, ATSReport, Lang
from app.services.matcher import normalize_token
from app.services.renderer import get_headings_for_lang

def run_ats_check(pdf_path: Path, job: JobAnalysis, language: Lang) -> ATSReport:
    doc = pymupdf.open(str(pdf_path))
    extracted_text_chunks = [page.get_text("text") for page in doc]
    doc.close()
    
    full_pdf_text = " ".join(extracted_text_chunks).strip()
    text_extractable = len(full_pdf_text) > 200
    pdf_text_lower = full_pdf_text.lower()
    
    # 1. Check must-have coverage
    must_found = 0
    for term in job.must_have_skills:
        term_clean = term.lower().strip()
        norm_term = normalize_token(term)
        if term_clean in pdf_text_lower or norm_term in pdf_text_lower:
            must_found += 1
            
    must_coverage = round(
        (must_found / len(job.must_have_skills) * 100) if job.must_have_skills else 100.0,
        1
    )
    
    # 2. Check keyword coverage
    all_keywords = list(dict.fromkeys(job.must_have_skills + job.nice_to_have_skills + job.keywords))
    kw_found = 0
    missing_keywords = []
    for term in all_keywords:
        term_clean = term.lower().strip()
        norm_term = normalize_token(term)
        if term_clean in pdf_text_lower or norm_term in pdf_text_lower:
            kw_found += 1
        else:
            missing_keywords.append(term)
            
    kw_coverage = round(
        (kw_found / len(all_keywords) * 100) if all_keywords else 100.0,
        1
    )
    
    # 3. Check headings
    expected_headings = get_headings_for_lang(language)
    sections_found = [
        title for title in expected_headings.values()
        if title.lower() in pdf_text_lower
    ]
    
    return ATSReport(
        text_extractable=text_extractable,
        must_have_coverage=must_coverage,
        keyword_coverage=kw_coverage,
        missing_keywords=missing_keywords,
        sections_found=sections_found
    )
