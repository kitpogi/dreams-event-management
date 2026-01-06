# Gmail SMTP Setup Guide - Step by Step

This guide will help you verify and complete the Gmail setup checklist for email delivery.

## Current Configuration

Based on your `.env` file:

- **Gmail Account**: `dreamsproduction63@gmail.com`
- **App Password**: `zvuokbbdxfmczthm` (16 characters ✓)
- **From Address**: `dreamsproduction63@gmail.com` ✓

---

## Step-by-Step Verification

### ✅ Step 1: Verify 2-Step Verification is Enabled

1. Go to: https://myaccount.google.com/security
2. Look for "2-Step Verification" section
3. If it says "On" → ✅ You're good!
4. If it says "Off" → Enable it:
   - Click "2-Step Verification"
   - Follow the setup wizard
   - You'll need your phone for verification

**Why this is required:** Gmail requires 2-Step Verification to generate App Passwords for SMTP.

---

### ✅ Step 2: Verify App Password is Generated

1. Go to: https://myaccount.google.com/apppasswords
2. You should see a list of App Passwords you've created
3. Look for one labeled "Mail" or "Dreams Events" or similar
4. If you see your App Password in the list → ✅ You're good!
5. If you don't see it or need a new one:
   - Click "Select app" → Choose "Mail"
   - Click "Select device" → Choose "Other (Custom name)"
   - Enter: "Dreams Events Backend"
   - Click "Generate"
   - **Copy the 16-character password** (it will look like: `abcd efgh ijkl mnop`)
   - **Remove all spaces** when adding to `.env` file

**Important:** The App Password should be 16 characters with no spaces.

---

### ✅ Step 3: Verify App Password in .env File

1. Open: `dreams-backend/.env`
2. Check line 64: `MAIL_PASSWORD=qitcashwivxgiacd`
3. Verify:
   - ✅ No spaces in the password
   - ✅ Exactly 16 characters
   - ✅ Matches the App Password from Google account

**Current Status:**

```
MAIL_PASSWORD=qitcashwivxgiacd
Length: 16 characters ✓
No spaces: ✓
```

---

### ✅ Step 4: Verify MAIL_USERNAME Matches Gmail Account

1. Open: `dreams-backend/.env`
2. Check line 63: `MAIL_USERNAME=dreamsproduction63@gmail.com`
3. Verify it matches your Gmail account email exactly

**Current Status:**

```
MAIL_USERNAME=dreamsproduction63@gmail.com ✓
```

---

### ✅ Step 5: Verify MAIL_FROM_ADDRESS Matches MAIL_USERNAME

1. Open: `dreams-backend/.env`
2. Check line 66: `MAIL_FROM_ADDRESS="dreamsproduction63@gmail.com"`
3. Verify it matches `MAIL_USERNAME`

**Current Status:**

```
MAIL_USERNAME=dreamsproduction63@gmail.com
MAIL_FROM_ADDRESS="dreamsproduction63@gmail.com"
Match: ✓
```

**Note:** The quotes around the FROM_ADDRESS are optional but fine.

---

### ✅ Step 6: Verify Gmail Account Status

1. Try logging into Gmail: https://mail.google.com
2. If you can log in normally → ✅ Account is active
3. If you see any warnings or errors:
   - Check for security alerts
   - Verify account recovery options
   - Check if account is suspended

**Common Issues:**

- Account locked: Check email for security alerts
- Suspended: Contact Google Support
- Rate limited: Wait 24 hours if you've sent too many emails

---

## Testing Your Configuration

### Test 1: Send Test Email via Laravel Tinker

**Option A: Single-line command (Easier)**

```bash
cd dreams-backend
php artisan tinker
```

Then paste this single line:

```php
Mail::raw('Test email from Dreams Events', function($message) { $message->to('dreamsproduction63@gmail.com')->subject('Test Email'); });
```

**Option B: Multi-line command**

In Tinker, type the command line by line:

```php
Mail::raw('Test email from Dreams Events', function($message) {
    $message->to('dreamsproduction63@gmail.com')->subject('Test Email');
});
```

**Note:** After typing the opening `{`, press Enter. Tinker will show `...` indicating it's waiting for more input. Then type the next lines and close with `});`

**Option C: Create a test command (Recommended)**

Create a test file `test-email.php` in the backend root:

```php
<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\Mail;

try {
    Mail::raw('Test email from Dreams Events', function($message) {
        $message->to('dreamsproduction63@gmail.com')->subject('Test Email');
    });
    echo "✅ Email sent successfully!\n";
} catch (\Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
```

Then run:

```bash
php test-email.php
```

If successful, you should receive the email within a few seconds.

### Test 2: Check Laravel Logs

```bash
tail -f dreams-backend/storage/logs/laravel.log
```

Look for:

- ✅ "Contact inquiry confirmation email sent successfully"
- ❌ Any error messages about authentication or connection

---

## Troubleshooting

### Error: "Authentication failed"

- **Solution:** Regenerate App Password and update `.env`

### Error: "Connection timeout"

- **Solution:** Check internet connection and firewall settings

### Error: "Mailbox full"

- **Solution:** This is a recipient issue, not your configuration

### Error: "Rate limit exceeded"

- **Solution:** Gmail free accounts: 500 emails/day. Wait 24 hours or upgrade.

---

## Quick Checklist Summary

- [ ] 2-Step Verification enabled → https://myaccount.google.com/security
- [ ] App Password generated → https://myaccount.google.com/apppasswords
- [ ] App Password in `.env` (16 chars, no spaces)
- [ ] `MAIL_USERNAME` = your Gmail address
- [ ] `MAIL_FROM_ADDRESS` = `MAIL_USERNAME`
- [ ] Gmail account is active and accessible
- [ ] Test email sent successfully

---

## Need Help?

If you're still having issues:

1. Check Laravel logs: `storage/logs/laravel.log`
2. Verify App Password is correct
3. Test with a different email address
4. Check Gmail sending limits (500/day for free accounts)
