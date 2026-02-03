<?php

namespace App\Exceptions;

class UnauthorizedException extends ApiException
{
    /**
     * Create a new unauthorized exception instance
     *
     * @param string|null $message
     */
    public function __construct(?string $message = null)
    {
        parent::__construct(
            $message ?? 'Unauthorized',
            401,
            'UNAUTHORIZED'
        );
    }
}
