<?php

namespace App\Facades;

use Illuminate\Support\Facades\Facade;

/**
 * Facade for easy access to structured logging
 *
 * @method static void info(string $message, array $context = [])
 * @method static void warning(string $message, array $context = [])
 * @method static void error(string $message, array $context = [], \Throwable $exception = null)
 * @method static void critical(string $message, array $context = [], \Throwable $exception = null)
 * @method static void logApiRequest(\Illuminate\Http\Request $request, string $endpoint)
 * @method static void logApiResponse(string $endpoint, int $statusCode, float $duration, array $responseData = [])
 * @method static void logAuthenticationAttempt(string $email, bool $success, string $failureReason = null)
 * @method static void logAuthorization(string $resource, string $action, bool $allowed, string $reason = null)
 * @method static void logDatabaseOperation(string $operation, string $model, int $recordCount, float $duration)
 * @method static void logBusinessEvent(string $event, array $details = [])
 * @method static void logPaymentEvent(int $bookingId, float $amount, string $event, array $details = [])
 * @method static void logEmailSent(string $recipient, string $subject, string $mailer = 'default')
 * @method static void logScheduledJob(string $jobName, float $duration, bool $success, string $error = null)
 */
class StructuredLog extends Facade
{
    protected static function getFacadeAccessor()
    {
        return \App\Services\Logging\StructuredLogger::class;
    }
}
