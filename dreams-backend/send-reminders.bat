@echo off
cd /d "%~dp0"
php artisan bookings:send-reminders
pause

