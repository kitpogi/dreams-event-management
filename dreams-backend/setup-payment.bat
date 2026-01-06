@echo off
REM Payment Integration Setup Script for Windows
REM This script helps you set up the payment integration

echo.
echo Payment Integration Setup
echo ==============================
echo.

REM Check if .env file exists
if not exist .env (
    echo Error: .env file not found!
    echo Please create .env file first.
    pause
    exit /b 1
)

echo Step 1: Checking PayMongo configuration...
echo.

REM Check if PayMongo keys are set (basic check)
findstr /C:"PAYMONGO_SECRET_KEY=sk_test_xxxxx" .env >nul
if %errorlevel% equ 0 (
    echo Warning: PayMongo keys not configured!
    echo Please update .env file with your PayMongo API keys.
    echo.
    echo Get your keys from: https://dashboard.paymongo.com/developers/api-keys
    echo.
    pause
)

echo.
echo Step 2: Running database migrations...
echo.

REM Run migrations
php artisan migrate

if %errorlevel% neq 0 (
    echo.
    echo Migration failed! Please check the error above.
    pause
    exit /b 1
)

echo.
echo Migrations completed successfully!
echo.

echo Step 3: Clearing config cache...
echo.

REM Clear config cache
php artisan config:clear

echo.
echo Setup complete!
echo.
echo Next steps:
echo 1. Make sure your PayMongo API keys are set in .env
echo 2. Start your backend server: php artisan serve
echo 3. Test payment integration
echo.
echo Documentation: docs\PAYMENT_SETUP_GUIDE.md
echo.
pause

