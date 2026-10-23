# CV Matcher — MVP Build Brief (for the AI coder)

> **Read this whole file before writing any code. Build ONLY the MVP described here. Follow the build order. Verify each step before moving to the next.**

---

## 0. Rules for the AI coder (read first)

1. **Goal = a working MVP, not a perfect product.** If something is not in section 3 ("MVP scope"), do NOT build it.
2. **The stack is fixed** (section 5). Do not swap libraries or add new ones without a strong reason.
3. **Build step by step** (section 9). After each step: run it, test it, show it works, then continue. Never leave the project in a broken state.
4. **Choose sensible defaults instead of asking questions.** Note any assumption in `README.md`.
5. **Keep code simple**: type hints, small functions, Pydantic models, clear errors. No over-engineering (no auth, no queues, no microservices, no vector DB).
6. **Honesty rule (most important product rule):** the AI may *select, reorder, shorten and rewrite* real content from the user's profile. It must **never invent** skills, technologies, employers, degrees, dates, or numbers. A fact-check step enforces this (section 7.5).
7. **Local only:** all AI runs locally with **Ollama** (no OpenAI / cloud API, no API keys).
8. Run everything on a normal student laptop. Assume Ollama is already installed on the host machine.

---

## 1. Context (who and why)

- **User:** Bilel Ayari, engineering student (Business Intelligence & Software Engineering) in Tunisia, applying for **internships (stage) and alternance in France**. He is a Full Stack developer (React, TypeScript, Next.js, Python/FastAPI, Node, PHP, SQL) with AI/LLM projects (local Ollama).
- **Problem:** tailoring a CV and cover letter for every job offer is slow, and a generic CV fails ATS (Applicant Tracking System) keyword filters.
- **Product:** a local AI web app. The user gives their **CV + GitHub + extra projects** once. For each job offer they paste, the app **analyzes the job, picks the most relevant projects, rewrites the CV for that job, writes a cover letter, and exports ATS-friendly PDFs in French, English or Arabic.**
- **Secondary goal:** the project will be shown on LinkedIn and GitHub as a portfolio piece, so the repo must be clean, run with a few commands, and have a good README with a demo GIF.

---

## 2. What "success" means (Definition of Done)

With the sample CV (section 11) and a sample job offer, a user can:

1. Import the CV PDF → get an editable **Master Profile**.
2. (Optional) Import public GitHub repos as project cards and add a manual project.
3. Paste a job offer → get **Job Analysis** (must-have skills, keywords…).
4. See a **match score**, matched skills, missing skills, and ranked projects; tick/untick projects.
5. Choose language (**fr / en / ar**) and click Generate.
6. Download **CV.pdf** and **CoverLetter.pdf**: ATS-friendly, text selectable, correct language, Arabic rendered RTL correctly.
7. See an **ATS report** (keyword coverage %) and **fact-check warnings** (should be none).
8. Whole flow takes **under ~5 minutes** on a laptop with `qwen2.5:7b`.

---

## 3. MVP scope

### IN scope
- Single user, no login, no database server. Data stored as **JSON files** in `data/`.
- CV PDF → Master Profile (LLM extraction, user can edit).
- Manual project add.
- GitHub import of **public** repos by username (README + languages → project card).
- Job offer **pasted as text** → structured analysis.
- Matching score (hybrid: skill overlap + embeddings) and project ranking.
- Tailored CV content + cover letter in **fr / en / ar**.
- PDF rendering (HTML → PDF) with ATS-safe template + RTL Arabic.
- ATS keyword coverage check + fact-check guard.
- Minimal React UI with 4 steps.

### OUT of scope (do NOT build)
User accounts/auth, cloud deployment, payments, DOCX export, job URL scraping, LinkedIn import, vector database (ChromaDB/pgvector), background job queues, streaming, multiple CV templates, drag-and-drop editors, mobile app, analytics, i18n of the UI itself (UI can be English only).

