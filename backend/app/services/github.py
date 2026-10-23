import re
import httpx
from fastapi import HTTPException
from app.config import settings
from app.schemas import Project
from app.llm import client, prompts

def get_headers() -> dict[str, str]:
    headers = {"Accept": "application/vnd.github.v3+json", "User-Agent": "CV-Matcher-App"}
    if settings.github_token:
        headers["Authorization"] = f"Bearer {settings.github_token}"
    return headers

def extract_github_username(input_val: str) -> str:
    cleaned = input_val.strip()
    match = re.search(r"github\.com/([a-zA-Z0-9_\-]+)", cleaned)
    if match:
        return match.group(1)
    return cleaned.lstrip("@").strip().split("/")[0]

async def fetch_github_project_candidates(username: str) -> list[Project]:
    clean_username = extract_github_username(username)
    if not clean_username:
        raise HTTPException(status_code=400, detail="Valid GitHub username or profile URL is required.")

    candidates: list[Project] = []
    repo_items: list[dict] = []

    async with httpx.AsyncClient(timeout=20.0, headers=get_headers()) as http:
        # Try standard GitHub API first
        url = f"https://api.github.com/users/{clean_username}/repos?per_page=100&sort=updated"
        try:
            res = await http.get(url)
            if res.status_code == 200:
                repos = res.json()
                for r in repos:
                    if not r.get("fork") and not r.get("archived"):
                        repo_items.append({
                            "name": r.get("name"),
                            "desc": r.get("description") or "",
                            "url": r.get("html_url") or f"https://github.com/{clean_username}/{r.get('name')}",
                            "year": str(r.get("created_at", "")[:4]) or "2024",
                            "languages": []
                        })
        except Exception:
            pass

        # If API was rate-limited (or failed), fallback to scraping the public profile tab
        if not repo_items:
            try:
                profile_url = f"https://github.com/{clean_username}?tab=repositories"
                resp = await http.get(profile_url, headers={"User-Agent": "Mozilla/5.0"})
                if resp.status_code == 200:
                    html = resp.text
                    # Extract repository cards
                    pattern = re.compile(
                        r'<a[^>]+href="/' + re.escape(clean_username) + r'/([^"/]+)"[^>]*itemprop="name codeRepository"[^>]*>\s*([^<\s]+)',
                        re.IGNORECASE
                    )
                    matches = pattern.findall(html)
                    for _, repo_name in matches:
                        clean_name = repo_name.strip()
                        if clean_name and not any(it["name"] == clean_name for it in repo_items):
                            repo_items.append({
                                "name": clean_name,
                                "desc": "",
                                "url": f"https://github.com/{clean_username}/{clean_name}",
                                "year": "2024",
                                "languages": []
                            })
            except Exception:
                pass

        if not repo_items:
            raise HTTPException(
                status_code=404,
                detail=f"Could not find any public repositories for GitHub user '{clean_username}'."
            )

        # Process up to 30 eligible repositories
        eligible_repos = repo_items[:30]

        for r in eligible_repos:
            repo_name = r["name"]
            desc = r.get("desc", "")
            html_url = r["url"]
            year = r.get("year", "2024")
            languages = list(r.get("languages", []))

            # Try to fetch languages via API if available
            if not languages:
                try:
                    lang_res = await http.get(f"https://api.github.com/repos/{clean_username}/{repo_name}/languages")
                    if lang_res.status_code == 200:
                        languages = list(lang_res.json().keys())
                except Exception:
                    pass

            # Try to fetch README from raw GitHub (bypasses API rate limits)
            readme_text = ""
            for branch in ["main", "master"]:
                try:
                    raw_url = f"https://raw.githubusercontent.com/{clean_username}/{repo_name}/{branch}/README.md"
                    raw_res = await http.get(raw_url, headers={"User-Agent": "Mozilla/5.0"})
                    if raw_res.status_code == 200:
                        readme_text = raw_res.text[:5000]
                        break
                except Exception:
                    pass

            slug = re.sub(r"[^a-z0-9\-]+", "-", repo_name.lower()).strip("-")
            input_text = f"Repository: {repo_name}\nDescription: {desc}\nLanguages: {', '.join(languages)}\nREADME:\n{readme_text}"

            try:
                project_card = client.generate(
                    Project,
                    prompts.GITHUB_SUMMARY_SYSTEM,
                    input_text,
                    temperature=0.2
                )
                project_card.id = slug
                project_card.name = repo_name
                project_card.source = "github"
                project_card.url = html_url
                project_card.year = year
                candidates.append(project_card)
            except Exception:
                # Fallback to direct heuristic creation if LLM fails
                candidates.append(Project(
                    id=slug,
                    name=repo_name,
                    role="Developer",
                    year=year,
                    stack=languages[:5] if languages else ["Full Stack"],
                    bullets=[desc] if desc else ["Open-source repository on GitHub."],
                    source="github",
                    url=html_url
                ))

    return candidates
