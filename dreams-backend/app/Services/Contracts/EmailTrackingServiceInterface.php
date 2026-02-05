<?php

namespace App\Services\Contracts;

/**
 * Contract for Email Tracking Service operations.
 */
interface EmailTrackingServiceInterface
{
    /**
     * Track an email being sent.
     *
     * @param string $type Email type (e.g., 'booking_confirmation', 'status_update')
     * @param string $recipient Recipient email address
     * @param string $subject Email subject
     * @param array $metadata Additional metadata
     * @return string Tracking ID
     */
    public function trackSent(string $type, string $recipient, string $subject, array $metadata = []): string;

    /**
     * Track an email being opened.
     *
     * @param string $trackingId
     * @return bool
     */
    public function trackOpened(string $trackingId): bool;

    /**
     * Track a link click in an email.
     *
     * @param string $trackingId
     * @param string $linkUrl
     * @return bool
     */
    public function trackClicked(string $trackingId, string $linkUrl): bool;

    /**
     * Track an email bounce.
     *
     * @param string $trackingId
     * @param string $bounceType
     * @param string|null $message
     * @return bool
     */
    public function trackBounced(string $trackingId, string $bounceType, ?string $message = null): bool;

    /**
     * Get email delivery statistics.
     *
     * @param string|null $type Filter by email type
     * @param string|null $startDate Filter by start date
     * @param string|null $endDate Filter by end date
     * @return array
     */
    public function getStatistics(?string $type = null, ?string $startDate = null, ?string $endDate = null): array;

    /**
     * Get email delivery logs.
     *
     * @param array $filters
     * @param int $limit
     * @return array
     */
    public function getLogs(array $filters = [], int $limit = 100): array;

    /**
     * Get tracking pixel URL for email opens.
     *
     * @param string $trackingId
     * @return string
     */
    public function getTrackingPixelUrl(string $trackingId): string;

    /**
     * Get tracked link URL.
     *
     * @param string $trackingId
     * @param string $originalUrl
     * @return string
     */
    public function getTrackedLinkUrl(string $trackingId, string $originalUrl): string;

    /**
     * Retry a failed email delivery.
     *
     * @param string $trackingId
     * @return bool
     */
    public function retry(string $trackingId): bool;
}
