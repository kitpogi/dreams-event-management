<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware to handle API versioning.
 * 
 * Supports versioning via:
 * 1. URL path prefix: /api/v1/resource, /api/v2/resource
 * 2. Header: Accept: application/vnd.api+json; version=1
 * 3. Query parameter: ?api_version=1
 * 
 * The version is determined in order of precedence:
 * 1. URL path (highest priority)
 * 2. Accept header
 * 3. Query parameter
 * 4. Default version (fallback)
 */
class ApiVersion
{
    /**
     * Current default API version.
     */
    public const DEFAULT_VERSION = '1';

    /**
     * Supported API versions.
     */
    public const SUPPORTED_VERSIONS = ['1', '2'];

    /**
     * Deprecated versions (still supported but show warning).
     */
    public const DEPRECATED_VERSIONS = [];

    /**
     * Sunset versions (will be removed soon).
     */
    public const SUNSET_VERSIONS = [];

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next, ?string $requiredVersion = null): Response
    {
        $version = $this->resolveVersion($request);

        // Validate version
        if (!in_array($version, self::SUPPORTED_VERSIONS)) {
            return response()->json([
                'success' => false,
                'message' => "API version '{$version}' is not supported",
                'error_code' => 'UNSUPPORTED_API_VERSION',
                'supported_versions' => self::SUPPORTED_VERSIONS,
            ], 400);
        }

        // Check if specific version is required for this route
        if ($requiredVersion !== null && $version !== $requiredVersion) {
            return response()->json([
                'success' => false,
                'message' => "This endpoint requires API version {$requiredVersion}",
                'error_code' => 'VERSION_MISMATCH',
            ], 400);
        }

        // Store version in request for use in controllers
        $request->attributes->set('api_version', $version);

        /** @var Response $response */
        $response = $next($request);

        // Add version headers to response
        $response->headers->set('X-API-Version', $version);
        $response->headers->set('X-API-Supported-Versions', implode(', ', self::SUPPORTED_VERSIONS));

        // Add deprecation warning header
        if (in_array($version, self::DEPRECATED_VERSIONS)) {
            $response->headers->set('X-API-Deprecated', 'true');
            $response->headers->set('Warning', '299 - "API version ' . $version . ' is deprecated"');
        }

        // Add sunset header for versions being removed
        if (in_array($version, self::SUNSET_VERSIONS)) {
            $sunsetDate = $this->getSunsetDate($version);
            if ($sunsetDate) {
                $response->headers->set('Sunset', $sunsetDate);
            }
        }

        return $response;
    }

    /**
     * Resolve the API version from the request.
     */
    protected function resolveVersion(Request $request): string
    {
        // 1. Check URL path first (e.g., /api/v1/...)
        $pathVersion = $this->getVersionFromPath($request);
        if ($pathVersion) {
            return $pathVersion;
        }

        // 2. Check Accept header
        $headerVersion = $this->getVersionFromHeader($request);
        if ($headerVersion) {
            return $headerVersion;
        }

        // 3. Check query parameter
        $queryVersion = $request->query('api_version');
        if ($queryVersion) {
            return (string) $queryVersion;
        }

        // 4. Return default version
        return self::DEFAULT_VERSION;
    }

    /**
     * Extract version from URL path.
     * Matches patterns like /api/v1/, /api/v2/, etc.
     */
    protected function getVersionFromPath(Request $request): ?string
    {
        $path = $request->path();

        if (preg_match('/^api\/v(\d+)\/?/', $path, $matches)) {
            return $matches[1];
        }

        return null;
    }

    /**
     * Extract version from Accept header.
     * Matches patterns like: application/vnd.api+json; version=1
     */
    protected function getVersionFromHeader(Request $request): ?string
    {
        $accept = $request->header('Accept', '');

        // Match version parameter in Accept header
        if (preg_match('/version[=:]?\s*(\d+)/i', $accept, $matches)) {
            return $matches[1];
        }

        // Match vnd.api.v1+json format
        if (preg_match('/vnd\.[\w-]+\.v(\d+)\+json/i', $accept, $matches)) {
            return $matches[1];
        }

        return null;
    }

    /**
     * Get the sunset date for a version.
     */
    protected function getSunsetDate(string $version): ?string
    {
        $sunsetDates = [
            // Add sunset dates for deprecated versions
            // 'v1' => 'Wed, 01 Jan 2025 00:00:00 GMT',
        ];

        return $sunsetDates[$version] ?? null;
    }
}
