<?php

namespace App\Http\Middleware;

use App\Services\StructuredLogService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware to log all API requests and responses.
 * 
 * Captures:
 * - Request method, path, and timing
 * - Response status code
 * - User ID if authenticated
 * - Performance metrics
 */
class LogApiRequest
{
    public function __construct(
        protected StructuredLogService $logger
    ) {}

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Start timing
        $startTime = microtime(true);

        // Log the incoming request
        $this->logger->logApiRequest($request);

        // Process the request
        $response = $next($request);

        // Calculate response time
        $responseTimeMs = (microtime(true) - $startTime) * 1000;

        // Log the response
        $this->logger->logApiResponse(
            $request,
            $response->getStatusCode(),
            $responseTimeMs
        );

        // Add timing header for debugging
        $response->headers->set('X-Response-Time', round($responseTimeMs, 2) . 'ms');

        return $response;
    }
}
