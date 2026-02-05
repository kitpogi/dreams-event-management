<?php

namespace App\Services;

use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Carbon;

class JobManagementService
{
    /**
     * Priority levels.
     */
    public const PRIORITY_LOW = 'low';
    public const PRIORITY_NORMAL = 'normal';
    public const PRIORITY_HIGH = 'high';
    public const PRIORITY_URGENT = 'urgent';

    /**
     * Priority weights for queue ordering.
     */
    protected array $priorityWeights = [
        self::PRIORITY_URGENT => 1,
        self::PRIORITY_HIGH => 2,
        self::PRIORITY_NORMAL => 3,
        self::PRIORITY_LOW => 4,
    ];

    /**
     * Get priority weight.
     */
    public function getPriorityWeight(string $priority): int
    {
        return $this->priorityWeights[$priority] ?? 3;
    }

    /**
     * Get all failed jobs with pagination.
     */
    public function getFailedJobs(int $page = 1, int $perPage = 15, ?string $queue = null): array
    {
        $query = DB::table('failed_jobs');

        if ($queue) {
            $query->where('queue', $queue);
        }

        $total = $query->count();
        $jobs = $query->orderBy('failed_at', 'desc')
            ->offset(($page - 1) * $perPage)
            ->limit($perPage)
            ->get()
            ->map(fn($job) => $this->formatFailedJob($job))
            ->toArray();

        return [
            'data' => $jobs,
            'total' => $total,
            'page' => $page,
            'per_page' => $perPage,
            'last_page' => ceil($total / $perPage),
        ];
    }

    /**
     * Format a failed job for display.
     */
    protected function formatFailedJob(object $job): array
    {
        $payload = json_decode($job->payload, true);
        $exception = $job->exception ?? '';

        return [
            'id' => $job->id,
            'uuid' => $job->uuid ?? null,
            'connection' => $job->connection,
            'queue' => $job->queue,
            'job_name' => $this->getJobName($payload),
            'failed_at' => $job->failed_at,
            'exception_message' => $this->extractExceptionMessage($exception),
            'exception_class' => $this->extractExceptionClass($exception),
            'attempts' => $payload['attempts'] ?? 1,
            'can_retry' => $this->canRetry($job),
        ];
    }

    /**
     * Get job name from payload.
     */
    protected function getJobName(array $payload): string
    {
        $data = json_decode($payload['data']['command'] ?? '{}', true);
        $class = $payload['data']['commandName'] ?? $payload['displayName'] ?? 'Unknown';
        
        return class_basename($class);
    }

    /**
     * Extract exception message from stack trace.
     */
    protected function extractExceptionMessage(string $exception): string
    {
        $lines = explode("\n", $exception);
        $firstLine = $lines[0] ?? '';
        
        // Extract message after the exception class
        if (preg_match('/^[^:]+:\s*(.+)$/', $firstLine, $matches)) {
            return $matches[1];
        }
        
        return $firstLine;
    }

    /**
     * Extract exception class from stack trace.
     */
    protected function extractExceptionClass(string $exception): string
    {
        $lines = explode("\n", $exception);
        $firstLine = $lines[0] ?? '';
        
        // Extract class before the colon
        if (preg_match('/^([^:]+):/', $firstLine, $matches)) {
            return trim($matches[1]);
        }
        
        return 'Exception';
    }

    /**
     * Check if job can be retried.
     */
    protected function canRetry(object $job): bool
    {
        // Check if job failed recently (within 24 hours)
        $failedAt = Carbon::parse($job->failed_at);
        return $failedAt->diffInHours(now()) < 24;
    }

    /**
     * Retry a failed job.
     */
    public function retryJob(string $uuid): bool
    {
        try {
            $exitCode = Artisan::call('queue:retry', ['id' => [$uuid]]);
            
            if ($exitCode === 0) {
                $this->logRetry($uuid, 'success');
                return true;
            }
            
            $this->logRetry($uuid, 'failed', 'Command returned non-zero exit code');
            return false;
        } catch (\Throwable $e) {
            $this->logRetry($uuid, 'failed', $e->getMessage());
            return false;
        }
    }

    /**
     * Retry multiple failed jobs.
     */
    public function retryJobs(array $uuids): array
    {
        $results = [];
        
        foreach ($uuids as $uuid) {
            $results[$uuid] = $this->retryJob($uuid);
        }
        
        return $results;
    }

    /**
     * Retry all failed jobs.
     */
    public function retryAllJobs(): int
    {
        try {
            Artisan::call('queue:retry', ['id' => ['all']]);
            
            $count = DB::table('failed_jobs')->count();
            $this->logRetry('all', 'success', "Retried {$count} jobs");
            
            return $count;
        } catch (\Throwable $e) {
            $this->logRetry('all', 'failed', $e->getMessage());
            return 0;
        }
    }

    /**
     * Delete a failed job.
     */
    public function deleteJob(string $uuid): bool
    {
        try {
            $deleted = DB::table('failed_jobs')
                ->where('uuid', $uuid)
                ->delete();
            
            return $deleted > 0;
        } catch (\Throwable $e) {
            Log::error('Failed to delete job', ['uuid' => $uuid, 'error' => $e->getMessage()]);
            return false;
        }
    }

    /**
     * Delete multiple failed jobs.
     */
    public function deleteJobs(array $uuids): int
    {
        try {
            return DB::table('failed_jobs')
                ->whereIn('uuid', $uuids)
                ->delete();
        } catch (\Throwable $e) {
            Log::error('Failed to delete jobs', ['uuids' => $uuids, 'error' => $e->getMessage()]);
            return 0;
        }
    }

