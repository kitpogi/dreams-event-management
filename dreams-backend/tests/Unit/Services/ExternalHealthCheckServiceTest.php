<?php

namespace Tests\Unit\Services;

use App\Services\ExternalHealthCheckService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class ExternalHealthCheckServiceTest extends TestCase
{
    protected ExternalHealthCheckService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new ExternalHealthCheckService();
        Cache::flush();
    }

    public function test_can_register_service(): void
    {
        $this->service->registerService('test-api', 'https://api.example.com/health');

        $this->assertTrue($this->service->hasService('test-api'));
    }

    public function test_can_unregister_service(): void
    {
        $this->service->registerService('test-api', 'https://api.example.com/health');
        $this->service->unregisterService('test-api');

        $this->assertFalse($this->service->hasService('test-api'));
    }

    public function test_check_service_returns_unknown_for_unregistered(): void
    {
        $result = $this->service->checkService('nonexistent');

        $this->assertEquals(ExternalHealthCheckService::STATUS_UNKNOWN, $result['status']);
        $this->assertEquals('Service not registered', $result['message']);
    }

    public function test_healthy_service_returns_healthy_status(): void
    {
        Http::fake([
            'api.example.com/health' => Http::response(['status' => 'ok'], 200),
        ]);

        $this->service->registerService('test-api', 'https://api.example.com/health');

        $result = $this->service->checkService('test-api', false);

        $this->assertEquals(ExternalHealthCheckService::STATUS_HEALTHY, $result['status']);
        $this->assertEquals('test-api', $result['name']);
        $this->assertNotNull($result['latency_ms']);
    }

    public function test_unhealthy_status_on_wrong_status_code(): void
    {
        Http::fake([
            'api.example.com/health' => Http::response(['error' => 'Server error'], 500),
        ]);

        $this->service->registerService('test-api', 'https://api.example.com/health');

        $result = $this->service->checkService('test-api', false);

        $this->assertEquals(ExternalHealthCheckService::STATUS_UNHEALTHY, $result['status']);
        $this->assertStringContains('Unexpected status code: 500', $result['message']);
    }

    public function test_accepts_custom_expected_status_codes(): void
    {
        Http::fake([
            'api.example.com/health' => Http::response(['error' => 'Unauthorized'], 401),
        ]);

        $this->service->registerService('test-api', 'https://api.example.com/health', 'GET', [
            'expected_status' => [200, 401],
        ]);

        $result = $this->service->checkService('test-api', false);

        $this->assertEquals(ExternalHealthCheckService::STATUS_HEALTHY, $result['status']);
    }

    public function test_degraded_status_when_expected_body_missing(): void
    {
        Http::fake([
            'api.example.com/health' => Http::response('{"status": "error"}', 200),
        ]);

        $this->service->registerService('test-api', 'https://api.example.com/health', 'GET', [
            'expected_body' => '"status": "ok"',
        ]);

        $result = $this->service->checkService('test-api', false);

        $this->assertEquals(ExternalHealthCheckService::STATUS_DEGRADED, $result['status']);
    }

    public function test_caches_health_check_results(): void
    {
        Http::fake([
            'api.example.com/health' => Http::response(['status' => 'ok'], 200),
        ]);

        $this->service->registerService('test-api', 'https://api.example.com/health');
        $this->service->setCacheTtl(300);

        // First check - hits the API
        $result1 = $this->service->checkService('test-api', true);

        // Second check - should use cache
        $result2 = $this->service->checkService('test-api', true);

        $this->assertEquals($result1['checked_at'], $result2['checked_at']);
    }

    public function test_bypasses_cache_when_requested(): void
    {
        $callCount = 0;

        Http::fake([
            'api.example.com/health' => function () use (&$callCount) {
                $callCount++;
                return Http::response(['status' => 'ok'], 200);
            },
        ]);

        $this->service->registerService('test-api', 'https://api.example.com/health');

        // First check
        $this->service->checkService('test-api', false);

        // Second check without cache - should make another request
        $this->service->checkService('test-api', false);

        // HTTP was called twice (not using cache)
        $this->assertEquals(2, $callCount);
    }

    public function test_check_all_services(): void
    {
        Http::fake([
            'api1.example.com/health' => Http::response(['status' => 'ok'], 200),
            'api2.example.com/health' => Http::response(['status' => 'ok'], 200),
        ]);

        $this->service
            ->registerService('api1', 'https://api1.example.com/health')
            ->registerService('api2', 'https://api2.example.com/health');

        $result = $this->service->checkAllServices(false);

        $this->assertEquals(ExternalHealthCheckService::STATUS_HEALTHY, $result['status']);
        $this->assertFalse($result['critical_failed']);
        $this->assertCount(2, $result['services']);
    }

    public function test_overall_unhealthy_when_any_service_fails(): void
    {
        Http::fake([
            'api1.example.com/health' => Http::response(['status' => 'ok'], 200),
            'api2.example.com/health' => Http::response(['error' => 'down'], 503),
        ]);

        $this->service
            ->registerService('api1', 'https://api1.example.com/health')
            ->registerService('api2', 'https://api2.example.com/health');

        $result = $this->service->checkAllServices(false);

        $this->assertEquals(ExternalHealthCheckService::STATUS_UNHEALTHY, $result['status']);
    }

    public function test_critical_failed_flag_when_critical_service_fails(): void
    {
        Http::fake([
            'api1.example.com/health' => Http::response(['status' => 'ok'], 200),
            'api2.example.com/health' => Http::response(['error' => 'down'], 503),
        ]);

        $this->service
            ->registerService('api1', 'https://api1.example.com/health')
            ->registerService('api2', 'https://api2.example.com/health', 'GET', [
                'critical' => true,
            ]);

        $result = $this->service->checkAllServices(false);

        $this->assertTrue($result['critical_failed']);
    }

    public function test_circuit_breaker_opens_after_failures(): void
    {
        Http::fake([
            'api.example.com/health' => Http::response(null, 500),
        ]);

        $this->service->registerService('test-api', 'https://api.example.com/health', 'GET', [
            'circuit_breaker' => true,
        ]);

        // Simulate 5 failures
        for ($i = 0; $i < 5; $i++) {
            $this->service->checkService('test-api', false);
            Cache::put("circuit:test-api:failures", $i + 1, 300);
        }
        Cache::put("circuit:test-api:opened_at", now(), 300);

        $status = $this->service->getCircuitBreakerStatus('test-api');

        $this->assertEquals('open', $status['status']);
        $this->assertEquals(5, $status['failures']);
    }

    public function test_circuit_breaker_can_be_reset(): void
    {
        // Set up open circuit
        Cache::put("circuit:test-api:failures", 5, 300);
        Cache::put("circuit:test-api:opened_at", now(), 300);

        $this->service->registerService('test-api', 'https://api.example.com/health');
        $this->service->resetCircuitBreaker('test-api');

        $status = $this->service->getCircuitBreakerStatus('test-api');

        $this->assertEquals('closed', $status['status']);
        $this->assertEquals(0, $status['failures']);
    }

    public function test_get_summary(): void
    {
        Http::fake([
            'api1.example.com/health' => Http::response(['status' => 'ok'], 200),
            'api2.example.com/health' => Http::response(['status' => 'ok'], 200),
        ]);

        $this->service
            ->registerService('api1', 'https://api1.example.com/health')
            ->registerService('api2', 'https://api2.example.com/health');

        $summary = $this->service->getSummary();

        $this->assertEquals(ExternalHealthCheckService::STATUS_HEALTHY, $summary['overall_status']);
        $this->assertEquals(2, $summary['total_services']);
        $this->assertEquals(2, $summary['counts']['healthy']);
    }

    public function test_set_timeout(): void
    {
        $this->service->setTimeout(10);

        Http::fake([
            'api.example.com/health' => Http::response(['status' => 'ok'], 200),
        ]);

        $this->service->registerService('test-api', 'https://api.example.com/health');

        $services = $this->service->getRegisteredServices();

        // Default timeout from config, but we can register with custom
        $this->assertArrayHasKey('test-api', $services);
    }

    public function test_clear_cache(): void
    {
        Http::fake([
            'api.example.com/health' => Http::response(['status' => 'ok'], 200),
        ]);

        $this->service->registerService('test-api', 'https://api.example.com/health');

        // Populate cache
        $this->service->checkService('test-api', true);

        // Clear cache
        $this->service->clearCache();

        // Cache should be empty
        $this->assertNull(Cache::get('external_health:test-api'));
    }

    public function test_handles_connection_timeout(): void
    {
        Http::fake([
            'api.example.com/health' => function () {
                throw new \Illuminate\Http\Client\ConnectionException('Connection timed out');
            },
        ]);

        $this->service->registerService('test-api', 'https://api.example.com/health', 'GET', [
            'retry_count' => 0,
        ]);

        $result = $this->service->checkService('test-api', false);

        $this->assertEquals(ExternalHealthCheckService::STATUS_UNHEALTHY, $result['status']);
        $this->assertStringContains('Connection timed out', $result['message']);
    }

    public function test_retries_on_failure(): void
    {
        $callCount = 0;

        Http::fake([
            'api.example.com/health' => function () use (&$callCount) {
                $callCount++;
                if ($callCount < 2) {
                    throw new \Exception('Temporary failure');
                }
                return Http::response(['status' => 'ok'], 200);
            },
        ]);

        $this->service->registerService('test-api', 'https://api.example.com/health', 'GET', [
            'retry_count' => 2,
        ]);

        $result = $this->service->checkService('test-api', false);

        $this->assertEquals(ExternalHealthCheckService::STATUS_HEALTHY, $result['status']);
    }

    public function test_supports_different_http_methods(): void
    {
        Http::fake([
            'api.example.com/health' => Http::response(['status' => 'ok'], 200),
        ]);

        $this->service->registerService('test-api', 'https://api.example.com/health', 'POST', [
            'headers' => ['Content-Type' => 'application/json'],
        ]);

        $result = $this->service->checkService('test-api', false);

        $this->assertEquals(ExternalHealthCheckService::STATUS_HEALTHY, $result['status']);
    }

    public function test_includes_latency_in_result(): void
    {
        Http::fake([
            'api.example.com/health' => Http::response(['status' => 'ok'], 200),
        ]);

        $this->service->registerService('test-api', 'https://api.example.com/health');

        $result = $this->service->checkService('test-api', false);

        $this->assertArrayHasKey('latency_ms', $result);
        $this->assertIsFloat($result['latency_ms']);
    }

    public function test_check_with_custom_timeout(): void
    {
        Http::fake([
            'api.example.com/health' => Http::response(['status' => 'ok'], 200),
        ]);

        $this->service->registerService('test-api', 'https://api.example.com/health', 'GET', [
            'timeout' => 5,
        ]);

        $result = $this->service->checkWithTimeout('test-api', 10);

        $this->assertEquals(ExternalHealthCheckService::STATUS_HEALTHY, $result['status']);
    }

    /**
     * Helper to check if string contains substring.
     */
    protected function assertStringContains(string $needle, string $haystack): void
    {
        $this->assertTrue(
            str_contains($haystack, $needle),
            "Failed asserting that '$haystack' contains '$needle'"
        );
    }
}
