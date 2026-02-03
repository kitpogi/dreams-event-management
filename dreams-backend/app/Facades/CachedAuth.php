<?php

namespace App\Facades;

use Illuminate\Support\Facades\Facade;

/**
 * Facade for easy access to cached authorization
 *
 * @method static bool can(string $ability, $resource = null, int $ttl = 3600)
 * @method static bool cannot(string $ability, $resource = null, int $ttl = 3600)
 * @method static void authorize(string $ability, $resource = null, int $ttl = 3600)
 * @method static void clearCache(string $ability, $resource = null)
 * @method static void clearUserCache(int $userId = null)
 */
class CachedAuth extends Facade
{
    protected static function getFacadeAccessor()
    {
        return \App\Services\Auth\CachedAuthorization::class;
    }
}
