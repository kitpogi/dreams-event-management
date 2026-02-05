<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;

/**
 * VirusScanService provides file scanning functionality for uploaded files.
 *
 * Supports multiple scanning backends:
 * - ClamAV (local daemon via socket or TCP)
 * - VirusTotal API
 * - Mock scanner for testing/development
 *
 * Configuration via config/filescan.php or .env variables.
 */
class VirusScanService
{
    /**
     * Scan result constants.
     */
    public const RESULT_CLEAN = 'clean';
    public const RESULT_INFECTED = 'infected';
    public const RESULT_ERROR = 'error';
    public const RESULT_SKIPPED = 'skipped';

    /**
     * Maximum file size to scan (default 25MB).
     */
    protected int $maxFileSize;

    /**
     * Scanner driver to use.
     */
    protected string $driver;

    /**
     * Whether scanning is enabled.
     */
    protected bool $enabled;

    public function __construct()
    {
        $this->driver = config('filescan.driver', 'mock');
        $this->enabled = config('filescan.enabled', false);
        $this->maxFileSize = config('filescan.max_file_size', 25 * 1024 * 1024);
    }

    /**
     * Scan a file for viruses/malware.
     *
     * @return array{status: string, message: string, threat?: string, scanner: string}
     */
    public function scan(UploadedFile|string $file): array
    {
        if (!$this->enabled) {
            return $this->result(self::RESULT_SKIPPED, 'Virus scanning is disabled', null, 'none');
        }

        $path = $file instanceof UploadedFile ? $file->getRealPath() : $file;
        $originalFilename = $file instanceof UploadedFile ? $file->getClientOriginalName() : null;

        if (!file_exists($path)) {
            return $this->result(self::RESULT_ERROR, 'File not found', null, $this->driver);
        }

        $fileSize = filesize($path);
        if ($fileSize > $this->maxFileSize) {
            return $this->result(self::RESULT_SKIPPED, 'File exceeds maximum scan size', null, $this->driver);
        }

        try {
            return match ($this->driver) {
                'clamav' => $this->scanWithClamAV($path),
                'virustotal' => $this->scanWithVirusTotal($path),
                'mock' => $this->scanWithMock($path, $originalFilename),
                default => $this->result(self::RESULT_ERROR, 'Unknown scanner driver', null, $this->driver),
            };
        } catch (\Exception $e) {
            Log::error('Virus scan failed', [
                'driver' => $this->driver,
                'error' => $e->getMessage(),
                'file' => $path,
            ]);

            return $this->result(self::RESULT_ERROR, 'Scan failed: ' . $e->getMessage(), null, $this->driver);
        }
    }

    /**
     * Scan file using ClamAV daemon.
     */
    protected function scanWithClamAV(string $path): array
    {
        $socket = config('filescan.clamav.socket', '/var/run/clamav/clamd.ctl');
        $host = config('filescan.clamav.host', '127.0.0.1');
        $port = config('filescan.clamav.port', 3310);
        $useSocket = config('filescan.clamav.use_socket', false);

        if ($useSocket) {
            $connection = @socket_create(AF_UNIX, SOCK_STREAM, 0);
            if (!$connection || !@socket_connect($connection, $socket)) {
                return $this->result(self::RESULT_ERROR, 'Cannot connect to ClamAV socket', null, 'clamav');
            }
        } else {
            $connection = @fsockopen($host, $port, $errno, $errstr, 5);
            if (!$connection) {
                return $this->result(self::RESULT_ERROR, "Cannot connect to ClamAV: {$errstr}", null, 'clamav');
            }
        }

        // Send INSTREAM command for streaming file content
        $command = "nINSTREAM\n";

        if ($useSocket) {
            socket_write($connection, $command, strlen($command));
        } else {
            fwrite($connection, $command);
        }

        // Stream file content in chunks
        $handle = fopen($path, 'rb');
        if (!$handle) {
            return $this->result(self::RESULT_ERROR, 'Cannot read file', null, 'clamav');
        }

        while (!feof($handle)) {
            $chunk = fread($handle, 8192);
            $chunkLen = pack('N', strlen($chunk));

            if ($useSocket) {
                socket_write($connection, $chunkLen . $chunk, strlen($chunkLen) + strlen($chunk));
            } else {
                fwrite($connection, $chunkLen . $chunk);
            }
        }
        fclose($handle);

        // Send zero-length chunk to indicate end of stream
        $endChunk = pack('N', 0);
        if ($useSocket) {
            socket_write($connection, $endChunk, 4);
            $response = socket_read($connection, 4096);
            socket_close($connection);
        } else {
            fwrite($connection, $endChunk);
            $response = fgets($connection, 4096);
            fclose($connection);
        }

        // Parse response
        $response = trim($response);

        if (str_contains($response, 'OK')) {
            return $this->result(self::RESULT_CLEAN, 'No threats detected', null, 'clamav');
        }

        if (str_contains($response, 'FOUND')) {
            // Extract threat name: "stream: ThreatName FOUND"
            preg_match('/stream:\s*(.+)\s*FOUND/', $response, $matches);
            $threat = $matches[1] ?? 'Unknown threat';

            Log::warning('Virus detected in uploaded file', [
                'threat' => $threat,
                'response' => $response,
            ]);

            return $this->result(self::RESULT_INFECTED, 'Threat detected', trim($threat), 'clamav');
        }

        return $this->result(self::RESULT_ERROR, "Unexpected response: {$response}", null, 'clamav');
    }

