<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Error Monitoring Configuration
    |--------------------------------------------------------------------------
    |
    | Configure error monitoring and alerting for the application.
    | Supports Sentry, Bugsnag, Rollbar, or local logging.
    |
    */

    // Enable/disable error monitoring
    'enabled' => env('ERROR_MONITORING_ENABLED', true),

    // Default provider (sentry, bugsnag, rollbar, log)
    'provider' => env('ERROR_MONITORING_PROVIDER', 'log'),

    // Provider configurations
    'providers' => [

        'sentry' => [
            'dsn' => env('SENTRY_DSN'),
            'sample_rate' => env('SENTRY_SAMPLE_RATE', 1.0),
            'traces_sample_rate' => env('SENTRY_TRACES_SAMPLE_RATE', 0.1),
            'send_default_pii' => env('SENTRY_SEND_PII', false),
        ],

        'bugsnag' => [
            'api_key' => env('BUGSNAG_API_KEY'),
            'notify_release_stages' => ['production', 'staging'],
        ],

        'rollbar' => [
            'token' => env('ROLLBAR_TOKEN'),
            'environment' => env('APP_ENV', 'production'),
        ],

        'log' => [
            // Uses Laravel's logging system
        ],

    ],

    /*
    |--------------------------------------------------------------------------
    | Alerting Configuration
    |--------------------------------------------------------------------------
    |
    | Configure when and how alerts are sent for critical errors.
    |
    */

    // Number of same errors before sending alert
    'alert_threshold' => env('ERROR_ALERT_THRESHOLD', 5),

    // Time window for counting errors (in seconds)
    'alert_window' => env('ERROR_ALERT_WINDOW', 300),

    // Webhook URL for alerts (Slack, Discord, etc.)
    'alert_webhook' => env('ERROR_ALERT_WEBHOOK'),

    // Levels that trigger alerts
    'alert_levels' => ['error', 'fatal'],

    /*
    |--------------------------------------------------------------------------
    | Filtering Configuration
    |--------------------------------------------------------------------------
    |
    | Configure which errors to ignore or filter.
    |
    */

    // Exception classes to ignore
    'ignore_exceptions' => [
        Illuminate\Auth\AuthenticationException::class,
        Illuminate\Auth\Access\AuthorizationException::class,
        Illuminate\Database\Eloquent\ModelNotFoundException::class,
        Illuminate\Validation\ValidationException::class,
        Symfony\Component\HttpKernel\Exception\NotFoundHttpException::class,
        Symfony\Component\HttpKernel\Exception\MethodNotAllowedHttpException::class,
    ],

    // HTTP status codes to ignore
    'ignore_status_codes' => [400, 401, 403, 404, 405, 422],

    /*
    |--------------------------------------------------------------------------
    | Sensitive Data
    |--------------------------------------------------------------------------
    |
    | Configure which data should be redacted from error reports.
    |
    */

    'redact_fields' => [
        'password',
        'password_confirmation',
        'token',
        'api_key',
        'secret',
        'credit_card',
        'card_number',
        'cvv',
        'ssn',
    ],

    'redact_headers' => [
        'authorization',
        'cookie',
        'x-api-key',
        'x-auth-token',
        'x-csrf-token',
    ],

    /*
    |--------------------------------------------------------------------------
    | Performance Configuration
    |--------------------------------------------------------------------------
    |
    | Configure performance-related settings.
    |
    */

    // Maximum breadcrumbs to keep
    'max_breadcrumbs' => 100,

    // Maximum stack trace frames
    'max_stack_frames' => 50,

    // Maximum recent errors to store
    'max_recent_errors' => 1000,

    // Statistics retention (in seconds)
    'stats_retention' => 86400, // 24 hours

];
