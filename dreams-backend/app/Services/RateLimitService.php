<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Http\Request;
use Illuminate\Cache\RateLimiting\Limit;

class RateLimitService
{
    /**
     * Rate limit tiers with requests per minute.
     */
    protected array $tiers = [
        'guest' => [
            'limit' => 30,
            'decay_minutes' => 1,
            'throttle_by' => 'ip',
        ],
        'basic' => [
            'limit' => 60,
            'decay_minutes' => 1,
            'throttle_by' => 'user',
        ],
        'premium' => [
            'limit' => 120,
            'decay_minutes' => 1,
            'throttle_by' => 'user',
        ],
        'admin' => [
            'limit' => 300,
            'decay_minutes' => 1,
            'throttle_by' => 'user',
        ],
        'api_key' => [
            'limit' => 1000,
            'decay_minutes' => 1,
            'throttle_by' => 'api_key',
        ],
    ];

    /**
     * Endpoint-specific rate limits.
     */
    protected array $endpointLimits = [
        'login' => [
            'limit' => 5,
            'decay_minutes' => 5,
            'throttle_by' => 'ip',
        ],
        'register' => [
            'limit' => 3,
            'decay_minutes' => 60,
            'throttle_by' => 'ip',
        ],
        'password_reset' => [
            'limit' => 3,
            'decay_minutes' => 60,
            'throttle_by' => 'ip',
        ],
        'otp' => [
            'limit' => 5,
            'decay_minutes' => 15,
            'throttle_by' => 'ip',
        ],
        'search' => [
            'limit' => 30,
            'decay_minutes' => 1,
            'throttle_by' => 'user',
        ],
        'file_upload' => [
            'limit' => 10,
            'decay_minutes' => 1,
            'throttle_by' => 'user',
        ],
        'webhook' => [
            'limit' => 100,
            'decay_minutes' => 1,
            'throttle_by' => 'ip',
        ],
    ];

    public function __construct()
    {
        $this->tiers = array_merge($this->tiers, config('ratelimit.tiers', []));
        $this->endpointLimits = array_merge($this->endpointLimits, config('ratelimit.endpoints', []));
    }

    /**
     * Get the rate limiter key for a request.
     */
    public function key(Request $request, string $prefix = 'api'): string
    {
        $user = $request->user();
        
        if ($user) {
            return $prefix . ':user:' . $user->id;
        }

        // For API key authentication
        $apiKey = $request->header('X-API-Key');
        if ($apiKey) {
            return $prefix . ':api_key:' . hash('sha256', $apiKey);
        }

        return $prefix . ':ip:' . $request->ip();
    }

    /**
     * Get the tier for a request.
     */
    public function getTier(Request $request): string
    {
        $user = $request->user();

        if (!$user) {
            // Check for API key
            if ($request->header('X-API-Key')) {
                return 'api_key';
            }
            return 'guest';
        }

        // Check user role for tier
        $role = $user->role ?? $user->getRoleNames()->first();

        if (in_array($role, ['admin', 'super_admin'])) {
            return 'admin';
        }

        if (in_array($role, ['premium', 'vip', 'coordinator'])) {
            return 'premium';
        }

        return 'basic';
    }

    /**
     * Get the limit configuration for a tier.
     */
    public function getTierConfig(string $tier): array
    {
        return $this->tiers[$tier] ?? $this->tiers['guest'];
    }

    /**
     * Get endpoint-specific limit configuration.
     */
    public function getEndpointConfig(string $endpoint): ?array
    {
        return $this->endpointLimits[$endpoint] ?? null;
    }

    /**
     * Check if the request should be rate limited.
     */
    public function shouldLimit(Request $request, string $endpoint = 'api'): bool
    {
        $config = $this->getEndpointConfig($endpoint) ?? $this->getTierConfig($this->getTier($request));
        $key = $this->buildKey($request, $endpoint, $config);

        return RateLimiter::tooManyAttempts($key, $config['limit']);
    }

    /**
     * Record a hit for rate limiting.
     */
    public function hit(Request $request, string $endpoint = 'api'): void
    {
        $config = $this->getEndpointConfig($endpoint) ?? $this->getTierConfig($this->getTier($request));
        $key = $this->buildKey($request, $endpoint, $config);

        RateLimiter::hit($key, $config['decay_minutes'] * 60);
    }

    /**
     * Get the remaining attempts.
     */
    public function remaining(Request $request, string $endpoint = 'api'): int
    {
        $config = $this->getEndpointConfig($endpoint) ?? $this->getTierConfig($this->getTier($request));
        $key = $this->buildKey($request, $endpoint, $config);

        return RateLimiter::remaining($key, $config['limit']);
    }

    /**
     * Get the retry after seconds.
     */
    public function retryAfter(Request $request, string $endpoint = 'api'): int
    {
        $config = $this->getEndpointConfig($endpoint) ?? $this->getTierConfig($this->getTier($request));
        $key = $this->buildKey($request, $endpoint, $config);

        return RateLimiter::availableIn($key);
    }

    /**
     * Clear the rate limit for a request.
     */
    public function clear(Request $request, string $endpoint = 'api'): void
    {
        $config = $this->getEndpointConfig($endpoint) ?? $this->getTierConfig($this->getTier($request));
        $key = $this->buildKey($request, $endpoint, $config);

        RateLimiter::clear($key);
    }

