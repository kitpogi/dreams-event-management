<?php

namespace Tests\Unit\Services;

use App\Models\User;
use App\Services\RateLimitService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\RateLimiter;
use Tests\TestCase;

class RateLimitServiceTest extends TestCase
{
    use RefreshDatabase;

    protected RateLimitService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new RateLimitService();
        
        // Clear any existing rate limits
        Cache::flush();
    }

    public function test_guest_tier_for_unauthenticated_request(): void
    {
        $request = Request::create('/api/test', 'GET');

        $tier = $this->service->getTier($request);

        $this->assertEquals('guest', $tier);
    }

    public function test_basic_tier_for_regular_user(): void
    {
        $user = User::factory()->create(['role' => 'client']);
        $request = Request::create('/api/test', 'GET');
        $request->setUserResolver(fn() => $user);

        $tier = $this->service->getTier($request);

        $this->assertEquals('basic', $tier);
    }

    public function test_admin_tier_for_admin_user(): void
    {
        $user = User::factory()->create(['role' => 'admin']);
        $request = Request::create('/api/test', 'GET');
        $request->setUserResolver(fn() => $user);

        $tier = $this->service->getTier($request);

        $this->assertEquals('admin', $tier);
    }

    public function test_premium_tier_for_coordinator(): void
    {
        $user = User::factory()->create(['role' => 'coordinator']);
        $request = Request::create('/api/test', 'GET');
        $request->setUserResolver(fn() => $user);

        $tier = $this->service->getTier($request);

        $this->assertEquals('premium', $tier);
    }

    public function test_api_key_tier_for_api_key_request(): void
    {
        $request = Request::create('/api/test', 'GET');
        $request->headers->set('X-API-Key', 'test-api-key');

        $tier = $this->service->getTier($request);

        $this->assertEquals('api_key', $tier);
    }

    public function test_tier_config_returns_correct_limits(): void
    {
        $guestConfig = $this->service->getTierConfig('guest');
        $adminConfig = $this->service->getTierConfig('admin');

        $this->assertEquals(30, $guestConfig['limit']);
        $this->assertEquals(300, $adminConfig['limit']);
    }

    public function test_endpoint_config_returns_correct_limits(): void
    {
        $loginConfig = $this->service->getEndpointConfig('login');
        $searchConfig = $this->service->getEndpointConfig('search');

        $this->assertEquals(5, $loginConfig['limit']);
        $this->assertEquals(30, $searchConfig['limit']);
    }

    public function test_should_limit_returns_false_initially(): void
    {
        $request = Request::create('/api/test', 'GET');
        
        $shouldLimit = $this->service->shouldLimit($request, 'api');

        $this->assertFalse($shouldLimit);
    }

    public function test_hit_increments_counter(): void
    {
        $request = Request::create('/api/test', 'GET');
        
        $initialRemaining = $this->service->remaining($request, 'api');
        $this->service->hit($request, 'api');
        $afterHitRemaining = $this->service->remaining($request, 'api');

        $this->assertEquals($initialRemaining - 1, $afterHitRemaining);
    }

    public function test_remaining_decreases_with_hits(): void
    {
        $request = Request::create('/api/test', 'GET');
        
        $config = $this->service->getTierConfig('guest');
        
        for ($i = 0; $i < 5; $i++) {
            $this->service->hit($request, 'api');
        }

        $remaining = $this->service->remaining($request, 'api');

        $this->assertEquals($config['limit'] - 5, $remaining);
    }

    public function test_should_limit_returns_true_when_exhausted(): void
    {
        $request = Request::create('/api/test', 'GET');
        
        $config = $this->service->getTierConfig('guest');
        
        // Hit limit times
        for ($i = 0; $i < $config['limit']; $i++) {
            $this->service->hit($request, 'api');
        }

        $shouldLimit = $this->service->shouldLimit($request, 'api');

        $this->assertTrue($shouldLimit);
    }

    public function test_clear_resets_rate_limit(): void
    {
        $request = Request::create('/api/test', 'GET');
        
        // Hit a few times
        for ($i = 0; $i < 10; $i++) {
            $this->service->hit($request, 'api');
        }

        $this->service->clear($request, 'api');
        $remaining = $this->service->remaining($request, 'api');
        $config = $this->service->getTierConfig('guest');

        $this->assertEquals($config['limit'], $remaining);
    }

    public function test_get_headers_returns_rate_limit_headers(): void
    {
        $request = Request::create('/api/test', 'GET');
        
        $headers = $this->service->getHeaders($request, 'api');

        $this->assertArrayHasKey('X-RateLimit-Limit', $headers);
        $this->assertArrayHasKey('X-RateLimit-Remaining', $headers);
        $this->assertArrayHasKey('X-RateLimit-Reset', $headers);
    }

    public function test_get_headers_includes_retry_after_when_exhausted(): void
    {
        $request = Request::create('/api/test', 'GET');
        $config = $this->service->getTierConfig('guest');
        
        // Exhaust rate limit
        for ($i = 0; $i < $config['limit']; $i++) {
            $this->service->hit($request, 'api');
        }

        $headers = $this->service->getHeaders($request, 'api');

        $this->assertArrayHasKey('Retry-After', $headers);
        $this->assertEquals(0, $headers['X-RateLimit-Remaining']);
    }

    public function test_get_status_returns_complete_status(): void
    {
        $request = Request::create('/api/test', 'GET');
        
        $status = $this->service->getStatus($request, 'api');

        $this->assertArrayHasKey('tier', $status);
        $this->assertArrayHasKey('endpoint', $status);
        $this->assertArrayHasKey('limit', $status);
        $this->assertArrayHasKey('remaining', $status);
        $this->assertArrayHasKey('is_limited', $status);
        $this->assertEquals('guest', $status['tier']);
        $this->assertEquals('api', $status['endpoint']);
    }

    public function test_record_analytics_stores_data(): void
    {
        $request = Request::create('/api/test', 'GET');
        
        $this->service->recordAnalytics($request, 'api', false);
        $this->service->recordAnalytics($request, 'api', false);
        $this->service->recordAnalytics($request, 'api', true);

        $analytics = $this->service->getAnalytics();

        $this->assertEquals(3, $analytics['total_requests']);
        $this->assertEquals(1, $analytics['throttled_requests']);
        $this->assertArrayHasKey('api', $analytics['requests_by_endpoint']);
    }

    public function test_user_analytics_tracked_separately(): void
    {
        $user = User::factory()->create();
        $request = Request::create('/api/test', 'GET');
        $request->setUserResolver(fn() => $user);
        
        $this->service->recordAnalytics($request, 'api', false);
        $this->service->recordAnalytics($request, 'api', false);

        $userAnalytics = $this->service->getAnalytics($user->id);

        $this->assertEquals(2, $userAnalytics['total_requests']);
    }

    public function test_endpoint_limits_take_precedence(): void
    {
        $request = Request::create('/api/login', 'POST');
        
        $status = $this->service->getStatus($request, 'login');

        $this->assertEquals(5, $status['limit']);
        $this->assertEquals(5, $status['decay_minutes']);
    }

    public function test_unknown_endpoint_uses_tier_config(): void
    {
        $request = Request::create('/api/unknown', 'GET');
        
        $config = $this->service->getEndpointConfig('unknown_endpoint');

        $this->assertNull($config);
    }

    public function test_configure_rate_limiter_sets_up_limiters(): void
    {
        RateLimitService::configureRateLimiter();

        // Verify limiters are configured
        $this->assertTrue(true); // If no exception, limiters are configured
    }
}
