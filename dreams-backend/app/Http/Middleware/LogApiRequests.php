<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Services\Logging\StructuredLogger;
use Symfony\Component\HttpFoundation\Response;

class LogApiRequests
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $startTime = microtime(true);
        $endpoint = $request->getPathInfo();

        // Log the incoming request
        StructuredLogger::logApiRequest($request, $endpoint);

        // Process the request
        $response = $next($request);

        // Calculate duration
        $duration = microtime(true) - $startTime;

        // Log the response
        $statusCode = $response->getStatusCode();
        
        try {
            $responseData = json_decode($response->getContent(), true) ?? [];
        } catch (\Exception $e) {
            $responseData = [];
        }

        StructuredLogger::logApiResponse($endpoint, $statusCode, $duration, $responseData);

        // Add request ID header for tracing
        if (!$response->headers->has('X-Request-ID')) {
            $response->headers->set('X-Request-ID', $request->id());
        }

        return $response;
    }
}
