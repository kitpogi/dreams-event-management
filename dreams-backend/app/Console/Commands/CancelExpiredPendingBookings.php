<?php

namespace App\Console\Commands;

use App\Models\BookingDetail;
use App\Models\Payment;
use App\Events\BookingStatusChanged;
use App\Mail\BookingStatusUpdateMail;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class CancelExpiredPendingBookings extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'bookings:cancel-expired 
                            {--hours=24 : Number of hours before a pending unpaid booking expires}
                            {--dry-run : Show what would be updated without making changes}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Automatically cancel pending bookings that have no payments after a specific timeframe';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $hours = (int) $this->option('hours');
        $dryRun = $this->option('dry-run');

        $cutoffTime = Carbon::now()->subHours($hours);

        $this->info("Checking for pending bookings created before: {$cutoffTime->toDateTimeString()}");

        // Find bookings that are:
        // 1. Pending status
        // 2. Created before the cutoff OR event_date is today or past
        // 3. Have 'unpaid' payment status
        $expiredBookings = BookingDetail::with(['client', 'payments'])
            ->where('booking_status', 'Pending')
            ->where('payment_status', 'unpaid')
            ->where(function ($query) use ($cutoffTime) {
                $query->where('created_at', '<=', $cutoffTime)
                    ->orWhereDate('event_date', '<=', Carbon::today());
            })
            ->get();

        if ($expiredBookings->isEmpty()) {
            $this->info('No expired pending bookings found.');
            return 0;
        }

        $this->info("Found {$expiredBookings->count()} expired booking(s).");

        foreach ($expiredBookings as $booking) {
            /** @var \App\Models\BookingDetail $booking */

            // Determine the reason for cancellation
            $eventDate = $booking->event_date ? Carbon::parse($booking->event_date) : null;
            $isPastEvent = $eventDate && $eventDate->startOfDay()->isPast();

            $internalReason = $isPastEvent
                ? "Automatically cancelled because the event date (" . ($eventDate ? $eventDate->format('Y-m-d') : 'N/A') . ") has been reached without downpayment or approval."
                : "Automatically cancelled due to payment timeout ({$hours} hours).";

            $emailReason = $isPastEvent
                ? "Your booking has been cancelled because the event date was reached without the required downpayment or administrative approval. As a result, we were unable to secure your reservation."
                : "Your booking has been cancelled because the required downpayment was not received within the {$hours}-hour reservation window.";

            // Safety check: verify no successful payments exist even if status says unpaid
            $hasSuccessfulPayment = $booking->payments()
                ->where('status', 'paid')
                ->exists();

            if ($hasSuccessfulPayment) {
                $this->warn("Skipping Booking #{$booking->booking_id}: Status is unpaid but has successful payments.");
                continue;
            }

            $this->line("Processing Booking #{$booking->booking_id} (Created: {$booking->created_at}, Event: " . ($eventDate ? $eventDate->format('Y-m-d') : 'N/A') . ")");

            if ($dryRun) {
                $this->info("  [DRY RUN] Would cancel booking #{$booking->booking_id} - Reason: " . ($isPastEvent ? 'Past Event' : 'Timeout'));
                continue;
            }

            try {
                $oldStatus = $booking->booking_status;

                // 1. Update status
                $booking->update([
                    'booking_status' => 'Cancelled',
                    'internal_notes' => ($booking->internal_notes ? $booking->internal_notes . "\n" : "") . $internalReason
                ]);

                // 2. Notify Client
                if ($booking->client && $booking->client->client_email) {
                    try {
                        Mail::to($booking->client->client_email)->send(
                            new BookingStatusUpdateMail($booking, $oldStatus, 'Cancelled', $emailReason)
                        );
                        $this->line("    ✓ Cancellation email sent to {$booking->client->client_email}");
                    } catch (\Exception $e) {
                        Log::warning("Failed to send expiry email for booking #{$booking->booking_id}: " . $e->getMessage());
                    }
                }

                // 3. Broadcast Event (for real-time dashboard updates)
                try {
                    broadcast(new BookingStatusChanged($booking, $oldStatus, 'Cancelled'))->toOthers();
                } catch (\Exception $e) {
                    // Ignore broadcast errors in console
                }

                Log::info("Booking #{$booking->booking_id} auto-cancelled. Reason: " . ($isPastEvent ? 'Event date reached' : 'Payment timeout'));
                $this->info("    ✓ Successfully cancelled booking #{$booking->booking_id}");

            } catch (\Exception $e) {
                $this->error("    ✗ Failed to cancel booking #{$booking->booking_id}: " . $e->getMessage());
                Log::error("Failed auto-cancellation of booking #{$booking->booking_id}: " . $e->getMessage());
            }
        }

        return 0;
    }
}
