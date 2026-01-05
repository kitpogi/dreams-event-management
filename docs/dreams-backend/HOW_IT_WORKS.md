# How Booking Reminders Work in Your System

This guide explains exactly how the HTTP endpoint works in your current setup and how to use it.

## Your Current Setup

- **OS:** Windows
- **Server:** XAMPP (Apache + PHP)
- **Backend:** Laravel running on `http://localhost:8000`
- **Frontend:** React running on `http://localhost:3000`

## How It Works - Step by Step

### 1. The Endpoint

When you visit this URL:

```
http://localhost:8000/api/cron/send-reminders?token=dreams-reminder-secret-2024-change-in-production
```

**What happens:**

1. Laravel receives the request
2. Checks if the token matches `CRON_SECRET_TOKEN` in your `.env` file
3. If token is valid, runs the `bookings:send-reminders` command
4. Returns a JSON response with the results

### 2. The Command

The `bookings:send-reminders` command:

- Finds all approved bookings with events in the next 8 days
- Checks if any are exactly 7 days before (1-week reminder)
- Checks if any are exactly 1 day before (1-day reminder)
- Sends email reminders to clients
- Records sent reminders in database to prevent duplicates

### 3. The Flow

```
External Service (EasyCron)
    ↓
Calls: http://yourdomain.com/api/cron/send-reminders?token=secret
    ↓
Laravel API Route (routes/api.php)
    ↓
Validates Token
    ↓
Runs: php artisan bookings:send-reminders
    ↓
Checks Database for Upcoming Bookings
    ↓
Sends Email Reminders
    ↓
Returns JSON Response
```

## Testing in Your System

### Step 1: Make Sure Your Server is Running

```bash
# In one terminal, start Laravel server
cd dreams-backend
php artisan serve
# Server should be running on http://localhost:8000
```

### Step 2: Test the Endpoint

**Option A: Browser**

1. Open your browser
2. Visit: `http://localhost:8000/api/cron/send-reminders?token=dreams-reminder-secret-2024-change-in-production`
3. You should see JSON response like:

```json
{
  "success": true,
  "message": "Reminders processed successfully",
  "output": "Starting booking reminders process...\nFound 0 upcoming bookings to check.\nReminder process completed. Sent: 0, Errors: 0"
}
```

**Option B: Command Line (Git Bash)**

```bash
curl "http://localhost:8000/api/cron/send-reminders?token=dreams-reminder-secret-2024-change-in-production"
```

**Option C: Postman**

- Method: GET
- URL: `http://localhost:8000/api/cron/send-reminders?token=dreams-reminder-secret-2024-change-in-production`

### Step 3: Test with Invalid Token

Try without token or wrong token:

```
http://localhost:8000/api/cron/send-reminders
```

You should get:

```json
{
  "success": false,
  "message": "Unauthorized. Invalid or missing token."
}
```

## Automation Options

### Option 1: EasyCron (Free - Recommended)

