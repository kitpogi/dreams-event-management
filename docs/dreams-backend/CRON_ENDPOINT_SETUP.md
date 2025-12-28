# Booking Reminders - HTTP Endpoint Setup

This document explains how to use the HTTP endpoint for booking reminders, which works on any platform (Windows, Linux, Cloud) without requiring server-side cron configuration.

## How It Works

Instead of using cron or Windows Task Scheduler, we use an HTTP endpoint that can be called by:

- External cron services (EasyCron, UptimeRobot, etc.)
- Manual testing (browser, Postman)
- Any HTTP client

## Endpoint Details

**URL:** `GET /api/cron/send-reminders`

**Security:** Protected with a secret token query parameter

**Example:**

```
http://localhost:8000/api/cron/send-reminders?token=your-secret-token
```

## Setup

### 1. Configure Secret Token

In your `.env` file, set a strong secret token:

```env
CRON_SECRET_TOKEN=your-super-secret-token-here
```

**Important:** Use a strong, random token in production! Generate one with:

```bash
php -r "echo bin2hex(random_bytes(32));"
```

### 2. Test Locally

Visit in your browser:

```
http://localhost:8000/api/cron/send-reminders?token=dreams-reminder-secret-2024-change-in-production
```

Or use curl:

```bash
curl "http://localhost:8000/api/cron/send-reminders?token=dreams-reminder-secret-2024-change-in-production"
```

### 3. Production Setup

#### Option A: External Cron Service (Recommended)

Use a free service like **EasyCron** or **UptimeRobot**:

1. Sign up at [EasyCron.com](https://www.easycron.com) (free tier available)
2. Create a new cron job:
   - **URL:** `https://yourdomain.com/api/cron/send-reminders?token=your-secret-token`
   - **Schedule:** Daily at 9:00 AM (or your preferred time)
   - **Method:** GET
3. Save and activate

#### Option B: Server Cron (If you have SSH access)

If you prefer using server cron, add this to your crontab:

```bash
0 9 * * * curl -s "https://yourdomain.com/api/cron/send-reminders?token=your-secret-token" > /dev/null 2>&1
```

#### Option C: Cloud Scheduler Services

- **AWS EventBridge** (if using AWS)
- **Google Cloud Scheduler** (if using GCP)
- **Azure Logic Apps** (if using Azure)
- **Vercel Cron Jobs** (if using Vercel)

## Response Format

### Success Response:

```json
{
  "success": true,
  "message": "Reminders processed successfully",
  "output": "Starting booking reminders process...\nFound 2 upcoming bookings to check.\nReminder process completed. Sent: 1, Errors: 0"
}
```

### Error Response (Invalid Token):

```json
{
  "success": false,
  "message": "Unauthorized. Invalid or missing token."
}
```

### Error Response (Server Error):

```json
{
  "success": false,
  "message": "Error processing reminders: [error details]"
}
```

## Advantages

✅ **Platform Independent** - Works on Windows, Linux, Mac, Cloud  
✅ **No Server Access Needed** - Works even on shared hosting  
✅ **Easy to Test** - Just visit the URL in a browser  
✅ **Reliable** - External services monitor and retry on failure  
✅ **Secure** - Protected with secret token  
✅ **Easy to Monitor** - Check response to see if it worked

## Security Notes

1. **Never commit your secret token to Git** - Keep it in `.env` only
2. **Use HTTPS in production** - The token will be in the URL
3. **Rotate tokens periodically** - Change the token if compromised
4. **Use strong tokens** - At least 32 random characters

## Troubleshooting

### "Unauthorized" Error

- Check that the token in the URL matches `CRON_SECRET_TOKEN` in `.env`
- Make sure you're using the correct query parameter name: `?token=...`

### "Error processing reminders"

- Check Laravel logs: `storage/logs/laravel.log`
- Make sure the database connection is working
- Verify email configuration is set up correctly

### Reminders Not Sending

- Check that bookings exist with status "Approved"
- Verify event dates are exactly 7 days or 1 day in the future
- Check email configuration in `.env`
- Review the command output in the response

## Manual Testing

You can also test the underlying command directly:

```bash
php artisan bookings:send-reminders
```

This will show detailed output in the terminal.

## Migration from Scheduler

If you were using the Laravel scheduler approach:

1. The scheduler code in `routes/console.php` can remain (it won't hurt)
2. You can remove Windows Task Scheduler setup
3. Just use this HTTP endpoint instead

---

**Last Updated:** December 2024
