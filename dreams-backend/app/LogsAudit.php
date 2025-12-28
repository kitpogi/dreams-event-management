<?php

namespace App;

use App\Models\AuditLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;

trait LogsAudit
{
    /**
     * Log an audit action
     *
     * @param string $action Action name (e.g., 'package.created', 'booking.status_changed')
     * @param Model|null $model The model that was affected
     * @param array|null $oldValues Previous values (for updates)
     * @param array|null $newValues New values (for creates/updates)
     * @param string|null $description Custom description
     * @return AuditLog
     */
    protected function logAudit(
        string $action,
        ?Model $model = null,
        ?array $oldValues = null,
        ?array $newValues = null,
        ?string $description = null
    ): AuditLog {
        $user = Auth::user();
        $request = request();

        // Generate description if not provided
        if (!$description && $model) {
            $description = $this->generateDescription($action, $model, $oldValues, $newValues);
        }

        return AuditLog::create([
            'user_id' => $user?->id,
            'action' => $action,
            'model_type' => $model ? get_class($model) : null,
            'model_id' => $model?->id,
            'description' => $description,
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);
    }

    /**
     * Generate a human-readable description from action and model
     */
    private function generateDescription(string $action, Model $model, ?array $oldValues, ?array $newValues): string
    {
        $modelName = class_basename($model);
        $parts = explode('.', $action);
        $verb = $parts[1] ?? $parts[0];

        $descriptions = [
            'created' => "Created {$modelName} #{$model->id}",
            'updated' => "Updated {$modelName} #{$model->id}",
            'deleted' => "Deleted {$modelName} #{$model->id}",
            'status_changed' => "Changed status of {$modelName} #{$model->id}",
            'assigned' => "Assigned {$modelName} #{$model->id}",
            'unassigned' => "Unassigned {$modelName} #{$model->id}",
        ];

        $baseDescription = $descriptions[$verb] ?? ucfirst($verb) . " {$modelName} #{$model->id}";

        // Add specific details for status changes
        if ($verb === 'status_changed' && isset($oldValues['booking_status']) && isset($newValues['booking_status'])) {
            $baseDescription .= " from '{$oldValues['booking_status']}' to '{$newValues['booking_status']}'";
        }

        return $baseDescription;
    }
}
