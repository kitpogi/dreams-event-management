# Booking Reminders - Setup Options

Since you're on Windows, you have multiple options for running booking reminders. **We recommend Option 3 (HTTP Endpoint)** as it's the easiest and works on any platform.

## Option 3: HTTP Endpoint (Recommended - Works Everywhere) ⭐

This is the **best option** for both development and production. It works on Windows, Linux, and any cloud platform.

**See:** `CRON_ENDPOINT_SETUP.md` for complete instructions.

**Quick Setup:**

1. Visit: `http://localhost:8000/api/cron/send-reminders?token=dreams-reminder-secret-2024-change-in-production`
2. For automation, use EasyCron (free) to call this URL daily at 9 AM
3. No server configuration needed!

---

## Option 1: Windows Task Scheduler (Local Development Only)

If you prefer using Windows Task Scheduler for local development:

> **⚠️ Important:** Do NOT try to run cron-style commands (like `* * * * * ...`) directly in Windows CMD, PowerShell, or Git Bash. These commands will fail because:
>
> - In CMD/PowerShell: `'*' is not recognized as an internal or external command`
> - In Git Bash: Cron syntax is meant for crontab files, not direct execution
>
> **Cron syntax is only for Linux/Unix crontab files.** On Windows, you must use Windows Task Scheduler as described below.

## Option 1: Run Scheduler Every Minute (Recommended)

1. Open **Task Scheduler** (search for it in Windows Start menu)

2. Click **Create Basic Task**

3. **Name**: `Laravel Scheduler`
   **Description**: `Runs Laravel scheduled tasks every minute`

4. **Trigger**:

   - When: Daily
   - Start date: Today
   - Time: Current time
   - Recur every: 1 day
   - Repeat task every: 1 minute
   - Duration: Indefinitely

5. **Action**: Start a program

   - Program/script: `C:\xampp\php\php.exe` (or your PHP path)
   - Add arguments: `artisan schedule:run`
   - Start in: `C:\xampp\htdocs\capstone\dreams-backend`

6. Click **Finish**

## Option 2: Run Reminders Command Directly (Daily at 9 AM)

1. Open **Task Scheduler**

2. Click **Create Basic Task**

3. **Name**: `Send Booking Reminders`
   **Description**: `Sends booking reminder emails daily`

4. **Trigger**:

   - When: Daily
   - Start date: Today
   - Time: 09:00 AM
   - Recur every: 1 day

5. **Action**: Start a program

   - Program/script: `C:\xampp\php\php.exe`
   - Add arguments: `artisan bookings:send-reminders`
   - Start in: `C:\xampp\htdocs\capstone\dreams-backend`

6. Click **Finish**

## Testing

You can test the command manually by running:

```bash
cd dreams-backend
php artisan bookings:send-reminders
```

Or double-click `send-reminders.bat` in the `dreams-backend` folder.

## Notes

- Make sure PHP is in your system PATH, or use the full path to `php.exe`
- The scheduler will check for bookings that are exactly 7 days or 1 day before the event
- Only approved bookings will receive reminders
- Reminders are tracked in the `booking_reminders` table to prevent duplicates
