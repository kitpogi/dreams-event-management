<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\MetricsCollectionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class MetricsController extends Controller
{
    /**
     * The metrics collection service.
     */
    protected MetricsCollectionService $metrics;

    /**
     * Create a new controller instance.
     */
    public function __construct(MetricsCollectionService $metrics)
    {
        $this->metrics = $metrics;
    }

    /**
     * Get metrics in Prometheus format.
     */
    public function prometheus(): Response
    {
        // Collect current system metrics
        $this->metrics->collectSystemMetrics();

        $content = $this->metrics->toPrometheusFormat();

        return response($content, 200)
            ->header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    }

    /**
     * Get metrics as JSON.
     */
    public function json(): JsonResponse
    {
        // Collect current system metrics
        $this->metrics->collectSystemMetrics();

        return response()->json([
            'success' => true,
            'data' => $this->metrics->toArray(),
            'summary' => $this->metrics->getSummary(),
        ]);
    }

    /**
     * Get metrics summary.
     */
    public function summary(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $this->metrics->getSummary(),
        ]);
    }

    /**
     * Collect and return business metrics.
     */
    public function business(): JsonResponse
    {
        $this->metrics->collectBusinessMetrics();

        $definitions = $this->metrics->toArray();
        $businessMetrics = [];

        foreach ($definitions as $name => $data) {
            if (str_starts_with($name, 'business_') || 
                in_array($name, ['users_total', 'bookings_by_status', 'bookings_today', 'revenue_today'])) {
                $businessMetrics[$name] = $data;
            }
        }

        return response()->json([
            'success' => true,
            'data' => $businessMetrics,
            'collected_at' => now()->toIso8601String(),
        ]);
    }

    /**
     * Get specific metric.
     */
    public function show(Request $request, string $name): JsonResponse
    {
        $labels = $request->query('labels', []);

        if (is_string($labels)) {
            $labels = json_decode($labels, true) ?? [];
        }

        $value = $this->metrics->get($name, $labels);

        return response()->json([
            'success' => true,
            'data' => [
                'name' => $name,
                'labels' => $labels,
                'value' => $value,
            ],
        ]);
    }

    /**
     * Reset all metrics.
     */
    public function reset(): JsonResponse
    {
        $this->metrics->reset();

        return response()->json([
            'success' => true,
            'message' => 'All metrics have been reset.',
        ]);
    }

    /**
     * Collect database metrics.
     */
    public function database(): JsonResponse
    {
        $this->metrics->collectDatabaseMetrics();

        $definitions = $this->metrics->toArray();
        $dbMetrics = [];

        foreach ($definitions as $name => $data) {
            if (str_starts_with($name, 'database_')) {
                $dbMetrics[$name] = $data;
            }
        }

        return response()->json([
            'success' => true,
            'data' => $dbMetrics,
            'collected_at' => now()->toIso8601String(),
        ]);
    }
}
