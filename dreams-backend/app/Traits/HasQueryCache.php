<?php

namespace App\Traits;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Cache;

/**
 * Trait for adding query result caching to Eloquent models.
 *
 * Usage in Model:
 *   use HasQueryCache;
 *
 *   protected int $cacheSeconds = 3600; // Default TTL
 *   protected array $cacheTags = ['packages']; // Cache tags for invalidation
 */
trait HasQueryCache
{
    /**
     * Get cache seconds for this model.
     */
    public function getCacheSeconds(): int
    {
        return $this->cacheSeconds ?? config('cache.ttl.default', 3600);
    }

    /**
     * Get cache tags for this model.
     */
    public function getCacheTags(): array
    {
        return $this->cacheTags ?? [static::class];
    }

    /**
     * Scope to cache the query results.
     */
    public function scopeCached(Builder $query, ?int $seconds = null, ?string $key = null): Builder
    {
        $ttl = $seconds ?? $this->getCacheSeconds();
        $cacheKey = $key ?? $this->generateCacheKey($query);

        return $query->cacheFor($ttl, $cacheKey);
    }

    /**
     * Get all records with caching.
     */
    public static function allCached(?int $seconds = null): \Illuminate\Database\Eloquent\Collection
    {
        $instance = new static();
        $ttl = $seconds ?? $instance->getCacheSeconds();
        $cacheKey = static::class . ':all';
        $tags = $instance->getCacheTags();

        return static::cacheQuery($cacheKey, $ttl, $tags, function () {
            return static::all();
        });
    }

    /**
     * Find a record by ID with caching.
     */
    public static function findCached(mixed $id, ?int $seconds = null): ?static
    {
        $instance = new static();
        $ttl = $seconds ?? $instance->getCacheSeconds();
        $cacheKey = static::class . ':find:' . $id;
        $tags = $instance->getCacheTags();

        return static::cacheQuery($cacheKey, $ttl, $tags, function () use ($id) {
            return static::find($id);
        });
    }

    /**
     * Execute and cache a query.
     */
    protected static function cacheQuery(string $key, int $ttl, array $tags, callable $callback): mixed
    {
        $driver = config('cache.default');

        // Use tags if supported
        if (in_array($driver, ['redis', 'memcached', 'array'], true) && !empty($tags)) {
            return Cache::tags($tags)->remember($key, $ttl, $callback);
        }

        return Cache::remember($key, $ttl, $callback);
    }

    /**
     * Clear all cache for this model.
     */
    public static function clearCache(): bool
    {
        $instance = new static();
        $tags = $instance->getCacheTags();
        $driver = config('cache.default');

        if (in_array($driver, ['redis', 'memcached', 'array'], true) && !empty($tags)) {
            try {
                Cache::tags($tags)->flush();
                return true;
            } catch (\Exception $e) {
                return false;
            }
        }

        // For file/database cache, we can't selectively clear
        return false;
    }

    /**
     * Clear cache for a specific record.
     */
    public static function clearCacheForId(mixed $id): bool
    {
        $cacheKey = static::class . ':find:' . $id;

        try {
            return Cache::forget($cacheKey);
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Generate a cache key based on the query.
     */
    protected function generateCacheKey(Builder $query): string
    {
        $sql = $query->toSql();
        $bindings = $query->getBindings();

        return static::class . ':query:' . md5($sql . serialize($bindings));
    }

    /**
     * Boot the trait to set up automatic cache invalidation.
     */
    public static function bootHasQueryCache(): void
    {
        static::saved(function ($model) {
            $model::clearCache();
            $model::clearCacheForId($model->getKey());
        });

        static::deleted(function ($model) {
            $model::clearCache();
            $model::clearCacheForId($model->getKey());
        });
    }
}
