<?php

namespace App\Http\Middleware;

use App\Services\VirusScanService;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware to scan uploaded files for viruses/malware.
 *
 * Apply to routes that accept file uploads:
 *
 *     Route::post('/upload', [UploadController::class, 'store'])
 *         ->middleware('scan.virus');
 */
class ScanUploadedFiles
{
    public function __construct(
        protected VirusScanService $scanner
    ) {}

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (!$this->scanner->isEnabled()) {
            return $next($request);
        }

        $files = $this->extractFiles($request);

        foreach ($files as $key => $file) {
            $result = $this->scanFile($file, $key);

            if ($result !== null) {
                return $result;
            }
        }

        return $next($request);
    }

    /**
     * Extract all uploaded files from the request.
     *
     * @return array<string, UploadedFile|UploadedFile[]>
     */
    protected function extractFiles(Request $request): array
    {
        $files = [];

        foreach ($request->allFiles() as $key => $file) {
            if (is_array($file)) {
                foreach ($file as $index => $f) {
                    if ($f instanceof UploadedFile) {
                        $files["{$key}.{$index}"] = $f;
                    }
                }
            } elseif ($file instanceof UploadedFile) {
                $files[$key] = $file;
            }
        }

        return $files;
    }

    /**
     * Scan a single file and return error response if infected.
     */
    protected function scanFile(UploadedFile $file, string $key): ?Response
    {
        // Check file extension
        $extension = strtolower($file->getClientOriginalExtension());
        $allowedExtensions = config('filescan.allowed_extensions', []);

        if (!empty($allowedExtensions) && !in_array($extension, $allowedExtensions, true)) {
            Log::warning('Blocked file upload: extension not allowed', [
                'field' => $key,
                'extension' => $extension,
                'filename' => $file->getClientOriginalName(),
            ]);

            return response()->json([
                'message' => 'The file type is not allowed.',
                'errors' => [
                    $key => ["The file extension '.{$extension}' is not permitted."],
                ],
            ], 422);
        }

        // Check MIME type
        $blockedMimes = config('filescan.blocked_mimes', []);
        $mimeType = $file->getMimeType();

        if (in_array($mimeType, $blockedMimes, true)) {
            Log::warning('Blocked file upload: MIME type not allowed', [
                'field' => $key,
                'mime' => $mimeType,
                'filename' => $file->getClientOriginalName(),
            ]);

            return response()->json([
                'message' => 'The file type is not allowed.',
                'errors' => [
                    $key => ['This file type is not permitted for security reasons.'],
                ],
            ], 422);
        }

        // Perform virus scan
        $result = $this->scanner->scan($file);

        if ($result['status'] === VirusScanService::RESULT_INFECTED) {
            Log::error('Blocked infected file upload', [
                'field' => $key,
                'filename' => $file->getClientOriginalName(),
                'threat' => $result['threat'] ?? 'unknown',
                'scanner' => $result['scanner'],
            ]);

            return response()->json([
                'message' => 'The file contains a security threat and cannot be uploaded.',
                'errors' => [
                    $key => ['This file has been identified as potentially harmful and cannot be accepted.'],
                ],
            ], 422);
        }

        if ($result['status'] === VirusScanService::RESULT_ERROR) {
            $failOnError = config('filescan.fail_on_error', false);

            if ($failOnError) {
                Log::error('File upload rejected due to scan error', [
                    'field' => $key,
                    'filename' => $file->getClientOriginalName(),
                    'error' => $result['message'],
                ]);

                return response()->json([
                    'message' => 'The file could not be verified for security.',
                    'errors' => [
                        $key => ['Unable to verify file security. Please try again later.'],
                    ],
                ], 422);
            }

            Log::warning('File scan error, allowing upload', [
                'field' => $key,
                'filename' => $file->getClientOriginalName(),
                'error' => $result['message'],
            ]);
        }

        // Log successful scans if configured
        if (config('filescan.logging.log_all', false)) {
            Log::info('File scan completed', [
                'field' => $key,
                'filename' => $file->getClientOriginalName(),
                'status' => $result['status'],
                'scanner' => $result['scanner'],
            ]);
        }

        return null;
    }
}
