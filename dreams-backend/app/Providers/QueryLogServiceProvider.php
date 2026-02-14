<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class QueryLogServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        // Only enable query logging in development or when explicitly enabled
        if (!$this->shouldLogQueries()) {
            return;
        }

        DB::listen(function ($query) {
            $bindings = $query->bindings;
            $time = $query->time;
            $sql = $query->sql;

            // Replace placeholders with actual values for readability
            $formattedSql = $sql;
            foreach ($bindings as $binding) {
                $value = is_numeric($binding) ? $binding : "'" . addslashes($binding) . "'";
                $formattedSql = preg_replace('/\?/', $value, $formattedSql, 1);
            }

            // Log slow queries (> 100ms) as warnings
            $logLevel = $time > 100 ? 'warning' : 'debug';

            $logData = [
                'sql' => $formattedSql,
                'bindings' => $bindings,
                'time_ms' => $time,
            ];

            if ($time > 100) {
                Log::channel('database')->warning('Slow Query Detected', $logData);
            } else {
                Log::channel('database')->debug('Query Executed', $logData);
            }
        });
    }

    /**
     * Determine if query logging should be enabled.
     *
     * @return bool
     */
    protected function shouldLogQueries(): bool
    {
        // Enable in local/testing environments or when explicitly enabled
        if (config('app.env') === 'local' || config('app.env') === 'testing') {
            return config('database.log_queries', true);
        }

        // In production, only enable if explicitly set
        return config('database.log_queries', false);
    }
}
