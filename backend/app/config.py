from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    ollama_host: str = "http://127.0.0.1:11434"
    chat_model: str = "qwen2.5:7b"
    embed_model: str = "bge-m3"
    github_token: str | None = None
    data_dir: Path = Path("./data")
    frontend_origin: str = "http://localhost:5173"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()

# Ensure runtime directories exist
settings.data_dir.mkdir(parents=True, exist_ok=True)
(settings.data_dir / "outputs").mkdir(parents=True, exist_ok=True)
