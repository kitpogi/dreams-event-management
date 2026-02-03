<?php

namespace App\Services\Logging;

use App\Models\AuditLog;
use Illuminate\Support\Facades\Auth;
use Illuminate\Database\Eloquent\Model;

/**
 * Service for logging audit trails to database
 */
class AuditLogger
{
    /**
     * Log a model creation
     */
    public static function logCreate(Model $model, array $changes = []): void
    {
        static::log('create', $model, $changes);
    }

    /**
     * Log a model update
     */
    public static function logUpdate(Model $model, array $original = [], array $changes = []): void
    {
        $details = [
            'original' => $original,
            'changed' => $changes,
        ];

        static::log('update', $model, $details);
    }

    /**
     * Log a model deletion
     */
    public static function logDelete(Model $model): void
    {
        static::log('delete', $model, ['deleted_data' => $model->toArray()]);
    }

    /**
     * Log a custom action
     */
    public static function logAction(string $action, Model $model, array $details = []): void
    {
        static::log($action, $model, $details);
    }

    /**
     * Log authentication action
     */
    public static function logAuthAction(string $action, int $userId, array $details = []): void
    {
        $auditLog = [
            'user_id' => $userId,
            'action' => $action,
            'auditable_type' => 'authentication',
            'auditable_id' => $userId,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'details' => json_encode(array_merge([
                'timestamp' => now()->toIso8601String(),
            ], $details)),
        ];

        AuditLog::create($auditLog);
    }

    /**
     * Log payment action
     */
    public static function logPaymentAction(int $paymentId, string $action, array $details = []): void
    {
        $auditLog = [
            'user_id' => Auth::id(),
            'action' => $action,
            'auditable_type' => 'Payment',
            'auditable_id' => $paymentId,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'details' => json_encode(array_merge([
                'timestamp' => now()->toIso8601String(),
            ], $details)),
        ];

        AuditLog::create($auditLog);
    }

    /**
     * Create audit log entry
     */
    private static function log(string $action, Model $model, array $details = []): void
    {
        try {
            AuditLog::create([
                'user_id' => Auth::id(),
                'action' => $action,
                'auditable_type' => get_class($model),
                'auditable_id' => $model->id ?? null,
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
                'details' => json_encode(array_merge([
                    'timestamp' => now()->toIso8601String(),
                ], $details)),
            ]);
        } catch (\Exception $e) {
            // Silently fail to prevent logging from breaking application
            StructuredLogger::error('Failed to create audit log', [
                'model' => get_class($model),
                'action' => $action,
                'error' => $e->getMessage(),
            ], $e);
        }
    }

    /**
     * Get audit trail for a model
     */
    public static function getAuditTrail(Model $model, int $limit = 50): \Illuminate\Contracts\Pagination\Paginator
    {
        return AuditLog::where('auditable_type', get_class($model))
            ->where('auditable_id', $model->id)
            ->orderBy('created_at', 'desc')
            ->paginate($limit);
    }

    /**
     * Get user activity
     */
    public static function getUserActivity(int $userId, int $limit = 50): \Illuminate\Contracts\Pagination\Paginator
    {
        return AuditLog::where('user_id', $userId)
            ->orderBy('created_at', 'desc')
            ->paginate($limit);
    }

    /**
     * Get action audit log
     */
    public static function getActionLog(string $action, int $limit = 50): \Illuminate\Contracts\Pagination\Paginator
    {
        return AuditLog::where('action', $action)
            ->orderBy('created_at', 'desc')
            ->paginate($limit);
    }
}
