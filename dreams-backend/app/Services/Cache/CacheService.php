<?php

namespace App\Services\Cache;

use Closure;
use Illuminate\Contracts\Cache\Repository;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

/**
 * Advanced caching service with support for:
 * - Cache tags (Redis/Memcached)
 * - TTL presets
 * - Cache warming
 * - Statistics tracking
 * - Graceful fallback for non-taggable stores
 */
class CacheService
{
    protected Repository $cache;
    protected bool $tagsSupported;
    protected string $prefix;

    public function __construct()
    {
        $this->cache = Cache::store();
        $this->tagsSupported = $this->checkTagsSupport();
        $this->prefix = config('cache.prefix', 'dreams_');
    }

    /**
     * Check if the current cache driver supports tags.
     */
    protected function checkTagsSupport(): bool
    {
        $driver = config('cache.default');
        return in_array($driver, ['redis', 'memcached', 'array'], true);
    }

    /**
     * Get a cached value or execute callback and cache result.
     */
    public function remember(string $key, mixed $ttl, Closure $callback, array $tags = []): mixed
    {
        $cacheKey = $this->buildKey($key);
        $ttlSeconds = $this->resolveTtl($ttl);

        try {
            if ($this->tagsSupported && !empty($tags)) {
                return Cache::tags($tags)->remember($cacheKey, $ttlSeconds, $callback);
            }

            return Cache::remember($cacheKey, $ttlSeconds, $callback);
        } catch (\Exception $e) {
            Log::warning('Cache operation failed, executing callback directly', [
                'key' => $cacheKey,
                'error' => $e->getMessage(),
            ]);

            return $callback();
        }
    }

    /**
     * Get a cached value or execute callback (forever cache).
     */
    public function rememberForever(string $key, Closure $callback, array $tags = []): mixed
    {
        $cacheKey = $this->buildKey($key);

        try {
            if ($this->tagsSupported && !empty($tags)) {
                return Cache::tags($tags)->rememberForever($cacheKey, $callback);
            }

            return Cache::rememberForever($cacheKey, $callback);
        } catch (\Exception $e) {
            Log::warning('Cache operation failed, executing callback directly', [
                'key' => $cacheKey,
                'error' => $e->getMessage(),
            ]);

            return $callback();
        }
    }

