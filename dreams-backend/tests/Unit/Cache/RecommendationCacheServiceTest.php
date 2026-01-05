<?php

namespace Tests\Unit\Cache;

use Tests\TestCase;
use App\Services\Cache\RecommendationCacheService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Foundation\Testing\RefreshDatabase;

class RecommendationCacheServiceTest extends TestCase
{
    use RefreshDatabase;

    protected $cacheService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->cacheService = new RecommendationCacheService();
        Cache::flush(); // Clear cache before each test
    }

    /** @test */
    public function it_generates_consistent_cache_keys_for_same_criteria()
    {
        $criteria1 = [
            'type' => 'wedding',
            'budget' => 50000,
            'guests' => 100,
            'theme' => 'elegant',
            'preferences' => ['flowers', 'music'],
        ];

        $criteria2 = [
            'type' => 'wedding',
            'budget' => 50000,
            'guests' => 100,
            'theme' => 'elegant',
            'preferences' => ['flowers', 'music'],
        ];

        $key1 = $this->cacheService->generateCacheKey($criteria1);
        $key2 = $this->cacheService->generateCacheKey($criteria2);

        $this->assertEquals($key1, $key2);
    }

    /** @test */
    public function it_generates_different_cache_keys_for_different_criteria()
    {
        $criteria1 = ['type' => 'wedding', 'budget' => 50000];
        $criteria2 = ['type' => 'birthday', 'budget' => 50000];

        $key1 = $this->cacheService->generateCacheKey($criteria1);
        $key2 = $this->cacheService->generateCacheKey($criteria2);

        $this->assertNotEquals($key1, $key2);
    }

    /** @test */
    public function it_normalizes_preferences_array_order()
    {
        $criteria1 = [
            'preferences' => ['flowers', 'music', 'catering'],
        ];

        $criteria2 = [
            'preferences' => ['music', 'catering', 'flowers'], // Different order
        ];

        $key1 = $this->cacheService->generateCacheKey($criteria1);
        $key2 = $this->cacheService->generateCacheKey($criteria2);

        // Should generate same key despite different order
        $this->assertEquals($key1, $key2);
    }

    /** @test */
    public function it_handles_null_values_in_criteria()
    {
        $criteria = [
            'type' => null,
            'budget' => null,
            'guests' => null,
            'theme' => null,
            'preferences' => [],
        ];

        $key = $this->cacheService->generateCacheKey($criteria);
        $this->assertStringStartsWith('recommendations_', $key);
    }

    /** @test */
    public function it_stores_and_retrieves_cached_results()
    {
        $criteria = ['type' => 'wedding', 'budget' => 50000];
        $results = [
            ['id' => 1, 'name' => 'Package 1', 'score' => 0.9],
            ['id' => 2, 'name' => 'Package 2', 'score' => 0.8],
        ];

        // Store in cache
        $stored = $this->cacheService->put($criteria, $results);
        $this->assertTrue($stored);

        // Retrieve from cache
        $cached = $this->cacheService->get($criteria);
        $this->assertEquals($results, $cached);
    }

    /** @test */
    public function it_returns_null_on_cache_miss()
    {
        $criteria = ['type' => 'wedding', 'budget' => 50000];

        $cached = $this->cacheService->get($criteria);
        $this->assertNull($cached);
    }

    /** @test */
    public function it_forgets_cached_results()
    {
        $criteria = ['type' => 'wedding', 'budget' => 50000];
        $results = [['id' => 1, 'name' => 'Package 1']];

        // Store in cache
        $this->cacheService->put($criteria, $results);

        // Verify it's cached
        $this->assertNotNull($this->cacheService->get($criteria));

        // Forget cache
        $forgotten = $this->cacheService->forget($criteria);
        $this->assertTrue($forgotten);

        // Verify it's gone
        $this->assertNull($this->cacheService->get($criteria));
    }

    /** @test */
    public function it_handles_cache_expiration()
    {
        $criteria = ['type' => 'wedding'];
        $results = [['id' => 1, 'name' => 'Package 1']];

        // Store with very short TTL (1 second)
        $this->cacheService->put($criteria, $results, 1);

        // Should be available immediately
        $this->assertNotNull($this->cacheService->get($criteria));

        // Wait for expiration
        sleep(2);

        // Should be expired
        $this->assertNull($this->cacheService->get($criteria));
    }

    /** @test */
    public function it_handles_float_budget_values()
    {
        $criteria1 = ['budget' => 50000.0];
        $criteria2 = ['budget' => 50000];

        $key1 = $this->cacheService->generateCacheKey($criteria1);
        $key2 = $this->cacheService->generateCacheKey($criteria2);

        // Should generate same key (normalized to float)
        $this->assertEquals($key1, $key2);
    }

    /** @test */
    public function it_handles_string_integer_guests()
    {
        $criteria1 = ['guests' => 100];
        $criteria2 = ['guests' => '100'];

        $key1 = $this->cacheService->generateCacheKey($criteria1);
        $key2 = $this->cacheService->generateCacheKey($criteria2);

        // Should generate same key (normalized to int)
        $this->assertEquals($key1, $key2);
    }

    /** @test */
    public function it_trims_theme_strings()
    {
        $criteria1 = ['theme' => 'elegant'];
        $criteria2 = ['theme' => ' elegant ']; // With spaces

        $key1 = $this->cacheService->generateCacheKey($criteria1);
        $key2 = $this->cacheService->generateCacheKey($criteria2);

        // Should generate same key (trimmed)
        $this->assertEquals($key1, $key2);
    }

    /** @test */
    public function it_returns_cache_stats()
    {
        $stats = $this->cacheService->getStats();

        $this->assertIsArray($stats);
        $this->assertArrayHasKey('driver', $stats);
        $this->assertArrayHasKey('ttl', $stats);
        $this->assertArrayHasKey('prefix', $stats);
        $this->assertEquals('recommendations_', $stats['prefix']);
    }
}

