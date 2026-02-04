<?php

namespace App\Services;

use App\Models\ApiKey;
use App\Models\ApiKeyUsageLog;
use Carbon\Carbon;
use Illuminate\Support\Facades\Hash;

class ApiKeyService
{
    /**
     * Create a new API key.
     *
     * @param array $data
     * @return array{api_key: ApiKey, credentials: array}
     */
    public function create(array $data): array
    {
        return ApiKey::createWithCredentials([
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'permissions' => $data['permissions'] ?? null,
            'allowed_ips' => $data['allowed_ips'] ?? null,
            'rate_limit' => $data['rate_limit'] ?? '1000',
            'expires_at' => $data['expires_at'] ?? null,
        ]);
    }

    /**
     * Regenerate API key secret.
     *
     * @param ApiKey $apiKey
     * @return string The new secret (only shown once)
     */
    public function regenerateSecret(ApiKey $apiKey): string
    {
        $credentials = ApiKey::generateCredentials();
        
        $apiKey->update([
            'secret_hash' => Hash::make($credentials['secret']),
        ]);

        return $credentials['secret'];
    }

    /**
     * Revoke an API key.
     *
     * @param ApiKey $apiKey
     * @return void
     */
    public function revoke(ApiKey $apiKey): void
    {
        $apiKey->update(['is_active' => false]);
    }

    /**
     * Activate an API key.
     *
     * @param ApiKey $apiKey
     * @return void
     */
    public function activate(ApiKey $apiKey): void
    {
        $apiKey->update(['is_active' => true]);
    }

    /**
     * Get usage statistics for an API key.
     *
     * @param ApiKey $apiKey
     * @param int $days
     * @return array
     */
    public function getUsageStats(ApiKey $apiKey, int $days = 30): array
    {
        $startDate = now()->subDays($days);

        $logs = ApiKeyUsageLog::where('api_key_id', $apiKey->id)
            ->where('created_at', '>=', $startDate)
            ->get();

        $totalRequests = $logs->count();
        $successRequests = $logs->where('response_code', '<', 400)->count();
        $errorRequests = $logs->where('response_code', '>=', 400)->count();
        $avgResponseTime = $logs->avg('response_time_ms');

        // Group by day
        $dailyStats = $logs->groupBy(function ($log) {
            return $log->created_at->format('Y-m-d');
        })->map(function ($dayLogs) {
            return [
                'requests' => $dayLogs->count(),
                'avg_response_time' => round($dayLogs->avg('response_time_ms'), 2),
            ];
        });

        // Top endpoints
        $topEndpoints = $logs->groupBy('endpoint')
            ->mapWithKeys(fn($group, $endpoint) => [$endpoint => $group->count()])
            ->sortDesc()
            ->take(10);

        return [
            'total_requests' => $totalRequests,
            'success_requests' => $successRequests,
            'error_requests' => $errorRequests,
            'success_rate' => $totalRequests > 0 
                ? round(($successRequests / $totalRequests) * 100, 2) 
                : 0,
            'avg_response_time_ms' => round($avgResponseTime ?? 0, 2),
            'daily_stats' => $dailyStats,
            'top_endpoints' => $topEndpoints,
            'period_days' => $days,
        ];
    }

    /**
     * Clean up old usage logs.
     *
     * @param int $daysToKeep
     * @return int Number of deleted records
     */
    public function cleanupOldLogs(int $daysToKeep = 90): int
    {
        return ApiKeyUsageLog::where('created_at', '<', now()->subDays($daysToKeep))
            ->delete();
    }

    /**
     * Get all active API keys.
     *
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getActiveKeys()
    {
        return ApiKey::where('is_active', true)
            ->where(function ($query) {
                $query->whereNull('expires_at')
                    ->orWhere('expires_at', '>', now());
            })
            ->get();
    }

    /**
     * Get expired API keys that are still active.
     *
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getExpiredActiveKeys()
    {
        return ApiKey::where('is_active', true)
            ->whereNotNull('expires_at')
            ->where('expires_at', '<=', now())
            ->get();
    }

    /**
     * Deactivate all expired keys.
     *
     * @return int Number of deactivated keys
     */
    public function deactivateExpiredKeys(): int
    {
        return ApiKey::where('is_active', true)
            ->whereNotNull('expires_at')
            ->where('expires_at', '<=', now())
            ->update(['is_active' => false]);
    }
}
