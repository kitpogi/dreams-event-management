<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use Exception;
use Throwable;

class ExternalHealthCheckService
{
    /**
     * Timeout for health check requests in seconds.
     */
    protected int $timeout = 5;

    /**
     * Cache TTL for health status in seconds.
     */
    protected int $cacheTtl = 60;

    /**
     * Service configurations.
     */
    protected array $services = [];

    /**
     * Health status constants.
     */
    public const STATUS_HEALTHY = 'healthy';
    public const STATUS_DEGRADED = 'degraded';
    public const STATUS_UNHEALTHY = 'unhealthy';
    public const STATUS_UNKNOWN = 'unknown';

    /**
     * Create a new ExternalHealthCheckService instance.
     */
    public function __construct()
    {
        $this->services = config('health.external_services', []);
        $this->timeout = config('health.timeout', 5);
        $this->cacheTtl = config('health.cache_ttl', 60);
    }

    /**
     * Register an external service for health checking.
     */
    public function registerService(
        string $name,
        string $url,
        string $method = 'GET',
        array $options = []
    ): self {
        $this->services[$name] = [
            'name' => $name,
            'url' => $url,
            'method' => strtoupper($method),
            'headers' => $options['headers'] ?? [],
            'timeout' => $options['timeout'] ?? $this->timeout,
            'expected_status' => $options['expected_status'] ?? [200],
            'expected_body' => $options['expected_body'] ?? null,
            'critical' => $options['critical'] ?? false,
            'circuit_breaker' => $options['circuit_breaker'] ?? true,
            'retry_count' => $options['retry_count'] ?? 1,
        ];

        return $this;
    }

    /**
     * Check health of a specific service.
     */
    public function checkService(string $name, bool $useCache = true): array
    {
        if (!isset($this->services[$name])) {
            return $this->buildHealthResult($name, self::STATUS_UNKNOWN, 'Service not registered');
        }

        $cacheKey = "external_health:{$name}";

        if ($useCache && $cached = Cache::get($cacheKey)) {
            return $cached;
        }

        // Check circuit breaker
        if ($this->isCircuitOpen($name)) {
            return $this->buildHealthResult(
                $name,
                self::STATUS_UNHEALTHY,
                'Circuit breaker open - too many failures',
                null,
                $this->services[$name]
            );
        }

        $result = $this->performHealthCheck($name);

        // Update circuit breaker
        $this->updateCircuitBreaker($name, $result['status'] === self::STATUS_HEALTHY);

        // Cache the result
        Cache::put($cacheKey, $result, $this->cacheTtl);

        return $result;
    }

    /**
     * Check health of all registered services.
     */
    public function checkAllServices(bool $useCache = true): array
    {
        $results = [];
        $overallStatus = self::STATUS_HEALTHY;
        $criticalFailed = false;

        foreach ($this->services as $name => $config) {
            $results[$name] = $this->checkService($name, $useCache);

            if ($results[$name]['status'] === self::STATUS_UNHEALTHY) {
                if ($config['critical'] ?? false) {
                    $criticalFailed = true;
                }
                $overallStatus = self::STATUS_UNHEALTHY;
            } elseif ($results[$name]['status'] === self::STATUS_DEGRADED && $overallStatus !== self::STATUS_UNHEALTHY) {
                $overallStatus = self::STATUS_DEGRADED;
            }
        }

        return [
            'status' => $overallStatus,
            'critical_failed' => $criticalFailed,
            'timestamp' => now()->toIso8601String(),
            'services' => $results,
        ];
    }

