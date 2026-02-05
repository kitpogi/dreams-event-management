<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redis;
use Carbon\Carbon;
use Exception;

class MetricsCollectionService
{
    /**
     * Metric types.
     */
    public const TYPE_COUNTER = 'counter';
    public const TYPE_GAUGE = 'gauge';
    public const TYPE_HISTOGRAM = 'histogram';
    public const TYPE_SUMMARY = 'summary';

    /**
     * Cache key prefix for metrics.
     */
    protected string $prefix = 'metrics:';

    /**
     * Default histogram buckets.
     */
    protected array $defaultBuckets = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10];

    /**
     * Increment a counter metric.
     */
    public function increment(string $name, array $labels = [], float $value = 1): void
    {
        $key = $this->buildKey($name, $labels);
        
        // Initialize if not exists
        if (!Cache::has($key)) {
            Cache::put($key, 0, now()->addDay());
        }
        
        Cache::increment($key, (int) $value);
        $this->trackMetricDefinition($name, self::TYPE_COUNTER, $labels);
    }

    /**
     * Decrement a counter (only for gauges, not true counters).
     */
    public function decrement(string $name, array $labels = [], float $value = 1): void
    {
        $key = $this->buildKey($name, $labels);
        
        // Initialize if not exists
        if (!Cache::has($key)) {
            Cache::put($key, 0, now()->addDay());
        }
        
        Cache::decrement($key, (int) $value);
        $this->trackMetricDefinition($name, self::TYPE_GAUGE, $labels);
    }

    /**
     * Set a gauge metric value.
     */
    public function gauge(string $name, float $value, array $labels = []): void
    {
        $key = $this->buildKey($name, $labels);
        Cache::put($key, $value, now()->addDay());
        $this->trackMetricDefinition($name, self::TYPE_GAUGE, $labels);
    }

    /**
     * Observe a value for histogram metric.
     */
    public function histogram(string $name, float $value, array $labels = [], ?array $buckets = null): void
    {
        $buckets = $buckets ?? $this->defaultBuckets;
        $key = $this->buildKey($name, $labels);

        // Initialize and increment count
        $countKey = "{$key}:count";
        if (!Cache::has($countKey)) {
            Cache::put($countKey, 0, now()->addDay());
        }
        Cache::increment($countKey);
        
        // Update sum
        $sum = Cache::get("{$key}:sum", 0);
        Cache::put("{$key}:sum", $sum + $value, now()->addDay());

        // Increment bucket counters (use string keys for floats)
        foreach ($buckets as $bucket) {
            if ($value <= $bucket) {
                $bucketKeyStr = (string) $bucket;
                $bucketKey = "{$key}:bucket:{$bucketKeyStr}";
                if (!Cache::has($bucketKey)) {
                    Cache::put($bucketKey, 0, now()->addDay());
                }
                Cache::increment($bucketKey);
            }
        }

        // Track +Inf bucket (always incremented)
        $infKey = "{$key}:bucket:+Inf";
        if (!Cache::has($infKey)) {
            Cache::put($infKey, 0, now()->addDay());
        }
        Cache::increment($infKey);

        $this->trackMetricDefinition($name, self::TYPE_HISTOGRAM, $labels, $buckets);
    }

    /**
     * Observe response time for an endpoint.
     */
    public function observeResponseTime(string $endpoint, float $durationMs, string $method = 'GET', int $status = 200): void
    {
        $this->histogram('http_request_duration_ms', $durationMs, [
            'endpoint' => $endpoint,
            'method' => $method,
            'status' => (string) $status,
        ]);
    }

    /**
     * Track API request.
     */
    public function trackApiRequest(string $endpoint, string $method, int $status): void
    {
        $this->increment('http_requests_total', [
            'endpoint' => $endpoint,
            'method' => $method,
            'status' => (string) $status,
        ]);
    }

    /**
     * Track database query.
     */
    public function trackDatabaseQuery(float $durationMs, string $query = 'unknown'): void
    {
        $this->histogram('database_query_duration_ms', $durationMs, [
            'query' => $this->normalizeQuery($query),
        ]);

        $this->increment('database_queries_total');
    }

    /**
     * Track cache operation.
     */
    public function trackCacheOperation(string $operation, bool $hit = true): void
    {
        $this->increment('cache_operations_total', [
            'operation' => $operation,
            'result' => $hit ? 'hit' : 'miss',
        ]);
    }

    /**
     * Track queue job.
     */
    public function trackJob(string $job, string $status, float $durationMs = 0): void
    {
        $this->increment('queue_jobs_total', [
            'job' => $job,
            'status' => $status,
        ]);

        if ($durationMs > 0) {
            $this->histogram('queue_job_duration_ms', $durationMs, [
                'job' => $job,
            ]);
        }
    }

    /**
     * Track business metric.
     */
    public function trackBusinessMetric(string $name, float $value, array $labels = []): void
    {
        $this->gauge("business_{$name}", $value, $labels);
    }

    /**
     * Get current active users gauge.
     */
    public function setActiveUsers(int $count): void
    {
        $this->gauge('active_users', $count);
    }

    /**
     * Track booking metric.
     */
    public function trackBooking(string $status, float $amount = 0): void
    {
        $this->increment('bookings_total', ['status' => $status]);

        if ($amount > 0) {
            $sum = Cache::get("{$this->prefix}bookings_amount_sum", 0);
            Cache::put("{$this->prefix}bookings_amount_sum", $sum + $amount, now()->addDay());
        }
    }

    /**
     * Track payment metric.
     */
    public function trackPayment(string $status, float $amount, string $provider = 'unknown'): void
    {
        $this->increment('payments_total', [
            'status' => $status,
            'provider' => $provider,
        ]);

        if ($status === 'success') {
            $key = "{$this->prefix}payments_amount_total";
            $sum = Cache::get($key, 0);
            Cache::put($key, $sum + $amount, now()->addDay());
        }
    }

    /**
     * Track authentication event.
     */
    public function trackAuth(string $event, bool $success = true): void
    {
        $this->increment('auth_events_total', [
            'event' => $event,
            'success' => $success ? 'true' : 'false',
        ]);
    }

    /**
     * Track error.
     */
    public function trackError(string $type, string $code = 'unknown'): void
    {
        $this->increment('errors_total', [
            'type' => $type,
            'code' => $code,
        ]);
    }

    /**
     * Get metric value.
     */
    public function get(string $name, array $labels = []): mixed
    {
        $key = $this->buildKey($name, $labels);
        return Cache::get($key, 0);
    }

    /**
     * Get histogram data.
     */
    public function getHistogram(string $name, array $labels = []): array
    {
        $key = $this->buildKey($name, $labels);
        $definition = $this->getMetricDefinition($name);
        $buckets = $definition['buckets'] ?? $this->defaultBuckets;

        $result = [
            'count' => Cache::get("{$key}:count", 0),
            'sum' => Cache::get("{$key}:sum", 0),
            'buckets' => [],
        ];

        foreach ($buckets as $bucket) {
            $bucketKeyStr = (string) $bucket;
            // Use string key in result to preserve float precision
            $result['buckets'][$bucketKeyStr] = Cache::get("{$key}:bucket:{$bucketKeyStr}", 0);
        }
        $result['buckets']['+Inf'] = Cache::get("{$key}:bucket:+Inf", 0);

        return $result;
    }

    /**
     * Get all metrics in Prometheus format.
     */
    public function toPrometheusFormat(): string
    {
        $output = [];
        $definitions = $this->getAllMetricDefinitions();

        foreach ($definitions as $name => $definition) {
            $type = $definition['type'];
            $output[] = "# HELP {$name} {$name}";
            $output[] = "# TYPE {$name} {$type}";

            if ($type === self::TYPE_HISTOGRAM) {
                $this->formatHistogramPrometheus($name, $definition, $output);
            } else {
                $this->formatSimpleMetricPrometheus($name, $definition, $output);
            }
        }

        return implode("\n", $output) . "\n";
    }

    /**
     * Format histogram for Prometheus.
     */
    protected function formatHistogramPrometheus(string $name, array $definition, array &$output): void
    {
        $labelSets = $definition['label_sets'] ?? [[]];
        $buckets = $definition['buckets'] ?? $this->defaultBuckets;

        foreach ($labelSets as $labels) {
            $key = $this->buildKey($name, $labels);
            $labelString = $this->formatLabels($labels);

            foreach ($buckets as $bucket) {
                $bucketLabels = $labels;
                $bucketLabels['le'] = (string) $bucket;
                $bucketLabelString = $this->formatLabels($bucketLabels);
                $value = Cache::get("{$key}:bucket:{$bucket}", 0);
                $output[] = "{$name}_bucket{{$bucketLabelString}} {$value}";
            }

            // +Inf bucket
            $infLabels = $labels;
            $infLabels['le'] = '+Inf';
            $infLabelString = $this->formatLabels($infLabels);
            $infValue = Cache::get("{$key}:bucket:+Inf", 0);
            $output[] = "{$name}_bucket{{$infLabelString}} {$infValue}";

            // Sum and count
            $sum = Cache::get("{$key}:sum", 0);
            $count = Cache::get("{$key}:count", 0);
            $output[] = "{$name}_sum{{$labelString}} {$sum}";
            $output[] = "{$name}_count{{$labelString}} {$count}";
        }
    }

    /**
     * Format simple metric for Prometheus.
     */
    protected function formatSimpleMetricPrometheus(string $name, array $definition, array &$output): void
    {
        $labelSets = $definition['label_sets'] ?? [[]];

        foreach ($labelSets as $labels) {
            $key = $this->buildKey($name, $labels);
            $value = Cache::get($key, 0);
            $labelString = $this->formatLabels($labels);

            if (empty($labelString)) {
                $output[] = "{$name} {$value}";
            } else {
                $output[] = "{$name}{{$labelString}} {$value}";
            }
        }
    }

    /**
     * Format labels for Prometheus.
     */
    protected function formatLabels(array $labels): string
    {
        if (empty($labels)) {
            return '';
        }

        $parts = [];
        foreach ($labels as $key => $value) {
            $escapedValue = str_replace(['\\', '"', "\n"], ['\\\\', '\\"', '\\n'], $value);
            $parts[] = "{$key}=\"{$escapedValue}\"";
        }

        return implode(',', $parts);
    }

    /**
     * Build cache key from metric name and labels.
     */
    protected function buildKey(string $name, array $labels = []): string
    {
        $key = $this->prefix . $name;

        if (!empty($labels)) {
            ksort($labels);
            $labelHash = md5(json_encode($labels));
            $key .= ':' . $labelHash;
        }

        return $key;
    }

    /**
     * Track metric definition for later retrieval.
     */
    protected function trackMetricDefinition(string $name, string $type, array $labels, ?array $buckets = null): void
    {
        $definitionsKey = "{$this->prefix}definitions";
        $definitions = Cache::get($definitionsKey, []);

        if (!isset($definitions[$name])) {
            $definitions[$name] = [
                'type' => $type,
                'label_sets' => [],
                'buckets' => $buckets,
            ];
        }

        // Track unique label sets
        if (!empty($labels)) {
            $labelHash = md5(json_encode($labels));
            $definitions[$name]['label_sets'][$labelHash] = $labels;
        } else {
            // Track that there's a metric without labels
            if (!isset($definitions[$name]['label_sets']['_empty'])) {
                $definitions[$name]['label_sets']['_empty'] = [];
            }
        }

        Cache::put($definitionsKey, $definitions, now()->addDay());
    }

    /**
     * Get metric definition.
     */
    protected function getMetricDefinition(string $name): array
    {
        $definitions = Cache::get("{$this->prefix}definitions", []);
        return $definitions[$name] ?? [];
    }

    /**
     * Get all metric definitions.
     */
    protected function getAllMetricDefinitions(): array
    {
        return Cache::get("{$this->prefix}definitions", []);
    }

    /**
     * Normalize query for labeling.
     */
    protected function normalizeQuery(string $query): string
    {
        // Extract query type (SELECT, INSERT, UPDATE, DELETE)
        if (preg_match('/^\s*(SELECT|INSERT|UPDATE|DELETE)\s/i', $query, $matches)) {
            return strtoupper($matches[1]);
        }

        return 'OTHER';
    }

    /**
     * Collect system metrics.
     */
    public function collectSystemMetrics(): void
    {
        // Memory usage
        $this->gauge('php_memory_bytes', memory_get_usage(true), ['type' => 'current']);
        $this->gauge('php_memory_bytes', memory_get_peak_usage(true), ['type' => 'peak']);

        // Uptime (if we can determine it)
        if (defined('LARAVEL_START')) {
            $uptime = microtime(true) - LARAVEL_START;
            $this->gauge('app_uptime_seconds', $uptime);
        }
    }

    /**
     * Collect database metrics.
     */
    public function collectDatabaseMetrics(): void
    {
        try {
            // Active connections (MySQL specific)
            $result = DB::select("SHOW STATUS LIKE 'Threads_connected'");
            if (!empty($result)) {
                $this->gauge('database_connections', (float) $result[0]->Value);
            }

            // Slow queries
            $result = DB::select("SHOW STATUS LIKE 'Slow_queries'");
            if (!empty($result)) {
                $this->gauge('database_slow_queries_total', (float) $result[0]->Value);
            }
        } catch (Exception $e) {
            Log::warning('Failed to collect database metrics', ['error' => $e->getMessage()]);
        }
    }

    /**
     * Collect business metrics from database.
     */
    public function collectBusinessMetrics(): void
    {
        try {
            // Total users
            $this->gauge('users_total', DB::table('users')->count());

            // Total bookings by status
            $bookings = DB::table('booking_details')
                ->select('status', DB::raw('count(*) as count'))
                ->groupBy('status')
                ->get();

            foreach ($bookings as $booking) {
                $this->gauge('bookings_by_status', $booking->count, ['status' => $booking->status ?? 'unknown']);
            }

            // Today's bookings
            $todayBookings = DB::table('booking_details')
                ->whereDate('created_at', now()->toDateString())
                ->count();
            $this->gauge('bookings_today', $todayBookings);

            // Today's revenue (if payments table exists)
            if (DB::getSchemaBuilder()->hasTable('payments')) {
                $todayRevenue = DB::table('payments')
                    ->where('status', 'completed')
                    ->whereDate('created_at', now()->toDateString())
                    ->sum('amount');
                $this->gauge('revenue_today', $todayRevenue ?? 0);
            }
        } catch (Exception $e) {
            Log::warning('Failed to collect business metrics', ['error' => $e->getMessage()]);
        }
    }

    /**
     * Reset all metrics.
     */
    public function reset(): void
    {
        $definitions = Cache::get("{$this->prefix}definitions", []);

        foreach (array_keys($definitions) as $name) {
            $this->resetMetric($name);
        }

        Cache::forget("{$this->prefix}definitions");
    }

    /**
     * Reset specific metric.
     */
    public function resetMetric(string $name): void
    {
        $definition = $this->getMetricDefinition($name);
        $labelSets = $definition['label_sets'] ?? [[]];

        foreach ($labelSets as $labels) {
            $key = $this->buildKey($name, $labels);
            Cache::forget($key);

            if ($definition['type'] === self::TYPE_HISTOGRAM) {
                Cache::forget("{$key}:count");
                Cache::forget("{$key}:sum");
                $buckets = $definition['buckets'] ?? $this->defaultBuckets;
                foreach ($buckets as $bucket) {
                    Cache::forget("{$key}:bucket:{$bucket}");
                }
                Cache::forget("{$key}:bucket:+Inf");
            }
        }
    }

    /**
     * Get all metrics as array.
     */
    public function toArray(): array
    {
        $result = [];
        $definitions = $this->getAllMetricDefinitions();

        foreach ($definitions as $name => $definition) {
            $type = $definition['type'];
            $labelSets = $definition['label_sets'] ?? [[]];

            $result[$name] = [
                'type' => $type,
                'values' => [],
            ];

            foreach ($labelSets as $labels) {
                if ($type === self::TYPE_HISTOGRAM) {
                    $value = $this->getHistogram($name, $labels);
                } else {
                    $value = $this->get($name, $labels);
                }

                $result[$name]['values'][] = [
                    'labels' => $labels,
                    'value' => $value,
                ];
            }
        }

        return $result;
    }

    /**
     * Get summary statistics.
     */
    public function getSummary(): array
    {
        return [
            'total_metrics' => count($this->getAllMetricDefinitions()),
            'metrics_by_type' => $this->countByType(),
            'collected_at' => now()->toIso8601String(),
        ];
    }

    /**
     * Count metrics by type.
     */
    protected function countByType(): array
    {
        $definitions = $this->getAllMetricDefinitions();
        $counts = [
            self::TYPE_COUNTER => 0,
            self::TYPE_GAUGE => 0,
            self::TYPE_HISTOGRAM => 0,
            self::TYPE_SUMMARY => 0,
        ];

        foreach ($definitions as $definition) {
            $type = $definition['type'];
            if (isset($counts[$type])) {
                $counts[$type]++;
            }
        }

        return $counts;
    }
}