    /**
     * Flush all failed jobs.
     */
    public function flushAllJobs(?int $hours = null): int
    {
        try {
            $query = DB::table('failed_jobs');
            
            if ($hours !== null) {
                $query->where('failed_at', '<', now()->subHours($hours));
            }
            
            $count = $query->count();
            $query->delete();
            
            Log::info('Flushed failed jobs', ['count' => $count, 'hours' => $hours]);
            
            return $count;
        } catch (\Throwable $e) {
            Log::error('Failed to flush jobs', ['error' => $e->getMessage()]);
            return 0;
        }
    }

    /**
     * Get failed job statistics.
     */
    public function getStatistics(): array
    {
        $cacheKey = 'failed_jobs_stats';
        
        return Cache::remember($cacheKey, 300, function () {
            $jobs = DB::table('failed_jobs')->get();
            
            $byQueue = $jobs->groupBy('queue')->map(fn($items) => $items->count())->toArray();
            $byException = [];
            
            foreach ($jobs as $job) {
                $exceptionClass = $this->extractExceptionClass($job->exception ?? '');
                $byException[$exceptionClass] = ($byException[$exceptionClass] ?? 0) + 1;
            }
            
            // Get jobs by time period
            $last24Hours = $jobs->filter(fn($j) => Carbon::parse($j->failed_at)->isAfter(now()->subHours(24)))->count();
            $last7Days = $jobs->filter(fn($j) => Carbon::parse($j->failed_at)->isAfter(now()->subDays(7)))->count();
            $last30Days = $jobs->filter(fn($j) => Carbon::parse($j->failed_at)->isAfter(now()->subDays(30)))->count();
            
            return [
                'total' => $jobs->count(),
                'last_24_hours' => $last24Hours,
                'last_7_days' => $last7Days,
                'last_30_days' => $last30Days,
                'by_queue' => $byQueue,
                'by_exception' => $byException,
                'oldest_failure' => $jobs->min('failed_at'),
                'newest_failure' => $jobs->max('failed_at'),
            ];
        });
    }

    /**
     * Get queue status.
     */
    public function getQueueStatus(?string $queue = null): array
    {
        $statuses = [];
        
        // Get pending jobs count from jobs table
        $queues = $queue ? [$queue] : $this->getActiveQueues();
        
        foreach ($queues as $q) {
            $pending = DB::table('jobs')
                ->where('queue', $q)
                ->count();
            
            $failed = DB::table('failed_jobs')
                ->where('queue', $q)
                ->count();
            
            $statuses[$q] = [
                'pending' => $pending,
                'failed' => $failed,
                'health' => $this->calculateQueueHealth($pending, $failed),
            ];
        }
        
        return $statuses;
    }

    /**
     * Get active queues.
     */
    protected function getActiveQueues(): array
    {
        $jobQueues = DB::table('jobs')
            ->select('queue')
            ->distinct()
            ->pluck('queue')
            ->toArray();
        
        $failedQueues = DB::table('failed_jobs')
            ->select('queue')
            ->distinct()
            ->pluck('queue')
            ->toArray();
        
        return array_unique(array_merge($jobQueues, $failedQueues, ['default']));
    }

    /**
     * Calculate queue health percentage.
     */
    protected function calculateQueueHealth(int $pending, int $failed): int
    {
        if ($pending === 0 && $failed === 0) {
            return 100;
        }
        
        $total = $pending + $failed;
        $failureRate = ($failed / $total) * 100;
        
        return max(0, 100 - (int) $failureRate);
    }

    /**
     * Log retry attempt.
     */
    protected function logRetry(string $uuid, string $status, ?string $message = null): void
    {
        Log::channel('jobs')->info('Job retry attempt', [
            'uuid' => $uuid,
            'status' => $status,
            'message' => $message,
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    /**
     * Clear statistics cache.
     */
    public function clearStatisticsCache(): void
    {
        Cache::forget('failed_jobs_stats');
    }

    /**
     * Get job details by UUID.
     */
    public function getJobDetails(string $uuid): ?array
    {
        $job = DB::table('failed_jobs')
            ->where('uuid', $uuid)
            ->first();
        
        if (!$job) {
            return null;
        }
        
        $payload = json_decode($job->payload, true);
        
        return [
            ...$this->formatFailedJob($job),
            'full_exception' => $job->exception,
            'payload' => $payload,
        ];
    }

    /**
     * Search failed jobs.
     */
    public function searchJobs(string $query, int $limit = 20): array
    {
        return DB::table('failed_jobs')
            ->where('exception', 'like', "%{$query}%")
            ->orWhere('payload', 'like', "%{$query}%")
            ->orderBy('failed_at', 'desc')
            ->limit($limit)
            ->get()
            ->map(fn($job) => $this->formatFailedJob($job))
            ->toArray();
    }

    /**
     * Get retry history for a job.
     */
    public function getRetryHistory(string $uuid): array
    {
        return Cache::get("job_retry_history_{$uuid}", []);
    }

    /**
     * Add retry to history.
     */
    protected function addToRetryHistory(string $uuid, string $status): void
    {
        $history = $this->getRetryHistory($uuid);
        $history[] = [
            'timestamp' => now()->toIso8601String(),
            'status' => $status,
        ];
        
        // Keep last 10 retries
        $history = array_slice($history, -10);
        
        Cache::put("job_retry_history_{$uuid}", $history, 86400 * 30);
    }
}
