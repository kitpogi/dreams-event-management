<?php

namespace App\Exceptions;

use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ApiException extends Exception
{
    protected $statusCode;
    protected $errorCode;
    protected $errors;

    /**
     * Create a new API exception instance
     *
     * @param string $message
     * @param int $statusCode
     * @param string|null $errorCode
     * @param array|null $errors
     * @param int $code
     * @param Exception|null $previous
     */
    public function __construct(
        string $message = '',
        int $statusCode = 400,
        ?string $errorCode = null,
        ?array $errors = null,
        int $code = 0,
        ?Exception $previous = null
    ) {
        parent::__construct($message, $code, $previous);
        $this->statusCode = $statusCode;
        $this->errorCode = $errorCode;
        $this->errors = $errors;
    }

    /**
     * Render the exception as an HTTP response
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function render(Request $request): JsonResponse
    {
        $response = [
            'success' => false,
            'message' => $this->getMessage(),
        ];

        if ($this->errorCode !== null) {
            $response['error_code'] = $this->errorCode;
        }

        if ($this->errors !== null) {
            $response['errors'] = $this->errors;
        }

        if (config('app.debug')) {
            $response['debug'] = [
                'file' => $this->getFile(),
                'line' => $this->getLine(),
                'trace' => $this->getTraceAsString(),
            ];
        }

        return response()->json($response, $this->statusCode);
    }

    /**
     * Get the status code
     *
     * @return int
     */
    public function getStatusCode(): int
    {
        return $this->statusCode;
    }

    /**
     * Get the error code
     *
     * @return string|null
     */
    public function getErrorCode(): ?string
    {
        return $this->errorCode;
    }

    /**
     * Get the errors
     *
     * @return array|null
     */
    public function getErrors(): ?array
    {
        return $this->errors;
    }
}
