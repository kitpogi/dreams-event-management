<?php

namespace App\Services\Auth;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Auth;
use Illuminate\Database\Eloquent\Model;

/**
 * Service for caching permission and authorization checks
 */
class PermissionCache
{
    const CACHE_PREFIX = 'permissions:';
    const CACHE_TTL = 3600; // 1 hour in seconds

    /**
     * Get cached permission result
     */
    public static function get(int $userId, string $resource, string $action): ?bool
    {
        $key = static::getCacheKey($userId, $resource, $action);
        return Cache::get($key);
    }

    /**
     * Set cached permission result
     */
    public static function set(int $userId, string $resource, string $action, bool $allowed, int $ttl = self::CACHE_TTL): void
    {
        $key = static::getCacheKey($userId, $resource, $action);
        Cache::put($key, $allowed, $ttl);
    }

    /**
     * Forget specific permission cache
     */
    public static function forget(int $userId, string $resource, string $action): void
    {
        $key = static::getCacheKey($userId, $resource, $action);
        Cache::forget($key);
    }

    /**
     * Forget all permissions for a user
     */
    public static function forgetUser(int $userId): void
    {
        $pattern = static::CACHE_PREFIX . "{$userId}:*";
        Cache::tags(['permissions'])->flush();
    }

    /**
     * Forget all permissions for a resource
     */
    public static function forgetResource(string $resource): void
    {
        // Typically called when resource permissions change
        Cache::tags(['permissions', $resource])->flush();
    }

    /**
     * Clear all permission cache
     */
    public static function flush(): void
    {
        Cache::tags(['permissions'])->flush();
    }

    /**
     * Check if permission is cached
     */
    public static function has(int $userId, string $resource, string $action): bool
    {
        $key = static::getCacheKey($userId, $resource, $action);
        return Cache::has($key);
    }

    /**
     * Remember permission check with caching
     */
    public static function remember(int $userId, string $resource, string $action, callable $callback, int $ttl = self::CACHE_TTL): bool
    {
        $key = static::getCacheKey($userId, $resource, $action);
        
        return Cache::remember($key, $ttl, function () use ($callback) {
            return $callback();
        });
    }

    /**
     * Get cache key
     */
    private static function getCacheKey(int $userId, string $resource, string $action): string
    {
        return static::CACHE_PREFIX . "{$userId}:{$resource}:{$action}";
    }
}
