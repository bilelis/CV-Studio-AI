import json
import pytest
from pathlib import Path
from app.schemas import (
    MasterProfile,
    JobAnalysis,
    TailoredCV,
    CoverLetter,
    TailoredItem,
    Basics,
    Project
)
from app.services.matcher import normalize_token, normalize_list, compute_overlap, match_profile_to_job
from app.services.fact_check import fact_check_generation
from app.services.renderer import render_cv_pdf, render_letter_pdf
import pymupdf

SAMPLE_FIXTURE_PATH = Path("./fixtures/master_profile.sample.json")

@pytest.fixture
def sample_profile() -> MasterProfile:
    with open(SAMPLE_FIXTURE_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
    return MasterProfile.model_validate(data)

@pytest.fixture
def sample_job_bi() -> JobAnalysis:
    return JobAnalysis(
        title="Alternance Data & Business Intelligence",
        company="Nexa Paris",
        offer_language="fr",
        level="alternance",
        must_have_skills=["SQL", "Python", "Power BI", "ETL"],
        nice_to_have_skills=["API REST", "Git", "PostgreSQL"],
        keywords=["tableaux de bord", "KPI", "reporting"],
        responsibilities=["Création de dashboards Power BI", "Extraction SQL"]
    )

def test_normalize():
    assert normalize_token("ReactJS") == "react"
    assert normalize_token("react.js") == "react"
    assert normalize_token("Postgres") == "postgresql"
    assert normalize_token("Fast API") == "fastapi"
    assert normalize_token("Node.JS") == "node.js"
    assert normalize_token("Power-BI") == "power bi"

    job_set = {"react", "typescript", "fastapi"}
    cand_set = {"react", "typescript", "python"}
    overlap = compute_overlap(job_set, cand_set)
    assert abs(overlap - (2 / 3)) < 0.01

def test_matcher(sample_profile, sample_job_bi):
    res = match_profile_to_job(sample_profile, sample_job_bi)
    assert 0 <= res.global_score <= 100
    assert len(res.ranked_projects) > 0
    # Power BI and ETL are missing from the raw sample profile skills
    assert any("power bi" in s.lower() for s in res.missing_skills)
    assert any("etl" in s.lower() for s in res.missing_skills)

def test_fact_check(sample_profile):
    tailored_cv = TailoredCV(
        language="fr",
        headline="Data Engineer",
        summary="Développeur avec 100% de rigueur et 5 ans d'expérience.",
        skills={
            "Backend": ["Python", "FastAPI", "Kubernetes"],  # Kubernetes is INVENTED
        },
        projects=[
            TailoredItem(
                id="grand-azur-palace",
                name="Grand Azur Palace",
                role="Lead",
                stack=["React", "TypeScript", "Solidity"],  # Solidity is INVENTED
                bullets=["A géré 999999 utilisateurs inconnus.", "Conception d'un tableau de bord."]
            )
        ],
        education=["Diplôme d'ingénieur"],
        languages=["Français"]
    )
    
    cover_letter = CoverLetter(
        language="fr",
        subject="Candidature",
        greeting="Madame, Monsieur,",
        paragraphs=[
            "Je vous contacte pour le poste.",
            "J'ai réalisé des projets pertinents avec 777 clients.",
            "Je reste à votre disposition."
        ],
        closing="Cordialement"
    )

    cleaned_cv, cleaned_letter, warnings = fact_check_generation(
        sample_profile,
        tailored_cv,
        cover_letter
    )

    # 1. Injected skill "Kubernetes" must be removed
    assert "Kubernetes" not in cleaned_cv.skills.get("Backend", [])
    assert any("Kubernetes" in w for w in warnings)

    # 2. Injected stack tech "Solidity" must be removed
    assert "Solidity" not in cleaned_cv.projects[0].stack
    assert any("Solidity" in w for w in warnings)

    # 3. Unverified numbers 999999 and 777 must be flagged
    assert any("999999" in w for w in warnings)
    assert any("777" in w for w in warnings)

def test_renderer(sample_profile):
    cv = TailoredCV(
        language="fr",
        headline="Développeur Full Stack",
        summary="Profil professionnel axé sur le développement web moderne et l'intelligence artificielle.",
        skills={
            "Frontend": ["React", "TypeScript"],
            "Backend": ["Python", "FastAPI"]
        },
        projects=[
            TailoredItem(
                id="grand-azur-palace",
                name="Grand Azur Palace",
                role="Full Stack",
                period="2026",
                stack=["React", "TypeScript"],
                bullets=["Développement de la plateforme et intégration de modèles LLM."]
            )
        ],
        education=["Diplôme d'ingénieur en Business Intelligence & Génie Logiciel"],
        languages=["Français : niveau professionnel", "Anglais : niveau professionnel"]
    )

    filename, pdf_path = render_cv_pdf(sample_profile.basics, cv)
    assert pdf_path.exists()
    assert pdf_path.stat().st_size > 0

    # Read back with PyMuPDF
    doc = pymupdf.open(str(pdf_path))
    extracted_text = " ".join([page.get_text("text") for page in doc])
    doc.close()
    
    assert "Bilel Ayari" in extracted_text
    assert "PROJETS" in extracted_text.upper() or "COMPÉTENCES" in extracted_text.upper()

def test_arabic_renderer(sample_profile):
    cv_ar = TailoredCV(
        language="ar",
        headline="مطور برمجيات ذكاء اصطناعي",
        summary="مهندس برمجيات متخصص في تحليل البيانات ونماذج الذكاء الاصطناعي.",
        skills={
            "المهارات": ["Python", "FastAPI", "React"]
        },
        projects=[
            TailoredItem(
                id="grand-azur-palace",
                name="Grand Azur Palace",
                role="Full Stack",
                period="2026",
                stack=["React", "TypeScript"],
                bullets=["تطوير منصة إدارة متكاملة للمنتجع باستخدام الذكاء الاصطناعي."]
            )
        ],
        education=["شهادة الهندسة في ذكاء الأعمال وهندسة البرمجيات"],
        languages=["العربية : لغة الأم", "الفرنسية : مستوى مهني"]
    )

    filename, pdf_path = render_cv_pdf(sample_profile.basics, cv_ar)
    assert pdf_path.exists()
    assert pdf_path.stat().st_size > 0
