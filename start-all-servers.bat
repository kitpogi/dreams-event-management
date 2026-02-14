@echo off
title Dreams Event Management - Server Launcher
color 0A

echo ============================================================
echo    Dreams Event Management - Starting All Servers
echo ============================================================
echo.

:: ---- 1. Laravel Backend (php artisan serve) ----
echo [1/4] Starting Laravel Backend on port 8000...
start "Dreams Backend - php artisan serve" cmd /k "cd /d c:\xampp\htdocs\capstone\dreams-backend && php artisan serve --host=127.0.0.1 --port=8000"
timeout /t 3 /nobreak >nul

:: ---- 2. Laravel Reverb (WebSocket server) ----
echo [2/4] Starting Laravel Reverb on port 8080...
start "Dreams Reverb - WebSocket Server" cmd /k "cd /d c:\xampp\htdocs\capstone\dreams-backend && php artisan reverb:start --host=0.0.0.0 --port=8080"
timeout /t 2 /nobreak >nul

:: ---- 3. Vite Frontend Dev Server ----
echo [3/4] Starting Vite Frontend on port 3000...
start "Dreams Frontend - Vite Dev Server" cmd /k "cd /d c:\xampp\htdocs\capstone\dreams-frontend && npm run dev"
timeout /t 2 /nobreak >nul

:: ---- 4. Ngrok Tunnel (expose backend) ----
echo [4/4] Starting Ngrok tunnel for backend (port 8000)...
start "Dreams Ngrok - Tunnel" cmd /k "ngrok http 8000"

echo.
echo ============================================================
echo    All servers started successfully!
echo ============================================================
echo.
echo    Backend:   http://127.0.0.1:8000
echo    Frontend:  http://127.0.0.1:3000
echo    Reverb:    ws://localhost:8080
echo    Ngrok:     Check the Ngrok terminal for the public URL
echo.
echo    Close individual terminal windows to stop each server.
echo    Or press any key to close this launcher window.
echo ============================================================
pause >nul
