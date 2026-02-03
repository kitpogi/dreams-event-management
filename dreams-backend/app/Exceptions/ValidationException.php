<?php

namespace App\Exceptions;

use Illuminate\Validation\ValidationException as LaravelValidationException;

class ValidationException extends ApiException
{
    protected $validationErrors;

    /**
     * Create a new validation exception instance
     *
     * @param array $errors
     * @param string|null $message
     */
    public function __construct(array $errors, ?string $message = null)
    {
        parent::__construct(
            $message ?? 'Validation failed',
            422,
            'VALIDATION_ERROR',
            $errors
        );
        $this->validationErrors = $errors;
    }

    /**
     * Create from Laravel validation exception
     *
     * @param LaravelValidationException $exception
     * @return static
     */
    public static function fromLaravelException(LaravelValidationException $exception): self
    {
        $errors = $exception->errors();
        return new static($errors, $exception->getMessage());
    }

    /**
     * Get validation errors
     *
     * @return array
     */
    public function getValidationErrors(): array
    {
        return $this->validationErrors;
    }
}
