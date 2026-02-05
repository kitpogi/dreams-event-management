<?php

namespace App\Services;

use App\Models\EmailLog;
use App\Services\Contracts\EmailTrackingServiceInterface;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Service for tracking email delivery and engagement.
 * 
 * Tracks sent, opened, clicked, and bounced emails.
 * Provides statistics and analytics for email campaigns.
 */
class EmailTrackingService implements EmailTrackingServiceInterface
{
    /**
     * Email status constants.
     */
    public const STATUS_QUEUED = 'queued';
    public const STATUS_SENT = 'sent';
    public const STATUS_DELIVERED = 'delivered';
    public const STATUS_OPENED = 'opened';
    public const STATUS_CLICKED = 'clicked';
    public const STATUS_BOUNCED = 'bounced';
    public const STATUS_FAILED = 'failed';

    /**
     * Email types.
     */
    public const TYPES = [
        'booking_confirmation',
        'booking_status_update',
        'booking_reminder',
        'payment_confirmation',
        'payment_reminder',
        'welcome',
        'password_reset',
        'verification',
        'notification',
        'newsletter',
    ];

    /**
     * Cache TTL for statistics (seconds).
     */
    protected const STATS_CACHE_TTL = 300;

    /**
     * Track an email being sent.
     *
     * @param string $type Email type
     * @param string $recipient Recipient email address
     * @param string $subject Email subject
     * @param array $metadata Additional metadata
     * @return string Tracking ID
     */
    public function trackSent(string $type, string $recipient, string $subject, array $metadata = []): string
    {
        $trackingId = $this->generateTrackingId();

        EmailLog::create([
            'tracking_id' => $trackingId,
            'type' => $type,
            'recipient' => $recipient,
            'subject' => $subject,
            'status' => self::STATUS_SENT,
            'metadata' => $metadata,
            'sent_at' => now(),
        ]);

        Log::info('Email tracked', [
            'tracking_id' => $trackingId,
            'type' => $type,
            'recipient' => $this->maskEmail($recipient),
        ]);

        // Clear statistics cache
        $this->clearStatsCache();

        return $trackingId;
    }

    /**
     * Track an email being opened.
     *
     * @param string $trackingId
     * @return bool
     */
    public function trackOpened(string $trackingId): bool
    {
        $log = EmailLog::where('tracking_id', $trackingId)->first();

        if (!$log) {
            return false;
        }

        // Only track first open
        if (!$log->opened_at) {
            $log->update([
                'status' => self::STATUS_OPENED,
                'opened_at' => now(),
                'open_count' => 1,
            ]);
        } else {
            // Increment open count for subsequent opens
            $log->increment('open_count');
        }

        Log::debug('Email opened', ['tracking_id' => $trackingId]);

        return true;
    }

    /**
     * Track a link click in an email.
     *
     * @param string $trackingId
     * @param string $linkUrl
     * @return bool
     */
    public function trackClicked(string $trackingId, string $linkUrl): bool
    {
        $log = EmailLog::where('tracking_id', $trackingId)->first();

        if (!$log) {
            return false;
        }

        // Update click data
        $clicks = $log->clicks ?? [];
        $clicks[] = [
            'url' => $linkUrl,
            'clicked_at' => now()->toIso8601String(),
        ];

        $log->update([
            'status' => self::STATUS_CLICKED,
            'clicked_at' => $log->clicked_at ?? now(),
            'click_count' => ($log->click_count ?? 0) + 1,
            'clicks' => $clicks,
        ]);

        Log::debug('Email link clicked', [
            'tracking_id' => $trackingId,
            'url' => $linkUrl,
        ]);

        return true;
    }

    /**
     * Track an email bounce.
     *
     * @param string $trackingId
     * @param string $bounceType
     * @param string|null $message
     * @return bool
     */
    public function trackBounced(string $trackingId, string $bounceType, ?string $message = null): bool
    {
        $log = EmailLog::where('tracking_id', $trackingId)->first();

        if (!$log) {
            return false;
        }

        $log->update([
            'status' => self::STATUS_BOUNCED,
            'bounced_at' => now(),
            'bounce_type' => $bounceType,
            'bounce_message' => $message,
        ]);

        Log::warning('Email bounced', [
            'tracking_id' => $trackingId,
            'bounce_type' => $bounceType,
        ]);

        $this->clearStatsCache();

        return true;
    }

