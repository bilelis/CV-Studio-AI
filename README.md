# CV Matcher — Local AI CV & Cover Letter Tailoring Engine

> **100% Local, ATS-Optimized, and strictly truthful.**  
> Automatically tailor your Master Profile to job offers, rank relevant projects, and generate professional PDFs in **French, English, or Arabic** using local Ollama models (`qwen2.5:7b` + `bge-m3`). Zero cloud API costs and zero data leakage.

---

## 🌟 Key Features

1. **Master Profile Storage**: Upload your CV PDF once or manage your projects in a persistent `profile.json`.
2. **GitHub Public Repo Import**: Automatically fetch your public repositories and transform READMEs/languages into structured project cards.
3. **Structured Job Analysis**: Paste any job description to extract required must-have skills, nice-to-have tools, level, and ATS search keywords.
4. **Deterministic Hybrid Matcher**: Ranks projects and computes a 0–100 match score using:
   - **60%** must-have skills overlap
   - **15%** nice-to-have tools overlap
   - **25%** ATS keywords overlap
   - **Semantic Cosine Similarity** via embeddings.
5. **Strict Honesty Rule (Zero Hallucinations)**:
   - AI may select, reorder, shorten, and rewrite factual bullets.
   - **Never invents** skills, technologies, employers, degrees, dates, or metrics.
   - Built-in deterministic fact-checker automatically strips unverified technologies and flags unauthorized numbers.
6. **ATS-Compliant PDF Export**:
   - Clean, single-column HTML-to-PDF templates.
   - Real selectable text.
   - Native Right-to-Left (RTL) Arabic support with shaped characters.
   - Automated ATS report checking keyword coverage and text extractability.

---

## 🛠️ Architecture & Tech Stack

```
[React 19 + TypeScript + Tailwind v4 UI (4 Steps)]
                        │  HTTP/JSON (Vite Proxy)
[FastAPI Backend] ──────┴───────────────────────────────────────
   ├─ services/cv_parser.py      PDF → text (PyMuPDF)
   ├─ services/profile.py        text → MasterProfile (LLM Structured Output)
   ├─ services/github.py         username → candidate project cards (GitHub API)
   ├─ services/job_analyzer.py   raw job text → JobAnalysis
   ├─ services/matcher.py        hybrid overlap + bge-m3 embeddings
   ├─ services/tailor.py         profile + job + language → TailoredCV + CoverLetter
   ├─ services/fact_check.py     strips unverified skills & warns on new numbers
   ├─ services/renderer.py       HTML → PDF (WeasyPrint / Headless Edge fallback)
   └─ services/ats_check.py      PDF text extraction & ATS keyword coverage audit
                        │
   [Local Ollama on host: qwen2.5:7b + bge-m3]
```

| Layer | Choice |
|---|---|
| **Backend API** | Python 3.11+, FastAPI, Uvicorn, Pydantic v2 |
| **Local LLM** | Ollama (`qwen2.5:7b` chat, `bge-m3` embeddings) |
| **PDF Extraction** | PyMuPDF (`pymupdf`) |
| **PDF Rendering** | WeasyPrint (Linux/Docker) / Headless Chromium/Edge (Windows) |
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons |
| **Storage** | Local JSON (`data/profile.json`) |

---

## 🚀 Quickstart Guide

### 1. Prerequisites
- **Python 3.11+**
- **Node.js 18+**
- **Ollama**: Download and install from [ollama.com](https://ollama.com)

Pull the local models:
```bash
ollama pull qwen2.5:7b
ollama pull bge-m3
```

Ensure Ollama is running (`ollama serve` or launch the desktop app).

---

### 2. Backend Setup

```bash
# Create and activate virtual environment (optional)
python -m venv .venv
.venv\Scripts\activate   # Windows
# source .venv/bin/activate # Linux/macOS

# Install dependencies
pip install -r backend/requirements.txt

# Run backend server
python -m uvicorn backend.app.main:app --reload --port 8000
```
Backend will be live at: `http://localhost:8000` (API docs at `/docs`, health at `/health`).

---

### 3. Frontend Setup

In a separate terminal:
```bash
cd frontend
npm install
npm run dev
```
Open your browser at `http://localhost:5173`.

---

### 4. Running with Docker (Alternative)

```bash
docker-compose up --build
```
The backend will run in a container with GTK/Pango pre-installed for WeasyPrint, connecting to Ollama on the host machine.

---

## 🧪 Testing

Run the automated test suite:
```bash
python -m pytest backend/tests/test_all.py -v
```

Tests verify:
- ✅ **Skill Normalization**: Alias mapping (`react.js` → `react`, `fast api` → `fastapi`) and overlap math.
- ✅ **Matcher Scoring**: Bounded 0–100 global score and domain project ranking.
- ✅ **Fact-Checker**: Removal of unauthorized technologies (e.g. injected "Kubernetes") and number verification.
- ✅ **Renderer**: Valid PDF creation with selectable text and section headings.
- ✅ **Arabic RTL**: Proper `dir="rtl"` layout and font integration.

---

## 🔒 The Honesty Rule (Why It Matters)

Applicant Tracking Systems (ATS) and recruiters penalize AI-generated CVs when candidates claim skills they cannot defend in an interview.

CV Matcher enforces a **hard firewall**:
1. Only skills, projects, and experiences documented in your **Master Profile** are permitted in the final CV.
2. If the LLM generates a technology absent from your profile, `fact_check.py` strips it before rendering.
3. Every number and percentage in the bullets is validated against source data.
4. The UI displays an explicit **Fact-Check Report** highlighting 0 hallucinations.

---

## 📂 Project Structure

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
│   │   └── templates/
│   │       ├── cv.html
│   │       └── letter.html
│   └── tests/
│       ├── conftest.py
│       └── test_all.py
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

## 👤 Author
Developed for **Bilel Ayari** — Engineering Student in Business Intelligence & Software Engineering.
