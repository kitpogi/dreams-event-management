<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Rate Limiting Enabled
    |--------------------------------------------------------------------------
    |
    | This option controls whether rate limiting is enabled or disabled.
    |
    */
    'enabled' => env('RATE_LIMIT_ENABLED', true),

    /*
    |--------------------------------------------------------------------------
    | Rate Limit Tiers
    |--------------------------------------------------------------------------
    |
    | Define rate limit tiers for different user types. Each tier specifies
    | the maximum requests per period and how to identify the requester.
    |
    */
    'tiers' => [
        'guest' => [
            'limit' => (int) env('RATE_LIMIT_GUEST', 30),
            'decay_minutes' => 1,
            'throttle_by' => 'ip',
        ],
        'basic' => [
            'limit' => (int) env('RATE_LIMIT_BASIC', 60),
            'decay_minutes' => 1,
            'throttle_by' => 'user',
        ],
        'premium' => [
            'limit' => (int) env('RATE_LIMIT_PREMIUM', 120),
            'decay_minutes' => 1,
            'throttle_by' => 'user',
        ],
        'admin' => [
            'limit' => (int) env('RATE_LIMIT_ADMIN', 300),
            'decay_minutes' => 1,
            'throttle_by' => 'user',
        ],
        'api_key' => [
            'limit' => (int) env('RATE_LIMIT_API_KEY', 1000),
            'decay_minutes' => 1,
            'throttle_by' => 'api_key',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Endpoint-Specific Rate Limits
    |--------------------------------------------------------------------------
    |
    | Define specific rate limits for sensitive or high-traffic endpoints.
    | These take precedence over tier-based limits.
    |
    */
    'endpoints' => [
        'login' => [
            'limit' => (int) env('RATE_LIMIT_LOGIN', 5),
            'decay_minutes' => 5,
            'throttle_by' => 'ip',
        ],
        'register' => [
            'limit' => (int) env('RATE_LIMIT_REGISTER', 3),
            'decay_minutes' => 60,
            'throttle_by' => 'ip',
        ],
        'password_reset' => [
            'limit' => (int) env('RATE_LIMIT_PASSWORD_RESET', 3),
            'decay_minutes' => 60,
            'throttle_by' => 'ip',
        ],
        'otp' => [
            'limit' => (int) env('RATE_LIMIT_OTP', 5),
            'decay_minutes' => 15,
            'throttle_by' => 'ip',
        ],
        'search' => [
            'limit' => (int) env('RATE_LIMIT_SEARCH', 30),
            'decay_minutes' => 1,
            'throttle_by' => 'user',
        ],
        'file_upload' => [
            'limit' => (int) env('RATE_LIMIT_UPLOAD', 10),
            'decay_minutes' => 1,
            'throttle_by' => 'user',
        ],
        'webhook' => [
            'limit' => (int) env('RATE_LIMIT_WEBHOOK', 100),
            'decay_minutes' => 1,
            'throttle_by' => 'ip',
        ],
        'export' => [
            'limit' => (int) env('RATE_LIMIT_EXPORT', 5),
            'decay_minutes' => 10,
            'throttle_by' => 'user',
        ],
        'bulk' => [
            'limit' => (int) env('RATE_LIMIT_BULK', 10),
            'decay_minutes' => 1,
            'throttle_by' => 'user',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Analytics Settings
    |--------------------------------------------------------------------------
    |
    | Configure how rate limiting analytics are collected and stored.
    |
    */
    'analytics' => [
        'enabled' => env('RATE_LIMIT_ANALYTICS_ENABLED', true),
        'retention_hours' => (int) env('RATE_LIMIT_ANALYTICS_RETENTION', 24),
    ],

    /*
    |--------------------------------------------------------------------------
    | Response Messages
    |--------------------------------------------------------------------------
    |
    | Customize the response messages for rate limit exceeded errors.
    |
    */
    'messages' => [
        'exceeded' => 'Too many requests. Please try again later.',
        'login_exceeded' => 'Too many login attempts. Please try again in :minutes minutes.',
        'register_exceeded' => 'Too many registration attempts. Please try again later.',
    ],

    /*
    |--------------------------------------------------------------------------
    | Skip Rate Limiting
    |--------------------------------------------------------------------------
    |
    | Configure which requests should skip rate limiting entirely.
    |
    */
    'skip' => [
        'ips' => explode(',', env('RATE_LIMIT_SKIP_IPS', '')),
        'user_ids' => array_map('intval', explode(',', env('RATE_LIMIT_SKIP_USERS', ''))),
        'paths' => [
            'health',
            'health/*',
        ],
    ],
];
