<?php

namespace App\Jobs;

use App\Mail\BookingStatusUpdateMail;
use App\Models\BookingDetail;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

/**
 * Job to send booking status update emails asynchronously.
 */
class SendBookingStatusUpdate implements ShouldQueue
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
        public string $previousStatus
    ) {}

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        Log::info('Sending booking status update email', [
            'booking_id' => $this->booking->booking_id,
            'previous_status' => $this->previousStatus,
            'new_status' => $this->booking->booking_status,
        ]);

        $client = $this->booking->client;
        
        if (!$client || !$client->client_email) {
            Log::warning('Cannot send status update - no client email', [
                'booking_id' => $this->booking->booking_id,
            ]);
            return;
        }

        Mail::to($client->client_email)->send(new BookingStatusUpdateMail(
            $this->booking,
            $this->previousStatus,
            $this->booking->booking_status ?? 'unknown'
        ));

        Log::info('Booking status update email sent successfully', [
            'booking_id' => $this->booking->booking_id,
        ]);
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('Failed to send booking status update email', [
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
        return ['email', 'booking', 'status-update', 'booking:' . $this->booking->booking_id];
    }
}
