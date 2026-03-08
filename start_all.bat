@echo off
title EduGuide - All Services Launcher
color 0A

echo ============================================================
echo          EduGuide - Starting All Backend Services
echo ============================================================
echo.
echo [1] Unified Backend  -- FastAPI   -- http://localhost:8000
echo [2] Attendance API   -- Express   -- http://localhost:5050
echo [3] ML Service       -- Flask     -- http://localhost:8001
echo [4] Frontend         -- Vite      -- http://localhost:5173
echo ============================================================
echo.

set ROOT=%~dp0
cd /d "%ROOT%"

REM ── Kill any processes already using these ports ─────────────
echo Stopping any existing services on ports 8000, 5050, 8001, 5173...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8000 " 2^>nul') do taskkill /PID %%a /F >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5050 " 2^>nul') do taskkill /PID %%a /F >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8001 " 2^>nul') do taskkill /PID %%a /F >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5173 " 2^>nul') do taskkill /PID %%a /F >nul 2>&1
timeout /t 2 /nobreak >nul

REM ── 1. Unified Backend (FastAPI — Learning Path + Risk + Stress) ─
echo Starting Unified Backend (port 8000)...
start "EduGuide Backend" cmd /k "cd /d "%ROOT%backend" && pip install -r requirements.txt -q && python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

timeout /t 8 /nobreak >nul

REM ── 2. Attendance API (Node/Express on port 5050) ────────────────
echo Starting Attendance API (port 5050)...
start "Attendance API" cmd /k "cd /d "%ROOT%backend\attendance_api" && npm install && node server.js"

timeout /t 4 /nobreak >nul

REM ── 3. Attendance ML Service (Flask on port 8001) ────────────────
echo Starting Attendance ML Service (port 8001)...
start "ML Service" cmd /k "cd /d "%ROOT%backend\ml_service" && pip install -r requirements.txt -q && python app.py"

timeout /t 4 /nobreak >nul

REM ── 4. Frontend (Vite on port 5173) ──────────────────────────────
echo Starting EduGuide Frontend (port 5173)...
start "EduGuide Frontend" cmd /k "cd /d "%ROOT%frontend" && npm install && npm run dev"

echo.
echo ============================================================
echo All services are starting in separate windows.
echo.
echo   Unified API  : http://localhost:8000/docs
echo   Attendance   : http://localhost:5050
echo   ML Service   : http://localhost:8001
echo   Frontend App : http://localhost:5173
echo ============================================================
echo.
echo Waiting 20 seconds for all services to initialise...
timeout /t 20 /nobreak >nul
echo.
echo Opening frontend in default browser...
start "" "http://localhost:5173"
pause