    /**
     * Track email delivery failure.
     *
     * @param string $trackingId
     * @param string $errorMessage
     * @return bool
     */
    public function trackFailed(string $trackingId, string $errorMessage): bool
    {
        $log = EmailLog::where('tracking_id', $trackingId)->first();

        if (!$log) {
            return false;
        }

        $log->update([
            'status' => self::STATUS_FAILED,
            'failed_at' => now(),
            'error_message' => $errorMessage,
            'attempts' => ($log->attempts ?? 0) + 1,
        ]);

        Log::error('Email delivery failed', [
            'tracking_id' => $trackingId,
            'error' => $errorMessage,
        ]);

        $this->clearStatsCache();

        return true;
    }

    /**
     * Get email delivery statistics.
     *
     * @param string|null $type Filter by email type
     * @param string|null $startDate Filter by start date
     * @param string|null $endDate Filter by end date
     * @return array
     */
    public function getStatistics(?string $type = null, ?string $startDate = null, ?string $endDate = null): array
    {
        $cacheKey = "email_stats_{$type}_{$startDate}_{$endDate}";

        return Cache::remember($cacheKey, self::STATS_CACHE_TTL, function () use ($type, $startDate, $endDate) {
            $query = EmailLog::query();

            if ($type) {
                $query->where('type', $type);
            }

            if ($startDate) {
                $query->whereDate('created_at', '>=', $startDate);
            }

            if ($endDate) {
                $query->whereDate('created_at', '<=', $endDate);
            }

            $total = $query->count();
            $statuses = (clone $query)
                ->selectRaw('status, COUNT(*) as count')
                ->groupBy('status')
                ->pluck('count', 'status')
                ->toArray();

            $opened = (clone $query)->whereNotNull('opened_at')->count();
            $clicked = (clone $query)->whereNotNull('clicked_at')->count();

            return [
                'total' => $total,
                'by_status' => $statuses,
                'sent' => $statuses[self::STATUS_SENT] ?? 0,
                'opened' => $opened,
                'clicked' => $clicked,
                'bounced' => $statuses[self::STATUS_BOUNCED] ?? 0,
                'failed' => $statuses[self::STATUS_FAILED] ?? 0,
                'open_rate' => $total > 0 ? round(($opened / $total) * 100, 2) : 0,
                'click_rate' => $opened > 0 ? round(($clicked / $opened) * 100, 2) : 0,
                'bounce_rate' => $total > 0 ? round((($statuses[self::STATUS_BOUNCED] ?? 0) / $total) * 100, 2) : 0,
            ];
        });
    }

    /**
     * Get email delivery logs.
     *
     * @param array $filters
     * @param int $limit
     * @return array
     */
    public function getLogs(array $filters = [], int $limit = 100): array
    {
        $query = EmailLog::orderByDesc('created_at');

        if (!empty($filters['type'])) {
            $query->where('type', $filters['type']);
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['recipient'])) {
            $query->where('recipient', 'like', '%' . $filters['recipient'] . '%');
        }

        if (!empty($filters['start_date'])) {
            $query->whereDate('created_at', '>=', $filters['start_date']);
        }

        if (!empty($filters['end_date'])) {
            $query->whereDate('created_at', '<=', $filters['end_date']);
        }

