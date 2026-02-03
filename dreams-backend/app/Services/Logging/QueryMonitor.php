<?php

namespace App\Services\Logging;

use Illuminate\Support\Facades\DB;

/**
 * Service for monitoring and logging slow database queries
 */
class QueryMonitor
{
    private static float $slowQueryThreshold = 0.5; // 500ms threshold

    /**
     * Enable query monitoring
     */
    public static function enable(float $threshold = 0.5): void
    {
        static::$slowQueryThreshold = $threshold;

        DB::listen(function ($query) {
            $duration = $query->time / 1000; // Convert to seconds

            // Log slow queries
            if ($duration > static::$slowQueryThreshold) {
                StructuredLogger::warning('Slow Query Detected', [
                    'type' => 'slow_query',
                    'duration_ms' => round($query->time, 2),
                    'query' => $query->sql,
                    'bindings' => $query->bindings,
                ]);
            }

            // Log all queries in debug mode
            if (config('app.debug')) {
                StructuredLogger::info('Database Query', [
                    'type' => 'database_query',
                    'duration_ms' => round($query->time, 2),
                    'query' => $query->sql,
                ]);
            }
        });
    }

    /**
     * Set slow query threshold in milliseconds
     */
    public static function setThreshold(float $milliseconds): void
    {
        static::$slowQueryThreshold = $milliseconds / 1000;
    }

    /**
     * Get current threshold
     */
    public static function getThreshold(): float
    {
        return static::$slowQueryThreshold;
    }
}
