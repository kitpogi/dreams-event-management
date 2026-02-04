<?php

namespace App\DTO\Common;

use App\DTO\BaseDTO;
use Illuminate\Http\Request;

/**
 * API Response DTO
 * 
 * Standard wrapper for all API responses.
 */
class ApiResponseDTO extends BaseDTO
{
    public function __construct(
        public readonly bool $success,
        public readonly ?string $message = null,
        public readonly mixed $data = null,
        public readonly ?array $errors = null,
        public readonly ?PaginationDTO $pagination = null,
        public readonly ?array $meta = null,
    ) {}

    /**
     * Create a success response.
     */
    public static function success(mixed $data = null, ?string $message = null, ?PaginationDTO $pagination = null, ?array $meta = null): static
    {
        return new static(
            success: true,
            message: $message,
            data: $data,
            errors: null,
            pagination: $pagination,
            meta: $meta,
        );
    }

    /**
     * Create an error response.
     */
    public static function error(string $message, ?array $errors = null, ?array $meta = null): static
    {
        return new static(
            success: false,
            message: $message,
            data: null,
            errors: $errors,
            pagination: null,
            meta: $meta,
        );
    }

    /**
     * Create a validation error response.
     */
    public static function validationError(array $errors, string $message = 'Validation failed'): static
    {
        return new static(
            success: false,
            message: $message,
            data: null,
            errors: $errors,
            pagination: null,
            meta: ['error_code' => 'VALIDATION_ERROR'],
        );
    }

    /**
     * Create DTO from request (not typically used).
     */
    public static function fromRequest(Request $request): static
    {
        throw new \BadMethodCallException('ApiResponseDTO cannot be created from request.');
    }

    /**
     * Create DTO from array.
     */
    public static function fromArray(array $data): static
    {
        return new static(
            success: (bool) ($data['success'] ?? false),
            message: $data['message'] ?? null,
            data: $data['data'] ?? null,
            errors: $data['errors'] ?? null,
            pagination: isset($data['pagination']) ? PaginationDTO::fromArray($data['pagination']) : null,
            meta: $data['meta'] ?? null,
        );
    }

    /**
     * Convert to API response array.
     */
    public function toApiArray(): array
    {
        $response = [
            'success' => $this->success,
        ];

        if ($this->message !== null) {
            $response['message'] = $this->message;
        }

        if ($this->data !== null) {
            $response['data'] = $this->data;
        }

        if ($this->errors !== null) {
            $response['errors'] = $this->errors;
        }

        if ($this->pagination !== null) {
            $response['meta'] = array_merge(
                $this->meta ?? [],
                $this->pagination->toMeta()
            );
            $response['links'] = $this->pagination->toLinks();
        } elseif ($this->meta !== null) {
            $response['meta'] = $this->meta;
        }

        return $response;
    }

    /**
     * Convert to JSON response.
     */
    public function toResponse(int $statusCode = 200): \Illuminate\Http\JsonResponse
    {
        return response()->json($this->toApiArray(), $statusCode);
    }
}
