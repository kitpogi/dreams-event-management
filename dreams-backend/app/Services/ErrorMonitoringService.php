<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use Throwable;

class ErrorMonitoringService
{
    /**
     * Supported providers.
     */
    public const PROVIDER_SENTRY = 'sentry';
    public const PROVIDER_BUGSNAG = 'bugsnag';
    public const PROVIDER_ROLLBAR = 'rollbar';
    public const PROVIDER_LOG = 'log';

    /**
     * Error severity levels.
     */
    public const LEVEL_DEBUG = 'debug';
    public const LEVEL_INFO = 'info';
    public const LEVEL_WARNING = 'warning';
    public const LEVEL_ERROR = 'error';
    public const LEVEL_FATAL = 'fatal';

    /**
     * Current provider.
     */
    protected string $provider;

    /**
     * Provider configuration.
     */
    protected array $config;

    /**
     * Cached request fingerprint.
     */
    protected ?string $requestFingerprint = null;

    /**
     * Create a new ErrorMonitoringService instance.
     */
    public function __construct()
    {
        $this->provider = config('error-monitoring.provider', self::PROVIDER_LOG);
        $this->config = config('error-monitoring.providers.' . $this->provider, []);
    }

    /**
     * Get a safe request fingerprint that works even without routes.
     */
    protected function getRequestFingerprint(): string
    {
        if ($this->requestFingerprint !== null) {
            return $this->requestFingerprint;
        }

        try {
            $request = request();
            if ($request && $request->route()) {
                $this->requestFingerprint = $request->fingerprint();
            } else {
                // Fallback fingerprint based on session or IP
                $this->requestFingerprint = sha1(
                    ($request?->ip() ?? 'cli') . '|' .
                    ($request?->userAgent() ?? 'console') . '|' .
                    (session()->getId() ?? uniqid())
                );
            }
        } catch (Throwable $e) {
            // Ultimate fallback
            $this->requestFingerprint = sha1(uniqid('error_monitoring_', true));
        }

        return $this->requestFingerprint;
    }

    /**
     * Check if monitoring is enabled.
     */
    public function isEnabled(): bool
    {
        if (!config('error-monitoring.enabled', false)) {
            return false;
        }

        // Log provider doesn't need DSN/API key
        if ($this->provider === self::PROVIDER_LOG) {
            return true;
        }

        return !empty($this->config['dsn'] ?? $this->config['api_key'] ?? $this->config['token'] ?? null);
    }

    /**
     * Capture an exception.
     */
    public function captureException(Throwable $exception, array $context = []): ?string
    {
        if (!$this->isEnabled() && $this->provider !== self::PROVIDER_LOG) {
            return null;
        }

        $eventId = $this->generateEventId();

        $payload = $this->buildExceptionPayload($exception, $context, $eventId);

        $this->send($payload);
        $this->recordError($payload);

        return $eventId;
    }

    /**
     * Capture a message.
     */
    public function captureMessage(string $message, string $level = self::LEVEL_INFO, array $context = []): ?string
    {
        if (!$this->isEnabled() && $this->provider !== self::PROVIDER_LOG) {
            return null;
        }

        $eventId = $this->generateEventId();

        $payload = [
            'event_id' => $eventId,
            'timestamp' => now()->toIso8601String(),
            'level' => $level,
            'message' => $message,
            'context' => $context,
            'environment' => app()->environment(),
            'server_name' => gethostname(),
            'release' => config('app.version', '1.0.0'),
        ];

        $this->send($payload);
        $this->recordError($payload);

        return $eventId;
    }

    /**
     * Add breadcrumb for context.
     */
    public function addBreadcrumb(string $message, string $category = 'default', array $data = []): void
    {
        $fingerprint = $this->getRequestFingerprint();
        $breadcrumbs = Cache::get('error_monitoring_breadcrumbs_' . $fingerprint, []);

        $breadcrumbs[] = [
            'timestamp' => now()->toIso8601String(),
            'message' => $message,
            'category' => $category,
            'data' => $data,
        ];

        // Keep last 100 breadcrumbs
        $breadcrumbs = array_slice($breadcrumbs, -100);

        Cache::put('error_monitoring_breadcrumbs_' . $fingerprint, $breadcrumbs, 3600);
    }

