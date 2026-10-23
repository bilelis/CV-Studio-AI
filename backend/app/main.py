import sys
from pathlib import Path

# Ensure backend directory is in sys.path regardless of execution CWD
_backend_dir = Path(__file__).resolve().parent.parent
if str(_backend_dir) not in sys.path:
    sys.path.insert(0, str(_backend_dir))

import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api.routes import router

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")

app = FastAPI(
    title="CV Matcher API",
    description="Local-first AI CV tailoring and ATS matching engine",
    version="1.0.0"
)

# CORS configuration
origins = [
    settings.frontend_origin,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

@app.get("/")
def root():
    return {
        "app": "CV Matcher API",
        "docs": "/docs",
        "health": "/health"
    }
