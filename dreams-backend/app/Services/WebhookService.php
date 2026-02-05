<?php

namespace App\Services;

use App\Jobs\SendWebhook;
use App\Models\Webhook;
use App\Models\WebhookDelivery;
use App\Services\Contracts\WebhookServiceInterface;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Service for managing webhook notifications.
 * 
 * Handles registration, delivery, verification, and retry of webhooks.
 */
class WebhookService implements WebhookServiceInterface
{
    /**
     * Webhook signature algorithm.
     */
    protected const SIGNATURE_ALGORITHM = 'sha256';

    /**
     * Default timeout for webhook requests (seconds).
     */
    protected const DEFAULT_TIMEOUT = 30;

    /**
     * Maximum retry attempts.
     */
    protected const MAX_RETRIES = 3;

    /**
     * Cache TTL for webhook endpoints (seconds).
     */
    protected const CACHE_TTL = 3600;

    /**
     * Supported webhook events.
     */
    public const EVENTS = [
        'booking.created',
        'booking.updated',
        'booking.cancelled',
        'booking.status_changed',
        'payment.completed',
        'payment.failed',
        'payment.refunded',
        'client.created',
        'client.updated',
        'review.created',
        'contact.received',
    ];

    /**
     * Send a webhook notification.
     *
     * @param string $event Event type
     * @param array $payload Data to send
     * @param string|null $webhookUrl Override default URL
     * @return bool
     */
    public function send(string $event, array $payload, ?string $webhookUrl = null): bool
    {
        if ($webhookUrl) {
            return $this->deliverWebhook($webhookUrl, $event, $payload, null);
        }

        // Get all registered webhooks for this event
        $webhooks = $this->getWebhooksForEvent($event);

        if ($webhooks->isEmpty()) {
            Log::debug('No webhooks registered for event', ['event' => $event]);
            return true;
        }

        $allSuccessful = true;

        foreach ($webhooks as $webhook) {
            if (config('queue.default') !== 'sync') {
                // Queue webhook delivery for async processing
                SendWebhook::dispatch($webhook, $event, $payload);
            } else {
                $success = $this->deliverWebhook(
                    $webhook->url,
                    $event,
                    $payload,
                    $webhook->secret,
                    $webhook->id
                );
                $allSuccessful = $allSuccessful && $success;
            }
        }

        return $allSuccessful;
    }

    /**
     * Register a webhook endpoint.
     *
     * @param string $url Webhook URL
     * @param array $events Events to subscribe to
     * @param string|null $secret Webhook secret for verification
     * @return array Registered webhook details
     */
    public function register(string $url, array $events, ?string $secret = null): array
    {
        // Validate URL
        if (!filter_var($url, FILTER_VALIDATE_URL)) {
            throw new \InvalidArgumentException('Invalid webhook URL.');
        }

        // Validate events
        $validEvents = array_intersect($events, self::EVENTS);
        if (empty($validEvents)) {
            throw new \InvalidArgumentException('No valid events specified.');
        }

        // Generate secret if not provided
        $secret = $secret ?? Str::random(32);

        $webhook = Webhook::create([
            'url' => $url,
            'events' => $validEvents,
            'secret' => $secret,
            'is_active' => true,
        ]);

        // Clear cache
        $this->clearWebhookCache();

        Log::info('Webhook registered', [
            'webhook_id' => $webhook->id,
            'url' => $url,
            'events' => $validEvents,
        ]);

        return [
            'id' => $webhook->id,
            'url' => $webhook->url,
            'events' => $webhook->events,
            'secret' => $secret, // Only returned on registration
            'created_at' => $webhook->created_at->toIso8601String(),
        ];
    }

    /**
     * Unregister a webhook endpoint.
     *
     * @param string $webhookId
     * @return bool
     */
    public function unregister(string $webhookId): bool
    {
        $webhook = Webhook::find($webhookId);

        if (!$webhook) {
            return false;
        }

        $webhook->delete();
        $this->clearWebhookCache();

        Log::info('Webhook unregistered', ['webhook_id' => $webhookId]);

        return true;
    }

    /**
     * Verify webhook signature.
     *
     * @param string $payload Raw payload
     * @param string $signature Signature to verify
     * @param string $secret Webhook secret
     * @return bool
     */
    public function verifySignature(string $payload, string $signature, string $secret): bool
    {
        $expectedSignature = $this->generateSignature($payload, $secret);

        return hash_equals($expectedSignature, $signature);
    }

    /**
     * Get webhook delivery logs.
     *
     * @param string|null $webhookId Filter by webhook ID
     * @param int $limit Number of logs to retrieve
     * @return array
     */
    public function getDeliveryLogs(?string $webhookId = null, int $limit = 100): array
    {
        $query = WebhookDelivery::with('webhook')
            ->orderByDesc('created_at')
            ->limit($limit);

        if ($webhookId) {
            $query->where('webhook_id', $webhookId);
        }

        return $query->get()->map(function ($delivery) {
            return [
                'id' => $delivery->id,
                'webhook_id' => $delivery->webhook_id,
                'event' => $delivery->event,
                'status' => $delivery->status,
                'status_code' => $delivery->status_code,
                'attempts' => $delivery->attempts,
                'last_attempt_at' => $delivery->last_attempt_at?->toIso8601String(),
                'created_at' => $delivery->created_at->toIso8601String(),
            ];
        })->toArray();
    }