    /**
     * Set user context.
     */
    public function setUser(?int $id, ?string $email = null, ?string $name = null, array $extra = []): void
    {
        $user = array_filter([
            'id' => $id,
            'email' => $email,
            'name' => $name,
            ...$extra,
        ]);

        Cache::put('error_monitoring_user_' . $this->getRequestFingerprint(), $user, 3600);
    }

    /**
     * Set extra context.
     */
    public function setContext(string $key, array $data): void
    {
        $fingerprint = $this->getRequestFingerprint();
        $contexts = Cache::get('error_monitoring_contexts_' . $fingerprint, []);
        $contexts[$key] = $data;
        Cache::put('error_monitoring_contexts_' . $fingerprint, $contexts, 3600);
    }

    /**
     * Set tags.
     */
    public function setTags(array $tags): void
    {
        $fingerprint = $this->getRequestFingerprint();
        $existingTags = Cache::get('error_monitoring_tags_' . $fingerprint, []);
        $tags = array_merge($existingTags, $tags);
        Cache::put('error_monitoring_tags_' . $fingerprint, $tags, 3600);
    }

    /**
     * Get error statistics.
     */
    public function getStatistics(string $period = 'day'): array
    {
        $key = match ($period) {
            'hour' => 'error_stats_hour_' . now()->format('Y-m-d-H'),
            'day' => 'error_stats_day_' . now()->format('Y-m-d'),
            'week' => 'error_stats_week_' . now()->format('Y-W'),
            'month' => 'error_stats_month_' . now()->format('Y-m'),
            default => 'error_stats_day_' . now()->format('Y-m-d'),
        };

        return Cache::get($key, [
            'total' => 0,
            'by_level' => [],
            'by_type' => [],
            'unique_errors' => 0,
        ]);
    }

    /**
     * Get recent errors.
     */
    public function getRecentErrors(int $limit = 50): array
    {
        return Cache::get('recent_errors', collect())
            ->take($limit)
            ->toArray();
    }

    /**
     * Get error by event ID.
     */
    public function getError(string $eventId): ?array
    {
        $errors = Cache::get('recent_errors', collect());
        return $errors->firstWhere('event_id', $eventId);
    }

    /**
     * Check if alert should be sent.
     */
    public function shouldAlert(string $errorHash): bool
    {
        $key = "error_alert_{$errorHash}";
        $threshold = config('error-monitoring.alert_threshold', 5);
        $window = config('error-monitoring.alert_window', 300); // 5 minutes

        $count = Cache::get($key, 0) + 1;
        Cache::put($key, $count, $window);

        // Only alert once when reaching the threshold
        return $count === $threshold;
    }

    /**
     * Send alert for critical error.
     */
    public function sendAlert(array $errorData): void
    {
        $webhookUrl = config('error-monitoring.alert_webhook');

        if (!$webhookUrl) {
            Log::channel('slack')->critical('Critical error detected', $errorData);
            return;
        }

        try {
            Http::post($webhookUrl, [
                'text' => "🚨 Critical Error Alert",
                'attachments' => [
                    [
                        'color' => 'danger',
                        'title' => $errorData['type'] ?? 'Unknown Error',
                        'text' => $errorData['message'] ?? 'No message',
                        'fields' => [
                            ['title' => 'Environment', 'value' => app()->environment(), 'short' => true],
                            ['title' => 'Event ID', 'value' => $errorData['event_id'] ?? 'N/A', 'short' => true],
                            ['title' => 'File', 'value' => $errorData['file'] ?? 'Unknown', 'short' => false],
                        ],
                        'ts' => now()->timestamp,
                    ],
                ],
            ]);
        } catch (Throwable $e) {
            Log::error('Failed to send error alert', ['error' => $e->getMessage()]);
        }
    }

    /**
     * Build exception payload.
     */
    protected function buildExceptionPayload(Throwable $exception, array $context, string $eventId): array
    {
        $fingerprint = $this->getRequestFingerprint();

        return [
            'event_id' => $eventId,
            'timestamp' => now()->toIso8601String(),
            'level' => self::LEVEL_ERROR,
            'type' => get_class($exception),
            'message' => $exception->getMessage(),
            'file' => $exception->getFile(),
            'line' => $exception->getLine(),
            'stacktrace' => $this->formatStackTrace($exception),
            'context' => $context,
            'breadcrumbs' => Cache::get('error_monitoring_breadcrumbs_' . $fingerprint, []),
            'user' => Cache::get('error_monitoring_user_' . $fingerprint),
            'tags' => Cache::get('error_monitoring_tags_' . $fingerprint, []),
            'extra' => Cache::get('error_monitoring_contexts_' . $fingerprint, []),
            'environment' => app()->environment(),
            'server_name' => gethostname(),
            'release' => config('app.version', '1.0.0'),
            'request' => $this->getRequestContext(),
            'hash' => $this->generateErrorHash($exception),
        ];
    }