---

## 4. High-level architecture

```
[React UI: 4 steps]
        │  HTTP/JSON
[FastAPI backend]
   ├─ services/cv_parser.py      PDF → text (PyMuPDF)
   ├─ services/profile.py        text → MasterProfile (LLM, structured output); load/save JSON
   ├─ services/github.py         username → project cards (GitHub API + LLM summary)
   ├─ services/job_analyzer.py   job text → JobAnalysis (LLM)
   ├─ services/matcher.py        skill overlap + embeddings → scores, ranking, gaps
   ├─ services/tailor.py         profile + job + language → TailoredCV + CoverLetter (LLM)
   ├─ services/fact_check.py     remove/flag anything not in the profile
   ├─ services/renderer.py       Jinja2 HTML → PDF (WeasyPrint)
   └─ services/ats_check.py      read PDF text back, keyword coverage score
        │
   [Ollama on host: qwen2.5:7b (chat) + bge-m3 (embeddings)]
        │
   data/  profile.json  outputs/*.pdf
```

**Pipeline per job:** `job text → JobAnalysis → Match (score + ranked projects) → user picks projects + language → Tailor (CV + letter) → Fact-check → Render PDFs → ATS check`.

**Key idea:** one structured **Master Profile**; every generated CV is a *view* of it. Language switching = generating the same structured content in another language, then rendering.

---

## 5. Fixed tech stack

| Part | Choice |
|---|---|
| Language | Python 3.11+ |
| API | FastAPI + Uvicorn, Pydantic v2, python-multipart |
| LLM | `ollama` Python package; chat model `qwen2.5:7b` (configurable) |
| Embeddings | `bge-m3` via Ollama (multilingual FR/EN/AR) |
| PDF read | PyMuPDF (`pymupdf`) |
| HTTP | `httpx` (GitHub API) |
| Templates | Jinja2 |
| PDF write | WeasyPrint (HTML → PDF) |
| Math | numpy (cosine similarity) |
| Storage | JSON files in `data/` (no DB) |
| Tests | pytest |
| Frontend | React + Vite + TypeScript + Tailwind (no router, no state library) |

`requirements.txt` (no need to pin strictly): `fastapi uvicorn[standard] pydantic python-multipart ollama pymupdf httpx jinja2 weasyprint numpy python-dotenv pytest`

**Windows note:** WeasyPrint needs Pango/GTK libraries and is painful on native Windows. Recommended: run the backend in **Docker** or **WSL2**. Provide a `Dockerfile` for the backend (python:3.11-slim + `libpango-1.0-0 libpangoft2-1.0-0`). Ollama stays on the host; the container reaches it via `OLLAMA_HOST=http://host.docker.internal:11434`. (Fallback only if WeasyPrint fails: Playwright + Chromium `page.pdf()`.)

Environment variables (`.env.example`):
```
OLLAMA_HOST=http://localhost:11434
CHAT_MODEL=qwen2.5:7b
EMBED_MODEL=bge-m3
GITHUB_TOKEN=            # optional, raises GitHub rate limit from 60 to 5000/hour
DATA_DIR=./data
```

Setup commands to document in README:
```
ollama pull qwen2.5:7b
ollama pull bge-m3
```

---

## 6. Folder structure

