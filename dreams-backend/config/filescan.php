<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Enable Virus Scanning
    |--------------------------------------------------------------------------
    |
    | This option controls whether file scanning is enabled. When disabled,
    | all scans will return a "skipped" status and files will be allowed.
    |
    */
    'enabled' => env('VIRUS_SCAN_ENABLED', false),

    /*
    |--------------------------------------------------------------------------
    | Scanner Driver
    |--------------------------------------------------------------------------
    |
    | The scanner driver to use for file scanning. Supported drivers:
    | - "clamav" - ClamAV daemon (requires ClamAV installed)
    | - "virustotal" - VirusTotal API (requires API key)
    | - "mock" - Mock scanner for development/testing
    |
    */
    'driver' => env('VIRUS_SCAN_DRIVER', 'mock'),

    /*
    |--------------------------------------------------------------------------
    | Maximum File Size
    |--------------------------------------------------------------------------
    |
    | Maximum file size in bytes that will be scanned. Files larger than
    | this will return a "skipped" status. Default is 25MB.
    |
    */
    'max_file_size' => env('VIRUS_SCAN_MAX_SIZE', 25 * 1024 * 1024),

    /*
    |--------------------------------------------------------------------------
    | Fail on Error
    |--------------------------------------------------------------------------
    |
    | Whether to reject file uploads when scanning encounters an error.
    | When false, files will be allowed if the scanner fails to respond.
    |
    */
    'fail_on_error' => env('VIRUS_SCAN_FAIL_ON_ERROR', false),

    /*
    |--------------------------------------------------------------------------
    | ClamAV Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for ClamAV daemon connection.
    |
    */
    'clamav' => [
        // Use Unix socket instead of TCP
        'use_socket' => env('CLAMAV_USE_SOCKET', false),

        // Unix socket path (if use_socket is true)
        'socket' => env('CLAMAV_SOCKET', '/var/run/clamav/clamd.ctl'),

        // TCP host (if use_socket is false)
        'host' => env('CLAMAV_HOST', '127.0.0.1'),

        // TCP port (if use_socket is false)
        'port' => env('CLAMAV_PORT', 3310),

        // Connection timeout in seconds
        'timeout' => env('CLAMAV_TIMEOUT', 30),
    ],

    /*
    |--------------------------------------------------------------------------
    | VirusTotal Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for VirusTotal API.
    | Get a free API key at: https://www.virustotal.com/gui/join-us
    |
    */
    'virustotal' => [
        // API key for VirusTotal
        'api_key' => env('VIRUSTOTAL_API_KEY', ''),

        // Wait for analysis results (slower but more accurate)
        'wait_for_analysis' => env('VIRUSTOTAL_WAIT_ANALYSIS', false),

        // Maximum wait time in seconds for analysis
        'analysis_timeout' => env('VIRUSTOTAL_ANALYSIS_TIMEOUT', 60),
    ],

    /*
    |--------------------------------------------------------------------------
    | Scan Logging
    |--------------------------------------------------------------------------
    |
    | Configure logging for scan operations.
    |
    */
    'logging' => [
        // Log all scan results
        'log_all' => env('VIRUS_SCAN_LOG_ALL', false),

        // Log infected files (always recommended)
        'log_infected' => env('VIRUS_SCAN_LOG_INFECTED', true),

        // Log scan errors
        'log_errors' => env('VIRUS_SCAN_LOG_ERRORS', true),
    ],

    /*
    |--------------------------------------------------------------------------
    | File Type Restrictions
    |--------------------------------------------------------------------------
    |
    | Additional file type restrictions beyond virus scanning.
    | These MIME types will be rejected regardless of scan results.
    |
    */
    'blocked_mimes' => [
        'application/x-executable',
        'application/x-msdos-program',
        'application/x-msdownload',
        'application/x-sh',
        'application/x-shellscript',
        'application/x-php',
        'text/x-php',
        'application/x-httpd-php',
    ],

    /*
    |--------------------------------------------------------------------------
    | Allowed Extensions
    |--------------------------------------------------------------------------
    |
    | When not empty, only files with these extensions will be allowed.
    | Leave empty to allow all extensions (subject to blocked_mimes).
    |
    */
    'allowed_extensions' => [
        // Images
        'jpg',
        'jpeg',
        'png',
        'gif',
        'webp',
        'svg',
        'bmp',
        // Documents
        'pdf',
        'doc',
        'docx',
        'xls',
        'xlsx',
        'ppt',
        'pptx',
        'txt',
        'rtf',
        // Archives (use with caution)
        'zip',
        'rar',
        '7z',
        // Audio/Video
        'mp3',
        'mp4',
        'wav',
        'avi',
        'mov',
        'wmv',
    ],
];