1. **Sign up:** Go to [EasyCron.com](https://www.easycron.com) (free account)
2. **Create Cron Job:**
   - URL: `http://localhost:8000/api/cron/send-reminders?token=dreams-reminder-secret-2024-change-in-production`
   - Schedule: Daily at 9:00 AM
   - Method: GET
3. **Note:** For localhost, you need to use a service like ngrok to expose your local server, OR wait until you deploy to production

### Option 2: Manual Testing (For Development)

Just bookmark the URL and click it daily, or create a simple HTML page:

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Send Reminders</title>
  </head>
  <body>
    <h1>Booking Reminders</h1>
    <button onclick="sendReminders()">Send Reminders Now</button>
    <div id="result"></div>

    <script>
      async function sendReminders() {
        const token = "dreams-reminder-secret-2024-change-in-production";
        const url = `http://localhost:8000/api/cron/send-reminders?token=${token}`;

        try {
          const response = await fetch(url);
          const data = await response.json();
          document.getElementById("result").innerHTML =
            "<pre>" + JSON.stringify(data, null, 2) + "</pre>";
        } catch (error) {
          document.getElementById("result").innerHTML =
            '<p style="color: red;">Error: ' + error.message + "</p>";
        }
      }
    </script>
  </body>
</html>
```

Save this as `test-reminders.html` and open it in your browser.

### Option 3: Windows Task Scheduler (For Local Development)

If you want it to run automatically on your local machine:

1. Open **Task Scheduler**
2. Create a new task
3. **Trigger:** Daily at 9:00 AM
4. **Action:** Start a program
   - Program: `C:\Program Files\Git\bin\curl.exe` (or download curl)
   - Arguments: `"http://localhost:8000/api/cron/send-reminders?token=dreams-reminder-secret-2024-change-in-production"`
5. **Conditions:** Uncheck "Start the task only if the computer is on AC power"

## Production Deployment

When you deploy to production:

### 1. Update Environment Variable

In your production `.env`:

```env
CRON_SECRET_TOKEN=your-super-secret-production-token-here
```

Generate a strong token:

```bash
php -r "echo bin2hex(random_bytes(32));"
```

### 2. Update the URL

Use your production domain:

```
https://yourdomain.com/api/cron/send-reminders?token=your-production-token
```

### 3. Set Up External Cron

Use EasyCron or similar service to call your production URL daily.

## What Happens When It Runs

### Example Scenario:

**Today:** December 26, 2024  
**Bookings in Database:**

- Booking #1: Event on January 2, 2025 (7 days away) - Status: Approved
- Booking #2: Event on December 27, 2024 (1 day away) - Status: Approved
- Booking #3: Event on January 10, 2025 (15 days away) - Status: Approved

**When endpoint is called:**

1. Finds Booking #1 (7 days away) → Sends 1-week reminder email
2. Finds Booking #2 (1 day away) → Sends 1-day reminder email
3. Skips Booking #3 (too far in future)
4. Records reminders in `booking_reminders` table
5. Returns: "Sent: 2, Errors: 0"

**Next day (December 27):**

- Booking #2 already received reminder, won't send again
- Booking #1 is now 6 days away, no reminder needed
- No reminders sent

## Database Tracking

The system tracks sent reminders in the `booking_reminders` table:

| booking_id | reminder_type | reminder_date | event_date |
| ---------- | ------------- | ------------- | ---------- |
| 1          | 1_week        | 2024-12-26    | 2025-01-02 |
| 2          | 1_day         | 2024-12-26    | 2024-12-27 |

This prevents:

- Duplicate reminders
- Sending reminders multiple times
- Reminders for past events

## Troubleshooting

### "Unauthorized" Error

- ✅ Check token in URL matches `CRON_SECRET_TOKEN` in `.env`
- ✅ Make sure you're using `?token=` not `&token=`

### "No reminders sent"

- ✅ Check you have approved bookings in database
- ✅ Check event dates are exactly 7 or 1 days in the future
- ✅ Check email configuration in `.env` (MAIL\_\* settings)

### Server Not Responding

- ✅ Make sure `php artisan serve` is running
- ✅ Check firewall isn't blocking port 8000
- ✅ Try accessing other API endpoints to verify server is up

### Emails Not Sending

- ✅ Check `MAIL_*` settings in `.env`
- ✅ Check Laravel logs: `storage/logs/laravel.log`
- ✅ Test email sending manually: `php artisan tinker` then `Mail::raw('test', function($m) { $m->to('your@email.com')->subject('test'); });`

## Summary

**In your current system:**

- ✅ Endpoint works immediately (no setup needed)
- ✅ Test by visiting URL in browser
- ✅ Works the same in production
- ✅ No server configuration required
- ✅ Secure with token protection

**For automation:**

- Use EasyCron (free) to call the URL daily
- Or use Windows Task Scheduler for local development
- Or call manually when needed

The beauty of this approach: **It works the same everywhere!** No need to change anything when you deploy.
