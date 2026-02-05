<?php

namespace App\Services;

use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class HttpCacheService
{
    /**
     * Cache strategies.
     */
    public const STRATEGY_PUBLIC = 'public';
    public const STRATEGY_PRIVATE = 'private';
    public const STRATEGY_NO_CACHE = 'no-cache';
    public const STRATEGY_NO_STORE = 'no-store';

    /**
     * Default TTL in seconds.
     */
    protected int $defaultTtl = 3600;

    /**
     * Cache prefix.
     */
    protected string $prefix = 'http_cache:';

    /**
     * Cacheable HTTP methods.
     */
    protected array $cacheableMethods = ['GET', 'HEAD'];

    /**
     * Routes that should not be cached.
     */
    protected array $excludedRoutes = [
        'api/auth/*',
        'api/user/*',
        'api/admin/*',
        'api/webhook/*',
    ];

    /**
     * Route-specific TTL overrides.
     */
    protected array $routeTtl = [
        'api/packages' => 1800,       // 30 minutes
        'api/packages/*' => 1800,
        'api/venues' => 1800,
        'api/venues/*' => 1800,
        'api/reviews' => 900,         // 15 minutes
    ];

    /**
     * Check if request is cacheable.
     */
    public function isCacheable(Request $request): bool
    {
        // Only cache GET and HEAD requests
        if (!in_array($request->method(), $this->cacheableMethods)) {
            return false;
        }

        // Don't cache authenticated requests by default
        if ($request->user() && !$this->allowAuthenticatedCache($request)) {
            return false;
        }

        // Check excluded routes
        foreach ($this->excludedRoutes as $pattern) {
            if ($request->is($pattern)) {
                return false;
            }
        }

        // Check for no-cache headers
        if ($request->header('Cache-Control') === 'no-cache') {
            return false;
        }

        return true;
    }

    /**
     * Check if authenticated caching is allowed for this route.
     */
    protected function allowAuthenticatedCache(Request $request): bool
    {
        // Allow caching for certain public endpoints even when authenticated
        $publicEndpoints = [
            'api/packages',
            'api/venues',
            'api/reviews',
        ];

        foreach ($publicEndpoints as $endpoint) {
            if ($request->is($endpoint) || $request->is("{$endpoint}/*")) {
                return true;
            }
        }

        return false;
    }

    /**
     * Generate cache key for request.
     */
    public function generateCacheKey(Request $request): string
    {
        $path = $request->path();
        $queryParams = $request->query();
        
        // Sort query params for consistent keys
        ksort($queryParams);
        
        $queryString = http_build_query($queryParams);
        $key = $path . ($queryString ? "?{$queryString}" : '');
        
        return $this->prefix . md5($key);
    }

    /**
     * Generate ETag for response.
     */
    public function generateEtag(string $content): string
    {
        return '"' . md5($content) . '"';
    }

    /**
     * Generate weak ETag for response.
     */
    public function generateWeakEtag(string $content): string
    {
        return 'W/"' . md5($content) . '"';
    }

    /**
     * Check if client has valid cached version (ETag).
     */
    public function hasValidEtag(Request $request, string $etag): bool
    {
        $ifNoneMatch = $request->header('If-None-Match');
        
        if (!$ifNoneMatch) {
            return false;
        }

        // Handle multiple ETags
        $clientEtags = array_map('trim', explode(',', $ifNoneMatch));
        
        foreach ($clientEtags as $clientEtag) {
            // Handle weak ETags
            $clientEtag = preg_replace('/^W\//', '', $clientEtag);
            $serverEtag = preg_replace('/^W\//', '', $etag);
            
            if ($clientEtag === $serverEtag || $clientEtag === '*') {
                return true;
            }
        }

        return false;
    }

    /**
     * Check if client has valid cached version (Last-Modified).
     */
    public function hasValidLastModified(Request $request, \DateTimeInterface $lastModified): bool
    {
        $ifModifiedSince = $request->header('If-Modified-Since');
        
        if (!$ifModifiedSince) {
            return false;
        }

        try {
            $clientTime = new \DateTime($ifModifiedSince);
            return $clientTime >= $lastModified;
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Get cached response.
     */
    public function getCached(string $key): ?array
    {
        return Cache::get($key);
    }

    /**
     * Store response in cache.
     */
    public function store(string $key, SymfonyResponse $response, ?int $ttl = null): void
    {
        $ttl = $ttl ?? $this->defaultTtl;
        
        $data = [
            'content' => $response->getContent(),
            'headers' => $response->headers->all(),
            'status' => $response->getStatusCode(),
            'etag' => $this->generateEtag($response->getContent()),
            'cached_at' => now()->timestamp,
            'expires_at' => now()->addSeconds($ttl)->timestamp,
        ];
        
        Cache::put($key, $data, $ttl);
    }

    /**
     * Build response from cached data.
     */
    public function buildCachedResponse(array $cached): SymfonyResponse
    {
        $response = new Response(
            $cached['content'],
            $cached['status'],
            $cached['headers']
        );
        
        // Add cache hit header
        $response->headers->set('X-Cache', 'HIT');
        $response->headers->set('X-Cache-Age', now()->timestamp - $cached['cached_at']);
        
        return $response;
    }

    /**
     * Apply cache headers to response.
     */
    public function applyCacheHeaders(
        SymfonyResponse $response, 
        string $strategy = self::STRATEGY_PUBLIC,
        ?int $maxAge = null,
        ?string $etag = null,
        ?\DateTimeInterface $lastModified = null
    ): SymfonyResponse {
        $maxAge = $maxAge ?? $this->defaultTtl;
        
        // Build Cache-Control header
        $cacheControl = [];
        
        switch ($strategy) {
            case self::STRATEGY_PUBLIC:
                $cacheControl[] = 'public';
                $cacheControl[] = "max-age={$maxAge}";
                $cacheControl[] = "s-maxage={$maxAge}";
                break;
                
            case self::STRATEGY_PRIVATE:
                $cacheControl[] = 'private';
                $cacheControl[] = "max-age={$maxAge}";
                break;
                
            case self::STRATEGY_NO_CACHE:
                $cacheControl[] = 'no-cache';
                $cacheControl[] = 'must-revalidate';
                break;
                
            case self::STRATEGY_NO_STORE:
                $cacheControl[] = 'no-store';
                $cacheControl[] = 'no-cache';
                $cacheControl[] = 'must-revalidate';
                break;
        }
        
        $response->headers->set('Cache-Control', implode(', ', $cacheControl));
        
        // Add ETag
        if ($etag) {
            $response->headers->set('ETag', $etag);
        } elseif ($strategy !== self::STRATEGY_NO_STORE) {
            $response->headers->set('ETag', $this->generateEtag($response->getContent()));
        }
        
        // Add Last-Modified
        if ($lastModified) {
            $response->headers->set('Last-Modified', $lastModified->format(\DateTime::RFC7231));
        }
        
        // Add Expires header for older clients
        if ($strategy === self::STRATEGY_PUBLIC || $strategy === self::STRATEGY_PRIVATE) {
            $response->headers->set('Expires', now()->addSeconds($maxAge)->format(\DateTime::RFC7231));
        }
        
        // Add Vary header for proper cache keying
        $response->headers->set('Vary', 'Accept, Accept-Encoding');
        
        return $response;
    }

    /**
     * Create 304 Not Modified response.
     */
    public function notModifiedResponse(?string $etag = null): SymfonyResponse
    {
        $response = new Response('', 304);
        
        if ($etag) {
            $response->headers->set('ETag', $etag);
        }
        
        return $response;
    }

    /**
     * Get TTL for specific route.
     */
    public function getTtlForRoute(Request $request): int
    {
        foreach ($this->routeTtl as $pattern => $ttl) {
            if ($request->is($pattern)) {
                return $ttl;
            }
        }
        
        return $this->defaultTtl;
    }

    /**
     * Invalidate cache for a key.
     */
    public function invalidate(string $key): bool
    {
        return Cache::forget($key);
    }

    /**
     * Invalidate cache for a URL pattern.
     */
    public function invalidatePattern(string $pattern): int
    {
        // This requires cache tagging or a more sophisticated approach
        // For now, log the invalidation request
        Log::info('Cache invalidation requested for pattern', ['pattern' => $pattern]);
        
        return 0;
    }

    /**
     * Invalidate cache for multiple keys.
     */
    public function invalidateMany(array $keys): int
    {
        $count = 0;
        
        foreach ($keys as $key) {
            if ($this->invalidate($key)) {
                $count++;
            }
        }
        
        return $count;
    }

    /**
     * Set default TTL.
     */
    public function setDefaultTtl(int $seconds): self
    {
        $this->defaultTtl = $seconds;
        return $this;
    }

    /**
     * Get default TTL.
     */
    public function getDefaultTtl(): int
    {
        return $this->defaultTtl;
    }

    /**
     * Add excluded route pattern.
     */
    public function addExcludedRoute(string $pattern): self
    {
        $this->excludedRoutes[] = $pattern;
        return $this;
    }

    /**
     * Set route-specific TTL.
     */
    public function setRouteTtl(string $pattern, int $ttl): self
    {
        $this->routeTtl[$pattern] = $ttl;
        return $this;
    }

    /**
     * Get cache statistics.
     */
    public function getStatistics(): array
    {
        return Cache::get($this->prefix . 'stats', [
            'hits' => 0,
            'misses' => 0,
            'stores' => 0,
            'invalidations' => 0,
        ]);
    }

    /**
     * Record cache hit.
     */
    public function recordHit(): void
    {
        $stats = $this->getStatistics();
        $stats['hits']++;
        $stats['last_hit_at'] = now()->toIso8601String();
        Cache::put($this->prefix . 'stats', $stats, 86400);
    }

    /**
     * Record cache miss.
     */
    public function recordMiss(): void
    {
        $stats = $this->getStatistics();
        $stats['misses']++;
        $stats['last_miss_at'] = now()->toIso8601String();
        Cache::put($this->prefix . 'stats', $stats, 86400);
    }

    /**
     * Record cache store.
     */
    public function recordStore(): void
    {
        $stats = $this->getStatistics();
        $stats['stores']++;
        Cache::put($this->prefix . 'stats', $stats, 86400);
    }

    /**
     * Get hit ratio.
     */
    public function getHitRatio(): float
    {
        $stats = $this->getStatistics();
        $total = $stats['hits'] + $stats['misses'];
        
        if ($total === 0) {
            return 0.0;
        }
        
        return round($stats['hits'] / $total * 100, 2);
    }

    /**
     * Reset statistics.
     */
    public function resetStatistics(): void
    {
        Cache::forget($this->prefix . 'stats');
    }

    /**
     * Determine cache strategy based on response.
     */
    public function determineCacheStrategy(Request $request, SymfonyResponse $response): string
    {
        // Non-successful responses should not be cached
        if ($response->getStatusCode() >= 400) {
            return self::STRATEGY_NO_STORE;
        }

        // POST, PUT, DELETE responses should not be cached
        if (!in_array($request->method(), $this->cacheableMethods)) {
            return self::STRATEGY_NO_STORE;
        }

        // Authenticated requests get private caching
        if ($request->user()) {
            return self::STRATEGY_PRIVATE;
        }

        // Default to public caching
        return self::STRATEGY_PUBLIC;
    }

    /**
     * Check if response is cacheable.
     */
    public function isResponseCacheable(SymfonyResponse $response): bool
    {
        // Only cache successful responses
        if ($response->getStatusCode() >= 400) {
            return false;
        }

        // Check for explicit no-cache directive in response
        $cacheControl = $response->headers->get('Cache-Control', '');
        if (Str::contains($cacheControl, ['no-store', 'no-cache', 'private'])) {
            return false;
        }

        return true;
    }
}
