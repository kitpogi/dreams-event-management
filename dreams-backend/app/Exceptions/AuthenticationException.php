<?php

namespace App\Exceptions;

class AuthenticationException extends ApiException
{
    /**
     * Create a new authentication exception instance
     *
     * @param string|null $message
     * @param array|null $errors
     */
    public function __construct(?string $message = null, ?array $errors = null)
    {
        parent::__construct(
            $message ?? 'Authentication failed',
            401,
            'AUTHENTICATION_ERROR',
            $errors
        );
    }
}