    /**
     * Scan file using VirusTotal API.
     */
    protected function scanWithVirusTotal(string $path): array
    {
        $apiKey = config('filescan.virustotal.api_key');

        if (empty($apiKey)) {
            return $this->result(self::RESULT_ERROR, 'VirusTotal API key not configured', null, 'virustotal');
        }

        // First, get file hash to check if already scanned
        $hash = hash_file('sha256', $path);

        // Check existing report
        $response = Http::withHeaders([
            'x-apikey' => $apiKey,
        ])->get("https://www.virustotal.com/api/v3/files/{$hash}");

        if ($response->successful()) {
            $data = $response->json();
            $stats = $data['data']['attributes']['last_analysis_stats'] ?? [];

            $malicious = $stats['malicious'] ?? 0;
            $suspicious = $stats['suspicious'] ?? 0;

            if ($malicious > 0 || $suspicious > 0) {
                return $this->result(
                    self::RESULT_INFECTED,
                    "Detected by {$malicious} engines",
                    "malicious: {$malicious}, suspicious: {$suspicious}",
                    'virustotal'
                );
            }

            return $this->result(self::RESULT_CLEAN, 'No threats detected', null, 'virustotal');
        }

        // File not in VirusTotal database, upload for scanning
        if ($response->status() === 404) {
            $uploadResponse = Http::withHeaders([
                'x-apikey' => $apiKey,
            ])->attach(
                'file',
                file_get_contents($path),
                basename($path)
            )->post('https://www.virustotal.com/api/v3/files');

            if ($uploadResponse->successful()) {
                // File uploaded for analysis - in production, you'd want to poll for results
                return $this->result(
                    self::RESULT_CLEAN,
                    'File submitted for analysis, assumed clean',
                    null,
                    'virustotal'
                );
            }

            return $this->result(
                self::RESULT_ERROR,
                'Failed to upload file to VirusTotal',
                null,
                'virustotal'
            );
        }

        return $this->result(self::RESULT_ERROR, 'VirusTotal API error', null, 'virustotal');
    }

    /**
     * Mock scanner for development/testing.
     */
    protected function scanWithMock(string $path, ?string $originalFilename = null): array
    {
        // Check for test trigger files - use original filename if available
        $filename = $originalFilename ?? basename($path);

        // Files containing "eicar" or "virus" are flagged as infected
        if (stripos($filename, 'eicar') !== false || stripos($filename, 'virus') !== false) {
            return $this->result(self::RESULT_INFECTED, 'Test virus detected', 'EICAR-Test-File', 'mock');
        }

        // Check file content for EICAR test string
        $content = file_get_contents($path, false, null, 0, 1024);
        if (str_contains($content, 'X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR')) {
            return $this->result(self::RESULT_INFECTED, 'EICAR test signature detected', 'EICAR-Test-File', 'mock');
        }

        return $this->result(self::RESULT_CLEAN, 'No threats detected (mock scan)', null, 'mock');
    }

    /**
     * Build a scan result array.
     */
    protected function result(string $status, string $message, ?string $threat, string $scanner): array
    {
        $result = [
            'status' => $status,
            'message' => $message,
            'scanner' => $scanner,
            'scanned_at' => now()->toIso8601String(),
        ];

        if ($threat !== null) {
            $result['threat'] = $threat;
        }

        return $result;
    }

    /**
     * Check if a scan result indicates the file is safe to use.
     */
    public function isSafe(array $result): bool
    {
        return in_array($result['status'], [self::RESULT_CLEAN, self::RESULT_SKIPPED], true);
    }

    /**
     * Check if scanning is enabled.
     */
    public function isEnabled(): bool
    {
        return $this->enabled;
    }

    /**
     * Get the current scanner driver.
     */
    public function getDriver(): string
    {
        return $this->driver;
    }

    /**
     * Validate an uploaded file (scan + return boolean).
     */
    public function validateUpload(UploadedFile $file): bool
    {
        $result = $this->scan($file);
        return $this->isSafe($result);
    }

    /**
     * Create a validation rule for file uploads.
     */
    public static function rule(): \Closure
    {
        return function (string $attribute, mixed $value, \Closure $fail) {
            if (!$value instanceof UploadedFile) {
                return;
            }

            $scanner = app(VirusScanService::class);
            $result = $scanner->scan($value);

            if ($result['status'] === VirusScanService::RESULT_INFECTED) {
                $fail("The {$attribute} file contains a security threat and cannot be uploaded.");
            }

            if ($result['status'] === VirusScanService::RESULT_ERROR) {
                Log::warning('Virus scan error during validation', [
                    'attribute' => $attribute,
                    'result' => $result,
                ]);
                // Optionally fail on errors too
                // $fail("The {$attribute} file could not be scanned for security threats.");
            }
        };
    }
}