    /**
     * Format stack trace.
     */
    protected function formatStackTrace(Throwable $exception): array
    {
        $frames = [];

        foreach ($exception->getTrace() as $frame) {
            $frames[] = [
                'file' => $frame['file'] ?? 'unknown',
                'line' => $frame['line'] ?? 0,
                'function' => $frame['function'] ?? 'unknown',
                'class' => $frame['class'] ?? null,
                'type' => $frame['type'] ?? null,
            ];
        }

        return array_slice($frames, 0, 50); // Limit to 50 frames
    }

    /**
     * Get request context.
     */
    protected function getRequestContext(): array
    {
        $request = request();

        return [
            'url' => $request->fullUrl(),
            'method' => $request->method(),
            'headers' => $this->sanitizeHeaders($request->headers->all()),
            'query' => $request->query(),
            'ip' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ];
    }

    /**
     * Sanitize headers (remove sensitive data).
     */
    protected function sanitizeHeaders(array $headers): array
    {
        $sensitiveHeaders = ['authorization', 'cookie', 'x-api-key', 'x-auth-token'];

        foreach ($sensitiveHeaders as $header) {
            if (isset($headers[$header])) {
                $headers[$header] = ['[REDACTED]'];
            }
        }

        return $headers;
    }

    /**
     * Generate unique event ID.
     */
    protected function generateEventId(): string
    {
        return bin2hex(random_bytes(16));
    }

    /**
     * Generate error hash for deduplication.
     */
    protected function generateErrorHash(Throwable $exception): string
    {
        return md5(get_class($exception) . $exception->getFile() . $exception->getLine() . $exception->getMessage());
    }

