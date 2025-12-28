@echo off
REM This script runs the Laravel scheduler
REM You can set this up in Windows Task Scheduler to run every minute
cd /d "%~dp0"
php artisan schedule:run

