@echo off
REM ==========================================
REM Dreams Event Management - Laravel Scheduler
REM ==========================================
REM This batch script runs Laravel's scheduler.
REM Set this up in Windows Task Scheduler to run every minute.
REM 
REM Instructions:
REM 1. Open Task Scheduler (taskschd.msc)
REM 2. Create a new Basic Task
REM 3. Name: "Dreams Laravel Scheduler"
REM 4. Trigger: Daily, starting at any time
REM 5. Under "Advanced settings" in trigger, set to repeat every 1 minute
REM 6. Action: Start a program
REM    - Program/script: C:\xampp\htdocs\capstone\dreams-backend\run-scheduler.bat
REM 7. Check "Run whether user is logged on or not"
REM 8. Check "Run with highest privileges"
REM ==========================================

cd /d "C:\xampp\htdocs\capstone\dreams-backend"
"C:\xampp\php\php.exe" artisan schedule:run >> "C:\xampp\htdocs\capstone\dreams-backend\storage\logs\scheduler.log" 2>&1
