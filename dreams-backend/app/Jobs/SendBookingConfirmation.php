<?php

namespace App\Jobs;

use App\Mail\BookingConfirmationMail;
use App\Models\BookingDetail;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

/**
 * Job to send booking confirmation emails asynchronously.
 */
class SendBookingConfirmation implements ShouldQueue
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
     * The maximum number of unhandled exceptions to allow before failing.
     */
    public int $maxExceptions = 2;

    /**
     * Create a new job instance.
     */
    public function __construct(
        public BookingDetail $booking
    ) {}

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        Log::info('Sending booking confirmation email', [
            'booking_id' => $this->booking->booking_id,
            'client_email' => $this->booking->client?->client_email,
        ]);

        $client = $this->booking->client;
        
        if (!$client || !$client->client_email) {
            Log::warning('Cannot send booking confirmation - no client email', [
                'booking_id' => $this->booking->booking_id,
            ]);
            return;
        }

        Mail::to($client->client_email)->send(new BookingConfirmationMail($this->booking));

        Log::info('Booking confirmation email sent successfully', [
            'booking_id' => $this->booking->booking_id,
        ]);
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('Failed to send booking confirmation email', [
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
        return ['email', 'booking', 'booking:' . $this->booking->booking_id];
    }
}
