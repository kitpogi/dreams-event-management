# Email Notifications for Bookings

This document describes the email notification system for booking confirmations and status updates.

## Overview

The system automatically sends email notifications to clients when:

1. A new booking is created (confirmation email)
2. A booking status is updated by an admin (status update email)

## Implementation Details

### Mail Classes

- **`App\Mail\BookingConfirmationMail`**: Sends confirmation email when a booking is created
- **`App\Mail\BookingStatusUpdateMail`**: Sends status update email when booking status changes

### Email Templates

- **`resources/views/emails/booking-confirmation.blade.php`**: Template for booking confirmation emails
- **`resources/views/emails/booking-status-update.blade.php`**: Template for status update emails

### Integration Points

1. **BookingController::store()**: Sends confirmation email after creating a booking
2. **BookingController::adminUpdateStatus()**: Sends status update email when admin changes booking status

## Email Configuration

To enable email sending, configure your `.env` file with mail settings:

```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=your_username
MAIL_PASSWORD=your_password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@dreamsevents.com
MAIL_FROM_NAME="${APP_NAME}"
```

### Testing with Mailtrap

For development, you can use Mailtrap (https://mailtrap.io) to test emails without actually sending them.

### Production Setup

For production, configure with your actual SMTP provider (Gmail, SendGrid, Mailgun, etc.):

```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_app_password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@dreamsevents.com
MAIL_FROM_NAME="Dreams Events"
```

## Error Handling

Email sending is wrapped in try-catch blocks to prevent booking operations from failing if email sending fails. Errors are logged to the Laravel log file (`storage/logs/laravel.log`).

### Common Email Delivery Errors

#### "The recipient's mailbox is full"

**Possible Causes:**

1. The recipient's Gmail inbox is actually full (15GB limit for free accounts)
2. Gmail rate limiting (500 emails/day for free accounts, 2000/day for Google Workspace)
3. Invalid or expired Gmail App Password
4. Gmail blocking suspicious activity

**Solutions:**

1. **Check recipient's mailbox**: Ask the recipient to clear their Gmail inbox
2. **Verify Gmail App Password**:
   - Go to https://myaccount.google.com/apppasswords
   - Generate a new App Password if needed
   - Update `MAIL_PASSWORD` in `.env` file
3. **Check Gmail sending limits**:
   - Free Gmail: 500 emails/day
   - Google Workspace: 2000 emails/day
   - If exceeded, wait 24 hours or upgrade account
4. **Check Laravel logs**:
   ```bash
   tail -f storage/logs/laravel.log
   ```
   Look for detailed error messages with error codes

#### Other Common Errors

- **"Connection timeout"**: Check internet connection and Gmail SMTP settings
- **"Authentication failed"**: Verify Gmail App Password is correct
- **"Invalid recipient"**: Check email address format is valid

### Gmail Setup Checklist

> **📖 Detailed Setup Guide:** See [Gmail Setup Guide](./GMAIL_SETUP_GUIDE.md) for step-by-step instructions.

- [ ] 2-Step Verification enabled on Google account
  - Verify at: https://myaccount.google.com/security
- [ ] App Password generated (not regular password)
  - Generate at: https://myaccount.google.com/apppasswords
  - Select "Mail" → "Other (Custom name)" → Enter "Dreams Events Backend"
- [ ] App Password copied correctly (no spaces)
  - Should be exactly 16 characters
  - Remove all spaces when adding to `.env`
- [ ] `MAIL_USERNAME` matches Gmail account
  - Check in `dreams-backend/.env` file
- [ ] `MAIL_PASSWORD` is the App Password (16 characters, no spaces)
  - Should match the App Password from Google account
- [ ] `MAIL_FROM_ADDRESS` matches `MAIL_USERNAME`
  - Both should be your Gmail address
- [ ] Gmail account is not locked or suspended
  - Test by logging into https://mail.google.com

## Email Content

### Booking Confirmation Email

- Sent when a new booking is created
- Includes booking ID, package details, event date, venue, guest count, and status
- Status is always "Pending" for new bookings

### Status Update Email

- Sent when admin updates booking status
- Shows old status → new status transition
- Includes all booking details
- Customized message based on new status (Approved, Completed, Cancelled)

## Status Values

Valid booking statuses:

- **Pending**: Initial status when booking is created
- **Approved**: Booking has been confirmed by admin
- **Completed**: Event has been completed
- **Cancelled**: Booking has been cancelled

## Testing

To test email notifications:

1. Create a booking through the API
2. Check that confirmation email is sent to client's email
3. Update booking status as admin
4. Check that status update email is sent

For local testing, use Mailtrap or check Laravel logs for email sending errors.
