<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware for CSRF protection on state-changing API operations.
 * 
 * This middleware provides CSRF protection for SPA frontends making API calls.
 * It uses a double-submit cookie pattern where:
 * 1. Server sets a CSRF token in a cookie (XSRF-TOKEN)
 * 2. Client reads the cookie and sends it in X-XSRF-TOKEN header
 * 3. Server validates that header matches the cookie
 * 
 * Usage in routes:
 * - Route::post('/...', ...)->middleware('csrf.api');
 * - Route::middleware(['csrf.api'])->group(...);
 * 
 * Safe methods (GET, HEAD, OPTIONS) are automatically excluded.
 */
class VerifyCsrfToken
{
    /**
     * HTTP methods that should be excluded from CSRF verification.
     */
    protected array $safeMethods = ['GET', 'HEAD', 'OPTIONS'];

    /**
     * URIs that should be excluded from CSRF verification.
     */
    protected array $except = [
        'api/webhooks/*',
        'api/external/*',
        'api/health',
        'api/health/*',
    ];

    /**
     * Handle an incoming request.
     *
     * @param Request $request
     * @param Closure $next
     * @return Response
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Skip safe methods
        if ($this->isReading($request)) {
            return $this->addCookieToResponse($request, $next($request));
        }

        // Skip excluded URIs
        if ($this->inExceptArray($request)) {
            return $next($request);
        }

        // Skip if using API key authentication (external services)
        if ($request->hasHeader('X-API-Key')) {
            return $next($request);
        }

        // Verify CSRF token
        if (!$this->tokensMatch($request)) {
            return response()->json([
                'success' => false,
                'message' => 'CSRF token mismatch',
                'error_code' => 'CSRF_MISMATCH',
            ], 419);
        }

        return $this->addCookieToResponse($request, $next($request));
    }

    /**
     * Determine if the HTTP request uses a 'read' verb.
     *
     * @param Request $request
     * @return bool
     */
    protected function isReading(Request $request): bool
    {
        return in_array($request->method(), $this->safeMethods);
    }

    /**
     * Determine if the request has a URI that should be excluded.
     *
     * @param Request $request
     * @return bool
     */
    protected function inExceptArray(Request $request): bool
    {
        foreach ($this->except as $except) {
            if ($request->is($except)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Determine if the session and input CSRF tokens match.
     *
     * @param Request $request
     * @return bool
     */
    protected function tokensMatch(Request $request): bool
    {
        $token = $this->getTokenFromRequest($request);
        $cookieToken = $request->cookie('XSRF-TOKEN');

        if (!$token || !$cookieToken) {
            return false;
        }

        // URL decode the cookie (it's encoded when set)
        $decodedCookieToken = urldecode($cookieToken);

        return hash_equals($decodedCookieToken, $token);
    }

    /**
     * Get the CSRF token from the request.
     *
     * @param Request $request
     * @return string|null
     */
    protected function getTokenFromRequest(Request $request): ?string
    {
        // Check header first (preferred for SPAs)
        $token = $request->header('X-XSRF-TOKEN');

        // Fall back to request parameter
        if (!$token) {
            $token = $request->input('_token');
        }

        return $token;
    }

    /**
     * Add the CSRF token cookie to the response.
     *
     * @param Request $request
     * @param Response $response
     * @return Response
     */
    protected function addCookieToResponse(Request $request, Response $response): Response
    {
        $token = $this->getOrCreateToken($request);

        $response->headers->setCookie(
            cookie(
                'XSRF-TOKEN',
                $token,
                config('session.lifetime', 120), // minutes
                '/',
                config('session.domain'),
                config('session.secure', false),
                false, // httpOnly must be false for JS access
                false,
                config('session.same_site', 'lax')
            )
        );

        return $response;
    }

    /**
     * Get or create a CSRF token for the request.
     *
     * @param Request $request
     * @return string
     */
    protected function getOrCreateToken(Request $request): string
    {
        // Check if user is authenticated
        $user = $request->user();
        
        if ($user) {
            // Use user-specific token with cache
            $cacheKey = "csrf_token:{$user->id}";
            
            return Cache::remember($cacheKey, 7200, function () { // 2 hours
                return Str::random(40);
            });
        }

        // For non-authenticated requests, check existing cookie
        $existingToken = $request->cookie('XSRF-TOKEN');
        
        if ($existingToken) {
            return urldecode($existingToken);
        }

        // Generate new token
        return Str::random(40);
    }
}
