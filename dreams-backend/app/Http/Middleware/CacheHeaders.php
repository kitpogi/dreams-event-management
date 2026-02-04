<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware for HTTP caching with ETag and Last-Modified headers.
 * 
 * This middleware adds caching headers to responses and handles
 * conditional requests (If-None-Match, If-Modified-Since).
 * 
 * Usage in routes:
 * - Route::get('/packages', ...)->middleware('cache.headers');
 * - Route::get('/packages/{id}', ...)->middleware('cache.headers:3600'); // 1 hour max-age
 */
class CacheHeaders
{
    /**
     * Handle an incoming request.
     *
     * @param Request $request
     * @param Closure $next
     * @param int $maxAge Max age in seconds (default: 300 = 5 minutes)
     * @return Response
     */
    public function handle(Request $request, Closure $next, int $maxAge = 300): Response
    {
        // Only apply to GET and HEAD requests
        if (!in_array($request->method(), ['GET', 'HEAD'])) {
            return $next($request);
        }

        // Process the request
        $response = $next($request);

        // Only apply to successful JSON responses
        if (!$response instanceof JsonResponse || !$response->isSuccessful()) {
            return $response;
        }

        // Generate ETag from response content
        $etag = $this->generateETag($response);
        
        // Get Last-Modified from response data or use current time
        $lastModified = $this->getLastModified($response);

        // Check If-None-Match (ETag validation)
        if ($this->etagMatches($request, $etag)) {
            return $this->notModifiedResponse($etag, $lastModified, $maxAge);
        }

        // Check If-Modified-Since
        if ($this->notModifiedSince($request, $lastModified)) {
            return $this->notModifiedResponse($etag, $lastModified, $maxAge);
        }

        // Add caching headers to response
        return $this->addCacheHeaders($response, $etag, $lastModified, $maxAge);
    }

    /**
     * Generate ETag from response content.
     *
     * @param JsonResponse $response
     * @return string
     */
    protected function generateETag(JsonResponse $response): string
    {
        $content = $response->getContent();
        return '"' . md5($content) . '"';
    }

    /**
     * Get Last-Modified timestamp from response data.
     *
     * @param JsonResponse $response
     * @return \DateTimeInterface
     */
    protected function getLastModified(JsonResponse $response): \DateTimeInterface
    {
        $data = json_decode($response->getContent(), true);

        // Try to find updated_at in the response data
        $timestamp = $this->findLatestTimestamp($data);

        if ($timestamp) {
            return new \DateTime($timestamp);
        }

        return new \DateTime();
    }

    /**
     * Recursively find the latest updated_at timestamp in data.
     *
     * @param mixed $data
     * @return string|null
     */
    protected function findLatestTimestamp($data): ?string
    {
        if (!is_array($data)) {
            return null;
        }

        $latest = null;

        // Check for updated_at at this level
        if (isset($data['updated_at'])) {
            $latest = $data['updated_at'];
        }

        // Check in 'data' key (common API response format)
        if (isset($data['data'])) {
            $dataValue = is_array($data['data']) ? $data['data'] : [];
            
            // Single resource
            if (isset($dataValue['updated_at'])) {
                $timestamp = $dataValue['updated_at'];
                if (!$latest || $timestamp > $latest) {
                    $latest = $timestamp;
                }
            }

            // Collection of resources
            foreach ($dataValue as $item) {
                if (is_array($item) && isset($item['updated_at'])) {
                    $timestamp = $item['updated_at'];
                    if (!$latest || $timestamp > $latest) {
                        $latest = $timestamp;
                    }
                }
            }
        }

        return $latest;
    }

    /**
     * Check if the request ETag matches.
     *
     * @param Request $request
     * @param string $etag
     * @return bool
     */
    protected function etagMatches(Request $request, string $etag): bool
    {
        $ifNoneMatch = $request->header('If-None-Match');

        if (!$ifNoneMatch) {
            return false;
        }

        // Handle multiple ETags
        $clientEtags = array_map('trim', explode(',', $ifNoneMatch));

        return in_array($etag, $clientEtags) || in_array('*', $clientEtags);
    }

    /**
     * Check if the resource was not modified since the given date.
     *
     * @param Request $request
     * @param \DateTimeInterface $lastModified
     * @return bool
     */
    protected function notModifiedSince(Request $request, \DateTimeInterface $lastModified): bool
    {
        $ifModifiedSince = $request->header('If-Modified-Since');

        if (!$ifModifiedSince) {
            return false;
        }

        try {
            $sinceDate = new \DateTime($ifModifiedSince);
            return $lastModified <= $sinceDate;
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Return a 304 Not Modified response.
     *
     * @param string $etag
     * @param \DateTimeInterface $lastModified
     * @param int $maxAge
     * @return Response
     */
    protected function notModifiedResponse(string $etag, \DateTimeInterface $lastModified, int $maxAge): Response
    {
        return response()->noContent(304)
            ->header('ETag', $etag)
            ->header('Last-Modified', $lastModified->format(\DateTime::RFC7231))
            ->header('Cache-Control', "public, max-age={$maxAge}");
    }

    /**
     * Add caching headers to the response.
     *
     * @param JsonResponse $response
     * @param string $etag
     * @param \DateTimeInterface $lastModified
     * @param int $maxAge
     * @return JsonResponse
     */
    protected function addCacheHeaders(
        JsonResponse $response, 
        string $etag, 
        \DateTimeInterface $lastModified,
        int $maxAge
    ): JsonResponse {
        return $response
            ->header('ETag', $etag)
            ->header('Last-Modified', $lastModified->format(\DateTime::RFC7231))
            ->header('Cache-Control', "public, max-age={$maxAge}")
            ->header('Vary', 'Accept, Accept-Encoding, Authorization');
    }
}
