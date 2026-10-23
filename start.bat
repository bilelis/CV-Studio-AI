@echo off
echo ===================================================
echo   Starting CV Matcher (Local AI Tailoring Engine)
echo ===================================================
echo.

:: 1. Launch FastAPI Backend from backend directory on 127.0.0.1:8000
start "CV Matcher - Backend (FastAPI)" cmd /k "cd /d ""%~dp0backend"" && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000"

:: 2. Launch Vite React Frontend
start "CV Matcher - Frontend (Vite)" cmd /k "cd /d ""%~dp0frontend"" && npm run dev"

echo Backend starting on: http://127.0.0.1:8000
echo Frontend starting on: http://localhost:5173
echo.
echo Waiting for services to initialize...
timeout /t 4 >nul
start http://localhost:5173

