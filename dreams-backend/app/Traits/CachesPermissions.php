<?php

namespace App\Traits;

use App\Models\User;
use App\Services\PermissionCacheService;
use Illuminate\Database\Eloquent\Model;

/**
 * Trait for caching policy authorization checks.
 * 
 * Use this trait in Policy classes to automatically cache
 * authorization results for improved performance.
 */
trait CachesPermissions
{
    /**
     * Get the permission cache service
     */
    protected function getPermissionCache(): PermissionCacheService
    {
        return app(PermissionCacheService::class);
    }

    /**
     * Cache and return an authorization result
     */
    protected function cacheResult(User $user, string $ability, ?Model $model, bool $result): bool
    {
        $modelClass = $model ? get_class($model) : 'general';
        $modelId = $model ? $model->getKey() : null;
        
        $this->getPermissionCache()->cacheAuthorization(
            $user,
            $ability,
            $modelClass,
            $modelId,
            $result
        );

        return $result;
    }

    /**
     * Get cached authorization result or execute callback
     */
    protected function getCachedOrCheck(User $user, string $ability, ?Model $model, callable $check): bool
    {
        $modelClass = $model ? get_class($model) : 'general';
        $modelId = $model ? $model->getKey() : null;
        
        $cached = $this->getPermissionCache()->getCachedAuthorization(
            $user,
            $ability,
            $modelClass,
            $modelId
        );

        if ($cached !== null) {
            return $cached;
        }

        $result = $check();
        
        return $this->cacheResult($user, $ability, $model, $result);
    }

    /**
     * Check if user is admin (cached)
     */
    protected function isAdminCached(User $user): bool
    {
        return $this->getPermissionCache()->isAdmin($user);
    }

    /**
     * Check if user is coordinator (cached)
     */
    protected function isCoordinatorCached(User $user): bool
    {
        return $this->getPermissionCache()->isCoordinator($user);
    }

    /**
     * Check if user is client (cached)
     */
    protected function isClientCached(User $user): bool
    {
        return $this->getPermissionCache()->isClient($user);
    }
}
