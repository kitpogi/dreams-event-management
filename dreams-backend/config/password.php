<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Password History Count
    |--------------------------------------------------------------------------
    |
    | The number of previous passwords to check against when a user changes
    | their password. Set to 0 to disable password history checking.
    |
    */
    'password_history_count' => env('PASSWORD_HISTORY_COUNT', 5),

    /*
    |--------------------------------------------------------------------------
    | Password Expiration Days
    |--------------------------------------------------------------------------
    |
    | The number of days after which a password expires and must be changed.
    | Set to 0 to disable password expiration.
    |
    */
    'password_expiration_days' => env('PASSWORD_EXPIRATION_DAYS', 90),

    /*
    |--------------------------------------------------------------------------
    | Password Warning Days
    |--------------------------------------------------------------------------
    |
    | The number of days before password expiration when warning should be shown.
    |
    */
    'password_warning_days' => env('PASSWORD_WARNING_DAYS', 14),

    /*
    |--------------------------------------------------------------------------
    | Minimum Password Length
    |--------------------------------------------------------------------------
    |
    | The minimum length required for passwords.
    |
    */
    'min_password_length' => env('MIN_PASSWORD_LENGTH', 8),

    /*
    |--------------------------------------------------------------------------
    | Password Complexity Requirements
    |--------------------------------------------------------------------------
    |
    | Enable/disable various password complexity requirements.
    |
    */
    'require_uppercase' => env('PASSWORD_REQUIRE_UPPERCASE', true),
    'require_lowercase' => env('PASSWORD_REQUIRE_LOWERCASE', true),
    'require_numbers' => env('PASSWORD_REQUIRE_NUMBERS', true),
    'require_symbols' => env('PASSWORD_REQUIRE_SYMBOLS', true),
];