    /**
     * Retry a failed webhook delivery.
     *
     * @param string $deliveryId
     * @return bool
     */
    public function retryDelivery(string $deliveryId): bool
    {
        $delivery = WebhookDelivery::with('webhook')->find($deliveryId);

        if (!$delivery || !$delivery->webhook) {
            return false;
        }

        if ($delivery->status === 'success') {
            return true; // Already successful
        }

        $success = $this->deliverWebhook(
            $delivery->webhook->url,
            $delivery->event,
            json_decode($delivery->payload, true),
            $delivery->webhook->secret,
            $delivery->webhook_id,
            $delivery->id
        );

        return $success;
    }

    /**
     * Deliver webhook to endpoint.
     */
    protected function deliverWebhook(
        string $url,
        string $event,
        array $payload,
        ?string $secret,
        ?int $webhookId = null,
        ?int $existingDeliveryId = null
    ): bool {
        $fullPayload = [
            'event' => $event,
            'timestamp' => now()->toIso8601String(),
            'data' => $payload,
        ];

        $jsonPayload = json_encode($fullPayload);
        $signature = $secret ? $this->generateSignature($jsonPayload, $secret) : null;

        // Create or update delivery record
        $delivery = $existingDeliveryId
            ? WebhookDelivery::find($existingDeliveryId)
            : null;

        if (!$delivery && $webhookId) {
            $delivery = WebhookDelivery::create([
                'webhook_id' => $webhookId,
                'event' => $event,
                'payload' => $jsonPayload,
                'status' => 'pending',
                'attempts' => 0,
            ]);
        }

        try {
            $headers = [
                'Content-Type' => 'application/json',
                'X-Webhook-Event' => $event,
                'X-Webhook-Timestamp' => now()->timestamp,
            ];

            if ($signature) {
                $headers['X-Webhook-Signature'] = self::SIGNATURE_ALGORITHM . '=' . $signature;
            }

            if ($webhookId) {
                $headers['X-Webhook-ID'] = $webhookId;
            }

            $response = Http::timeout(self::DEFAULT_TIMEOUT)
                ->withHeaders($headers)
                ->post($url, $fullPayload);

            $statusCode = $response->status();
            $success = $response->successful();

            if ($delivery) {
                $delivery->update([
                    'status' => $success ? 'success' : 'failed',
                    'status_code' => $statusCode,
                    'response_body' => substr($response->body(), 0, 1000),
                    'attempts' => $delivery->attempts + 1,
                    'last_attempt_at' => now(),
                ]);
            }

            if ($success) {
                Log::info('Webhook delivered successfully', [
                    'url' => $url,
                    'event' => $event,
                    'status_code' => $statusCode,
                ]);
            } else {
                Log::warning('Webhook delivery failed', [
                    'url' => $url,
                    'event' => $event,
                    'status_code' => $statusCode,
                ]);
            }

            return $success;
        } catch (\Exception $e) {
            if ($delivery) {
                $delivery->update([
                    'status' => 'failed',
                    'error_message' => $e->getMessage(),
                    'attempts' => $delivery->attempts + 1,
                    'last_attempt_at' => now(),
                ]);
            }

            Log::error('Webhook delivery error', [
                'url' => $url,
                'event' => $event,
                'error' => $e->getMessage(),
            ]);

            return false;
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
     * Get all active webhooks subscribed to an event.
     */
    protected function getWebhooksForEvent(string $event)
    {
        $cacheKey = "webhooks_for_event_{$event}";

        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($event) {
            return Webhook::where('is_active', true)
                ->whereJsonContains('events', $event)
                ->get();
        });
    }

    /**
     * Clear webhook cache.
     */
    protected function clearWebhookCache(): void
    {
        foreach (self::EVENTS as $event) {
            Cache::forget("webhooks_for_event_{$event}");
        }
    }

    /**
     * Get all registered webhooks.
     */
    public function getAllWebhooks(): array
    {
        return Webhook::where('is_active', true)
            ->get()
            ->map(function ($webhook) {
                return [
                    'id' => $webhook->id,
                    'url' => $webhook->url,
                    'events' => $webhook->events,
                    'is_active' => $webhook->is_active,
                    'created_at' => $webhook->created_at->toIso8601String(),
                ];
            })
            ->toArray();
    }

    /**
     * Update webhook configuration.
     */
    public function updateWebhook(string $webhookId, array $data): array
    {
        $webhook = Webhook::findOrFail($webhookId);

        if (isset($data['url'])) {
            if (!filter_var($data['url'], FILTER_VALIDATE_URL)) {
                throw new \InvalidArgumentException('Invalid webhook URL.');
            }
            $webhook->url = $data['url'];
        }

        if (isset($data['events'])) {
            $validEvents = array_intersect($data['events'], self::EVENTS);
            if (empty($validEvents)) {
                throw new \InvalidArgumentException('No valid events specified.');
            }
            $webhook->events = $validEvents;
        }

        if (isset($data['is_active'])) {
            $webhook->is_active = (bool) $data['is_active'];
        }

        $webhook->save();
        $this->clearWebhookCache();

        return [
            'id' => $webhook->id,
            'url' => $webhook->url,
            'events' => $webhook->events,
            'is_active' => $webhook->is_active,
            'updated_at' => $webhook->updated_at->toIso8601String(),
        ];
    }

    /**
     * Test webhook endpoint.
     */
    public function testWebhook(string $webhookId): array
    {
        $webhook = Webhook::findOrFail($webhookId);

        $testPayload = [
            'test' => true,
            'message' => 'This is a test webhook delivery.',
            'webhook_id' => $webhookId,
        ];

        $success = $this->deliverWebhook(
            $webhook->url,
            'webhook.test',
            $testPayload,
            $webhook->secret,
            $webhook->id
        );

        return [
            'success' => $success,
            'webhook_id' => $webhookId,
            'tested_at' => now()->toIso8601String(),
        ];
    }
}
