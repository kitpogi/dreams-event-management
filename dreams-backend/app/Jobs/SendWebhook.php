<?php

namespace App\Jobs;

use App\Models\Webhook;
use App\Models\WebhookDelivery;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Job to send webhook notifications asynchronously.
 */
class SendWebhook implements ShouldQueue
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
     * Webhook signature algorithm.
     */
    protected const SIGNATURE_ALGORITHM = 'sha256';

    /**
     * Default timeout for webhook requests (seconds).
     */
    protected const DEFAULT_TIMEOUT = 30;

    /**
     * Create a new job instance.
     */
    public function __construct(
        public Webhook $webhook,
        public string $event,
        public array $payload
    ) {
        $this->onQueue('webhooks');
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        Log::info('Sending webhook', [
            'webhook_id' => $this->webhook->id,
            'event' => $this->event,
            'url' => $this->webhook->url,
        ]);

        $fullPayload = [
            'event' => $this->event,
            'timestamp' => now()->toIso8601String(),
            'data' => $this->payload,
        ];

        $jsonPayload = json_encode($fullPayload);
        $signature = $this->generateSignature($jsonPayload, $this->webhook->secret);

        // Create delivery record
        $delivery = WebhookDelivery::create([
            'webhook_id' => $this->webhook->id,
            'event' => $this->event,
            'payload' => $jsonPayload,
            'status' => 'pending',
            'attempts' => 0,
        ]);

        try {
            $headers = [
                'Content-Type' => 'application/json',
                'X-Webhook-Event' => $this->event,
                'X-Webhook-Timestamp' => now()->timestamp,
                'X-Webhook-Signature' => self::SIGNATURE_ALGORITHM . '=' . $signature,
                'X-Webhook-ID' => $this->webhook->id,
            ];

            $response = Http::timeout(self::DEFAULT_TIMEOUT)
                ->withHeaders($headers)
                ->post($this->webhook->url, $fullPayload);

            $statusCode = $response->status();
            $success = $response->successful();

            if ($success) {
                $delivery->markAsSuccess($statusCode, $response->body());
                Log::info('Webhook delivered successfully', [
                    'webhook_id' => $this->webhook->id,
                    'event' => $this->event,
                    'status_code' => $statusCode,
                ]);
            } else {
                $delivery->markAsFailed($statusCode, 'HTTP error: ' . $statusCode);
                Log::warning('Webhook delivery failed', [
                    'webhook_id' => $this->webhook->id,
                    'event' => $this->event,
                    'status_code' => $statusCode,
                ]);

                // Throw exception to trigger retry
                throw new \Exception("Webhook delivery failed with status code: {$statusCode}");
            }
        } catch (\Exception $e) {
            $delivery->markAsFailed(null, $e->getMessage());

            Log::error('Webhook delivery error', [
                'webhook_id' => $this->webhook->id,
                'event' => $this->event,
                'error' => $e->getMessage(),
            ]);

            throw $e; // Re-throw to trigger retry
        }
    }

    /**
     * Generate HMAC signature for payload.
     */
    protected function generateSignature(string $payload, string $secret): string
    {
        return hash_hmac(self::SIGNATURE_ALGORITHM, $payload, $secret);
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('Failed to send webhook after all retries', [
            'webhook_id' => $this->webhook->id,
            'event' => $this->event,
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
        return ['webhook', 'webhook:' . $this->webhook->id, 'event:' . $this->event];
    }
}
