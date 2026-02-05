<?php

namespace App\Http\Middleware;

use App\Services\RateLimitService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class DynamicRateLimit
{
    public function __construct(
        protected RateLimitService $rateLimitService
    ) {}

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next, string $endpoint = 'api'): Response
    {
        // Check if rate limited
        if ($this->rateLimitService->shouldLimit($request, $endpoint)) {
            $retryAfter = $this->rateLimitService->retryAfter($request, $endpoint);
            
            // Record throttled request in analytics
            $this->rateLimitService->recordAnalytics($request, $endpoint, true);

            return response()->json([
                'success' => false,
                'message' => 'Too many requests. Please try again later.',
                'error' => 'rate_limit_exceeded',
                'retry_after' => $retryAfter,
            ], 429, [
                'Retry-After' => $retryAfter,
                'X-RateLimit-Limit' => $this->rateLimitService->getTierConfig($this->rateLimitService->getTier($request))['limit'],
                'X-RateLimit-Remaining' => 0,
                'X-RateLimit-Reset' => time() + $retryAfter,
            ]);
        }

        // Record the hit
        $this->rateLimitService->hit($request, $endpoint);
        
        // Record in analytics
        $this->rateLimitService->recordAnalytics($request, $endpoint, false);

        // Process the request
        $response = $next($request);

        // Add rate limit headers to successful response
        $headers = $this->rateLimitService->getHeaders($request, $endpoint);
        foreach ($headers as $key => $value) {
            $response->headers->set($key, (string) $value);
        }

        return $response;
    }
}