        return $query->limit($limit)->get()->map(function ($log) {
            return [
                'tracking_id' => $log->tracking_id,
                'type' => $log->type,
                'recipient' => $this->maskEmail($log->recipient),
                'subject' => $log->subject,
                'status' => $log->status,
                'sent_at' => $log->sent_at?->toIso8601String(),
                'opened_at' => $log->opened_at?->toIso8601String(),
                'clicked_at' => $log->clicked_at?->toIso8601String(),
                'open_count' => $log->open_count ?? 0,
                'click_count' => $log->click_count ?? 0,
            ];
        })->toArray();
    }

    /**
     * Get tracking pixel URL for email opens.
     *
     * @param string $trackingId
     * @return string
     */
    public function getTrackingPixelUrl(string $trackingId): string
    {
        return url("/api/email/track/open/{$trackingId}.gif");
    }

    /**
     * Get tracked link URL.
     *
     * @param string $trackingId
     * @param string $originalUrl
     * @return string
     */
    public function getTrackedLinkUrl(string $trackingId, string $originalUrl): string
    {
        $encodedUrl = base64_encode($originalUrl);
        return url("/api/email/track/click/{$trackingId}?url={$encodedUrl}");
    }

    /**
     * Retry a failed email delivery.
     *
     * @param string $trackingId
     * @return bool
     */
    public function retry(string $trackingId): bool
    {
        $log = EmailLog::where('tracking_id', $trackingId)->first();

        if (!$log || $log->status !== self::STATUS_FAILED) {
            return false;
        }

        // Check retry limit
        if (($log->attempts ?? 0) >= 3) {
            Log::warning('Email retry limit reached', ['tracking_id' => $trackingId]);
            return false;
        }

        // Here you would dispatch the email job again
        // This is a placeholder - actual implementation depends on your email sending mechanism
        $log->update([
            'status' => self::STATUS_QUEUED,
            'error_message' => null,
        ]);

        Log::info('Email retry scheduled', ['tracking_id' => $trackingId]);

        return true;
    }

    /**
     * Get email log by tracking ID.
     *
     * @param string $trackingId
     * @return EmailLog|null
     */
    public function getByTrackingId(string $trackingId): ?EmailLog
    {
        return EmailLog::where('tracking_id', $trackingId)->first();
    }

    /**
     * Get statistics by email type.
     *
     * @return array
     */
    public function getStatsByType(): array
    {
        return Cache::remember('email_stats_by_type', self::STATS_CACHE_TTL, function () {
            return EmailLog::selectRaw('type, status, COUNT(*) as count')
                ->groupBy('type', 'status')
                ->get()
                ->groupBy('type')
                ->map(function ($group) {
                    $stats = $group->pluck('count', 'status')->toArray();
                    $total = array_sum($stats);
                    return [
                        'total' => $total,
                        'by_status' => $stats,
                    ];
                })
                ->toArray();
        });
    }

    /**
     * Get daily email statistics.
     *
     * @param int $days Number of days to retrieve
     * @return array
     */
    public function getDailyStats(int $days = 30): array
    {
        return EmailLog::selectRaw('DATE(created_at) as date, status, COUNT(*) as count')
            ->where('created_at', '>=', now()->subDays($days))
            ->groupBy('date', 'status')
            ->orderBy('date')
            ->get()
            ->groupBy('date')
            ->map(function ($group, $date) {
                return [
                    'date' => $date,
                    'by_status' => $group->pluck('count', 'status')->toArray(),
                    'total' => $group->sum('count'),
                ];
            })
            ->values()
            ->toArray();
    }

    /**
     * Generate a unique tracking ID.
     */
    protected function generateTrackingId(): string
    {
        return Str::uuid()->toString();
    }

    /**
     * Mask email address for privacy.
     */
    protected function maskEmail(string $email): string
    {
        $parts = explode('@', $email);
        if (count($parts) !== 2) {
            return '***@***';
        }

        $name = $parts[0];
        $domain = $parts[1];

        $maskedName = strlen($name) > 2
            ? substr($name, 0, 2) . str_repeat('*', max(0, strlen($name) - 2))
            : '**';

        return $maskedName . '@' . $domain;
    }

    /**
     * Clear statistics cache.
     */
    protected function clearStatsCache(): void
    {
        Cache::forget('email_stats_by_type');
        // Clear other cache keys as needed
    }

    /**
     * Generate HTML for tracking pixel.
     *
     * @param string $trackingId
     * @return string
     */
    public function getTrackingPixelHtml(string $trackingId): string
    {
        $url = $this->getTrackingPixelUrl($trackingId);
        return "<img src=\"{$url}\" width=\"1\" height=\"1\" style=\"display:none\" alt=\"\" />";
    }
}
