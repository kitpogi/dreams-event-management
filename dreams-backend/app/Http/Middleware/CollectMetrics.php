<?php

namespace App\Http\Middleware;

use App\Services\MetricsCollectionService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CollectMetrics
{
    /**
     * The metrics collection service.
     */
    protected MetricsCollectionService $metrics;

    /**
     * Create a new middleware instance.
     */
    public function __construct(MetricsCollectionService $metrics)
    {
        $this->metrics = $metrics;
    }

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $startTime = microtime(true);

        $response = $next($request);

        $durationMs = (microtime(true) - $startTime) * 1000;

        // Track the request
        $endpoint = $this->normalizeEndpoint($request);
        $method = $request->method();
        $status = $response->getStatusCode();

        $this->metrics->trackApiRequest($endpoint, $method, $status);
        $this->metrics->observeResponseTime($endpoint, $durationMs, $method, $status);

        return $response;
    }

    /**
     * Normalize endpoint path for metrics (remove IDs, etc.).
     */
    protected function normalizeEndpoint(Request $request): string
    {
        $path = $request->path();

        // Replace numeric IDs with placeholder
        $path = preg_replace('/\/\d+/', '/{id}', $path);

        // Replace UUIDs with placeholder
        $path = preg_replace('/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i', '/{uuid}', $path);

        // Trim and clean
        $path = '/' . trim($path, '/');

        return $path;
    }
}
