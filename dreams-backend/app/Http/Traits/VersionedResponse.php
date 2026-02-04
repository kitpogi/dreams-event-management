<?php

namespace App\Http\Traits;

use Illuminate\Http\Request;

/**
 * Trait for version-aware API responses.
 * 
 * Provides helper methods for controllers to handle different API versions
 * and return appropriately formatted responses based on the requested version.
 */
trait VersionedResponse
{
    /**
     * Get the current API version from the request.
     */
    protected function getApiVersion(Request $request): string
    {
        return $request->attributes->get('api_version', '1');
    }

    /**
     * Check if the request is for a specific API version.
     */
    protected function isApiVersion(Request $request, string $version): bool
    {
        return $this->getApiVersion($request) === $version;
    }

    /**
     * Check if the request is for API version 1.
     */
    protected function isV1(Request $request): bool
    {
        return $this->isApiVersion($request, '1');
    }

    /**
     * Check if the request is for API version 2.
     */
    protected function isV2(Request $request): bool
    {
        return $this->isApiVersion($request, '2');
    }

    /**
     * Return a version-specific response.
     * Automatically selects the appropriate formatter based on API version.
     *
     * @param Request $request
     * @param mixed $data
     * @param array<string, callable> $formatters Version-specific formatters ['1' => fn($data) => ..., '2' => fn($data) => ...]
     * @param int $status HTTP status code
     * @return \Illuminate\Http\JsonResponse
     */
    protected function versionedResponse(Request $request, mixed $data, array $formatters, int $status = 200)
    {
        $version = $this->getApiVersion($request);

        if (isset($formatters[$version])) {
            $formattedData = $formatters[$version]($data);
        } elseif (isset($formatters['default'])) {
            $formattedData = $formatters['default']($data);
        } else {
            // Fallback to first formatter or raw data
            $formattedData = !empty($formatters)
                ? reset($formatters)($data)
                : $data;
        }

        return response()->json($formattedData, $status);
    }

    /**
     * Transform data based on API version.
     *
     * @param Request $request
     * @param mixed $data
     * @param array<string, callable> $transformers
     * @return mixed
     */
    protected function transformForVersion(Request $request, mixed $data, array $transformers): mixed
    {
        $version = $this->getApiVersion($request);

        if (isset($transformers[$version])) {
            return $transformers[$version]($data);
        }

        if (isset($transformers['default'])) {
            return $transformers['default']($data);
        }

        return $data;
    }

    /**
     * Get version-specific configuration value.
     *
     * @param Request $request
     * @param array<string, mixed> $versionConfigs
     * @param mixed $default
     * @return mixed
     */
    protected function getVersionConfig(Request $request, array $versionConfigs, mixed $default = null): mixed
    {
        $version = $this->getApiVersion($request);

        return $versionConfigs[$version] ?? $versionConfigs['default'] ?? $default;
    }

    /**
     * Standard success response with version info.
     *
     * @param Request $request
     * @param mixed $data
     * @param string $message
     * @param int $status
     * @return \Illuminate\Http\JsonResponse
     */
    protected function successResponse(Request $request, mixed $data = null, string $message = 'Success', int $status = 200)
    {
        $response = [
            'success' => true,
            'message' => $message,
        ];

        if ($data !== null) {
            $response['data'] = $data;
        }

        // V2 includes API version in response body
        if ($this->isV2($request)) {
            $response['api_version'] = $this->getApiVersion($request);
        }

        return response()->json($response, $status);
    }

    /**
     * Standard error response with version info.
     *
     * @param Request $request
     * @param string $message
     * @param string $errorCode
     * @param int $status
     * @param array<string, mixed>|null $errors
     * @return \Illuminate\Http\JsonResponse
     */
    protected function errorResponse(
        Request $request,
        string $message,
        string $errorCode,
        int $status = 400,
        ?array $errors = null
    ) {
        $response = [
            'success' => false,
            'message' => $message,
            'error_code' => $errorCode,
        ];

        if ($errors !== null) {
            $response['errors'] = $errors;
        }

        // V2 includes API version in response body
        if ($this->isV2($request)) {
            $response['api_version'] = $this->getApiVersion($request);
        }

        return response()->json($response, $status);
    }
}