    /**
     * Get rate limit headers for a response.
     */
    public function getHeaders(Request $request, string $endpoint = 'api'): array
    {
        $config = $this->getEndpointConfig($endpoint) ?? $this->getTierConfig($this->getTier($request));
        $remaining = $this->remaining($request, $endpoint);
        $retryAfter = $this->retryAfter($request, $endpoint);

        $headers = [
            'X-RateLimit-Limit' => $config['limit'],
            'X-RateLimit-Remaining' => max(0, $remaining),
            'X-RateLimit-Reset' => time() + ($config['decay_minutes'] * 60),
        ];

        if ($remaining <= 0) {
            $headers['Retry-After'] = $retryAfter;
        }

        return $headers;
    }

    /**
     * Build the cache key for rate limiting.
     */
    protected function buildKey(Request $request, string $endpoint, array $config): string
    {
        $throttleBy = $config['throttle_by'] ?? 'ip';

        $identifier = match ($throttleBy) {
            'user' => $request->user() ? 'user:' . $request->user()->id : 'ip:' . $request->ip(),
            'api_key' => 'api_key:' . hash('sha256', $request->header('X-API-Key', '')),
            default => 'ip:' . $request->ip(),
        };

        return "rate_limit:{$endpoint}:{$identifier}";
    }

    /**
     * Get rate limiting analytics for a user.
     */
    public function getAnalytics(?int $userId = null): array
    {
        $prefix = 'rate_limit_analytics:';
        $key = $userId ? $prefix . 'user:' . $userId : $prefix . 'global';

        return Cache::get($key, [
            'total_requests' => 0,
            'throttled_requests' => 0,
            'requests_by_endpoint' => [],
            'peak_hour' => null,
            'avg_requests_per_minute' => 0,
        ]);
    }

    /**
     * Record analytics for rate limiting.
     */
    public function recordAnalytics(Request $request, string $endpoint, bool $wasThrottled = false): void
    {
        $userId = $request->user()?->id;
        $hour = now()->format('H');

        // Update global analytics
        $this->updateAnalyticsData('rate_limit_analytics:global', $endpoint, $hour, $wasThrottled);

        // Update user-specific analytics
        if ($userId) {
            $this->updateAnalyticsData('rate_limit_analytics:user:' . $userId, $endpoint, $hour, $wasThrottled);
        }
    }

    /**
     * Update analytics data.
     */
    protected function updateAnalyticsData(string $key, string $endpoint, string $hour, bool $wasThrottled): void
    {
        $analytics = Cache::get($key, [
            'total_requests' => 0,
            'throttled_requests' => 0,
            'requests_by_endpoint' => [],
            'requests_by_hour' => [],
            'last_updated' => null,
        ]);

        $analytics['total_requests']++;
        
        if ($wasThrottled) {
            $analytics['throttled_requests']++;
        }

        // Track by endpoint
        if (!isset($analytics['requests_by_endpoint'][$endpoint])) {
            $analytics['requests_by_endpoint'][$endpoint] = 0;
        }
        $analytics['requests_by_endpoint'][$endpoint]++;

        // Track by hour
        if (!isset($analytics['requests_by_hour'][$hour])) {
            $analytics['requests_by_hour'][$hour] = 0;
        }
        $analytics['requests_by_hour'][$hour]++;

        // Find peak hour
        $analytics['peak_hour'] = array_keys($analytics['requests_by_hour'], max($analytics['requests_by_hour']))[0] ?? null;

        $analytics['last_updated'] = now()->toIso8601String();

        // Store for 24 hours
        Cache::put($key, $analytics, now()->addHours(24));
    }

    /**
     * Get the current status for a request.
     */
    public function getStatus(Request $request, string $endpoint = 'api'): array
    {
        $tier = $this->getTier($request);
        $config = $this->getEndpointConfig($endpoint) ?? $this->getTierConfig($tier);

        return [
            'tier' => $tier,
            'endpoint' => $endpoint,
            'limit' => $config['limit'],
            'remaining' => $this->remaining($request, $endpoint),
            'decay_minutes' => $config['decay_minutes'],
            'throttle_by' => $config['throttle_by'],
            'is_limited' => $this->shouldLimit($request, $endpoint),
            'retry_after' => $this->shouldLimit($request, $endpoint) ? $this->retryAfter($request, $endpoint) : null,
        ];
    }

    /**
     * Configure Laravel's built-in rate limiter.
     */
    public static function configureRateLimiter(): void
    {
        // Default API rate limiter
        RateLimiter::for('api', function (Request $request) {
            $service = app(RateLimitService::class);
            $tier = $service->getTier($request);
            $config = $service->getTierConfig($tier);

            return Limit::perMinute($config['limit'])->by($service->key($request, 'api'));
        });

        // Login rate limiter
        RateLimiter::for('login', function (Request $request) {
            return Limit::perMinutes(5, 5)->by($request->ip());
        });

        // Register rate limiter
        RateLimiter::for('register', function (Request $request) {
            return Limit::perHour(3)->by($request->ip());
        });

        // File upload rate limiter
        RateLimiter::for('uploads', function (Request $request) {
            return $request->user()
                ? Limit::perMinute(10)->by($request->user()->id)
                : Limit::perMinute(3)->by($request->ip());
        });

        // OTP/2FA rate limiter
        RateLimiter::for('otp', function (Request $request) {
            return Limit::perMinutes(15, 5)->by($request->ip());
        });

        // Search rate limiter
        RateLimiter::for('search', function (Request $request) {
            return $request->user()
                ? Limit::perMinute(30)->by($request->user()->id)
                : Limit::perMinute(10)->by($request->ip());
        });

        // Webhook rate limiter
        RateLimiter::for('webhook', function (Request $request) {
            return Limit::perMinute(100)->by($request->ip());
        });
    }
}
