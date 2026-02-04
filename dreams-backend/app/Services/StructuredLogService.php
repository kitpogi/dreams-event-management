<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;

/**
 * Structured Logging Service
 * 
 * Provides consistent, structured logging throughout the application.
 * All logs are in JSON format with standard fields for easy parsing.
 */
class StructuredLogService
{
    /**
     * Standard context fields included in all logs.
     */
    protected array $defaultContext = [];

    /**
     * Log an informational message.
     */
    public function info(string $message, array $context = [], ?string $channel = null): void
    {
        $this->log('info', $message, $context, $channel);
    }

    /**
     * Log a warning message.
     */
    public function warning(string $message, array $context = [], ?string $channel = null): void
    {
        $this->log('warning', $message, $context, $channel);
    }

    /**
     * Log an error message.
     */
    public function error(string $message, array $context = [], ?string $channel = null): void
    {
        $this->log('error', $message, $context, $channel);
    }

    /**
     * Log a debug message.
     */
    public function debug(string $message, array $context = [], ?string $channel = null): void
    {
        $this->log('debug', $message, $context, $channel);
    }

    /**
     * Log a critical message.
     */
    public function critical(string $message, array $context = [], ?string $channel = null): void
    {
        $this->log('critical', $message, $context, $channel);
    }

    /**
     * Log an API request.
     */
    public function logApiRequest(Request $request, ?int $userId = null): void
    {
        $this->info('api_request', [
            'type' => 'api_request',
            'method' => $request->method(),
            'path' => $request->path(),
            'ip' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'user_id' => $userId ?? Auth::id(),
            'query_params' => $request->query(),
            'content_type' => $request->header('Content-Type'),
        ], 'api');
    }

    /**
     * Log an API response.
     */
    public function logApiResponse(Request $request, int $statusCode, float $responseTimeMs, ?int $userId = null): void
    {
        $level = $statusCode >= 500 ? 'error' : ($statusCode >= 400 ? 'warning' : 'info');

        $this->log($level, 'api_response', [
            'type' => 'api_response',
            'method' => $request->method(),
            'path' => $request->path(),
            'status_code' => $statusCode,
            'response_time_ms' => round($responseTimeMs, 2),
            'user_id' => $userId ?? Auth::id(),
            'ip' => $request->ip(),
        ], 'api');
    }

    /**
     * Log a user action.
     */
    public function logUserAction(string $action, array $details = [], ?int $userId = null): void
    {
        $this->info('user_action', [
            'type' => 'user_action',
            'action' => $action,
            'user_id' => $userId ?? Auth::id(),
            'details' => $details,
        ], 'user_actions');
    }

    /**
     * Log a security event.
     */
    public function logSecurityEvent(string $event, array $details = [], string $severity = 'warning'): void
    {
        $this->log($severity, 'security_event', [
            'type' => 'security_event',
            'event' => $event,
            'user_id' => Auth::id(),
            'ip' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'details' => $details,
        ], 'security');
    }

    /**
     * Log an authentication event.
     */
    public function logAuthEvent(string $event, ?int $userId = null, array $details = []): void
    {
        $this->info('auth_event', [
            'type' => 'auth_event',
            'event' => $event,
            'user_id' => $userId ?? Auth::id(),
            'ip' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'details' => $details,
        ], 'auth');
    }

    /**
     * Log a business event.
     */
    public function logBusinessEvent(string $event, string $entity, ?int $entityId = null, array $details = []): void
    {
        $this->info('business_event', [
            'type' => 'business_event',
            'event' => $event,
            'entity' => $entity,
            'entity_id' => $entityId,
            'user_id' => Auth::id(),
            'details' => $details,
        ], 'business');
    }

    /**
     * Log a performance metric.
     */
    public function logPerformance(string $operation, float $durationMs, array $details = []): void
    {
        $level = $durationMs > 1000 ? 'warning' : 'info';

        $this->log($level, 'performance_metric', [
            'type' => 'performance',
            'operation' => $operation,
            'duration_ms' => round($durationMs, 2),
            'details' => $details,
        ], 'performance');
    }

    /**
     * Log a database query.
     */
    public function logQuery(string $sql, float $timeMs, array $bindings = []): void
    {
        $level = $timeMs > 100 ? 'warning' : 'debug';

        $this->log($level, 'database_query', [
            'type' => 'database_query',
            'query' => $sql,
            'time_ms' => round($timeMs, 2),
            'bindings_count' => count($bindings),
        ], 'database');
    }

    /**
     * Log an exception.
     */
    public function logException(\Throwable $exception, array $context = []): void
    {
        $this->error('exception', array_merge([
            'type' => 'exception',
            'exception_class' => get_class($exception),
            'message' => $exception->getMessage(),
            'code' => $exception->getCode(),
            'file' => $exception->getFile(),
            'line' => $exception->getLine(),
            'trace' => $this->formatTrace($exception),
            'user_id' => Auth::id(),
            'url' => request()->fullUrl(),
        ], $context), 'exceptions');
    }

    /**
     * Log a job event.
     */
    public function logJobEvent(string $job, string $event, array $details = []): void
    {
        $this->info('job_event', [
            'type' => 'job_event',
            'job' => $job,
            'event' => $event,
            'details' => $details,
        ], 'jobs');
    }

    /**
     * Log an email event.
     */
    public function logEmailEvent(string $event, string $to, ?string $subject = null, array $details = []): void
    {
        $this->info('email_event', [
            'type' => 'email_event',
            'event' => $event,
            'to' => $to,
            'subject' => $subject,
            'details' => $details,
        ], 'email');
    }

    /**
     * Core logging method.
     */
    protected function log(string $level, string $message, array $context = [], ?string $channel = null): void
    {
        $structuredContext = $this->buildContext($context);

        if ($channel) {
            Log::channel($channel)->$level($message, $structuredContext);
        } else {
            Log::$level($message, $structuredContext);
        }
    }

    /**
     * Build the full context with default fields.
     */
    protected function buildContext(array $context): array
    {
        return array_merge($this->defaultContext, [
            'timestamp' => now()->toIso8601String(),
            'environment' => app()->environment(),
            'request_id' => request()->header('X-Request-ID') ?? uniqid('req_'),
        ], $context);
    }

    /**
     * Format exception trace for logging.
     */
    protected function formatTrace(\Throwable $exception, int $limit = 5): array
    {
        $trace = $exception->getTrace();
        $formatted = [];

        foreach (array_slice($trace, 0, $limit) as $frame) {
            $formatted[] = [
                'file' => $frame['file'] ?? 'unknown',
                'line' => $frame['line'] ?? 0,
                'function' => ($frame['class'] ?? '') . ($frame['type'] ?? '') . ($frame['function'] ?? ''),
            ];
        }

        return $formatted;
    }

    /**
     * Set default context values.
     */
    public function setDefaultContext(array $context): void
    {
        $this->defaultContext = $context;
    }

    /**
     * Add to default context.
     */
    public function addDefaultContext(string $key, mixed $value): void
    {
        $this->defaultContext[$key] = $value;
    }
}
