import io
import json
from pathlib import Path
from unittest.mock import patch
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.schemas import (
    MasterProfile,
    JobAnalysis,
    TailoredCV,
    CoverLetter,
    TailoredItem,
    Basics,
    Project,
    Education
)

client = TestClient(app)

SAMPLE_FIXTURE_PATH = Path("./fixtures/master_profile.sample.json")

@pytest.fixture
def sample_profile_data() -> dict:
    with open(SAMPLE_FIXTURE_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert "ok" in data
    assert "ollama" in data
    assert "models_ready" in data

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["app"] == "CV Matcher API"

def test_profile_crud(sample_profile_data):
    # 1. Update profile
    put_res = client.put("/profile", json=sample_profile_data)
    assert put_res.status_code == 200
    saved_profile = put_res.json()
    assert saved_profile["basics"]["name"] == "Bilel Ayari"

    # 2. Get profile
    get_res = client.get("/profile")
    assert get_res.status_code == 200
    assert get_res.json()["basics"]["name"] == "Bilel Ayari"

    # 3. Add single project
    new_proj = {
        "id": "test-analytics-platform",
        "name": "Test Analytics Platform",
        "role": "Data Engineer",
        "year": "2026",
        "stack": ["Python", "FastAPI", "SQL"],
        "bullets": ["Conception d'une plateforme de test."],
        "source": "manual",
        "url": ""
    }
    proj_res = client.post("/profile/projects", json=new_proj)
    assert proj_res.status_code == 200
    updated_projects = proj_res.json()["projects"]
    assert any(p["id"] == "test-analytics-platform" for p in updated_projects)

    # 4. Bulk add projects
    bulk_proj = [{
        "id": "bulk-proj-1",
        "name": "Bulk Project 1",
        "role": "Developer",
        "year": "2025",
        "stack": ["React"],
        "bullets": ["Projet importé."],
        "source": "github",
        "url": ""
    }]
    bulk_res = client.post("/profile/projects/bulk", json=bulk_proj)
    assert bulk_res.status_code == 200
    assert any(p["id"] == "bulk-proj-1" for p in bulk_res.json()["projects"])

def test_job_match_endpoint():
    job_payload = {
        "title": "Data Analyst Alternance",
        "company": "Nexa Paris",
        "offer_language": "fr",
        "level": "alternance",
        "must_have_skills": ["SQL", "Python", "Power BI"],
        "nice_to_have_skills": ["Git", "PostgreSQL"],
        "keywords": ["reporting", "KPI"],
        "responsibilities": ["Création de dashboards"]
    }
    res = client.post("/match", json=job_payload)
    assert res.status_code == 200
    match_data = res.json()
    assert 0 <= match_data["global_score"] <= 100
    assert len(match_data["ranked_projects"]) > 0
    assert len(match_data["suggested_project_ids"]) <= 3

def test_generate_and_download_flow(sample_profile_data):
    # Ensure profile exists
    client.put("/profile", json=sample_profile_data)

    job_data = {
        "title": "Développeur Full Stack",
        "company": "Tech Corp",
        "offer_language": "fr",
        "level": "internship",
        "must_have_skills": ["React", "Python", "SQL"],
        "nice_to_have_skills": ["Docker", "Git"],
        "keywords": ["API REST", "Cloud"],
        "responsibilities": ["Développement d'interfaces"]
    }

    mock_tailored_cv = TailoredCV(
        language="fr",
        headline="Développeur Full Stack",
        summary="Étudiant motivé pour stage de fin d'études.",
        skills={
            "Frontend": ["React.js", "TypeScript"],
            "Backend": ["Python", "FastAPI", "SQL"]
        },
        experience=[],
        projects=[
            TailoredItem(
                id="grand-azur-palace",
                name="Grand Azur Palace",
                role="Développeur Full Stack",
                period="2026",
                stack=["React 18", "TypeScript"],
                bullets=["Développement de la plateforme analytique."]
            )
        ],
        education=["Diplôme d'ingénieur en Business Intelligence"],
        languages=["Français : niveau professionnel", "Anglais : niveau professionnel"]
    )

    mock_cover_letter = CoverLetter(
        language="fr",
        subject="Candidature Développeur Full Stack",
        greeting="Madame, Monsieur,",
        paragraphs=[
            "Je vous adresse ma candidature pour le stage.",
            "Mes projets m'ont permis de maîtriser React et FastAPI.",
            "Je serais ravi d'échanger avec vous."
        ],
        closing="Cordialement"
    )

    with patch("app.services.tailor.client.generate") as mock_llm_gen:
        # First call is TailoredCV, second call is CoverLetter
        mock_llm_gen.side_effect = [mock_tailored_cv, mock_cover_letter]

        req_body = {
            "job": job_data,
            "project_ids": ["grand-azur-palace"],
            "language": "fr"
        }

        gen_res = client.post("/generate", json=req_body)
        assert gen_res.status_code == 200
        gen_data = gen_res.json()

        assert "cv_pdf_url" in gen_data
        assert "letter_pdf_url" in gen_data
        assert "ats_report" in gen_data
        assert gen_data["ats_report"]["text_extractable"] is True
        assert gen_data["ats_report"]["must_have_coverage"] >= 0

        # Download CV PDF
        cv_url = gen_data["cv_pdf_url"]
        download_res = client.get(cv_url)
        assert download_res.status_code == 200
        assert download_res.headers["content-type"] == "application/pdf"
        assert len(download_res.content) > 1000  # valid PDF size

        # Download Cover Letter PDF
        letter_url = gen_data["letter_pdf_url"]
        download_letter_res = client.get(letter_url)
        assert download_letter_res.status_code == 200
        assert download_letter_res.headers["content-type"] == "application/pdf"
        assert len(download_letter_res.content) > 1000

def test_file_not_found():
    res = client.get("/files/non_existent_file.pdf")
    assert res.status_code == 404

def test_invalid_cv_upload():
    # Attempt to upload a non-pdf file
    res = client.post(
        "/profile/import-cv",
        files={"file": ("test.txt", io.BytesIO(b"Hello text file"), "text/plain")}
    )
    assert res.status_code == 400
