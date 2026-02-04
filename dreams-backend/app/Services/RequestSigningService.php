<?php

namespace App\Services;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * Service for request signing and verification.
 * 
 * This provides HMAC-SHA256 based request signing for secure API communication.
 * The signature is computed over the request method, path, timestamp, and body.
 * 
 * Usage:
 * Client must include these headers:
 * - X-Signature: HMAC-SHA256 signature of the request
 * - X-Timestamp: Unix timestamp when the request was created
 * - X-API-Key: The API key identifier
 */
class RequestSigningService
{
    /**
     * Maximum age of a request in seconds (prevents replay attacks)
     */
    protected const MAX_REQUEST_AGE = 300; // 5 minutes

    /**
     * Algorithm used for signing
     */
    protected const ALGORITHM = 'sha256';

    /**
     * Generate signature for a request.
     *
     * @param string $method HTTP method
     * @param string $path Request path
     * @param string $timestamp Unix timestamp
     * @param string $body Request body
     * @param string $secret API secret key
     * @return string
     */
    public function generateSignature(
        string $method,
        string $path,
        string $timestamp,
        string $body,
        string $secret
    ): string {
        $payload = $this->buildPayload($method, $path, $timestamp, $body);
        
        return hash_hmac(self::ALGORITHM, $payload, $secret);
    }

    /**
     * Verify a request signature.
     *
     * @param Request $request
     * @param string $secret API secret key
     * @return array{valid: bool, error: string|null}
     */
    public function verifyRequest(Request $request, string $secret): array
    {
        $signature = $request->header('X-Signature');
        $timestamp = $request->header('X-Timestamp');

        // Check required headers
        if (!$signature) {
            return ['valid' => false, 'error' => 'Missing X-Signature header'];
        }

        if (!$timestamp) {
            return ['valid' => false, 'error' => 'Missing X-Timestamp header'];
        }

        // Validate timestamp format
        if (!is_numeric($timestamp)) {
            return ['valid' => false, 'error' => 'Invalid timestamp format'];
        }

        // Check request age (prevent replay attacks)
        $requestAge = abs(time() - (int) $timestamp);
        if ($requestAge > self::MAX_REQUEST_AGE) {
            Log::warning('Request signature expired', [
                'timestamp' => $timestamp,
                'age_seconds' => $requestAge,
                'max_age' => self::MAX_REQUEST_AGE,
            ]);
            return ['valid' => false, 'error' => 'Request timestamp expired'];
        }

        // Build expected signature
        $expectedSignature = $this->generateSignature(
            $request->method(),
            $request->path(),
            $timestamp,
            $request->getContent(),
            $secret
        );

        // Timing-safe comparison
        if (!hash_equals($expectedSignature, $signature)) {
            Log::warning('Request signature mismatch', [
                'path' => $request->path(),
                'method' => $request->method(),
            ]);
            return ['valid' => false, 'error' => 'Invalid signature'];
        }

        return ['valid' => true, 'error' => null];
    }

    /**
     * Build the payload string for signing.
     *
     * @param string $method
     * @param string $path
     * @param string $timestamp
     * @param string $body
     * @return string
     */
    protected function buildPayload(string $method, string $path, string $timestamp, string $body): string
    {
        // Normalize the body - for empty bodies, use empty string
        $normalizedBody = $body ?: '';
        
        // Build canonical request string
        return implode("\n", [
            strtoupper($method),
            '/' . ltrim($path, '/'),
            $timestamp,
            hash(self::ALGORITHM, $normalizedBody),
        ]);
    }

    /**
     * Generate headers for a signed request (useful for testing/client SDKs).
     *
     * @param string $method
     * @param string $path
     * @param string $body
     * @param string $apiKey
     * @param string $secret
     * @return array
     */
    public function generateSignedHeaders(
        string $method,
        string $path,
        string $body,
        string $apiKey,
        string $secret
    ): array {
        $timestamp = (string) time();
        $signature = $this->generateSignature($method, $path, $timestamp, $body, $secret);

        return [
            'X-API-Key' => $apiKey,
            'X-Timestamp' => $timestamp,
            'X-Signature' => $signature,
        ];
    }

    /**
     * Get the maximum request age in seconds.
     *
     * @return int
     */
    public function getMaxRequestAge(): int
    {
        return self::MAX_REQUEST_AGE;
    }
}
