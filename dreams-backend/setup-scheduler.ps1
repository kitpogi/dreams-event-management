# Dreams Event Management - Laravel Scheduler Setup Script
# Run this script as Administrator to create the Windows Task Scheduler task

$taskName = "Dreams Laravel Scheduler"
$taskDescription = "Runs Laravel scheduler every minute for Dreams Event Management"
$phpPath = "C:\xampp\php\php.exe"
$projectPath = "C:\xampp\htdocs\capstone\dreams-backend"

# Check if task already exists
$existingTask = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue

if ($existingTask) {
    Write-Host "Task '$taskName' already exists. Removing and recreating..." -ForegroundColor Yellow
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
}

# Create the action
$action = New-ScheduledTaskAction `
    -Execute $phpPath `
    -Argument "artisan schedule:run" `
    -WorkingDirectory $projectPath

# Create the trigger (every minute)
$trigger = New-ScheduledTaskTrigger `
    -Once `
    -At (Get-Date) `
    -RepetitionInterval (New-TimeSpan -Minutes 1) `
    -RepetitionDuration (New-TimeSpan -Days 9999)

# Create the principal (run whether logged in or not)
$principal = New-ScheduledTaskPrincipal `
    -UserId "SYSTEM" `
    -LogonType ServiceAccount `
    -RunLevel Highest

# Create settings
$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -ExecutionTimeLimit (New-TimeSpan -Minutes 5) `
    -MultipleInstances IgnoreNew

# Register the task
Register-ScheduledTask `
    -TaskName $taskName `
    -Description $taskDescription `
    -Action $action `
    -Trigger $trigger `
    -Principal $principal `
    -Settings $settings

if ($?) {
    Write-Host ""
    Write-Host "=" * 60 -ForegroundColor Green
    Write-Host "SUCCESS! Task '$taskName' has been created!" -ForegroundColor Green
    Write-Host "=" * 60 -ForegroundColor Green
    Write-Host ""
    Write-Host "The Laravel scheduler will now run every minute." -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Scheduled commands:" -ForegroundColor Yellow
    Write-Host "  - bookings:send-reminders (daily at 9:00 AM)" -ForegroundColor White
    Write-Host "  - bookings:mark-completed (daily at 11:59 PM)" -ForegroundColor White
    Write-Host ""
    Write-Host "To verify, open Task Scheduler and look for '$taskName'" -ForegroundColor Cyan
    Write-Host ""
} else {
    Write-Host "Failed to create scheduled task!" -ForegroundColor Red
    Write-Host "Make sure you're running PowerShell as Administrator." -ForegroundColor Yellow
}
