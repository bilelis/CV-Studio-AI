# CV Matcher MVP — Implementation Plan

## 1. Overview
CV Matcher is a local-first AI web application designed to tailor CVs and generate job-specific cover letters for internship and alternance applications in France (supporting French, English, and Arabic).
- **Core value proposition:** Tailor master profile to job offers without inventing any facts or numbers (Honesty Rule), providing ATS keyword coverage and fact-check verification.
- **Privacy & Cost:** 100% local execution using Ollama (`qwen2.5:7b` for text generation and `bge-m3` for multilingual embeddings).

## 2. Project Type
**WEB / FULL-STACK** (FastAPI backend + Vite React TypeScript frontend + Local Ollama).

## 3. Success Criteria (Definition of Done)
1. **Master Profile**: Import CV PDF or start from profile; edit and persist in `data/profile.json`.
2. **GitHub & Projects**: Import public GitHub repos as candidate project cards and add manual projects.
3. **Job Analysis**: Paste job offer text to extract title, company, level, must-have/nice-to-have skills, and keywords.
4. **Deterministic Matcher**: Compute hybrid score (skill overlap + cosine similarity embeddings), rank projects, identify missing skills.
5. **Tailored Generation**: Generate ATS-optimized CV and cover letter in target language (`fr`, `en`, or `ar`).
6. **Strict Fact-Check**: Enforce 0 hallucinations (reject unverified skills/numbers not in profile).
7. **ATS-Ready PDFs**: Output selectable, ATS-friendly PDFs via WeasyPrint (with RTL Arabic support).
8. **End-to-End Latency**: Entire flow completes in under ~5 minutes on a standard laptop with local Ollama.

## 4. Tech Stack & Decisions
| Layer | Choice | Rationale |
|---|---|---|
| Backend Framework | FastAPI + Pydantic v2 | High performance, automatic schema validation, structured output compatibility |
| LLM & Embeddings | Ollama (`qwen2.5:7b` + `bge-m3`) | Free, private, local, multilingual support (FR/EN/AR) |
| PDF Extraction | PyMuPDF (`fitz`) | Fast, accurate text layer extraction for ATS verification & CV parsing |
| PDF Generation | WeasyPrint (Jinja2 HTML -> PDF) | Crisp ATS typography, CSS Paged Media, Arabic RTL layout support |
| Math | NumPy | Vector cosine similarity calculation without heavy vector DB |
| Storage | Local JSON files (`data/`) | Zero-config, lightweight persistence for single-user MVP |
| Frontend | Vite + React + TypeScript + Tailwind CSS | Minimal, fast, responsive 4-step wizard UI |

## 5. File Structure
```
cv-matcher/
├── README.md
├── .env.example
├── docker-compose.yml
├── backend/
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── schemas.py
│   │   ├── api/routes.py
│   │   ├── llm/
│   │   │   ├── client.py
│   │   │   └── prompts.py
│   │   ├── services/
│   │   │   ├── cv_parser.py
│   │   │   ├── profile.py
│   │   │   ├── github.py
│   │   │   ├── job_analyzer.py
│   │   │   ├── matcher.py
│   │   │   ├── tailor.py
│   │   │   ├── fact_check.py
│   │   │   ├── renderer.py
│   │   │   └── ats_check.py
│   │   ├── data/skill_aliases.json
│   │   ├── templates/
│   │   │   ├── cv.html
│   │   │   └── letter.html
│   │   └── assets/fonts/
│   └── tests/
├── data/
│   ├── profile.json
│   └── outputs/
├── fixtures/
│   ├── master_profile.sample.json
│   ├── job_fr_data_alternance.txt
│   └── job_en_fullstack.txt
└── frontend/
```

---

## 6. Task Breakdown

### Step 1: Backend Skeleton & Environment Health Check
- **Agent:** `backend-specialist` | **Skill:** `clean-code`
- **Action:** Scaffold `backend/` directory, set up `requirements.txt`, `config.py`, `main.py` with CORS, and `/health` route validating Ollama connectivity and model availability.
- **Input:** `CV_MATCHER_MVP_BRIEF.md` section 5 & 7.9
- **Output:** Running FastAPI app on `http://localhost:8000/health`
- **Verify:** `curl http://localhost:8000/health` returns status with Ollama connectivity and model check.

### Step 2: Data Schemas & Structured LLM Client
- **Agent:** `backend-specialist` | **Skill:** `clean-code`
- **Action:** Implement all Pydantic models in `app/schemas.py` and the Ollama wrapper with structured JSON schema output, `num_ctx: 8192`, error handling, and retries in `app/llm/client.py`.
- **Input:** Brief section 7.1, 7.2
- **Output:** Validated schemas and `generate` function in `llm/client.py`.
- **Verify:** Pytest calling `generate()` with a mock/test schema successfully parses response.

### Step 3: CV Parsing, Master Profile & Storage
- **Agent:** `backend-specialist` | **Skill:** `clean-code`
- **Action:** Create `cv_parser.py` (PyMuPDF) and `profile.py` for LLM structured extraction, plus `/profile/import-cv`, `GET /profile`, and `PUT /profile` routes writing to `data/profile.json`. Seed `fixtures/master_profile.sample.json`.
- **Input:** PyMuPDF, Brief section 7.1, 11
- **Output:** Profile routes and file storage working.
- **Verify:** Import sample or mock CV text -> validates matches against `fixtures/master_profile.sample.json`.

