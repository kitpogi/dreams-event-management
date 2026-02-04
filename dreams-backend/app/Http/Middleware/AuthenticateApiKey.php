<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\ApiKey;
use Illuminate\Support\Facades\Cache;

/**
 * Middleware for API key authentication.
 * 
 * Usage in routes:
 * - Route::get('/external/...', ...)->middleware('api.key');
 * - Route::get('/external/...', ...)->middleware('api.key:webhooks.receive');
 * 
 * Expects headers:
 * - X-API-Key: The API key
 * - X-API-Secret: The API secret
 */
class AuthenticateApiKey
{
    /**
     * Handle an incoming request.
     *
     * @param Request $request
     * @param Closure $next
     * @param string|null $requiredPermission
     * @return Response
     */
    public function handle(Request $request, Closure $next, ?string $requiredPermission = null): Response
    {
        $startTime = microtime(true);

        $apiKeyHeader = $request->header('X-API-Key');
        $apiSecretHeader = $request->header('X-API-Secret');

        // Also check Authorization header for Bearer token format: "ApiKey {key}:{secret}"
        if (!$apiKeyHeader && $request->hasHeader('Authorization')) {
            $auth = $request->header('Authorization');
            if (str_starts_with($auth, 'ApiKey ')) {
                $credentials = substr($auth, 7);
                $parts = explode(':', $credentials, 2);
                if (count($parts) === 2) {
                    [$apiKeyHeader, $apiSecretHeader] = $parts;
                }
            }
        }

        if (!$apiKeyHeader || !$apiSecretHeader) {
            return $this->unauthorized('API key and secret are required.');
        }

        // Find API key
        $apiKey = ApiKey::where('key', $apiKeyHeader)
            ->where('is_active', true)
            ->first();

        if (!$apiKey) {
            return $this->unauthorized('Invalid API key.');
        }

        // Validate secret
        if (!$apiKey->validateSecret($apiSecretHeader)) {
            return $this->unauthorized('Invalid API secret.');
        }

        // Check if key is valid (not expired)
        if (!$apiKey->isValid()) {
            return $this->unauthorized('API key has expired or is inactive.');
        }

        // Check IP whitelist
        $clientIp = $request->ip();
        if (!$apiKey->isIpAllowed($clientIp)) {
            return response()->json([
                'success' => false,
                'message' => 'Access from this IP address is not allowed.',
                'error_code' => 'IP_NOT_ALLOWED',
            ], 403);
        }

        // Check rate limit
        if (!$this->checkRateLimit($apiKey, $request)) {
            return response()->json([
                'success' => false,
                'message' => 'Rate limit exceeded. Please try again later.',
                'error_code' => 'RATE_LIMIT_EXCEEDED',
            ], 429);
        }

        // Check permission if required
        if ($requiredPermission && !$apiKey->hasPermission($requiredPermission)) {
            return response()->json([
                'success' => false,
                'message' => 'API key does not have the required permission.',
                'error_code' => 'PERMISSION_DENIED',
                'required_permission' => $requiredPermission,
            ], 403);
        }

        // Store API key in request for later use
        $request->attributes->set('api_key', $apiKey);

        // Update last used timestamp
        $apiKey->recordUsage();

        // Process request
        $response = $next($request);

        // Log the request
        $responseTimeMs = (int) ((microtime(true) - $startTime) * 1000);
        $this->logRequest($apiKey, $request, $response, $responseTimeMs);

        return $response;
    }

    /**
     * Return unauthorized response.
     *
     * @param string $message
     * @return Response
     */
    protected function unauthorized(string $message): Response
    {
        return response()->json([
            'success' => false,
            'message' => $message,
            'error_code' => 'UNAUTHORIZED',
        ], 401);
    }

    /**
     * Check if request is within rate limits.
     *
     * @param ApiKey $apiKey
     * @param Request $request
     * @return bool
     */
    protected function checkRateLimit(ApiKey $apiKey, Request $request): bool
    {
        $limit = $apiKey->getRateLimitPerHour();
        $key = "api_key_rate:{$apiKey->id}";

        $hits = Cache::get($key, 0);

        if ($hits >= $limit) {
            return false;
        }

        Cache::put($key, $hits + 1, now()->addHour());

        return true;
    }

    /**
     * Log the API request.
     *
     * @param ApiKey $apiKey
     * @param Request $request
     * @param Response $response
     * @param int $responseTimeMs
     * @return void
     */
    protected function logRequest(ApiKey $apiKey, Request $request, Response $response, int $responseTimeMs): void
    {
        try {
            $apiKey->logRequest(
                $request->path(),
                $request->method(),
                $request->ip(),
                $response->getStatusCode(),
                $responseTimeMs
            );
        } catch (\Exception $e) {
            // Log error but don't fail the request
            \Log::warning('Failed to log API key usage: ' . $e->getMessage());
        }
    }
}
