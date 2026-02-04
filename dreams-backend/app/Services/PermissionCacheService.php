<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Cache;

/**
 * Service for caching permission checks to improve authorization performance.
 * 
 * Caches:
 * - User role checks (isAdmin, isCoordinator, isClient)
 * - Policy authorization results
 * - Client lookups by user email
 */
class PermissionCacheService
{
    /**
     * Cache TTL in seconds (5 minutes)
     */
    protected const CACHE_TTL = 300;

    /**
     * Cache prefix for permission keys
     */
    protected const CACHE_PREFIX = 'permissions:';

    /**
     * Check if user has a specific role (cached)
     */
    public function hasRole(User $user, string $role): bool
    {
        $cacheKey = $this->getRoleCacheKey($user, $role);

        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($user, $role) {
            return $user->role === $role;
        });
    }

    /**
     * Check if user is admin (cached)
     */
    public function isAdmin(User $user): bool
    {
        return $this->hasRole($user, 'admin');
    }

    /**
     * Check if user is coordinator (cached)
     */
    public function isCoordinator(User $user): bool
    {
        return $this->hasRole($user, 'coordinator');
    }

    /**
     * Check if user is client (cached)
     */
    public function isClient(User $user): bool
    {
        return $this->hasRole($user, 'client');
    }

    /**
     * Cache a policy authorization result
     */
    public function cacheAuthorization(User $user, string $ability, string $modelClass, ?int $modelId, bool $result): void
    {
        $cacheKey = $this->getAuthorizationCacheKey($user, $ability, $modelClass, $modelId);
        Cache::put($cacheKey, $result, self::CACHE_TTL);
    }

    /**
     * Get cached policy authorization result
     */
    public function getCachedAuthorization(User $user, string $ability, string $modelClass, ?int $modelId): ?bool
    {
        $cacheKey = $this->getAuthorizationCacheKey($user, $ability, $modelClass, $modelId);
        
        if (Cache::has($cacheKey)) {
            return Cache::get($cacheKey);
        }

        return null;
    }

    /**
     * Clear all permission cache for a specific user
     */
    public function clearUserCache(User $user): void
    {
        $pattern = self::CACHE_PREFIX . "user:{$user->id}:*";
        
        // For drivers that support tags, use tags
        if ($this->supportsCacheTags()) {
            Cache::tags(['permissions', "user:{$user->id}"])->flush();
        } else {
            // For file/database cache, manually clear known keys
            $roles = ['admin', 'coordinator', 'client'];
            foreach ($roles as $role) {
                Cache::forget($this->getRoleCacheKey($user, $role));
            }
        }
    }

    /**
     * Clear all permission cache
     */
    public function clearAllCache(): void
    {
        if ($this->supportsCacheTags()) {
            Cache::tags(['permissions'])->flush();
        }
        // For drivers without tags, cache will expire naturally
    }

    /**
     * Check if cache driver supports tags
     */
    protected function supportsCacheTags(): bool
    {
        $driver = config('cache.default');
        return in_array($driver, ['redis', 'memcached', 'dynamodb']);
    }

    /**
     * Generate cache key for role check
     */
    protected function getRoleCacheKey(User $user, string $role): string
    {
        return self::CACHE_PREFIX . "user:{$user->id}:role:{$role}";
    }

    /**
     * Generate cache key for authorization check
     */
    protected function getAuthorizationCacheKey(User $user, string $ability, string $modelClass, ?int $modelId): string
    {
        $modelKey = $modelId ? "{$modelClass}:{$modelId}" : $modelClass;
        return self::CACHE_PREFIX . "user:{$user->id}:auth:{$ability}:{$modelKey}";
    }

    /**
     * Remember a permission check result
     */
    public function remember(string $key, callable $callback, ?int $ttl = null): mixed
    {
        $cacheKey = self::CACHE_PREFIX . $key;
        return Cache::remember($cacheKey, $ttl ?? self::CACHE_TTL, $callback);
    }
}
