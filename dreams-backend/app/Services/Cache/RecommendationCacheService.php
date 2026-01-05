<?php

namespace App\Services\Cache;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class RecommendationCacheService
{
    /**
     * Cache TTL in seconds (1 hour)
     */
    const CACHE_TTL = 3600;

    /**
     * Cache key prefix
     */
    const CACHE_PREFIX = 'recommendations_';

    /**
     * Generate a cache key from criteria
     *
     * @param array $criteria
     * @return string
     */
    public function generateCacheKey(array $criteria): string
    {
        // Normalize criteria for consistent cache keys
        $normalized = [
            'type' => $criteria['type'] ?? null,
            'budget' => isset($criteria['budget']) ? (float)$criteria['budget'] : null,
            'guests' => isset($criteria['guests']) ? (int)$criteria['guests'] : null,
            'theme' => isset($criteria['theme']) ? trim($criteria['theme']) : null,
            'preferences' => isset($criteria['preferences']) && is_array($criteria['preferences'])
                ? array_map('trim', $criteria['preferences'])
                : [],
        ];

        // Sort preferences array for consistent keys
        if (!empty($normalized['preferences'])) {
            sort($normalized['preferences']);
        }

        // Create a hash of the normalized criteria
        $hash = md5(json_encode($normalized));

        return self::CACHE_PREFIX . $hash;
    }

    /**
     * Get cached recommendations
     *
     * @param array $criteria
     * @return array|null Returns null if cache miss
     */
    public function get(array $criteria): ?array
    {
        $key = $this->generateCacheKey($criteria);

        try {
            $cached = Cache::get($key);
            
            if ($cached !== null) {
                Log::debug("Recommendation cache hit for key: {$key}");
                return $cached;
            }

            Log::debug("Recommendation cache miss for key: {$key}");
            return null;
        } catch (\Exception $e) {
            Log::error("Error retrieving recommendation cache: " . $e->getMessage());
            return null; // Return null on error to allow fallback to database
        }
    }

    /**
     * Store recommendations in cache
     *
     * @param array $criteria
     * @param array $results
     * @param int|null $ttl Optional TTL in seconds (defaults to CACHE_TTL)
     * @return bool
     */
    public function put(array $criteria, array $results, ?int $ttl = null): bool
    {
        $key = $this->generateCacheKey($criteria);
        $ttl = $ttl ?? self::CACHE_TTL;

        try {
            Cache::put($key, $results, $ttl);
            Log::debug("Recommendation cache stored for key: {$key} (TTL: {$ttl}s)");
            return true;
        } catch (\Exception $e) {
            Log::error("Error storing recommendation cache: " . $e->getMessage());
            return false; // Don't fail the request if cache fails
        }
    }

    /**
     * Forget cached recommendations for specific criteria
     *
     * @param array $criteria
     * @return bool
     */
    public function forget(array $criteria): bool
    {
        $key = $this->generateCacheKey($criteria);

        try {
            Cache::forget($key);
            Log::debug("Recommendation cache forgotten for key: {$key}");
            return true;
        } catch (\Exception $e) {
            Log::error("Error forgetting recommendation cache: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Clear all recommendation caches
     * This is useful when packages are updated globally
     *
     * @return bool
     */
    public function clearAll(): bool
    {
        try {
            // Note: Laravel doesn't have a direct way to clear keys by prefix
            // In production with Redis, you could use: Cache::tags(['recommendations'])->flush();
            // For now, we'll use a pattern-based approach or clear the entire cache
            // For safety, we'll just log and let manual cache clearing handle it
            Log::info("Recommendation cache clear all requested. Use 'php artisan cache:clear' or clear specific keys.");
            
            // If using Redis with tags (requires cache config setup):
            // Cache::tags(['recommendations'])->flush();
            
            return true;
        } catch (\Exception $e) {
            Log::error("Error clearing all recommendation cache: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Get cache statistics (for monitoring)
     *
     * @return array
     */
    public function getStats(): array
    {
        // This is a placeholder - actual implementation would depend on cache driver
        // For Redis, you could use INFO stats
        return [
            'driver' => config('cache.default'),
            'ttl' => self::CACHE_TTL,
            'prefix' => self::CACHE_PREFIX,
        ];
    }
}

