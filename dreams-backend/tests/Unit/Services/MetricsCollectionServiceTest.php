<?php

namespace Tests\Unit\Services;

use App\Services\MetricsCollectionService;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class MetricsCollectionServiceTest extends TestCase
{
    protected MetricsCollectionService $metrics;
    protected string $testPrefix;

    protected function setUp(): void
    {
        parent::setUp();
        $this->testPrefix = 'test_' . uniqid() . '_';
        $this->metrics = new MetricsCollectionService();
        Cache::flush();
    }

    public function test_increment_counter(): void
    {
        $this->metrics->increment('test_counter');
        $this->metrics->increment('test_counter');
        $this->metrics->increment('test_counter');

        $value = $this->metrics->get('test_counter');

        $this->assertEquals(3, $value);
    }

    public function test_increment_counter_with_labels(): void
    {
        $this->metrics->increment('http_requests', ['method' => 'GET', 'status' => '200']);
        $this->metrics->increment('http_requests', ['method' => 'GET', 'status' => '200']);
        $this->metrics->increment('http_requests', ['method' => 'POST', 'status' => '201']);

        $getRequests = $this->metrics->get('http_requests', ['method' => 'GET', 'status' => '200']);
        $postRequests = $this->metrics->get('http_requests', ['method' => 'POST', 'status' => '201']);

        $this->assertEquals(2, $getRequests);
        $this->assertEquals(1, $postRequests);
    }

    public function test_increment_with_custom_value(): void
    {
        $this->metrics->increment('test_counter', [], 5);
        $this->metrics->increment('test_counter', [], 3);

        $value = $this->metrics->get('test_counter');

        $this->assertEquals(8, $value);
    }

    public function test_decrement_gauge(): void
    {
        $this->metrics->increment('active_connections', [], 10);
        $this->metrics->decrement('active_connections', [], 3);

        $value = $this->metrics->get('active_connections');

        $this->assertEquals(7, $value);
    }

    public function test_gauge_sets_value(): void
    {
        $this->metrics->gauge('temperature', 72.5);
        $this->metrics->gauge('temperature', 75.0);

        $value = $this->metrics->get('temperature');

        $this->assertEquals(75.0, $value);
    }

    public function test_gauge_with_labels(): void
    {
        $this->metrics->gauge('cpu_usage', 45.5, ['core' => '0']);
        $this->metrics->gauge('cpu_usage', 55.0, ['core' => '1']);

        $core0 = $this->metrics->get('cpu_usage', ['core' => '0']);
        $core1 = $this->metrics->get('cpu_usage', ['core' => '1']);

        $this->assertEquals(45.5, $core0);
        $this->assertEquals(55.0, $core1);
    }

    public function test_histogram_observation(): void
    {
        $name = $this->testPrefix . 'response_time1';
        $this->metrics->histogram($name, 0.05);
        $this->metrics->histogram($name, 0.15);
        $this->metrics->histogram($name, 0.5);

        $histogram = $this->metrics->getHistogram($name);

        $this->assertEquals(3, $histogram['count']);
        $this->assertEquals(0.7, $histogram['sum']);
    }

    public function test_histogram_buckets(): void
    {
        $name = $this->testPrefix . 'response_time2';
        $this->metrics->histogram($name, 0.008); // <= 0.01
        $this->metrics->histogram($name, 0.15);  // <= 0.25
        $this->metrics->histogram($name, 0.8);   // <= 1

        $histogram = $this->metrics->getHistogram($name);

        // Bucket keys are strings to preserve float precision
        // Bucket 0.01: only 0.008 is <= 0.01
        $this->assertEquals(1, $histogram['buckets']['0.01'], 'Bucket 0.01 should only have 1 value (0.008)');
        // Bucket 0.25: 0.008 and 0.15 are <= 0.25
        $this->assertEquals(2, $histogram['buckets']['0.25'], 'Bucket 0.25 should have 2 values (0.008, 0.15)');
        // Bucket 1: all values are <= 1
        $this->assertEquals(3, $histogram['buckets']['1'], 'Bucket 1 should have 3 values');
        $this->assertEquals(3, $histogram['buckets']['+Inf'], 'Bucket +Inf should have all 3 values');
    }

    public function test_observe_response_time(): void
    {
        $this->metrics->observeResponseTime('/api/users', 150.5, 'GET', 200);
        $this->metrics->observeResponseTime('/api/users', 200.0, 'GET', 200);

        $histogram = $this->metrics->getHistogram('http_request_duration_ms', [
            'endpoint' => '/api/users',
            'method' => 'GET',
            'status' => '200',
        ]);

        $this->assertEquals(2, $histogram['count']);
        $this->assertEquals(350.5, $histogram['sum']);
    }

    public function test_track_api_request(): void
    {
        $this->metrics->trackApiRequest('/api/bookings', 'POST', 201);
        $this->metrics->trackApiRequest('/api/bookings', 'GET', 200);
        $this->metrics->trackApiRequest('/api/bookings', 'GET', 200);

        $postCount = $this->metrics->get('http_requests_total', [
            'endpoint' => '/api/bookings',
            'method' => 'POST',
            'status' => '201',
        ]);

        $getCount = $this->metrics->get('http_requests_total', [
            'endpoint' => '/api/bookings',
            'method' => 'GET',
            'status' => '200',
        ]);

        $this->assertEquals(1, $postCount);
        $this->assertEquals(2, $getCount);
    }

    public function test_track_cache_operation(): void
    {
        $this->metrics->trackCacheOperation('get', true);  // hit
        $this->metrics->trackCacheOperation('get', true);  // hit
        $this->metrics->trackCacheOperation('get', false); // miss

        $hits = $this->metrics->get('cache_operations_total', ['operation' => 'get', 'result' => 'hit']);
        $misses = $this->metrics->get('cache_operations_total', ['operation' => 'get', 'result' => 'miss']);

        $this->assertEquals(2, $hits);
        $this->assertEquals(1, $misses);
    }

    public function test_track_job(): void
    {
        $this->metrics->trackJob('SendEmail', 'completed', 500);
        $this->metrics->trackJob('SendEmail', 'failed', 100);

        $completed = $this->metrics->get('queue_jobs_total', ['job' => 'SendEmail', 'status' => 'completed']);
        $failed = $this->metrics->get('queue_jobs_total', ['job' => 'SendEmail', 'status' => 'failed']);

        $this->assertEquals(1, $completed);
        $this->assertEquals(1, $failed);
    }

    public function test_track_booking(): void
    {
        $this->metrics->trackBooking('confirmed', 5000);
        $this->metrics->trackBooking('confirmed', 3000);
        $this->metrics->trackBooking('cancelled');

        $confirmed = $this->metrics->get('bookings_total', ['status' => 'confirmed']);
        $cancelled = $this->metrics->get('bookings_total', ['status' => 'cancelled']);

        $this->assertEquals(2, $confirmed);
        $this->assertEquals(1, $cancelled);
    }

    public function test_track_payment(): void
    {
        $this->metrics->trackPayment('success', 10000, 'paymongo');
        $this->metrics->trackPayment('success', 5000, 'paymongo');
        $this->metrics->trackPayment('failed', 2000, 'paymongo');

        $success = $this->metrics->get('payments_total', [
            'status' => 'success',
            'provider' => 'paymongo',
        ]);

        $failed = $this->metrics->get('payments_total', [
            'status' => 'failed',
            'provider' => 'paymongo',
        ]);

        $this->assertEquals(2, $success);
        $this->assertEquals(1, $failed);
    }

    public function test_track_auth(): void
    {
        $this->metrics->trackAuth('login', true);
        $this->metrics->trackAuth('login', true);
        $this->metrics->trackAuth('login', false);

        $successLogins = $this->metrics->get('auth_events_total', ['event' => 'login', 'success' => 'true']);
        $failedLogins = $this->metrics->get('auth_events_total', ['event' => 'login', 'success' => 'false']);

        $this->assertEquals(2, $successLogins);
        $this->assertEquals(1, $failedLogins);
    }

    public function test_track_error(): void
    {
        $this->metrics->trackError('validation', '422');
        $this->metrics->trackError('server', '500');

        $validationErrors = $this->metrics->get('errors_total', ['type' => 'validation', 'code' => '422']);
        $serverErrors = $this->metrics->get('errors_total', ['type' => 'server', 'code' => '500']);

        $this->assertEquals(1, $validationErrors);
        $this->assertEquals(1, $serverErrors);
    }

    public function test_set_active_users(): void
    {
        $this->metrics->setActiveUsers(150);

        $value = $this->metrics->get('active_users');

        $this->assertEquals(150, $value);
    }

    public function test_business_metric(): void
    {
        $this->metrics->trackBusinessMetric('monthly_revenue', 50000, ['month' => '2024-01']);

        $value = $this->metrics->get('business_monthly_revenue', ['month' => '2024-01']);

        $this->assertEquals(50000, $value);
    }

    public function test_prometheus_format_output(): void
    {
        $this->metrics->increment('test_counter');
        $this->metrics->gauge('test_gauge', 42);

        $output = $this->metrics->toPrometheusFormat();

        $this->assertStringContainsString('# TYPE test_counter counter', $output);
        $this->assertStringContainsString('test_counter 1', $output);
        $this->assertStringContainsString('# TYPE test_gauge gauge', $output);
        $this->assertStringContainsString('test_gauge 42', $output);
    }

    public function test_prometheus_format_with_labels(): void
    {
        $this->metrics->increment('requests', ['method' => 'GET']);

        $output = $this->metrics->toPrometheusFormat();

        $this->assertStringContainsString('requests{method="GET"} 1', $output);
    }

    public function test_to_array(): void
    {
        $this->metrics->increment('test_counter');
        $this->metrics->gauge('test_gauge', 50);

        $array = $this->metrics->toArray();

        $this->assertArrayHasKey('test_counter', $array);
        $this->assertArrayHasKey('test_gauge', $array);
        $this->assertEquals(MetricsCollectionService::TYPE_COUNTER, $array['test_counter']['type']);
        $this->assertEquals(MetricsCollectionService::TYPE_GAUGE, $array['test_gauge']['type']);
    }

    public function test_get_summary(): void
    {
        $this->metrics->increment('counter1');
        $this->metrics->gauge('gauge1', 10);
        $this->metrics->histogram('histogram1', 0.5);

        $summary = $this->metrics->getSummary();

        $this->assertEquals(3, $summary['total_metrics']);
        $this->assertArrayHasKey('metrics_by_type', $summary);
        $this->assertArrayHasKey('collected_at', $summary);
    }

    public function test_reset_metrics(): void
    {
        $this->metrics->increment('test_counter');
        $this->metrics->gauge('test_gauge', 42);

        $this->metrics->reset();

        $counter = $this->metrics->get('test_counter');
        $gauge = $this->metrics->get('test_gauge');

        $this->assertEquals(0, $counter);
        $this->assertEquals(0, $gauge);
    }

    public function test_reset_specific_metric(): void
    {
        $this->metrics->increment('counter1');
        $this->metrics->increment('counter2');

        $this->metrics->resetMetric('counter1');

        $counter1 = $this->metrics->get('counter1');
        $counter2 = $this->metrics->get('counter2');

        $this->assertEquals(0, $counter1);
        $this->assertEquals(1, $counter2);
    }

    public function test_collect_system_metrics(): void
    {
        $this->metrics->collectSystemMetrics();

        $memory = $this->metrics->get('php_memory_bytes', ['type' => 'current']);

        $this->assertGreaterThan(0, $memory);
    }

    public function test_label_order_does_not_affect_key(): void
    {
        // Labels in different order should still match the same metric
        $this->metrics->increment('test', ['a' => '1', 'b' => '2']);
        $this->metrics->increment('test', ['b' => '2', 'a' => '1']);

        $value = $this->metrics->get('test', ['b' => '2', 'a' => '1']);

        $this->assertEquals(2, $value);
    }

    public function test_track_database_query(): void
    {
        $this->metrics->trackDatabaseQuery(50.5, 'SELECT * FROM users');
        $this->metrics->trackDatabaseQuery(100.0, 'INSERT INTO logs');

        $totalQueries = $this->metrics->get('database_queries_total');

        $this->assertEquals(2, $totalQueries);
    }

    public function test_histogram_with_custom_buckets(): void
    {
        $customBuckets = [1, 5, 10, 50, 100];

        $this->metrics->histogram('custom_metric', 3, [], $customBuckets);
        $this->metrics->histogram('custom_metric', 25, [], $customBuckets);

        $histogram = $this->metrics->getHistogram('custom_metric');

        $this->assertEquals(2, $histogram['count']);
        $this->assertEquals(28, $histogram['sum']);
    }
}