    /**
     * Perform the actual health check.
     */
    protected function performHealthCheck(string $name): array
    {
        $config = $this->services[$name];
        $attempts = 0;
        $maxAttempts = $config['retry_count'] + 1;
        $lastError = null;

        while ($attempts < $maxAttempts) {
            $attempts++;

            try {
                $startTime = microtime(true);

                $response = Http::timeout($config['timeout'])
                    ->withHeaders($config['headers'])
                    ->send($config['method'], $config['url']);

                $latency = round((microtime(true) - $startTime) * 1000, 2);

                // Check status code
                $expectedStatuses = (array) $config['expected_status'];
                if (!in_array($response->status(), $expectedStatuses)) {
                    return $this->buildHealthResult(
                        $name,
                        self::STATUS_UNHEALTHY,
                        "Unexpected status code: {$response->status()}",
                        $latency,
                        $config
                    );
                }

                // Check expected body content
                if ($config['expected_body'] !== null) {
                    $body = $response->body();
                    if (strpos($body, $config['expected_body']) === false) {
                        return $this->buildHealthResult(
                            $name,
                            self::STATUS_DEGRADED,
                            'Response body does not contain expected content',
                            $latency,
                            $config
                        );
                    }
                }

                // Check latency thresholds
                $status = self::STATUS_HEALTHY;
                $message = 'Service is healthy';

                if ($latency > 2000) {
                    $status = self::STATUS_DEGRADED;
                    $message = 'Service is slow (>2s latency)';
                } elseif ($latency > 1000) {
                    $status = self::STATUS_DEGRADED;
                    $message = 'Service latency is higher than normal';
                }

                return $this->buildHealthResult($name, $status, $message, $latency, $config);

            } catch (Throwable $e) {
                $lastError = $e->getMessage();
                Log::warning("Health check failed for {$name}", [
                    'attempt' => $attempts,
                    'error' => $lastError,
                ]);

                if ($attempts < $maxAttempts) {
                    usleep(500000); // 500ms delay between retries
                }
            }
        }

        return $this->buildHealthResult(
            $name,
            self::STATUS_UNHEALTHY,
            "Health check failed: {$lastError}",
            null,
            $config ?? []
        );
    }

    /**
     * Build a health result array.
     */
    protected function buildHealthResult(
        string $name,
        string $status,
        string $message,
        ?float $latency = null,
        array $config = []
    ): array {
        return [
            'name' => $name,
            'status' => $status,
            'message' => $message,
            'latency_ms' => $latency,
            'critical' => $config['critical'] ?? false,
            'url' => $config['url'] ?? null,
            'checked_at' => now()->toIso8601String(),
        ];
    }

    /**
     * Check if circuit breaker is open for a service.
     */
    protected function isCircuitOpen(string $name): bool
    {
        $config = $this->services[$name];

        if (!($config['circuit_breaker'] ?? true)) {
            return false;
        }

        $failureCount = Cache::get("circuit:{$name}:failures", 0);
        $openedAt = Cache::get("circuit:{$name}:opened_at");

        if ($failureCount >= 5) {
            // Circuit is open, check if we should try half-open
            if ($openedAt && now()->diffInSeconds($openedAt) >= 60) {
                // Allow a single test request after 60 seconds
                Cache::forget("circuit:{$name}:opened_at");
                return false;
            }
            return true;
        }

        return false;
    }

    /**
     * Update circuit breaker state.
     */
    protected function updateCircuitBreaker(string $name, bool $success): void
    {
        $config = $this->services[$name];

        if (!($config['circuit_breaker'] ?? true)) {
            return;
        }

        $key = "circuit:{$name}:failures";

        if ($success) {
            Cache::forget($key);
            Cache::forget("circuit:{$name}:opened_at");
        } else {
            $failures = Cache::increment($key);
            Cache::put($key, $failures, 300); // 5 minute window

            if ($failures >= 5) {
                Cache::put("circuit:{$name}:opened_at", now(), 300);
            }
        }
    }