```
cv-matcher/
├─ README.md
├─ .env.example
├─ docker-compose.yml            # optional, last step
├─ backend/
│  ├─ requirements.txt
│  ├─ Dockerfile
│  ├─ app/
│  │  ├─ main.py                 # FastAPI app, CORS for http://localhost:5173
│  │  ├─ config.py
│  │  ├─ schemas.py              # ALL Pydantic models (section 7.1)
│  │  ├─ api/routes.py
│  │  ├─ llm/
│  │  │  ├─ client.py            # ollama wrapper (section 7.2)
│  │  │  └─ prompts.py           # all prompts (section 8)
│  │  ├─ services/               # files listed in section 4
│  │  ├─ data/skill_aliases.json # normalization map (section 7.3)
│  │  ├─ templates/
│  │  │  ├─ cv.html              # ONE template, language-aware (LTR/RTL)
│  │  │  └─ letter.html
│  │  └─ assets/fonts/           # bundled fonts (Latin + Arabic)
│  └─ tests/
├─ data/                         # runtime: profile.json, outputs/ (gitignored)
├─ fixtures/
│  ├─ master_profile.sample.json # section 11
│  ├─ job_fr_data_alternance.txt # create a realistic sample
│  └─ job_en_fullstack.txt       # create a realistic sample
└─ frontend/                     # Vite React TS app
```

---

## 7. Backend design

### 7.1 Data models (`schemas.py`)

```python
from typing import Literal
from pydantic import BaseModel, Field

Lang = Literal["fr", "en", "ar"]

class Basics(BaseModel):
    name: str
    headline: str = ""
    email: str = ""
    phone: str = ""
    location: str = ""
    github: str = ""
    linkedin: str = ""

class Project(BaseModel):
    id: str                      # slug, unique, e.g. "grand-azur-palace"
    name: str
    role: str = ""
    year: str = ""
    stack: list[str] = []        # technologies, short canonical names
    bullets: list[str] = []      # factual bullets from the user's content
    source: Literal["cv", "github", "manual"] = "cv"
    url: str = ""

class Education(BaseModel):
    degree: str
    school: str = ""
    location: str = ""
    period: str = ""
    details: str = ""

class MasterProfile(BaseModel):
    basics: Basics
    summary: str = ""
    skills: dict[str, list[str]] = {}        # category -> skills
    experience: list[Project] = []           # same shape as Project (company in `name`)
    projects: list[Project] = []
    education: list[Education] = []
    languages: list[str] = []                # e.g. "Arabe : langue maternelle"

class JobAnalysis(BaseModel):
    title: str
    company: str = ""
    offer_language: Lang = "fr"
    level: Literal["internship", "alternance", "junior", "mid", "senior", "unknown"] = "unknown"
    must_have_skills: list[str] = []
    nice_to_have_skills: list[str] = []
    keywords: list[str] = []                 # other terms an ATS would search
    responsibilities: list[str] = Field(default=[], max_length=5)

class ProjectScore(BaseModel):
    project_id: str
    score: int                               # 0-100
    matched_skills: list[str]

class MatchResult(BaseModel):
    global_score: int                        # 0-100
    matched_skills: list[str]
    missing_skills: list[str]                # required by job, absent from profile
    ranked_projects: list[ProjectScore]
    suggested_project_ids: list[str]         # top 3

class TailoredItem(BaseModel):
    id: str
    name: str
    role: str = ""
    period: str = ""
    stack: list[str] = []
    bullets: list[str] = Field(default=[], max_length=3)   # <= 20 words each

class TailoredCV(BaseModel):
    language: Lang
    headline: str                            # job-aligned title line
    summary: str                             # max ~45 words
    skills: dict[str, list[str]]             # ordered: job-relevant first
    experience: list[TailoredItem] = []
    projects: list[TailoredItem]             # max 4
    education: list[str]                     # ready-to-print lines, in target language
    languages: list[str]                     # ready-to-print lines, in target language

class CoverLetter(BaseModel):
    language: Lang
    subject: str
    greeting: str
    paragraphs: list[str] = Field(min_length=3, max_length=4)
    closing: str
```

### 7.2 LLM client (`llm/client.py`) — IMPORTANT details

