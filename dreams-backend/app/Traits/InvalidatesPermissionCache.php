<?php

namespace App\Traits;

use App\Services\Auth\PermissionCache;
use Illuminate\Database\Eloquent\Model;

/**
 * Trait for models to automatically clear cached permissions when they change
 */
trait InvalidatesPermissionCache
{
    /**
     * Boot the trait.
     */
    public static function bootInvalidatesPermissionCache(): void
    {
        // Clear permission cache when model is updated
        static::updated(function (Model $model) {
            // For coordinator/user model changes, clear all permission caches
            if (in_array(get_class($model), ['App\\Models\\User'])) {
                PermissionCache::forgetUser($model->id);
            }

            // For role or permission-related model changes
            PermissionCache::flush();
        });

        // Clear permission cache when model is deleted
        static::deleted(function (Model $model) {
            PermissionCache::flush();
        });

        // Clear permission cache when model is created
        static::created(function (Model $model) {
            // Clear cache to reflect new resource in permissions
            if (in_array(get_class($model), ['App\\Models\\BookingDetail'])) {
                PermissionCache::flush();
            }
        });
    }
}
