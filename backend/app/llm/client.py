import logging
from typing import TypeVar
import ollama
from fastapi import HTTPException
from pydantic import BaseModel
from app.config import settings

logger = logging.getLogger(__name__)

T = TypeVar("T", bound=BaseModel)

def get_client() -> ollama.Client:
    return ollama.Client(host=settings.ollama_host, timeout=300)

def generate(schema: type[T], system: str, user: str, temperature: float = 0.2) -> T:
    client = get_client()
    last_err: Exception | None = None
    
    for attempt in range(3):
        try:
            logger.info(f"Ollama generation attempt {attempt + 1}/3 for {schema.__name__}")
            resp = client.chat(
                model=settings.chat_model,
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": user}
                ],
                format=schema.model_json_schema(),
                options={"temperature": temperature, "num_ctx": 8192},
            )
            content = resp.get("message", {}).get("content", "")
            return schema.model_validate_json(content)
        except ollama.ResponseError as e:
            last_err = e
            logger.warning(f"Ollama response error on attempt {attempt + 1}: {e}")
            if "not found" in str(e).lower():
                raise HTTPException(
                    status_code=503,
                    detail=f"Model '{settings.chat_model}' is not pulled in Ollama. Run: ollama pull {settings.chat_model}"
                )
        except Exception as e:
            last_err = e
            logger.warning(f"Generation error on attempt {attempt + 1}: {e}")

    raise HTTPException(
        status_code=502,
        detail=f"LLM output validation failed after 3 attempts. Last error: {last_err}"
    )

def embed(texts: list[str]) -> list[list[float]]:
    if not texts:
        return []
    client = get_client()
    try:
        res = client.embed(model=settings.embed_model, input=texts)
        if "embeddings" in res:
            return res["embeddings"]
    except Exception as e:
        logger.warning(f"Embeddings via {settings.embed_model} failed ({e}). Falling back to dummy vectors.")
    
    # Graceful fallback: return empty/zero vectors so matcher can rely on skill overlap
    return [[0.0] * 128 for _ in texts]

def check_models_status() -> tuple[bool, dict[str, bool], str | None]:
    client = get_client()
    try:
        models_resp = client.list()
        raw_models = getattr(models_resp, "models", None)
        if raw_models is None and hasattr(models_resp, "get"):
            raw_models = models_resp.get("models", [])
        raw_models = raw_models or []
        
        model_names = []
        for m in raw_models:
            name = getattr(m, "model", None) or getattr(m, "name", None)
            if not name and isinstance(m, dict):
                name = m.get("model") or m.get("name")
            if name:
                model_names.append(str(name))
        
        chat_ready = any(settings.chat_model in name for name in model_names)
        embed_ready = any(settings.embed_model in name for name in model_names)
        
        return True, {settings.chat_model: chat_ready, settings.embed_model: embed_ready}, None
    except Exception as e:
        return False, {settings.chat_model: False, settings.embed_model: False}, str(e)
