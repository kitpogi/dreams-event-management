<?php

namespace App\Exceptions;

class NotFoundException extends ApiException
{
    /**
     * Create a new not found exception instance
     *
     * @param string|null $message
     * @param string|null $resource
     */
    public function __construct(?string $message = null, ?string $resource = null)
    {
        $defaultMessage = $resource
            ? "{$resource} not found"
            : 'Resource not found';

        parent::__construct(
            $message ?? $defaultMessage,
            404,
            'NOT_FOUND'
        );
    }
}
