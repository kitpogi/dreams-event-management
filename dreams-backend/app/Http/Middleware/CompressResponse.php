<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

/**
 * Middleware to compress API responses using gzip/deflate.
 * 
 * Automatically compresses responses when:
 * - Client supports compression (Accept-Encoding header)
 * - Response is compressible (JSON, text, HTML)
 * - Response size exceeds minimum threshold
 */
class CompressResponse
{
    /**
     * Minimum response size in bytes to compress.
     * Small responses don't benefit from compression.
     */
    protected const MIN_COMPRESS_SIZE = 1024;

    /**
     * Maximum response size in bytes to compress.
     * Very large responses should use streaming.
     */
    protected const MAX_COMPRESS_SIZE = 10485760; // 10MB

    /**
     * Compression level (1-9, higher = better compression but slower).
     */
    protected const COMPRESSION_LEVEL = 6;

    /**
     * Content types that should be compressed.
     */
    protected array $compressibleTypes = [
        'application/json',
        'application/javascript',
        'application/xml',
        'text/css',
        'text/html',
        'text/javascript',
        'text/plain',
        'text/xml',
    ];

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): SymfonyResponse
    {
        /** @var SymfonyResponse $response */
        $response = $next($request);

        // Skip if compression is not supported or not applicable
        if (!$this->shouldCompress($request, $response)) {
            return $response;
        }

        return $this->compressResponse($request, $response);
    }

    /**
     * Determine if the response should be compressed.
     */
    protected function shouldCompress(Request $request, SymfonyResponse $response): bool
    {
        // Check if compression extensions are available
        if (!function_exists('gzencode') && !function_exists('gzdeflate')) {
            return false;
        }

        // Check if client accepts compression
        if (!$request->header('Accept-Encoding')) {
            return false;
        }

        // Skip if response is already encoded
        if ($response->headers->has('Content-Encoding')) {
            return false;
        }

        // Skip for streaming responses
        if ($response instanceof \Symfony\Component\HttpFoundation\StreamedResponse) {
            return false;
        }

        // Check content type
        $contentType = $response->headers->get('Content-Type', '');
        if (!$this->isCompressibleContentType($contentType)) {
            return false;
        }

        // Check content size
        $content = $response->getContent();
        $size = strlen((string) $content);

        if ($size < self::MIN_COMPRESS_SIZE || $size > self::MAX_COMPRESS_SIZE) {
            return false;
        }

        return true;
    }

    /**
     * Check if the content type is compressible.
     */
    protected function isCompressibleContentType(string $contentType): bool
    {
        foreach ($this->compressibleTypes as $type) {
            if (str_starts_with($contentType, $type)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Compress the response content.
     */
    protected function compressResponse(Request $request, SymfonyResponse $response): SymfonyResponse
    {
        $acceptEncoding = $request->header('Accept-Encoding', '');
        $content = (string) $response->getContent();
        $originalSize = strlen($content);

        // Try gzip first, then deflate
        if (str_contains($acceptEncoding, 'gzip') && function_exists('gzencode')) {
            $compressed = gzencode($content, self::COMPRESSION_LEVEL);
            if ($compressed !== false) {
                return $this->setCompressedContent($response, $compressed, 'gzip', $originalSize);
            }
        }

        if (str_contains($acceptEncoding, 'deflate') && function_exists('gzdeflate')) {
            $compressed = gzdeflate($content, self::COMPRESSION_LEVEL);
            if ($compressed !== false) {
                return $this->setCompressedContent($response, $compressed, 'deflate', $originalSize);
            }
        }

        return $response;
    }

    /**
     * Set compressed content on the response.
     */
    protected function setCompressedContent(
        SymfonyResponse $response,
        string $compressed,
        string $encoding,
        int $originalSize
    ): SymfonyResponse {
        $compressedSize = strlen($compressed);

        // Only use compression if it actually reduces size
        if ($compressedSize >= $originalSize) {
            return $response;
        }

        $response->setContent($compressed);
        $response->headers->set('Content-Encoding', $encoding);
        $response->headers->set('Content-Length', (string) $compressedSize);
        $response->headers->set('Vary', 'Accept-Encoding');

        // Add compression ratio header for debugging
        if (config('app.debug')) {
            $ratio = round((1 - $compressedSize / $originalSize) * 100, 1);
            $response->headers->set('X-Compression-Ratio', "{$ratio}%");
            $response->headers->set('X-Original-Size', (string) $originalSize);
        }

        return $response;
    }
}
