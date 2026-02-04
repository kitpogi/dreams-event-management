<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;

class HealthController extends Controller
{
    /**
     * Basic health check endpoint.
     * Returns 200 if the application is running.
     *
     * @return JsonResponse
     */
    public function check(): JsonResponse
    {
        return response()->json([
            'status' => 'healthy',
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    /**
     * Detailed health check with dependency status.
     * For internal monitoring use.
     *
     * @return JsonResponse
     */
    public function detailed(): JsonResponse
    {
        $checks = [
            'database' => $this->checkDatabase(),
            'cache' => $this->checkCache(),
            'storage' => $this->checkStorage(),
        ];

        $allHealthy = collect($checks)->every(fn($check) => $check['status'] === 'healthy');

        return response()->json([
            'status' => $allHealthy ? 'healthy' : 'degraded',
            'timestamp' => now()->toIso8601String(),
            'version' => config('app.version', '1.0.0'),
            'environment' => config('app.env'),
            'checks' => $checks,
            'memory' => [
                'usage_mb' => round(memory_get_usage(true) / 1024 / 1024, 2),
                'peak_mb' => round(memory_get_peak_usage(true) / 1024 / 1024, 2),
            ],
        ], $allHealthy ? 200 : 503);
    }

    /**
     * Readiness probe for Kubernetes/container orchestration.
     * Returns 200 if the application is ready to receive traffic.
     *
     * @return JsonResponse
     */
    public function ready(): JsonResponse
    {
        $dbHealthy = $this->checkDatabase()['status'] === 'healthy';

        if (!$dbHealthy) {
            return response()->json([
                'status' => 'not_ready',
                'message' => 'Database connection not available',
            ], 503);
        }

        return response()->json([
            'status' => 'ready',
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    /**
     * Liveness probe for Kubernetes/container orchestration.
     * Returns 200 if the application process is alive.
     *
     * @return JsonResponse
     */
    public function live(): JsonResponse
    {
        return response()->json([
            'status' => 'alive',
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    /**
     * Check database connection.
     *
     * @return array
     */
    protected function checkDatabase(): array
    {
        try {
            $startTime = microtime(true);
            DB::connection()->getPdo();
            $latency = round((microtime(true) - $startTime) * 1000, 2);

            return [
                'status' => 'healthy',
                'latency_ms' => $latency,
                'driver' => config('database.default'),
            ];
        } catch (\Exception $e) {
            return [
                'status' => 'unhealthy',
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Check cache connection.
     *
     * @return array
     */
    protected function checkCache(): array
    {
        try {
            $startTime = microtime(true);
            $key = 'health_check_' . uniqid();
            Cache::put($key, 'test', 10);
            $value = Cache::get($key);
            Cache::forget($key);
            $latency = round((microtime(true) - $startTime) * 1000, 2);

            if ($value !== 'test') {
                return [
                    'status' => 'unhealthy',
                    'error' => 'Cache read/write verification failed',
                ];
            }

            return [
                'status' => 'healthy',
                'latency_ms' => $latency,
                'driver' => config('cache.default'),
            ];
        } catch (\Exception $e) {
            return [
                'status' => 'unhealthy',
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Check storage accessibility.
     *
     * @return array
     */
    protected function checkStorage(): array
    {
        try {
            $startTime = microtime(true);
            $disk = Storage::disk('local');
            $testFile = 'health_check_' . uniqid() . '.txt';
            
            $disk->put($testFile, 'test');
            $content = $disk->get($testFile);
            $disk->delete($testFile);
            
            $latency = round((microtime(true) - $startTime) * 1000, 2);

            if ($content !== 'test') {
                return [
                    'status' => 'unhealthy',
                    'error' => 'Storage read/write verification failed',
                ];
            }

            return [
                'status' => 'healthy',
                'latency_ms' => $latency,
            ];
        } catch (\Exception $e) {
            return [
                'status' => 'unhealthy',
                'error' => $e->getMessage(),
            ];
        }
    }
}
