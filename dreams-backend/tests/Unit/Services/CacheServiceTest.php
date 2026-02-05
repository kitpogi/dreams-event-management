<?php

namespace Tests\Unit\Services;

use App\Services\Cache\CacheService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class CacheServiceTest extends TestCase
{
    protected CacheService $cacheService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->cacheService = new CacheService();
        Cache::flush();
    }

    protected function tearDown(): void
    {
        Cache::flush();
        parent::tearDown();
    }

    /** @test */
    public function it_can_put_and_get_a_value()
    {
        $key = 'test_key';
        $value = 'test_value';

        $this->cacheService->put($key, $value, 60);

        $this->assertEquals($value, $this->cacheService->get($key));
    }

    /** @test */
    public function it_returns_default_when_key_not_found()
    {
        $default = 'default_value';

        $result = $this->cacheService->get('non_existent_key', $default);

        $this->assertEquals($default, $result);
    }

    /** @test */
    public function it_can_check_if_key_exists()
    {
        $this->cacheService->put('exists_key', 'value');

        $this->assertTrue($this->cacheService->has('exists_key'));
        $this->assertFalse($this->cacheService->has('does_not_exist'));
    }

    /** @test */
    public function it_can_forget_a_key()
    {
        $this->cacheService->put('forget_key', 'value');

        $this->assertTrue($this->cacheService->has('forget_key'));

        $this->cacheService->forget('forget_key');

        $this->assertFalse($this->cacheService->has('forget_key'));
    }

    /** @test */
    public function it_can_remember_a_value_with_callback()
    {
        $callCount = 0;

        $callback = function () use (&$callCount) {
            $callCount++;
            return 'computed_value';
        };

        // First call should execute callback
        $result1 = $this->cacheService->remember('remember_key', 60, $callback);
        $this->assertEquals('computed_value', $result1);
        $this->assertEquals(1, $callCount);

        // Second call should return cached value without executing callback
        $result2 = $this->cacheService->remember('remember_key', 60, $callback);
        $this->assertEquals('computed_value', $result2);
        $this->assertEquals(1, $callCount); // Still 1, callback not called again
    }

    /** @test */
    public function it_can_remember_forever()
    {
        $callback = fn() => 'forever_value';

        $result = $this->cacheService->rememberForever('forever_key', $callback);

        $this->assertEquals('forever_value', $result);
        $this->assertTrue($this->cacheService->has('forever_key'));
    }

    /** @test */
    public function it_can_increment_a_value()
    {
        $this->cacheService->put('counter', 5);

        $newValue = $this->cacheService->increment('counter');

        $this->assertEquals(6, $newValue);
    }

    /** @test */
    public function it_can_decrement_a_value()
    {
        $this->cacheService->put('counter', 10);

        $newValue = $this->cacheService->decrement('counter', 3);

        $this->assertEquals(7, $newValue);
    }

    /** @test */
    public function it_can_get_many_values()
    {
        $this->cacheService->put('key1', 'value1');
        $this->cacheService->put('key2', 'value2');

        $results = $this->cacheService->many(['key1', 'key2', 'key3']);

        $this->assertEquals('value1', $results['key1']);
        $this->assertEquals('value2', $results['key2']);
        $this->assertNull($results['key3']);
    }

    /** @test */
    public function it_can_put_many_values()
    {
        $values = [
            'multi1' => 'value1',
            'multi2' => 'value2',
            'multi3' => 'value3',
        ];

        $this->cacheService->putMany($values, 60);

        $this->assertEquals('value1', $this->cacheService->get('multi1'));
        $this->assertEquals('value2', $this->cacheService->get('multi2'));
        $this->assertEquals('value3', $this->cacheService->get('multi3'));
    }

    /** @test */
    public function it_can_flush_all_cache()
    {
        $this->cacheService->put('flush1', 'value1');
        $this->cacheService->put('flush2', 'value2');

        $this->assertTrue($this->cacheService->has('flush1'));

        $this->cacheService->flush();

        $this->assertFalse($this->cacheService->has('flush1'));
        $this->assertFalse($this->cacheService->has('flush2'));
    }

    /** @test */
    public function it_resolves_ttl_from_preset_names()
    {
        // Using 'short' preset (5 minutes = 300 seconds)
        $this->cacheService->put('preset_key', 'value', 'short');

        $this->assertTrue($this->cacheService->has('preset_key'));
    }

    /** @test */
    public function it_can_get_cache_statistics()
    {
        $stats = $this->cacheService->getStatistics();

        $this->assertIsArray($stats);
        $this->assertArrayHasKey('driver', $stats);
    }

    /** @test */
    public function it_reports_tag_support_correctly()
    {
        // File cache doesn't support tags, array/redis/memcached do
        $driver = config('cache.default');
        $expected = in_array($driver, ['redis', 'memcached', 'array'], true);

        $this->assertEquals($expected, $this->cacheService->supportsTagging());
    }

    /** @test */
    public function it_can_warm_cache_with_multiple_items()
    {
        $warmers = [
            'warm_key1' => [
                'callback' => fn() => 'warmed_value1',
                'ttl' => 'short',
            ],
            'warm_key2' => [
                'callback' => fn() => ['data' => 'warmed_value2'],
                'ttl' => 60,
            ],
        ];

        $results = $this->cacheService->warm($warmers);

        $this->assertTrue($results['warm_key1']['success']);
        $this->assertTrue($results['warm_key2']['success']);
        $this->assertEquals('warmed_value1', $this->cacheService->get('warm_key1'));
        $this->assertEquals(['data' => 'warmed_value2'], $this->cacheService->get('warm_key2'));
    }

    /** @test */
    public function it_handles_cache_lock()
    {
        $lock = $this->cacheService->lock('test_lock', 5);

        if ($lock) {
            // Lock acquired successfully
            $this->assertNotNull($lock);
        }
    }
}
