# 🎓 Study Lesson: Automated Booking Management Logic

In this lesson, we break down how we implemented the **Auto-Expiry System** for your event management project. This is a common pattern in professional software development called **"Ghost Cleanup"** or **"Active Inventory Reclaim."**

---

## 🏗️ 1. The Problem: "The Date Squatter"
When a client creates a booking, your database marks it as `Pending`. By default, this date is now "blocked" on your calendar so other people don't double-book. 

**The Risk:** If a client books a popular date (like a wedding on a Saturday) but never pays the downpayment, your business loses money because a serious client can't book that date.

---

## 🛠️ 2. The Solution: Artisan Commands
We created a specialized **Artisan Command** in your backend located at:
`app/Console/Commands/CancelExpiredPendingBookings.php`

### How the logic works (The "Brain"):
1.  **Cutoff Time:** The system calculates a time exactly 24 hours ago.
2.  **The Filter:** It searches the database for bookings that match **ALL** these rules:
    *   **Status:** Must be `Pending`.
    *   **Age:** Must be older than 24 hours (created before the cutoff).
    *   **Payment:** Must be `unpaid`.
3.  **The Execution:** If any bookings are found, the system:
    *   Changes the status to `Cancelled`.
    *   Adds an **Internal Note** explaining *why* it was cancelled (useful for your staff to know).
    *   Sends an **Auto-Email** to the client informing them their reservation expired.
    *   **Broadcasts** the change so your dashboard updates in real-time without refreshing.

---

## 💻 3. Code Breakdown (Snippet)
Here is the core logical check we wrote in PHP (Laravel):

```php
// Find bookings older than the cutoff
$expiredBookings = BookingDetail::where('booking_status', 'Pending')
    ->where('created_at', '<=', $cutoffTime)
    ->where('payment_status', 'unpaid')
    ->get();

foreach ($expiredBookings as $booking) {
    // 1. Double check no payments were made (Safety First!)
    if (!$booking->payments()->where('status', 'paid')->exists()) {
        // 2. Cancel it
        $booking->update(['booking_status' => 'Cancelled']);
        
        // 3. Notify the client
        Mail::to($booking->client_email)->send(new BookingStatusUpdateMail(...));
    }
}
```

---

## 🕒 4. Automation (The "Scheduler")
In a real-production environment, you don't want to run this command manually every hour. We use the **Laravel Task Scheduler** (`app/Console/Kernel.php`).

You can schedule it to run every hour like this:
```php
$schedule->command('bookings:cancel-expired --hours=24')->hourly();
```

---

## 📝 5. Key Vocabulary for You to Remember:
*   **Artisan Command:** A custom script you can run via terminal to perform backend tasks.
*   **Cutoff Date:** A point in time used to separate "recent" data from "old/expired" data.
*   **Dry Run:** A "safety mode" where the script tells you what it *would* do without actually changing anything in the database (`--dry-run`).
*   **Idempotency:** A concept where running the script twice won't cause errors or double-cancel things (the script naturally handles this because it only looks for `Pending` status).

---

### 💡 Pro-Tip for your Study:
Try running this in your terminal to see the system in action:
```bash
php artisan bookings:cancel-expired --hours=24 --dry-run
```
It will show you exactly which "ghost" bookings are currently sitting in your database!
