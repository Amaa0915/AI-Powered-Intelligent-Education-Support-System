@echo off
echo =====================================================
echo  EduGuide -- 2-Port Launcher
echo  Backend  -^> http://localhost:8000
echo  Frontend -^> http://localhost:5173
echo =====================================================

:: Kill anything on ports 8000 and 5173 first
echo Cleaning up old processes...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000') do (
    taskkill /PID %%a /F >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173') do (
    taskkill /PID %%a /F >nul 2>&1
)
timeout /t 1 /nobreak >nul

:: Start Backend
echo Starting unified backend on port 8000...
start "EduGuide Backend" cmd /k "cd /d "%~dp0backend" && uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

:: Wait for backend to initialise
timeout /t 5 /nobreak >nul

:: Start Frontend
echo Starting frontend on port 5173...
start "EduGuide Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo Both services launched!
echo   Backend  API : http://localhost:8000
echo   Frontend App : http://localhost:5173
echo.
pause