- Use **structured output**: pass the Pydantic JSON schema to Ollama's `format` parameter, then validate with Pydantic. Small local models are unreliable without this.
- **Set `num_ctx` to 8192** (Ollama's default context is small and silently truncates long CV/job text).
- Low temperature (0.2) for extraction/analysis, 0.4 for letter writing.
- Retry up to 2 times if JSON/validation fails; then raise a clear HTTP 502 error ("LLM output invalid").
- Handle "Ollama not running" and "model not pulled" with a friendly error message.
- Request timeout ≥ 300 s.

```python
import ollama
from pydantic import BaseModel

def generate(schema: type[BaseModel], system: str, user: str, temperature: float = 0.2):
    for attempt in range(3):
        resp = ollama.Client(host=OLLAMA_HOST, timeout=300).chat(
            model=CHAT_MODEL,
            messages=[{"role": "system", "content": system},
                      {"role": "user", "content": user}],
            format=schema.model_json_schema(),
            options={"temperature": temperature, "num_ctx": 8192},
        )
        try:
            return schema.model_validate_json(resp["message"]["content"])
        except Exception:
            if attempt == 2:
                raise
```

Embeddings: `ollama.Client(...).embed(model=EMBED_MODEL, input=[...])["embeddings"]`.

### 7.3 Skill normalization (`data/skill_aliases.json`)

Lowercase, trim, then map aliases to one canonical name so matching works.
Examples: `reactjs/react.js → react`, `js → javascript`, `ts → typescript`, `postgres → postgresql`, `node/nodejs/node.js → node.js`, `mongo → mongodb`, `fast api → fastapi`, `power bi → powerbi`, `ia/ai → ai`, `llm/llms → llm`, `rest/api rest/restful → rest api`. Start with ~40 entries; the coder may extend.

### 7.4 Matching (`matcher.py`)

All deterministic and explainable:

```
profile_skills = normalized set of: all skills + all project.stack + experience.stack
must   = normalized job.must_have_skills
nice   = normalized job.nice_to_have_skills
kw     = normalized job.keywords

skill_score = 0.6*overlap(must) + 0.15*overlap(nice) + 0.25*overlap(kw)   # overlap = |job ∩ profile| / |job| (1.0 if job list empty)
embed_score = cosine(embed(job_text_summary), embed(profile_text))        # profile_text = summary + skills + project names/bullets
global_score = round(100 * (0.7*skill_score + 0.3*embed_score))

project_score = round(100 * (0.6*overlap(project.stack ∪ bullets terms vs must+nice+kw) + 0.4*cosine(embed(job), embed(project text))))
suggested_project_ids = top 3 by project_score
missing_skills = must - profile_skills   (display in original job wording)
```
Compute embeddings with one batched `embed` call. No vector DB: with <50 items numpy is enough.

### 7.5 Tailoring + Fact-check

`tailor.py` makes **two LLM calls**: (1) `TailoredCV` (2) `CoverLetter`. Input is ONLY: basics, skills, selected projects, experience, education, languages, JobAnalysis, target language.

`fact_check.py` runs after the LLM, deterministic:
1. Build `allowed_tech` = normalized profile skills + all stacks.
2. For every skill in `TailoredCV.skills` and every `stack` item: if not in `allowed_tech` → **remove it** and add a warning.
3. For every number (regex `\d+[\d.,%]*`) in bullets/summary/letter: it must appear in the source profile text, otherwise add a warning (and remove the number's sentence in bullets if easy; otherwise only warn).
4. Check that every `projects[].id` exists in the profile and that selected items were not renamed to something unrelated.
5. Return `warnings: list[str]`. UI shows them in red. Goal on the sample data: **0 warnings**.

Also enforce limits in code: summary ≤ 45 words, ≤ 4 projects, ≤ 3 bullets each, bullet ≤ 22 words (truncate/trim otherwise).

### 7.6 Rendering (`renderer.py`) — ATS-friendly rules

- ONE Jinja2 template `cv.html`, switched by `lang` (`dir="rtl"` for `ar`, `lang` attribute set).
- **Single column. No tables for layout, no icons, no images, no text boxes, no columns, no colored text on colored background.** Real selectable text.
- Standard section headings (dictionary below), simple bullets, dates like `2022 – 2026`.
- A4, margins ~15 mm, base font 10–10.5 pt. Target **1 page** (max 2).
- Bundle fonts in `assets/fonts/` and load via `@font-face` with a file path; set `base_url` in WeasyPrint. Latin font: e.g. Noto Sans. Arabic font: e.g. Noto Naskh Arabic or Cairo.
- Arabic: `direction: rtl`, headings in Arabic, technologies/emails/URLs/phones kept LTR using `<span dir="ltr">` or `<bdi>`.
- Output to `data/outputs/CV_<lang>_<timestamp>.pdf` and `CoverLetter_<lang>_<timestamp>.pdf`.

Section headings:

| key | fr | en | ar |
|---|---|---|---|
| summary | Profil | Summary | الملخص |
| skills | Compétences techniques | Technical Skills | المهارات التقنية |
| experience | Expérience | Experience | الخبرة |
| projects | Projets | Projects | المشاريع |
| education | Formation | Education | التعليم |
| languages | Langues | Languages | اللغات |

Cover letter template: sender block (name, email, phone, location), date `DD/MM/YYYY`, subject line, greeting, 3–4 paragraphs, closing, name. Formal tone. French greeting default: "Madame, Monsieur,".

### 7.7 ATS check (`ats_check.py`)

After rendering, open the generated PDF with PyMuPDF, extract text, and report:
- `text_extractable` (bool, text length > 200),
- `must_have_coverage` and `keyword_coverage` (% of job terms found in the PDF text, normalized, case-insensitive),
- `missing_keywords` (job terms not in PDF; these are mostly the real gaps),
- `sections_found` (headings detected).

Do **not** do keyword stuffing or hidden text. Only truthful matches count.

### 7.8 GitHub import (`github.py`)

- `GET https://api.github.com/users/{username}/repos?per_page=100&sort=updated` → drop forks and archived; keep the 10 most recently updated; use `GITHUB_TOKEN` if set.
- For each: README via `GET /repos/{u}/{r}/readme` with header `Accept: application/vnd.github.raw`, languages via `/repos/{u}/{r}/languages`.
- Truncate README to ~6000 chars. LLM turns it into a `Project` (source="github", 2–3 factual bullets, `stack` only from README + languages, `url` = repo URL).
- Return candidates; the **user selects** which to save into the profile. Nothing is saved automatically.
- Handle: user not found, rate limit (clear message), repo without README (use description + languages).

### 7.9 API endpoints (`api/routes.py`)

| Method | Path | Body | Returns |
|---|---|---|---|
| GET | `/health` | – | `{ok, ollama, models_ready}` |
| POST | `/profile/import-cv` | multipart PDF | `MasterProfile` (saved as draft) |
| GET | `/profile` | – | `MasterProfile` |
| PUT | `/profile` | `MasterProfile` | saved profile |
| POST | `/profile/projects` | `Project` | updated profile |
| POST | `/github/import` | `{username}` | `list[Project]` (candidates) |
| POST | `/profile/projects/bulk` | `list[Project]` | updated profile |
| POST | `/job/analyze` | `{text}` | `JobAnalysis` |
| POST | `/match` | `{job: JobAnalysis}` | `MatchResult` |
| POST | `/generate` | `{job, project_ids, language}` | `{tailored_cv, cover_letter, cv_pdf_url, letter_pdf_url, ats_report, warnings}` |
| GET | `/files/{name}` | – | the PDF |

Errors: JSON `{detail: "human readable message"}` with proper status codes.

---

## 8. Prompts (put in `llm/prompts.py`)

Use these as the base; the coder may refine wording, not the rules.

**CV_EXTRACT_SYSTEM**
```
You extract structured data from a CV. Copy facts exactly as written; do not invent anything.
If information is missing, use an empty string or empty list.
Keep the CV's original language. Technologies in `stack` must be short canonical names (e.g. "React", "PostgreSQL").
Create a short unique `id` slug for every project. Return JSON only, matching the schema.
```

**JOB_ANALYZE_SYSTEM**
```
You analyze a job offer for CV matching. Extract: title, company, offer_language (fr/en/ar), level
(internship, alternance, junior, mid, senior, unknown), must_have_skills (explicitly required skills/technologies),
nice_to_have_skills, keywords (other important terms an ATS would search: methods, tools, domain words),
responsibilities (max 5 short items). Technologies as short canonical names. Do not invent anything not in the offer.
Return JSON only.
```

**GITHUB_SUMMARY_SYSTEM**
```
Turn this GitHub repository (README, languages, description) into a project card for a CV.
Use ONLY information present in the input. 2-3 factual bullets, max 20 words each, no marketing language, no invented numbers.
`stack` = technologies explicitly present in README or languages. Return JSON only.
```

**TAILOR_SYSTEM**
```
You tailor a CV to a job offer. Write ALL text in the target language: {language}
(fr = French, en = English, ar = Arabic). Keep technology names, product names, emails and URLs in Latin script.
STRICT RULES:
1. Use ONLY facts present in PROFILE. Never invent skills, technologies, employers, degrees, dates or numbers.
2. Do not add a skill to `skills` or `stack` unless it already exists in PROFILE.
3. Rewrite bullets to emphasize what is relevant to JOB, using the job's own wording ONLY when it truthfully describes the work.
4. Summary: max 45 words, aligned with the job title, truthful.
5. Order skills so the ones required by the job come first.
6. Bullets: max 3 per item, max 20 words, start with a strong verb, no first person.
7. Education and languages: output ready-to-print lines translated into the target language.
8. Include only the projects given in SELECTED_PROJECTS. Return JSON only.
```

**COVER_SYSTEM**
```
Write a professional cover letter in {language} for the job in JOB, using ONLY facts from PROFILE and SELECTED_PROJECTS.
3-4 short paragraphs, max 300 words total: (1) motivation for this role/company, (2) the 1-2 most relevant projects and skills,
(3) what the candidate wants to learn/bring (internship/alternance context if level says so), (4) polite closing.
Formal tone. No invented facts or numbers, no exaggerated claims. If company is empty, write a neutral version.
Return JSON matching the schema (subject, greeting, paragraphs, closing).
```

---

## 9. Build order (follow strictly)

Each step has an **acceptance test**. Do not continue until it passes.

**Step 1 — Skeleton & health.** Repo structure, `config.py`, FastAPI app, CORS, `/health` that checks Ollama and that both models exist.
*Accept:* `GET /health` returns ok with models ready.

**Step 2 — LLM client + schemas.** `schemas.py`, `llm/client.py` (structured output, `num_ctx=8192`, retry, friendly errors).
*Accept:* a small test calls the client with a trivial schema and gets a valid object.

**Step 3 — CV import → Master Profile.** `cv_parser.py`, `profile.py`, endpoints `/profile/import-cv`, `GET/PUT /profile`, JSON file storage.
*Accept:* uploading the user's CV PDF returns a profile with the 4 projects, skills, education, languages (compare with `fixtures/master_profile.sample.json`).

**Step 4 — Job analyzer.** `job_analyzer.py` + `/job/analyze`.
*Accept:* both sample job offers give sensible must-have skills and the correct `offer_language`.

**Step 5 — Matcher.** `matcher.py` + alias normalization + `/match`.
*Accept:* unit tests for normalization/overlap; on the FR data-alternance offer the BI/data project ranks above the HR PHP project; `missing_skills` is plausible.

**Step 6 — Tailor + fact-check.** `tailor.py`, `fact_check.py`.
*Accept:* for fr/en/ar the output validates against `TailoredCV`; unit test proves an invented skill ("Kubernetes") injected into an LLM output gets removed with a warning.

**Step 7 — Renderer + ATS check.** `cv.html`, `letter.html`, fonts, `renderer.py`, `ats_check.py`, `/generate`, `/files/{name}`.
*Accept:* 3 PDFs (fr/en/ar) open correctly; text is selectable; Arabic is right-to-left with shaped letters (not broken/isolated); ATS report returns coverage numbers; CV fits 1 page (2 max).

**Step 8 — Frontend (4 steps, minimal).**
1. *Profile:* upload CV, show/edit the profile (simple forms or a JSON editor is acceptable), add manual project, GitHub import with checkboxes.
2. *Job:* paste text, analyze, show the analysis.
3. *Match:* score, matched/missing skills, ranked projects with checkboxes (top 3 pre-checked), language selector (fr/en/ar), Generate button with loading spinner.
4. *Result:* PDF previews/download links for CV and cover letter, ATS report, red warnings if any.
Vite dev proxy to the backend. Clear error banners (Ollama down, model missing, GitHub rate limit).
*Accept:* full flow works in the browser with the sample data.

**Step 9 — GitHub import.** `github.py` + endpoints + UI wiring (if not already done).
*Accept:* importing a real public username lists repos as candidates; saving selected ones adds them to the profile.

**Step 10 — Polish & ship.** `README.md` (what it is, setup commands, how to run, screenshots/GIF placeholder, honesty-rule explanation, limitations), `.env.example`, `Dockerfile` for the backend (+ optional `docker-compose.yml`), pytest passing, `.gitignore` for `data/`.
*Accept:* a fresh clone can run with the documented commands.

---

## 10. Tests (pytest, keep light)

- `test_normalize`: alias mapping and set overlap.
- `test_matcher`: scores in 0–100, ranking order on fixture data (mock embeddings or use a tiny deterministic fake).
- `test_fact_check`: invented skill removed + warning; unknown number flagged; valid content passes with 0 warnings.
- `test_renderer`: PDF is created, extracted text contains the candidate's name and a section heading; for `ar`, the HTML has `dir="rtl"`.
- LLM calls are **mocked** in unit tests. One optional manual script `scripts/e2e.py` runs the full pipeline on the fixtures with real Ollama.

---

## 11. Seed data: `fixtures/master_profile.sample.json`

Create this file exactly (source: the user's real CV, French). Use it for tests and as the expected result of CV import.

```json
{
  "basics": {
    "name": "Bilel Ayari",
    "headline": "Développeur Full Stack & Ingénieur assisté par l'IA",
    "email": "ba336158@gmail.com",
    "phone": "+216 93 783 124",
    "location": "Tunisie",
    "github": "github.com/bilelis",
    "linkedin": "linkedin.com/in/bilel-ayari"
  },
  "summary": "Étudiant en Business Intelligence et Génie Logiciel, avec une solide expérience pratique du développement Full Stack et de l'ingénierie assistée par l'IA. Parcours éprouvé dans la réalisation de projets concrets avec React, TypeScript, PHP et SQL. Explore activement l'architecture des systèmes d'IA et les workflows LLM.",
  "skills": {
    "Frontend": ["React.js", "Next.js", "TypeScript", "Tailwind CSS", "Vite"],
    "Backend": ["PHP", "Python", "FastAPI", "SQL", "MySQL", "PostgreSQL", "REST API"],
    "IA & outils": ["LLM", "OpenAI API", "Prompt engineering", "Agents IA", "Cursor AI"],
    "Données / Cloud": ["Supabase", "Business Intelligence", "Git", "GitHub", "CI/CD"]
  },
  "experience": [],
  "projects": [
    {
      "id": "grand-azur-palace",
      "name": "Grand Azur Palace Resort & Spa – Console de gestion et d'analytique",
      "role": "Développeur Full Stack",
      "year": "2026",
      "stack": ["React 18", "TypeScript", "Node.js", "Express", "MongoDB", "Ollama", "Qwen 2.5", "JWT"],
      "bullets": [
        "Conception d'une plateforme de gestion pour hôtel 5 étoiles avec tableau de bord analytique en temps réel (RevPAR, ADR, ventes) et facturation instantanée des séjours.",
        "Intégration d'un LLM local (Qwen 2.5 via Ollama) pour interroger en langage naturel la base MongoDB (13 collections, 89 000+ enregistrements), avec backend Node.js/Express et authentification JWT."
      ],
      "source": "cv",
      "url": ""
    },
    {
      "id": "shorts-ai",
      "name": "Shorts AI – Générateur de vidéos courtes virales",
      "role": "Développeur Backend & IA",
      "year": "2026",
      "stack": ["Python", "FastAPI", "Whisper", "FFmpeg", "Ollama"],
      "bullets": [
        "Développement d'un pipeline IA entièrement automatisé qui transforme audio ou vidéos YouTube en vidéos prêtes pour TikTok, Reels et Shorts : transcription Whisper, détection des temps forts, montage selon le rythme et sous-titres trilingues (arabe/français/anglais).",
        "API FastAPI, traitement vidéo avec FFmpeg et modèles IA locaux via Ollama, sans coûts d'API."
      ],
      "source": "cv",
      "url": ""
    },
    {
      "id": "flow-ai",
      "name": "Flow AI – SaaS Full Stack pour freelances",
      "role": "Développeur Full Stack",
      "year": "2024",
      "stack": ["Next.js", "FastAPI", "Supabase", "OpenAI"],
      "bullets": [
        "Développement d'une plateforme SaaS complète avec un tableau de bord freelance pour la gestion des clients et des tâches.",
        "Intégration de l'API OpenAI pour fournir une assistance par IA à l'organisation des tâches et à la communication client.",
        "Conception du backend avec Python (FastAPI) et Supabase pour la persistance des données en temps réel et l'authentification."
      ],
      "source": "cv",
      "url": ""
    },
    {
      "id": "rh-contrats-cdd",
      "name": "RH – Système de gestion des contrats CDD",
      "role": "Développeur Full Stack",
      "year": "2023",
      "stack": ["React", "PHP", "SQL"],
      "bullets": [
        "Conception d'un système de gestion avec 5 interfaces distinctes, adaptées aux différents rôles RH.",
        "Implémentation complète du CRUD pour les contrats des employés et du suivi automatisé des statuts via un backend PHP/SQL."
      ],
      "source": "cv",
      "url": ""
    }
  ],
  "education": [
    {
      "degree": "Diplôme d'ingénieur en Business Intelligence & Génie Logiciel",
      "school": "",
      "location": "Tunisie",
      "period": "2022 – Aujourd'hui",
      "details": "Spécialisation actuelle : architecture des données, systèmes d'IA et conception logicielle avancée."
    }
  ],
  "languages": [
    "Arabe : langue maternelle",
    "Français : niveau professionnel",
    "Anglais : niveau professionnel"
  ]
}
```

Also create two realistic sample job offers in `fixtures/`: (1) a French **alternance Data/BI** offer (Power BI, SQL, Python, ETL, reporting), (2) an English **Full Stack internship** offer (React, Node/Python, REST, Docker). Used for manual and automated testing.

---

## 12. Known pitfalls (avoid these)

- Ollama default context too small → always pass `num_ctx: 8192`.
- Free-text LLM output → always use `format=` JSON schema + Pydantic validation + retry.
- Arabic PDF with broken letters → needs WeasyPrint + Pango and a real Arabic font bundled and referenced in CSS.
- LLM "improving" the CV by adding skills → the fact-check step is mandatory; it is the product's trust feature.
- Over-building → no extras. MVP first, then the user will ask for the next features.

---

## 13. After the MVP (do NOT build now; for reference only)

Job URL import, DOCX export, multiple templates, interview-question generator, application tracker, LinkedIn profile import, public demo on a GPU server.
