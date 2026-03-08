@echo off
title EduGuide - All Services Launcher
color 0A

echo ============================================================
echo          EduGuide - Starting All Backend Services
echo ============================================================
echo.
echo [1] Learning Path API  -- FastAPI   -- http://localhost:8000
echo [2] Stress ML Service  -- Flask     -- http://localhost:5001
echo [3] Stress API         -- Express   -- http://localhost:5000
echo [4] Risk Predictor API -- Flask     -- http://localhost:5002
echo [5] Frontend           -- Vite      -- http://localhost:5173
echo ============================================================
echo.

set ROOT=%~dp0
cd /d "%ROOT%"

REM ── 1. Unified Backend (FastAPI) ─────────────────────────
echo Starting Unified Backend (port 8000)...
start "EduGuide Backend" cmd /k "cd /d %ROOT%backend && pip install -r requirements.txt -q && python -m uvicorn main:app --reload --port 8000"

timeout /t 3 /nobreak >nul

REM ── 2. Stress ML Service (Flask) ────────────────────────────
echo Starting Stress ML Service (port 5001)...
start "Stress ML Service" cmd /k "cd /d %ROOT%backend\stress_ml && pip install -r requirements.txt -q && python app.py"

timeout /t 3 /nobreak >nul

REM ── 3. Stress API (Express/Node) ────────────────────────────
echo Starting Stress API (port 5000)...
start "Stress API" cmd /k "cd /d %ROOT%backend\stress_api && npm install && node server.js"

timeout /t 3 /nobreak >nul

REM ── 4. Risk Predictor Backend (Flask) ───────────────────────
echo Starting Risk Predictor API (port 5002)...
start "Risk Predictor API" cmd /k "cd /d %ROOT%backend\risk_predictor && pip install -r requirements.txt -q && python app.py"

timeout /t 5 /nobreak >nul

REM ── 5. Frontend (Vite) ──────────────────────────────────────
echo Starting EduGuide Frontend (port 5173)...
start "EduGuide Frontend" cmd /k "cd /d %ROOT%frontend && npm install && npm run dev"

echo.
echo ============================================================
echo All services are starting in separate windows.
echo Open http://localhost:5173 in your browser.
echo ============================================================
echo.
pause
