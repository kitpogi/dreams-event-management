<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Services\HttpCacheService;
use Symfony\Component\HttpFoundation\Response;

class CacheResponse
{
    protected HttpCacheService $cacheService;

    public function __construct(HttpCacheService $cacheService)
    {
        $this->cacheService = $cacheService;
    }

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next, ?int $ttl = null, ?string $strategy = null): Response
    {
        // Check if request is cacheable
        if (!$this->cacheService->isCacheable($request)) {
            return $this->processResponse($request, $next($request), $strategy);
        }

        $cacheKey = $this->cacheService->generateCacheKey($request);
        $cached = $this->cacheService->getCached($cacheKey);

        // Check for conditional request with cached response
        if ($cached) {
            $etag = $cached['etag'] ?? null;
            
            // Handle If-None-Match
            if ($etag && $this->cacheService->hasValidEtag($request, $etag)) {
                $this->cacheService->recordHit();
                return $this->cacheService->notModifiedResponse($etag);
            }

            // Return cached response
            $this->cacheService->recordHit();
            return $this->cacheService->buildCachedResponse($cached);
        }

        // Process request
        $response = $next($request);

        // Cache the response if it's cacheable
        if ($this->cacheService->isResponseCacheable($response)) {
            $ttl = $ttl ?? $this->cacheService->getTtlForRoute($request);
            $this->cacheService->store($cacheKey, $response, $ttl);
            $this->cacheService->recordStore();
            $this->cacheService->recordMiss();
        }

        return $this->processResponse($request, $response, $strategy);
    }

    /**
     * Process response and apply cache headers.
     */
    protected function processResponse(Request $request, Response $response, ?string $strategy = null): Response
    {
        $strategy = $strategy ?? $this->cacheService->determineCacheStrategy($request, $response);
        $ttl = $this->cacheService->getTtlForRoute($request);
        
        return $this->cacheService->applyCacheHeaders(
            $response,
            $strategy,
            $ttl,
            $this->cacheService->generateEtag($response->getContent())
        );
    }
}
