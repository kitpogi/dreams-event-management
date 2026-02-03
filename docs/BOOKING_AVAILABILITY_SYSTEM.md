# Booking Availability & Auto-Completion System Improvements

## Overview

This document summarizes the improvements made to the Dreams Event Management booking system to handle:
1. Date/time availability blocking when bookings are approved
2. Automatic completion of bookings after event dates pass
3. Visual indicators in the admin calendar

---

## 1. Improved Date/Time Availability Algorithm

### Backend Changes

**File:** `app/Http/Controllers/Api/BookingController.php`

#### Enhanced `checkDateAvailability()` Method
- Added optional `$eventTime` parameter for time-slot specific checking
- Added `$strictMode` parameter:
  - `false` (default): Blocks dates with Pending, Approved, or Confirmed bookings
  - `true`: Only Approved/Confirmed/Completed block the date

#### New `getDateAvailabilityDetails()` Method
Returns detailed availability information including:
- `is_available`: Boolean indicating if the date is free
- `has_approved_booking`: Whether any approved bookings exist
- `has_pending_booking`: Whether any pending requests exist
- `pending_count` / `approved_count`: Counts of each status
- `conflicting_bookings`: Array of booking details causing conflicts

#### New `checkTimeSlotAvailability()` Method
For time-slot based booking (multiple events per day):
- Checks for overlapping time ranges
- Supports event duration
- Returns conflict details with overlap type

#### New Admin Endpoint
```
GET /api/bookings/availability-details
```
- Requires admin authentication
- Returns detailed availability analysis for a date/package combo

### Migration Added
**File:** `database/migrations/2026_02_03_032110_add_event_duration_to_booking_details_table.php`

Added columns:
- `event_duration` (decimal 4,2): Duration of event in hours
- `event_end_time` (time): Calculated end time
- Index on `package_id`, `event_date`, `event_time` for faster queries

---

## 2. Auto-Complete Bookings System

### Artisan Command

**File:** `app/Console/Commands/MarkCompletedBookings.php`

Usage:
```bash
# Dry run - see what would be updated
php artisan bookings:mark-completed --dry-run

# Mark bookings as completed
php artisan bookings:mark-completed

# Mark bookings completed 1 day after event
php artisan bookings:mark-completed --days=1

# Skip sending email notifications
php artisan bookings:mark-completed --no-email
```

Features:
- Automatically marks "Approved" bookings as "Completed" after event date passes
- Sends email notification to clients (optional)
- Broadcasts real-time status change via WebSocket
- Logs all changes

### Cron Endpoint

**Route:** `GET /api/cron/mark-completed`

Usage:
```
/api/cron/mark-completed?token=YOUR_CRON_SECRET_TOKEN
/api/cron/mark-completed?token=YOUR_CRON_SECRET_TOKEN&days=1
```

Protected by `CRON_SECRET_TOKEN` environment variable.

### Email Notifications
Uses existing `BookingStatusUpdateMail` template to notify clients when their booking is marked as completed.

---

## 3. Frontend Calendar Enhancements

### Admin Calendar Updates

**File:** `src/pages/Dashboard/admin/AdminBookingsCalendar.jsx`

#### Visual Availability Indicators

**Date Cell Styling:**
- **Green hover/border**: Available dates
- **Yellow background**: Dates with pending requests only
- **Red background**: Dates blocked by approved bookings
- **Gray/faded**: Past dates or dates outside current month

#### Availability Legend
Interactive legend showing:
- ✓ Available (green)
- ⚠ Pending Request (yellow)  
- 🔒 Blocked - Approved (red)

#### Enhanced Icons
- Lock icon (🔒) on blocked dates
- Warning triangle (⚠) on pending dates

---

## 4. Booking Status Flow

```
[Client Creates Booking]
         ↓
     PENDING
    (Date tentatively held)
         ↓
[Admin Approves]
         ↓
     APPROVED
    (Date is now BLOCKED)
         ↓
[Event Date Passes]
         ↓
    COMPLETED
    (Auto-marked by cron job)
    (Date available for future bookings)
```

**OR**

```
[Any Status] → CANCELLED → (Date becomes available)
```

---

## 5. Configuration Required

### Environment Variables

Add to your `.env` file:
```env
# Cron job authentication token
CRON_SECRET_TOKEN=your-secure-random-token-here
```

### Scheduling the Cron Job

#### Option A: Windows Task Scheduler
1. Open Task Scheduler
2. Create a Basic Task: "Mark Completed Bookings"
3. Set trigger: Daily at 1:00 AM
4. Action: Start a program
   - Program: `curl`
   - Arguments: `"http://localhost:8000/api/cron/mark-completed?token=YOUR_TOKEN"`

#### Option B: External Cron Service
Use services like [cron-job.org](https://cron-job.org) to call your endpoint daily.

#### Option C: Linux Crontab (for production)
```bash
# Run daily at 1:00 AM
0 1 * * * curl -s "https://yourdomain.com/api/cron/mark-completed?token=YOUR_TOKEN"
```

---

## 6. API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/bookings/check-availability` | Check if a date is available |
| GET | `/api/bookings/available-dates` | Get available dates for a package |
| GET | `/api/bookings/availability-details` | (Admin) Detailed availability info |
| GET | `/api/cron/mark-completed` | Trigger auto-completion (cron) |

---

## 7. Future Considerations

1. **Time-Slot Mode**: The backend is ready to support multiple events per day in different time slots. To enable:
   - Update booking form to accept `event_duration`
   - Modify `checkDateAvailability` to use `checkTimeSlotAvailability` instead
   
2. **Capacity Management**: Could add per-time-slot capacity limits

3. **Buffer Time**: Could add configurable buffer between bookings

---

*Generated: February 3, 2026*
