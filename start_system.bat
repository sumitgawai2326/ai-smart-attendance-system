@echo off
title Smart Attendance AI System - Full Launcher
color 0A
echo.
echo ============================================================
echo     AI SMART ATTENDANCE SYSTEM  --  Full System Launcher
echo ============================================================
echo.

:: Set Node.js in PATH
set PATH=C:\Program Files\nodejs;%PATH%

:: Kill any previous instances on these ports
echo [1/5] Freeing ports 3000 and 8000...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3000" ^| find "LISTENING" 2^>nul') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| find ":8000" ^| find "LISTENING" 2^>nul') do taskkill /F /PID %%a >nul 2>&1

:: Start Backend API Server in new window
echo [2/5] Starting FastAPI Backend on port 8000...
start "Smart Attendance - Backend API" cmd /k "cd /d %~dp0backend && python main.py"

:: Wait for backend to start
timeout /t 4 /nobreak >nul

:: Start Frontend in new window
echo [3/5] Starting React Frontend on port 3000...
start "Smart Attendance - Frontend" cmd /k "cd /d %~dp0frontend && node node_modules/vite/bin/vite.js"

:: Wait for frontend to start
timeout /t 5 /nobreak >nul

:: Start Backend Tunnel in new window
echo [4/5] Starting Backend Public Tunnel (API)...
start "Smart Attendance - Backend Tunnel" cmd /k "%APPDATA%\npm\lt.cmd --port 8000 --subdomain smart-attendance-ai-api"

:: Start Frontend Tunnel in new window
echo [5/5] Starting Frontend Public Tunnel...
start "Smart Attendance - Frontend Tunnel" cmd /k "%APPDATA%\npm\lt.cmd --port 3000 --subdomain smart-attendance-ai"

:: Wait a moment then show links
timeout /t 3 /nobreak >nul

echo.
echo ============================================================
echo   SYSTEM IS RUNNING!  ALL LINKS BELOW:
echo ============================================================
echo.
echo  [LOCAL - This Computer]
echo    Frontend  :  http://localhost:3000
echo    Backend   :  http://localhost:8000
echo.
echo  [PUBLIC - Any Device, Any Browser, Anywhere]
echo    Frontend  :  https://smart-attendance-ai.loca.lt
echo    Backend   :  https://smart-attendance-ai-api.loca.lt
echo.
echo  NOTE: If the public URL shows a password page,
echo        enter your IP: Run 'curl ifconfig.me' to find it.
echo.
echo ============================================================

pause
