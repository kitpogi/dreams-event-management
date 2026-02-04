<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\ApiKey;
use App\Services\RequestSigningService;

/**
 * Middleware for verifying signed API requests.
 * 
 * This middleware ensures that requests are properly signed using HMAC-SHA256.
 * It prevents tampering and replay attacks by validating signatures and timestamps.
 * 
 * Usage in routes:
 * - Route::post('/webhooks/...', ...)->middleware('signed.request');
 * - Route::middleware(['api.key', 'signed.request'])->group(...);
 * 
 * Required headers:
 * - X-API-Key: The API key identifier
 * - X-Timestamp: Unix timestamp when the request was signed
 * - X-Signature: HMAC-SHA256 signature of the request
 */
class VerifySignedRequest
{
    protected RequestSigningService $signingService;

    public function __construct(RequestSigningService $signingService)
    {
        $this->signingService = $signingService;
    }

    /**
     * Handle an incoming request.
     *
     * @param Request $request
     * @param Closure $next
     * @return Response
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Get API key from request
        $apiKeyHeader = $request->header('X-API-Key');
        
        if (!$apiKeyHeader) {
            return $this->errorResponse('Missing X-API-Key header', 'MISSING_API_KEY', 401);
        }

        // Look up the API key
        $apiKey = ApiKey::where('key', $apiKeyHeader)
            ->where('is_active', true)
            ->first();

        if (!$apiKey) {
            return $this->errorResponse('Invalid API key', 'INVALID_API_KEY', 401);
        }

        // Check if signing is required for this key
        if (!$apiKey->requires_signature) {
            // Signing not required, proceed without verification
            return $next($request);
        }

        // Verify the signature
        $result = $this->signingService->verifyRequest($request, $apiKey->secret);

        if (!$result['valid']) {
            return $this->errorResponse(
                $result['error'] ?? 'Signature verification failed',
                'SIGNATURE_INVALID',
                401
            );
        }

        // Add verified flag to request for downstream use
        $request->attributes->set('signature_verified', true);
        $request->attributes->set('api_key', $apiKey);

        return $next($request);
    }

    /**
     * Generate an error response.
     *
     * @param string $message
     * @param string $errorCode
     * @param int $statusCode
     * @return Response
     */
    protected function errorResponse(string $message, string $errorCode, int $statusCode): Response
    {
        return response()->json([
            'success' => false,
            'message' => $message,
            'error_code' => $errorCode,
        ], $statusCode);
    }
}