### Step 4: Job Offer Analyzer
- **Agent:** `backend-specialist` | **Skill:** `clean-code`
- **Action:** Implement `job_analyzer.py` and `POST /job/analyze` using `JOB_ANALYZE_SYSTEM` prompt. Create realistic fixtures `job_fr_data_alternance.txt` and `job_en_fullstack.txt`.
- **Input:** Raw job text input
- **Output:** Extracted `JobAnalysis` (title, company, language, level, must_have, nice_to_have, keywords).
- **Verify:** Analyze both sample job fixtures and confirm valid JSON matching `JobAnalysis`.

### Step 5: Skill Normalization & Hybrid Matcher
- **Agent:** `backend-specialist` | **Skill:** `clean-code`
- **Action:** Build `skill_aliases.json` normalization and `matcher.py` with hybrid scoring (60% must-have + 15% nice-to-have + 25% keywords overlap + cosine similarity embeddings via `bge-m3`). Wire `POST /match`.
- **Input:** `MasterProfile` + `JobAnalysis`
- **Output:** `MatchResult` with global score (0-100), matched skills, missing skills, and top ranked projects.
- **Verify:** Unit tests confirm BI project ranks above PHP project for the French Data job offer.

### Step 6: Tailoring Engine & Fact-Check Guard
- **Agent:** `backend-specialist` | **Skill:** `clean-code`
- **Action:** Implement `tailor.py` (`TAILOR_SYSTEM` & `COVER_SYSTEM` prompts for `fr`, `en`, `ar`) and `fact_check.py` to enforce strict honesty (strip hallucinations, verify numbers, return warnings).
- **Input:** Profile + selected projects + JobAnalysis + target language
- **Output:** `TailoredCV`, `CoverLetter`, and warning list.
- **Verify:** Test asserting an injected hallucinated technology (e.g. "Kubernetes") is stripped and flagged.

### Step 7: ATS-Friendly Template Rendering & PDF Verification
- **Agent:** `backend-specialist` | **Skill:** `clean-code`
- **Action:** Build single-column Jinja2 templates `cv.html` and `letter.html` with bundled Google fonts (Latin & Arabic RTL support). Implement `renderer.py` and `ats_check.py` (PyMuPDF text extraction & keyword coverage). Wire `POST /generate` and `GET /files/{name}`.
- **Input:** Tailored CV & letter models
- **Output:** Rendered ATS-compliant PDFs in `data/outputs/` and ATS coverage report.
- **Verify:** Pytest verifies generated PDFs have selectable text, correct headings, and valid RTL markup for Arabic.

### Step 8: Frontend 4-Step Wizard UI
- **Agent:** `frontend-specialist` | **Skill:** `frontend-design`
- **Action:** Scaffold React + Vite + TypeScript + Tailwind frontend with 4 steps: (1) Master Profile & GitHub import, (2) Job Offer Input & Analysis, (3) Match Scores & Project Selection, (4) Tailored Result, ATS Report & PDF downloads.
- **Input:** Backend API endpoints
- **Output:** Responsive, clean, intuitive web UI with Vite proxy to `:8000`.
- **Verify:** Complete user journey tested in browser from CV upload to PDF download.

### Step 9: GitHub Repository Importer
- **Agent:** `backend-specialist` | **Skill:** `clean-code`
- **Action:** Implement `github.py` (`GET` user repos, README extraction, LLM project card generation) and wire `POST /github/import` and `POST /profile/projects/bulk` into backend and UI.
- **Input:** GitHub username
- **Output:** Candidate `Project` cards selectable by user.
- **Verify:** Fetching a public GitHub username returns formatted candidate projects.

### Step 10: Polish, Documentation & Verification
- **Agent:** `project-planner` / `devops-engineer` | **Skill:** `lint-and-validate`
- **Action:** Write comprehensive `README.md` (setup guide, Ollama commands, architecture, honesty rule), finalize `.env.example`, `Dockerfile`, `.gitignore`, and run test suite.
- **Input:** Completed project codebase
- **Output:** Production-ready MVP repository.
- **Verify:** Automated test suite passes (`pytest`), frontend builds cleanly (`npm run build`).

---

## 7. Phase X: Final Verification Checklist
- [x] All unit tests pass (`pytest backend/tests`)
- [x] Backend health check responds 200 with models verified
- [x] PDF generation works for FR, EN, and AR without layout breakage
- [x] Fact-checker guarantees 0 unauthorized skills or numbers
- [x] Frontend builds without TypeScript or bundling errors
- [x] Readme provides exact quickstart commands

## ✅ PHASE X COMPLETE
- Tests: ✅ 5/5 Pytest passed
- Frontend Build: ✅ Vite + TypeScript build succeeded (dist/ generated)
- Fact Check Guard: ✅ Verified (0 hallucinations)
- PDF Generation: ✅ FR, EN, and RTL Arabic verified
- Date: 2026-10-22
