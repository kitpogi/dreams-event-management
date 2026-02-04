<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Validator;

/**
 * Middleware for validating common request parameters.
 * 
 * Validates:
 * - Content-Type header for POST/PUT/PATCH requests
 * - Accept header
 * - Request size limits
 * - JSON syntax for JSON requests
 */
class ValidateRequest
{
    /**
     * Maximum request body size in bytes (default 10MB).
     */
    protected int $maxBodySize;

    /**
     * Allowed content types for requests with body.
     */
    protected array $allowedContentTypes = [
        'application/json',
        'multipart/form-data',
        'application/x-www-form-urlencoded',
    ];

    public function __construct()
    {
        $this->maxBodySize = config('app.max_request_size', 10 * 1024 * 1024);
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
        // Check request body size
        $contentLength = $request->header('Content-Length', 0);
        if ($contentLength > $this->maxBodySize) {
            return response()->json([
                'success' => false,
                'message' => 'Request body too large.',
                'error_code' => 'PAYLOAD_TOO_LARGE',
                'max_size_bytes' => $this->maxBodySize,
            ], 413);
        }

        // Validate Content-Type for requests with body
        if ($this->requestHasBody($request)) {
            $contentType = $request->header('Content-Type', '');
            
            if (!$this->isValidContentType($contentType)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unsupported Content-Type.',
                    'error_code' => 'UNSUPPORTED_MEDIA_TYPE',
                    'allowed_types' => $this->allowedContentTypes,
                ], 415);
            }

            // Validate JSON syntax for JSON requests
            if ($this->isJsonRequest($request)) {
                $content = $request->getContent();
                if (!empty($content) && json_decode($content) === null && json_last_error() !== JSON_ERROR_NONE) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Invalid JSON syntax in request body.',
                        'error_code' => 'INVALID_JSON',
                        'json_error' => json_last_error_msg(),
                    ], 400);
                }
            }
        }

        // Validate Accept header (optional, just log warning if missing)
        $accept = $request->header('Accept', '*/*');
        if ($accept !== '*/*' && !str_contains($accept, 'application/json') && !str_contains($accept, '*/*')) {
            // We only serve JSON, but we'll still process the request
            // Just add a header warning
            $response = $next($request);
            $response->headers->set('X-Content-Type-Warning', 'This API only returns JSON responses');
            return $response;
        }

        return $next($request);
    }

    /**
     * Check if request method typically has a body.
     *
     * @param Request $request
     * @return bool
     */
    protected function requestHasBody(Request $request): bool
    {
        return in_array($request->method(), ['POST', 'PUT', 'PATCH']);
    }

    /**
     * Check if the content type is valid.
     *
     * @param string $contentType
     * @return bool
     */
    protected function isValidContentType(string $contentType): bool
    {
        // Empty content type is OK for GET/DELETE
        if (empty($contentType)) {
            return true;
        }

        foreach ($this->allowedContentTypes as $allowed) {
            if (str_contains($contentType, $allowed)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Check if this is a JSON request.
     *
     * @param Request $request
     * @return bool
     */
    protected function isJsonRequest(Request $request): bool
    {
        $contentType = $request->header('Content-Type', '');
        return str_contains($contentType, 'application/json');
    }
}
