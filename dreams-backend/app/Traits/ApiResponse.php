<?php

namespace App\Traits;

use Illuminate\Http\JsonResponse;

trait ApiResponse
{
    /**
     * Return a successful JSON response
     *
     * @param mixed $data
     * @param string|null $message
     * @param int $statusCode
     * @return JsonResponse
     */
    protected function successResponse($data = null, ?string $message = null, int $statusCode = 200): JsonResponse
    {
        $response = [
            'success' => true,
        ];

        if ($message !== null) {
            $response['message'] = $message;
        }

        if ($data !== null) {
            $response['data'] = $data;
        }

        return response()->json($response, $statusCode);
    }

    /**
     * Return an error JSON response
     *
     * @param string|null $message
     * @param int $statusCode
     * @param array|null $errors
     * @param string|null $errorCode
     * @return JsonResponse
     */
    protected function errorResponse(
        ?string $message = null,
        int $statusCode = 400,
        ?array $errors = null,
        ?string $errorCode = null
    ): JsonResponse {
        $response = [
            'success' => false,
        ];

        if ($message !== null) {
            $response['message'] = $message;
        }

        if ($errors !== null) {
            $response['errors'] = $errors;
        }

        if ($errorCode !== null) {
            $response['error_code'] = $errorCode;
        }

        return response()->json($response, $statusCode);
    }

    /**
     * Return a paginated JSON response
     *
     * @param mixed $data
     * @param array|null $meta
     * @param string|null $message
     * @return JsonResponse
     */
    protected function paginatedResponse($data, ?array $meta = null, ?string $message = null): JsonResponse
    {
        $response = [
            'success' => true,
            'data' => $data,
        ];

        if ($meta !== null) {
            $response['meta'] = $meta;
        }

        if ($message !== null) {
            $response['message'] = $message;
        }

        return response()->json($response);
    }

    /**
     * Return a validation error response
     *
     * @param array $errors
     * @param string|null $message
     * @return JsonResponse
     */
    protected function validationErrorResponse(array $errors, ?string $message = null): JsonResponse
    {
        return $this->errorResponse(
            $message ?? 'Validation failed',
            422,
            $errors,
            'VALIDATION_ERROR'
        );
    }

    /**
     * Return a not found response
     *
     * @param string|null $message
     * @return JsonResponse
     */
    protected function notFoundResponse(?string $message = null): JsonResponse
    {
        return $this->errorResponse(
            $message ?? 'Resource not found',
            404,
            null,
            'NOT_FOUND'
        );
    }

    /**
     * Return an unauthorized response
     *
     * @param string|null $message
     * @return JsonResponse
     */
    protected function unauthorizedResponse(?string $message = null): JsonResponse
    {
        return $this->errorResponse(
            $message ?? 'Unauthorized',
            401,
            null,
            'UNAUTHORIZED'
        );
    }

    /**
     * Return a forbidden response
     *
     * @param string|null $message
     * @return JsonResponse
     */
    protected function forbiddenResponse(?string $message = null): JsonResponse
    {
        return $this->errorResponse(
            $message ?? 'Forbidden',
            403,
            null,
            'FORBIDDEN'
        );
    }

    /**
     * Return a server error response
     *
     * @param string|null $message
     * @param string|null $errorCode
     * @return JsonResponse
     */
    protected function serverErrorResponse(?string $message = null, ?string $errorCode = null): JsonResponse
    {
        return $this->errorResponse(
            $message ?? 'Internal server error',
            500,
            null,
            $errorCode ?? 'SERVER_ERROR'
        );
    }
}
