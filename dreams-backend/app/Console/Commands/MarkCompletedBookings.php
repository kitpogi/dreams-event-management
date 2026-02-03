<?php

namespace App\Console\Commands;

use App\Models\BookingDetail;
use App\Events\BookingStatusChanged;
use App\Mail\BookingStatusUpdateMail;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class MarkCompletedBookings extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'bookings:mark-completed 
                            {--dry-run : Show what would be updated without making changes}
                            {--days=0 : Number of days after event date to mark as completed (default: 0 = same day)}
                            {--no-email : Skip sending email notifications}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Mark approved bookings as completed after their event date has passed';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $dryRun = $this->option('dry-run');
        $daysAfter = (int) $this->option('days');
        $sendEmails = !$this->option('no-email');

        // Calculate the cutoff date (event_date + days after should be before today)
        $cutoffDate = Carbon::today()->subDays($daysAfter);

        $this->info('Checking for bookings to mark as completed...');
        $this->info("Cutoff date: {$cutoffDate->format('Y-m-d')} (events on or before this date will be completed)");

        if ($dryRun) {
            $this->warn('DRY RUN MODE - No changes will be made');
        }

        if (!$sendEmails) {
            $this->warn('Email notifications are disabled');
        }

        // Find all approved bookings where event_date has passed
        $bookingsToComplete = BookingDetail::with(['client', 'eventPackage'])
            ->where('booking_status', 'Approved')
            ->whereDate('event_date', '<=', $cutoffDate)
            ->get();

        if ($bookingsToComplete->isEmpty()) {
            $this->info('No bookings found that need to be marked as completed.');
            return 0;
        }

        $this->info("Found {$bookingsToComplete->count()} booking(s) to mark as completed.");

        $successCount = 0;
        $failCount = 0;
        $emailsSent = 0;

        foreach ($bookingsToComplete as $booking) {
            /** @var BookingDetail $booking */
            $clientName = $booking->client
                ? trim(($booking->client->client_fname ?? '') . ' ' . ($booking->client->client_lname ?? ''))
                : 'Unknown';
            $packageName = $booking->eventPackage->package_name ?? 'N/A';
            $eventDate = $booking->event_date
                ? Carbon::parse($booking->event_date)->format('Y-m-d')
                : 'N/A';

            $this->line("  - Booking #{$booking->booking_id}: {$clientName} | {$packageName} | Event: {$eventDate}");

            if (!$dryRun) {
                try {
                    $oldStatus = $booking->booking_status;

                    $booking->update(['booking_status' => 'Completed']);

                    // Send email notification to client
                    if ($sendEmails && $booking->client && $booking->client->client_email) {
                        try {
                            Mail::to($booking->client->client_email)->send(
                                new BookingStatusUpdateMail($booking, $oldStatus, 'Completed')
                            );
                            $emailsSent++;
                            $this->line("    ✓ Email sent to {$booking->client->client_email}");
                        } catch (\Exception $e) {
                            Log::warning("Failed to send completion email for booking #{$booking->booking_id}: " . $e->getMessage());
                            $this->warn("    ⚠ Failed to send email: " . $e->getMessage());
                        }
                    }

                    // Broadcast status change event
                    try {
                        broadcast(new BookingStatusChanged($booking, $oldStatus, 'Completed'))->toOthers();
                    } catch (\Exception $e) {
                        Log::warning("Failed to broadcast status change for booking #{$booking->booking_id}: " . $e->getMessage());
                    }

                    Log::info("Booking #{$booking->booking_id} automatically marked as completed (event date: {$eventDate})");
                    $successCount++;
                } catch (\Exception $e) {
                    Log::error("Failed to mark booking #{$booking->booking_id} as completed: " . $e->getMessage());
                    $this->error("    Failed to update booking #{$booking->booking_id}: " . $e->getMessage());
                    $failCount++;
                }
            } else {
                $successCount++;
            }
        }

        $this->newLine();
        if ($dryRun) {
            $this->info("DRY RUN: {$successCount} booking(s) would be marked as completed.");
        } else {
            $this->info("Successfully marked {$successCount} booking(s) as completed.");
            if ($sendEmails) {
                $this->info("Sent {$emailsSent} email notification(s).");
            }
            if ($failCount > 0) {
                $this->error("{$failCount} booking(s) failed to update.");
            }
        }

        return 0;
    }
}
