@echo off
title EduGuide - 2-Port Launcher
color 0A

echo =====================================================
echo  EduGuide -- 2-Port Launcher
echo  Backend  -^> http://localhost:8000
echo  Frontend -^> http://localhost:5173
echo =====================================================
echo.

set ROOT=%~dp0

:: Kill anything on ports 8000 and 5173 first
echo Cleaning up old processes on ports 8000 and 5173...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000') do (
    taskkill /PID %%a /F >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173') do (
    taskkill /PID %%a /F >nul 2>&1
)
timeout /t 1 /nobreak >nul

:: Start Backend (installs deps then starts FastAPI)
echo Starting unified backend on port 8000...
start "EduGuide Backend" cmd /k "cd /d "%ROOT%backend" && pip install -r requirements.txt -q && uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

:: Wait for backend to initialise
timeout /t 8 /nobreak >nul

:: Start Frontend (installs deps then starts Vite)
echo Starting frontend on port 5173...
start "EduGuide Frontend" cmd /k "cd /d "%ROOT%frontend" && npm install && npm run dev"

echo.
echo =====================================================
echo  Both services are starting in separate windows.
echo  Backend  API : http://localhost:8000/docs
echo  Frontend App : http://localhost:5173
echo =====================================================
echo.
pause
