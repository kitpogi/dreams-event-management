<?php

return [

    /*
    |--------------------------------------------------------------------------
    | External Health Check Configuration
    |--------------------------------------------------------------------------
    |
    | Configure external services that should be health checked. Each service
    | can have its own URL, expected status codes, timeouts, and criticality.
    |
    */

    // Default timeout for health checks in seconds
    'timeout' => env('HEALTH_CHECK_TIMEOUT', 5),

    // Cache TTL for health check results in seconds
    'cache_ttl' => env('HEALTH_CHECK_CACHE_TTL', 60),

    // External services to monitor
    'external_services' => [

        // Example: Payment Gateway
        // 'paymongo' => [
        //     'name' => 'PayMongo',
        //     'url' => 'https://api.paymongo.com/v1',
        //     'method' => 'GET',
        //     'headers' => [],
        //     'timeout' => 5,
        //     'expected_status' => [200, 401],
        //     'expected_body' => null,
        //     'critical' => true,
        //     'circuit_breaker' => true,
        //     'retry_count' => 1,
        // ],

        // Example: SMS Provider
        // 'semaphore' => [
        //     'name' => 'Semaphore SMS',
        //     'url' => 'https://api.semaphore.co/api/v4/account',
        //     'method' => 'GET',
        //     'headers' => [
        //         'apikey' => env('SEMAPHORE_API_KEY'),
        //     ],
        //     'timeout' => 5,
        //     'expected_status' => [200],
        //     'critical' => false,
        //     'circuit_breaker' => true,
        //     'retry_count' => 2,
        // ],

        // Example: Firebase FCM
        // 'firebase' => [
        //     'name' => 'Firebase Cloud Messaging',
        //     'url' => 'https://fcm.googleapis.com/fcm/send',
        //     'method' => 'POST',
        //     'headers' => [
        //         'Authorization' => 'key=' . env('FIREBASE_SERVER_KEY'),
        //     ],
        //     'timeout' => 5,
        //     'expected_status' => [200, 401],
        //     'critical' => false,
        //     'circuit_breaker' => true,
        //     'retry_count' => 1,
        // ],

    ],

    /*
    |--------------------------------------------------------------------------
    | Circuit Breaker Configuration
    |--------------------------------------------------------------------------
    |
    | Configure the circuit breaker behavior for external service health checks.
    | The circuit opens after consecutive failures and closes after a timeout.
    |
    */

    'circuit_breaker' => [
        // Number of failures before opening the circuit
        'failure_threshold' => 5,

        // Time in seconds before trying to close the circuit
        'recovery_timeout' => 60,

        // Time window for counting failures (in seconds)
        'failure_window' => 300,
    ],

    /*
    |--------------------------------------------------------------------------
    | Health Status Thresholds
    |--------------------------------------------------------------------------
    |
    | Configure latency thresholds for determining service health status.
    |
    */

    'thresholds' => [
        // Latency in milliseconds for "degraded" status
        'degraded_latency' => 1000,

        // Latency in milliseconds for "slow" status
        'slow_latency' => 2000,
    ],

    /*
    |--------------------------------------------------------------------------
    | Health Check Endpoints
    |--------------------------------------------------------------------------
    |
    | Configure which internal checks should be included in health endpoints.
    |
    */

    'checks' => [
        'database' => true,
        'cache' => true,
        'queue' => env('HEALTH_CHECK_QUEUE', false),
        'storage' => env('HEALTH_CHECK_STORAGE', true),
        'external_services' => env('HEALTH_CHECK_EXTERNAL', true),
    ],

    /*
    |--------------------------------------------------------------------------
    | Health Check Rate Limiting
    |--------------------------------------------------------------------------
    |
    | Configure rate limiting for health check endpoints to prevent abuse.
    |
    */

    'rate_limit' => [
        'enabled' => true,
        'max_attempts' => 60,
        'decay_minutes' => 1,
    ],

];
