<?php

namespace App\Jobs;

use App\Mail\BookingReminderMail;
use App\Models\BookingDetail;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

/**
 * Job to send booking reminder emails asynchronously.
 */
class SendBookingReminder implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * The number of times the job may be attempted.
     */
    public int $tries = 3;

    /**
     * The number of seconds to wait before retrying the job.
     */
    public int $backoff = 60;

    /**
     * Create a new job instance.
     */
    public function __construct(
        public BookingDetail $booking,
        public int $daysUntilEvent = 1
    ) {}

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        Log::info('Sending booking reminder email', [
            'booking_id' => $this->booking->booking_id,
            'days_until_event' => $this->daysUntilEvent,
        ]);

        $client = $this->booking->client;
        
        if (!$client || !$client->client_email) {
            Log::warning('Cannot send reminder - no client email', [
                'booking_id' => $this->booking->booking_id,
            ]);
            return;
        }

        Mail::to($client->client_email)->send(new BookingReminderMail(
            $this->booking,
            $this->daysUntilEvent <= 1 ? '1_day' : '1_week'
        ));

        Log::info('Booking reminder email sent successfully', [
            'booking_id' => $this->booking->booking_id,
        ]);
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('Failed to send booking reminder email', [
            'booking_id' => $this->booking->booking_id,
            'error' => $exception->getMessage(),
        ]);
    }

    /**
     * Get the tags that should be assigned to the job.
     *
     * @return array<int, string>
     */
    public function tags(): array
    {
        return ['email', 'booking', 'reminder', 'booking:' . $this->booking->booking_id];
    }
}