    /**
     * Send error to provider.
     */
    protected function send(array $payload): void
    {
        try {
            match ($this->provider) {
                self::PROVIDER_SENTRY => $this->sendToSentry($payload),
                self::PROVIDER_BUGSNAG => $this->sendToBugsnag($payload),
                self::PROVIDER_ROLLBAR => $this->sendToRollbar($payload),
                default => $this->sendToLog($payload),
            };
        } catch (Throwable $e) {
            Log::error('Failed to send error to monitoring service', [
                'provider' => $this->provider,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Send to Sentry.
     */
    protected function sendToSentry(array $payload): void
    {
        $dsn = $this->config['dsn'] ?? null;
        if (!$dsn) {
            $this->sendToLog($payload);
            return;
        }

        // Parse DSN to get API URL
        $parsed = parse_url($dsn);
        $projectId = trim($parsed['path'] ?? '', '/');
        $publicKey = $parsed['user'] ?? '';
        $host = $parsed['host'] ?? 'sentry.io';
        $scheme = $parsed['scheme'] ?? 'https';

        $url = "{$scheme}://{$host}/api/{$projectId}/store/";

        Http::withHeaders([
            'Content-Type' => 'application/json',
            'X-Sentry-Auth' => "Sentry sentry_version=7, sentry_client=laravel-custom/1.0, sentry_key={$publicKey}",
        ])->post($url, $payload);
    }

    /**
     * Send to Bugsnag.
     */
    protected function sendToBugsnag(array $payload): void
    {
        $apiKey = $this->config['api_key'] ?? null;
        if (!$apiKey) {
            $this->sendToLog($payload);
            return;
        }

        Http::withHeaders([
            'Content-Type' => 'application/json',
            'Bugsnag-Api-Key' => $apiKey,
        ])->post('https://notify.bugsnag.com/', [
            'apiKey' => $apiKey,
            'payloadVersion' => '5',
            'notifier' => [
                'name' => 'Laravel Custom',
                'version' => '1.0.0',
            ],
            'events' => [$this->transformForBugsnag($payload)],
        ]);
    }

    /**
     * Send to Rollbar.
     */
    protected function sendToRollbar(array $payload): void
    {
        $token = $this->config['token'] ?? null;
        if (!$token) {
            $this->sendToLog($payload);
            return;
        }

        Http::post('https://api.rollbar.com/api/1/item/', [
            'access_token' => $token,
            'data' => $this->transformForRollbar($payload),
        ]);
    }

    /**
     * Send to log (fallback).
     */
    protected function sendToLog(array $payload): void
    {
        $level = $payload['level'] ?? self::LEVEL_ERROR;

        Log::channel('error_monitoring')->log($level, $payload['message'] ?? 'Unknown error', [
            'event_id' => $payload['event_id'],
            'type' => $payload['type'] ?? 'message',
            'file' => $payload['file'] ?? null,
            'line' => $payload['line'] ?? null,
            'context' => $payload['context'] ?? [],
        ]);
    }

    /**
     * Transform payload for Bugsnag.
     */
    protected function transformForBugsnag(array $payload): array
    {
        return [
            'exceptions' => [
                [
                    'errorClass' => $payload['type'] ?? 'Error',
                    'message' => $payload['message'],
                    'stacktrace' => array_map(fn($frame) => [
                        'file' => $frame['file'],
                        'lineNumber' => $frame['line'],
                        'method' => $frame['function'],
                    ], $payload['stacktrace'] ?? []),
                ],
            ],
            'context' => $payload['request']['url'] ?? null,
            'severity' => $payload['level'] === self::LEVEL_FATAL ? 'error' : $payload['level'],
            'user' => $payload['user'] ?? null,
            'metaData' => $payload['extra'] ?? [],
        ];
    }

    /**
     * Transform payload for Rollbar.
     */
    protected function transformForRollbar(array $payload): array
    {
        return [
            'environment' => $payload['environment'],
            'body' => [
                'trace' => [
                    'exception' => [
                        'class' => $payload['type'] ?? 'Error',
                        'message' => $payload['message'],
                    ],
                    'frames' => array_map(fn($frame) => [
                        'filename' => $frame['file'],
                        'lineno' => $frame['line'],
                        'method' => $frame['function'],
                    ], array_reverse($payload['stacktrace'] ?? [])),
                ],
            ],
            'level' => $payload['level'],
            'timestamp' => now()->timestamp,
            'platform' => 'php',
            'language' => 'php',
            'server' => [
                'host' => $payload['server_name'],
            ],
            'person' => $payload['user'] ?? null,
            'custom' => $payload['extra'] ?? [],
        ];
    }

    /**
     * Record error for statistics.
     */
    protected function recordError(array $payload): void
    {
        // Update statistics
        $dayKey = 'error_stats_day_' . now()->format('Y-m-d');
        $stats = Cache::get($dayKey, [
            'total' => 0,
            'by_level' => [],
            'by_type' => [],
            'unique_errors' => 0,
        ]);

        $stats['total']++;
        $level = $payload['level'] ?? 'error';
        $type = $payload['type'] ?? 'unknown';

        $stats['by_level'][$level] = ($stats['by_level'][$level] ?? 0) + 1;
        $stats['by_type'][$type] = ($stats['by_type'][$type] ?? 0) + 1;

        // Track unique errors
        $hash = $payload['hash'] ?? md5($payload['message'] ?? '');
        $uniqueKey = "unique_error_{$hash}";
        if (!Cache::has($uniqueKey)) {
            Cache::put($uniqueKey, true, 86400);
            $stats['unique_errors']++;
        }

        Cache::put($dayKey, $stats, 86400);

        // Store in recent errors
        $recentErrors = Cache::get('recent_errors', collect());
        $recentErrors->prepend([
            'event_id' => $payload['event_id'],
            'type' => $type,
            'message' => $payload['message'] ?? 'Unknown',
            'level' => $level,
            'file' => $payload['file'] ?? null,
            'line' => $payload['line'] ?? null,
            'timestamp' => $payload['timestamp'],
        ]);

        // Keep last 1000 errors
        Cache::put('recent_errors', $recentErrors->take(1000), 86400);

        // Check if we should alert
        if (in_array($level, [self::LEVEL_ERROR, self::LEVEL_FATAL]) && $this->shouldAlert($hash)) {
            $this->sendAlert($payload);
        }
    }

    /**
     * Clear error statistics.
     */
    public function clearStatistics(): void
    {
        Cache::forget('recent_errors');
        Cache::forget('error_stats_day_' . now()->format('Y-m-d'));
    }

    /**
     * Get provider name.
     */
    public function getProvider(): string
    {
        return $this->provider;
    }
}
