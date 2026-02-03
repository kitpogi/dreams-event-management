<?php

namespace App\Services\Auth;

use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Auth;

/**
 * Service for managing cached authorization checks
 */
class CachedAuthorization
{
    /**
     * Check if user can perform action on resource with caching
     */
    public static function can(string $ability, $resource = null, int $ttl = 3600): bool
    {
        if (!Auth::check()) {
            return false;
        }

        $user = Auth::user();
        $resourceKey = static::getResourceKey($resource);

        // Check cache first
        $cached = PermissionCache::get($user->id, $resourceKey, $ability);
        if ($cached !== null) {
            return $cached;
        }

        // Perform authorization check
        try {
            $allowed = Gate::allows($ability, $resource);
        } catch (\Exception $e) {
            // If authorization check fails, default to deny
            $allowed = false;
        }

        // Cache the result
        PermissionCache::set($user->id, $resourceKey, $ability, $allowed, $ttl);

        return $allowed;
    }

    /**
     * Check if user cannot perform action on resource with caching
     */
    public static function cannot(string $ability, $resource = null, int $ttl = 3600): bool
    {
        return !static::can($ability, $resource, $ttl);
    }

    /**
     * Authorize action with caching and throw exception if denied
     */
    public static function authorize(string $ability, $resource = null, int $ttl = 3600): void
    {
        if (!static::can($ability, $resource, $ttl)) {
            throw new \Illuminate\Auth\Access\AuthorizationException("This action is unauthorized.");
        }
    }

    /**
     * Clear cache for a specific ability and resource
     */
    public static function clearCache(string $ability, $resource = null): void
    {
        if (!Auth::check()) {
            return;
        }

        $user = Auth::user();
        $resourceKey = static::getResourceKey($resource);
        PermissionCache::forget($user->id, $resourceKey, $ability);
    }

    /**
     * Clear all caches for user
     */
    public static function clearUserCache(int $userId = null): void
    {
        $userId = $userId ?? Auth::id();
        
        if ($userId) {
            PermissionCache::forgetUser($userId);
        }
    }

    /**
     * Get resource key for caching
     */
    private static function getResourceKey($resource): string
    {
        if ($resource === null) {
            return 'global';
        }

        if (is_object($resource)) {
            return get_class($resource) . ':' . ($resource->id ?? 'unknown');
        }

        return (string) $resource;
    }
}