    /**
     * Put a value in cache.
     */
    public function put(string $key, mixed $value, mixed $ttl = 'default', array $tags = []): bool
    {
        $cacheKey = $this->buildKey($key);
        $ttlSeconds = $this->resolveTtl($ttl);

        try {
            if ($this->tagsSupported && !empty($tags)) {
                return Cache::tags($tags)->put($cacheKey, $value, $ttlSeconds);
            }

            return Cache::put($cacheKey, $value, $ttlSeconds);
        } catch (\Exception $e) {
            Log::warning('Cache put failed', [
                'key' => $cacheKey,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }

    /**
     * Get a value from cache.
     */
    public function get(string $key, mixed $default = null, array $tags = []): mixed
    {
        $cacheKey = $this->buildKey($key);

        try {
            if ($this->tagsSupported && !empty($tags)) {
                return Cache::tags($tags)->get($cacheKey, $default);
            }

            return Cache::get($cacheKey, $default);
        } catch (\Exception $e) {
            Log::warning('Cache get failed', [
                'key' => $cacheKey,
                'error' => $e->getMessage(),
            ]);

            return $default;
        }
    }

    /**
     * Check if a key exists in cache.
     */
    public function has(string $key, array $tags = []): bool
    {
        $cacheKey = $this->buildKey($key);

        try {
            if ($this->tagsSupported && !empty($tags)) {
                return Cache::tags($tags)->has($cacheKey);
            }

            return Cache::has($cacheKey);
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Remove a key from cache.
     */
    public function forget(string $key, array $tags = []): bool
    {
        $cacheKey = $this->buildKey($key);

        try {
            if ($this->tagsSupported && !empty($tags)) {
                return Cache::tags($tags)->forget($cacheKey);
            }

            return Cache::forget($cacheKey);
        } catch (\Exception $e) {
            Log::warning('Cache forget failed', [
                'key' => $cacheKey,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }

    /**
     * Flush all cached items with specific tags.
     */
    public function flushTags(array $tags): bool
    {
        if (!$this->tagsSupported) {
            Log::warning('Cache tags not supported by current driver');
            return false;
        }

        try {
            Cache::tags($tags)->flush();
            return true;
        } catch (\Exception $e) {
            Log::warning('Cache flush tags failed', [
                'tags' => $tags,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }

    /**
     * Flush all cache.
     */
    public function flush(): bool
    {
        try {
            Cache::flush();
            return true;
        } catch (\Exception $e) {
            Log::warning('Cache flush failed', [
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }

    /**
     * Increment a cached value.
     */
    public function increment(string $key, int $value = 1): int|bool
    {
        $cacheKey = $this->buildKey($key);

        try {
            return Cache::increment($cacheKey, $value);
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Decrement a cached value.
     */
    public function decrement(string $key, int $value = 1): int|bool
    {
        $cacheKey = $this->buildKey($key);

        try {
            return Cache::decrement($cacheKey, $value);
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Get multiple values from cache.
     */
    public function many(array $keys): array
    {
        $cacheKeys = array_map(fn($key) => $this->buildKey($key), $keys);

        try {
            $values = Cache::many($cacheKeys);

            // Re-map to original keys
            $result = [];
            foreach ($keys as $index => $originalKey) {
                $cacheKey = $cacheKeys[$index];
                $result[$originalKey] = $values[$cacheKey] ?? null;
            }

            return $result;
        } catch (\Exception $e) {
            return array_fill_keys($keys, null);
        }
    }

    /**
     * Put multiple values in cache.
     */
    public function putMany(array $values, mixed $ttl = 'default'): bool
    {
        $ttlSeconds = $this->resolveTtl($ttl);
        $cacheValues = [];

        foreach ($values as $key => $value) {
            $cacheValues[$this->buildKey($key)] = $value;
        }

        try {
            return Cache::putMany($cacheValues, $ttlSeconds);
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Acquire a cache lock.
     */
    public function lock(string $key, int $seconds = 10, ?string $owner = null): mixed
    {
        $lockKey = $this->buildKey("lock:{$key}");

        try {
            return Cache::lock($lockKey, $seconds, $owner);
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Build a prefixed cache key.
     */
    protected function buildKey(string $key): string
    {
        return $key; // Prefix is handled by Laravel's cache config
    }

    /**
     * Resolve TTL from preset name or seconds.
     */
    protected function resolveTtl(mixed $ttl): int
    {
        if (is_int($ttl)) {
            return $ttl;
        }

        if (is_string($ttl)) {
            return (int) config("cache.ttl.{$ttl}", config('cache.ttl.default', 3600));
        }

        return (int) config('cache.ttl.default', 3600);
    }

    /**
     * Get cache statistics (if supported).
     */
    public function getStatistics(): array
    {
        $driver = config('cache.default');

        if ($driver === 'redis') {
            try {
                $redis = Cache::getRedis();
                $info = $redis->info();

                return [
                    'driver' => 'redis',
                    'connected_clients' => $info['connected_clients'] ?? null,
                    'used_memory' => $info['used_memory_human'] ?? null,
                    'total_keys' => $info['db0']['keys'] ?? 0,
                    'hits' => $info['keyspace_hits'] ?? null,
                    'misses' => $info['keyspace_misses'] ?? null,
                    'hit_rate' => $this->calculateHitRate(
                        $info['keyspace_hits'] ?? 0,
                        $info['keyspace_misses'] ?? 0
                    ),
                ];
            } catch (\Exception $e) {
                return [
                    'driver' => 'redis',
                    'error' => $e->getMessage(),
                ];
            }
        }

        return [
            'driver' => $driver,
            'tags_supported' => $this->tagsSupported,
        ];
    }

    /**
     * Calculate cache hit rate percentage.
     */
    protected function calculateHitRate(int $hits, int $misses): float
    {
        $total = $hits + $misses;
        if ($total === 0) {
            return 0.0;
        }

        return round(($hits / $total) * 100, 2);
    }

    /**
     * Check if tags are supported.
     */
    public function supportsTagging(): bool
    {
        return $this->tagsSupported;
    }

    /**
     * Warm cache with specific data.
     */
    public function warm(array $warmers): array
    {
        $results = [];

        foreach ($warmers as $key => $config) {
            $callback = $config['callback'] ?? null;
            $ttl = $config['ttl'] ?? 'default';
            $tags = $config['tags'] ?? [];

            if (!$callback || !is_callable($callback)) {
                $results[$key] = ['success' => false, 'error' => 'Invalid callback'];
                continue;
            }

            try {
                $value = $callback();
                $this->put($key, $value, $ttl, $tags);
                $results[$key] = ['success' => true];
            } catch (\Exception $e) {
                $results[$key] = ['success' => false, 'error' => $e->getMessage()];
            }
        }

        return $results;
    }
}
