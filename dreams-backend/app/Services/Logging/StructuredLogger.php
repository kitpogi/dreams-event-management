<?php

namespace App\Services\Logging;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;

/**
 * Structured logging service for JSON-formatted logs with context
 */
class StructuredLogger
{
    /**
     * Log an info-level message with context
     */
    public static function info(string $message, array $context = []): void
    {
        $context = static::enrichContext($context);
        Log::channel('structured')->info($message, $context);
    }

    /**
     * Log a warning-level message with context
     */
    public static function warning(string $message, array $context = []): void
    {
        $context = static::enrichContext($context);
        Log::channel('structured')->warning($message, $context);
    }

    /**
     * Log an error-level message with context
     */
    public static function error(string $message, array $context = [], ?\Throwable $exception = null): void
    {
        $context = static::enrichContext($context);
        
        if ($exception) {
            $context['exception'] = [
                'class' => get_class($exception),
                'message' => $exception->getMessage(),
                'file' => $exception->getFile(),
                'line' => $exception->getLine(),
                'trace' => $exception->getTraceAsString(),
            ];
        }
        
        Log::channel('structured')->error($message, $context);
    }

    /**
     * Log a critical error
     */
    public static function critical(string $message, array $context = [], ?\Throwable $exception = null): void
    {
        $context = static::enrichContext($context);
        
        if ($exception) {
            $context['exception'] = [
                'class' => get_class($exception),
                'message' => $exception->getMessage(),
                'file' => $exception->getFile(),
                'line' => $exception->getLine(),
            ];
        }
        
        Log::channel('structured')->critical($message, $context);
    }

    /**
     * Log API request
     */
    public static function logApiRequest(Request $request, string $endpoint): void
    {
        $context = [
            'type' => 'api_request',
            'endpoint' => $endpoint,
            'method' => $request->getMethod(),
            'url' => $request->getPathInfo(),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'query_params' => $request->query(),
        ];

        static::info('API Request', $context);
    }

    /**
     * Log API response
     */
    public static function logApiResponse(string $endpoint, int $statusCode, float $duration, array $responseData = []): void
    {
        $context = [
            'type' => 'api_response',
            'endpoint' => $endpoint,
            'status_code' => $statusCode,
            'duration_ms' => round($duration * 1000, 2),
            'response_size' => strlen(json_encode($responseData)),
        ];

        static::info('API Response', $context);
    }

    /**
     * Log authentication attempt
     */
    public static function logAuthenticationAttempt(string $email, bool $success, ?string $failureReason = null): void
    {
        $context = [
            'type' => 'authentication',
            'email' => $email,
            'success' => $success,
            'failure_reason' => $failureReason,
            'ip_address' => request()->ip(),
        ];

        $message = $success ? 'Authentication Successful' : 'Authentication Failed';
        static::info($message, $context);
    }

    /**
     * Log authorization check
     */
    public static function logAuthorization(string $resource, string $action, bool $allowed, ?string $reason = null): void
    {
        $context = [
            'type' => 'authorization',
            'resource' => $resource,
            'action' => $action,
            'allowed' => $allowed,
            'reason' => $reason,
            'user_id' => Auth::id(),
        ];

        $message = $allowed ? 'Authorization Granted' : 'Authorization Denied';
        static::info($message, $context);
    }

    /**
     * Log database operation
     */
    public static function logDatabaseOperation(string $operation, string $model, int $recordCount, float $duration): void
    {
        $context = [
            'type' => 'database_operation',
            'operation' => $operation,
            'model' => $model,
            'record_count' => $recordCount,
            'duration_ms' => round($duration * 1000, 2),
        ];

        static::info('Database Operation', $context);
    }

    /**
     * Log business event
     */
    public static function logBusinessEvent(string $event, array $details = []): void
    {
        $context = array_merge([
            'type' => 'business_event',
            'event' => $event,
        ], $details);

        static::info("Business Event: {$event}", $context);
    }

    /**
     * Log payment event
     */
    public static function logPaymentEvent(int $bookingId, float $amount, string $event, array $details = []): void
    {
        $context = array_merge([
            'type' => 'payment_event',
            'booking_id' => $bookingId,
            'amount' => $amount,
            'event' => $event,
        ], $details);

        static::info("Payment Event: {$event}", $context);
    }

    /**
     * Log email sent
     */
    public static function logEmailSent(string $recipient, string $subject, string $mailer = 'default'): void
    {
        $context = [
            'type' => 'email_sent',
            'recipient' => $recipient,
            'subject' => $subject,
            'mailer' => $mailer,
        ];

        static::info('Email Sent', $context);
    }

    /**
     * Log scheduled job execution
     */
    public static function logScheduledJob(string $jobName, float $duration, bool $success, ?string $error = null): void
    {
        $context = [
            'type' => 'scheduled_job',
            'job_name' => $jobName,
            'duration_ms' => round($duration * 1000, 2),
            'success' => $success,
            'error' => $error,
        ];

        static::info("Scheduled Job: {$jobName}", $context);
    }

    /**
     * Enrich context with standard fields
     */
    private static function enrichContext(array $context = []): array
    {
        return array_merge([
            'timestamp' => now()->toIso8601String(),
            'environment' => config('app.env'),
            'user_id' => Auth::id(),
            'request_id' => request()->header('X-Request-ID') ?? request()->id(),
        ], $context);
    }
}
