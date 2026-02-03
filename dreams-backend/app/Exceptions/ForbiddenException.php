<?php

namespace App\Exceptions;

class ForbiddenException extends ApiException
{
    /**
     * Create a new forbidden exception instance
     *
     * @param string|null $message
     */
    public function __construct(?string $message = null)
    {
        parent::__construct(
            $message ?? 'Forbidden',
            403,
            'FORBIDDEN'
        );
    }
}