    /**
     * Get circuit breaker status for a service.
     */
    public function getCircuitBreakerStatus(string $name): array
    {
        $failures = Cache::get("circuit:{$name}:failures", 0);
        $openedAt = Cache::get("circuit:{$name}:opened_at");

        if ($failures >= 5 && $openedAt) {
            $status = 'open';
            $recoversIn = max(0, 60 - now()->diffInSeconds($openedAt));
        } elseif ($failures > 0) {
            $status = 'half-open';
            $recoversIn = null;
        } else {
            $status = 'closed';
            $recoversIn = null;
        }

        return [
            'status' => $status,
            'failures' => $failures,
            'opened_at' => $openedAt?->toIso8601String(),
            'recovers_in_seconds' => $recoversIn,
        ];
    }

    /**
     * Reset circuit breaker for a service.
     */
    public function resetCircuitBreaker(string $name): void
    {
        Cache::forget("circuit:{$name}:failures");
        Cache::forget("circuit:{$name}:opened_at");
    }

    /**
     * Get all registered services.
     */
    public function getRegisteredServices(): array
    {
        return $this->services;
    }

    /**
     * Check if a service is registered.
     */
    public function hasService(string $name): bool
    {
        return isset($this->services[$name]);
    }

    /**
     * Remove a registered service.
     */
    public function unregisterService(string $name): self
    {
        unset($this->services[$name]);
        Cache::forget("external_health:{$name}");
        $this->resetCircuitBreaker($name);

        return $this;
    }

    /**
     * Set timeout for health checks.
     */
    public function setTimeout(int $seconds): self
    {
        $this->timeout = $seconds;

        return $this;
    }

    /**
     * Set cache TTL for health results.
     */
    public function setCacheTtl(int $seconds): self
    {
        $this->cacheTtl = $seconds;

        return $this;
    }

    /**
     * Clear all cached health results.
     */
    public function clearCache(): void
    {
        foreach (array_keys($this->services) as $name) {
            Cache::forget("external_health:{$name}");
        }
    }

    /**
     * Get health summary for dashboard.
     */
    public function getSummary(): array
    {
        $results = $this->checkAllServices(true);

        $counts = [
            'healthy' => 0,
            'degraded' => 0,
            'unhealthy' => 0,
            'unknown' => 0,
        ];

        foreach ($results['services'] as $service) {
            $counts[$service['status']] = ($counts[$service['status']] ?? 0) + 1;
        }

        return [
            'overall_status' => $results['status'],
            'critical_failed' => $results['critical_failed'],
            'total_services' => count($results['services']),
            'counts' => $counts,
            'timestamp' => $results['timestamp'],
        ];
    }

    /**
     * Check health with specific timeout.
     */
    public function checkWithTimeout(string $name, int $timeout): array
    {
        $originalTimeout = $this->services[$name]['timeout'] ?? $this->timeout;
        $this->services[$name]['timeout'] = $timeout;

        $result = $this->checkService($name, false);

        $this->services[$name]['timeout'] = $originalTimeout;

        return $result;
    }

    /**
     * Configure common external services.
     */
    public function configureCommonServices(): self
    {
        // Payment gateway
        if ($url = config('services.paymongo.health_url', config('services.paymongo.url'))) {
            $this->registerService('paymongo', $url, 'GET', [
                'critical' => true,
                'expected_status' => [200, 401],
            ]);
        }

        // Email service
        if (config('mail.default') === 'smtp') {
            // SMTP doesn't have HTTP health endpoint, skip
        }

        // Semaphore SMS
        if (config('services.semaphore.enabled')) {
            $this->registerService('semaphore_sms', 'https://api.semaphore.co/api/v4/account', 'GET', [
                'headers' => ['apikey' => config('services.semaphore.api_key')],
                'expected_status' => [200],
            ]);
        }

        // Firebase FCM
        if (config('services.firebase.enabled')) {
            $this->registerService('firebase_fcm', 'https://fcm.googleapis.com/fcm/send', 'POST', [
                'headers' => ['Authorization' => 'key=' . config('services.firebase.server_key')],
                'expected_status' => [200, 401],
            ]);
        }

        return $this;
    }
}
