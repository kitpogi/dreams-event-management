<?php

namespace App\Console\Commands;

use App\Models\BookingDetail;
use App\Mail\BookingReminderMail;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class SendBookingReminders extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'bookings:send-reminders';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send automated email reminders for upcoming bookings (1 week and 1 day before)';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting booking reminders process...');
        
        $sentCount = 0;
        $errorCount = 0;

        // Get bookings that are approved and upcoming
        $upcomingBookings = BookingDetail::with(['client', 'eventPackage'])
            ->where('booking_status', 'Approved')
            ->where('event_date', '>=', now()->toDateString())
            ->where('event_date', '<=', now()->addDays(8)->toDateString()) // Only check next 8 days
            ->get();

        $this->info("Found {$upcomingBookings->count()} upcoming bookings to check.");

        foreach ($upcomingBookings as $booking) {
            try {
                // Skip if no client or email
                if (!$booking->client || !$booking->client->client_email) {
                    $this->warn("Skipping booking #{$booking->booking_id}: No client email");
                    continue;
                }

                $eventDate = Carbon::parse($booking->event_date);
                $daysUntilEvent = now()->diffInDays($eventDate, false);

                // Check for 1 week reminder (7 days before)
                if ($daysUntilEvent === 7) {
                    if (!$this->reminderAlreadySent($booking->booking_id, '1_week', now()->toDateString())) {
                        $this->sendReminder($booking, '1_week');
                        $this->recordReminder($booking->booking_id, '1_week', $booking->event_date);
                        $sentCount++;
                        $this->info("Sent 1-week reminder for booking #{$booking->booking_id}");
                    }
                }

                // Check for 1 day reminder (1 day before)
                if ($daysUntilEvent === 1) {
                    if (!$this->reminderAlreadySent($booking->booking_id, '1_day', now()->toDateString())) {
                        $this->sendReminder($booking, '1_day');
                        $this->recordReminder($booking->booking_id, '1_day', $booking->event_date);
                        $sentCount++;
                        $this->info("Sent 1-day reminder for booking #{$booking->booking_id}");
                    }
                }
            } catch (\Exception $e) {
                $errorCount++;
                Log::error("Failed to send reminder for booking #{$booking->booking_id}: " . $e->getMessage());
                $this->error("Error sending reminder for booking #{$booking->booking_id}: " . $e->getMessage());
            }
        }

        $this->info("Reminder process completed. Sent: {$sentCount}, Errors: {$errorCount}");
        
        return self::SUCCESS;
    }

    /**
     * Check if reminder was already sent
     */
    private function reminderAlreadySent($bookingId, $reminderType, $reminderDate): bool
    {
        return DB::table('booking_reminders')
            ->where('booking_id', $bookingId)
            ->where('reminder_type', $reminderType)
            ->where('reminder_date', $reminderDate)
            ->exists();
    }

    /**
     * Record that a reminder was sent
     */
    private function recordReminder($bookingId, $reminderType, $eventDate): void
    {
        DB::table('booking_reminders')->insert([
            'booking_id' => $bookingId,
            'reminder_type' => $reminderType,
            'reminder_date' => now()->toDateString(),
            'event_date' => $eventDate,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /**
     * Send reminder email
     */
    private function sendReminder(BookingDetail $booking, string $reminderType): void
    {
        Mail::to($booking->client->client_email)->send(new BookingReminderMail($booking, $reminderType));
    }
}
