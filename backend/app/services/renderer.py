import logging
import os
import subprocess
import tempfile
import time
from datetime import datetime
from pathlib import Path
from jinja2 import Environment, FileSystemLoader
from app.config import settings
from app.schemas import Basics, TailoredCV, CoverLetter, Lang

logger = logging.getLogger(__name__)

TEMPLATES_DIR = Path(__file__).parent.parent / "templates"
jinja_env = Environment(loader=FileSystemLoader(str(TEMPLATES_DIR)), autoescape=True)

SECTION_HEADINGS: dict[str, dict[Lang, str]] = {
    "summary": {"fr": "Profil", "en": "Summary", "ar": "الملخص"},
    "skills": {"fr": "Compétences techniques", "en": "Technical Skills", "ar": "المهارات التقنية"},
    "experience": {"fr": "Expérience", "en": "Experience", "ar": "الخبرة"},
    "projects": {"fr": "Projets", "en": "Projects", "ar": "المشاريع"},
    "education": {"fr": "Formation", "en": "Education", "ar": "التعليم"},
    "languages": {"fr": "Langues", "en": "Languages", "ar": "اللغات"},
}

def get_headings_for_lang(lang: Lang) -> dict[str, str]:
    return {k: v.get(lang, v["fr"]) for k, v in SECTION_HEADINGS.items()}

def _html_to_pdf_edge_or_chrome(html_content: str, output_pdf_path: Path) -> bool:
    edge_paths = [
        r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
        "msedge",
        "google-chrome",
        "chromium"
    ]
    browser_bin = None
    for p in edge_paths:
        if os.path.isabs(p) and os.path.exists(p):
            browser_bin = p
            break
        elif not os.path.isabs(p):
            import shutil
            if shutil.which(p):
                browser_bin = p
                break

    if not browser_bin:
        return False

    with tempfile.NamedTemporaryFile("w", suffix=".html", delete=False, encoding="utf-8") as f:
        f.write(html_content)
        temp_html = f.name

    try:
        abs_output = os.path.abspath(str(output_pdf_path))
        file_uri = Path(temp_html).resolve().as_uri()
        cmd = [
            browser_bin,
            "--headless=new",
            "--disable-gpu",
            "--no-pdf-header-footer",
            f"--print-to-pdf={abs_output}",
            file_uri
        ]
        res = subprocess.run(cmd, capture_output=True, timeout=30)
        return output_pdf_path.exists() and output_pdf_path.stat().st_size > 0
    except Exception as e:
        logger.error(f"Headless browser PDF rendering failed: {e}")
        return False
    finally:
        if os.path.exists(temp_html):
            try:
                os.remove(temp_html)
            except Exception:
                pass

def render_html_to_pdf(html_content: str, output_path: Path) -> Path:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    # 1. Try WeasyPrint (ideal for Linux/Docker)
    try:
        import weasyprint
        weasyprint.HTML(string=html_content).write_pdf(str(output_path))
        if output_path.exists() and output_path.stat().st_size > 0:
            return output_path
    except Exception as e:
        logger.info(f"WeasyPrint unavailable or failed ({e}), falling back to headless browser.")

    # 2. Try headless Edge / Chrome (native Windows fallback)
    success = _html_to_pdf_edge_or_chrome(html_content, output_path)
    if success:
        return output_path

    raise RuntimeError("Failed to generate PDF: neither WeasyPrint nor a headless browser is available.")

def render_cv_pdf(basics: Basics, cv: TailoredCV) -> tuple[str, Path]:
    headings = get_headings_for_lang(cv.language)
    template = jinja_env.get_template("cv.html")
    html_out = template.render(basics=basics, cv=cv, headings=headings)
    
    timestamp = int(time.time())
    filename = f"CV_{cv.language}_{timestamp}.pdf"
    output_path = settings.data_dir / "outputs" / filename
    
    render_html_to_pdf(html_out, output_path)
    return filename, output_path

def render_letter_pdf(basics: Basics, letter: CoverLetter) -> tuple[str, Path]:
    date_str = datetime.now().strftime("%d/%m/%Y")
    template = jinja_env.get_template("letter.html")
    html_out = template.render(basics=basics, letter=letter, date_str=date_str)
    
    timestamp = int(time.time())
    filename = f"CoverLetter_{letter.language}_{timestamp}.pdf"
    output_path = settings.data_dir / "outputs" / filename
    
    render_html_to_pdf(html_out, output_path)
    return filename, output_path
