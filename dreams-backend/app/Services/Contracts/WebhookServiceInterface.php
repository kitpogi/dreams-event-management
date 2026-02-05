<?php

namespace App\Services\Contracts;

/**
 * Contract for Webhook Service operations.
 */
interface WebhookServiceInterface
{
    /**
     * Send a webhook notification.
     *
     * @param string $event Event type
     * @param array $payload Data to send
     * @param string|null $webhookUrl Override default URL
     * @return bool
     */
    public function send(string $event, array $payload, ?string $webhookUrl = null): bool;

    /**
     * Register a webhook endpoint.
     *
     * @param string $url Webhook URL
     * @param array $events Events to subscribe to
     * @param string|null $secret Webhook secret for verification
     * @return array Registered webhook details
     */
    public function register(string $url, array $events, ?string $secret = null): array;

    /**
     * Unregister a webhook endpoint.
     *
     * @param string $webhookId
     * @return bool
     */
    public function unregister(string $webhookId): bool;

    /**
     * Verify webhook signature.
     *
     * @param string $payload Raw payload
     * @param string $signature Signature to verify
     * @param string $secret Webhook secret
     * @return bool
     */
    public function verifySignature(string $payload, string $signature, string $secret): bool;

    /**
     * Get webhook delivery logs.
     *
     * @param string|null $webhookId Filter by webhook ID
     * @param int $limit Number of logs to retrieve
     * @return array
     */
    public function getDeliveryLogs(?string $webhookId = null, int $limit = 100): array;

    /**
     * Retry a failed webhook delivery.
     *
     * @param string $deliveryId
     * @return bool
     */
    public function retryDelivery(string $deliveryId): bool;
}
