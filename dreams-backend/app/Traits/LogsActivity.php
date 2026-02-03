<?php

namespace App\Traits;

use App\Services\Logging\AuditLogger;

/**
 * Trait for automatically logging model changes via audit logs
 */
trait LogsActivity
{
    /**
     * Boot the trait.
     */
    public static function bootLogsActivity(): void
    {
        static::created(function ($model) {
            AuditLogger::logCreate($model, $model->toArray());
        });

        static::updated(function ($model) {
            $original = $model->getOriginal();
            $changes = $model->getDirty();
            AuditLogger::logUpdate($model, $original, $changes);
        });

        static::deleted(function ($model) {
            AuditLogger::logDelete($model);
        });

        static::restored(function ($model) {
            AuditLogger::logAction('restore', $model, ['restored_data' => $model->toArray()]);
        });
    }
}
