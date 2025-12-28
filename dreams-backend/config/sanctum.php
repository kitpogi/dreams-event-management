<?php

use Laravel\Sanctum\Sanctum;

return [
    'stateful' => env('SANCTUM_STATEFUL_DOMAINS')
        ? array_map('trim', explode(',', env('SANCTUM_STATEFUL_DOMAINS')))
        : [Sanctum::currentApplicationUrlWithPort()],

    'guard' => ['web'],

    'expiration' => null,

    'token_prefix' => env('SANCTUM_TOKEN_PREFIX', ''),

    'middleware' => [
        'verify_csrf_token' => App\Http\Middleware\VerifyCsrfToken::class,
        'encrypt_cookies' => App\Http\Middleware\EncryptCookies::class,
    ],
];

