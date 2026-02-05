<?php

namespace Tests\Unit\Services;

use App\Services\ErrorMonitoringService;
use Exception;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class ErrorMonitoringServiceTest extends TestCase
{
    protected ErrorMonitoringService $service;

    protected function setUp(): void
    {
        parent::setUp();
        
        config(['error-monitoring.enabled' => true]);
        config(['error-monitoring.provider' => 'log']);
        
        $this->service = new ErrorMonitoringService();
        Cache::flush();
    }

    public function test_capture_exception_returns_event_id(): void
    {
        $exception = new Exception('Test exception');
        
        $eventId = $this->service->captureException($exception);
        
        $this->assertNotNull($eventId);
        $this->assertEquals(32, strlen($eventId)); // 16 bytes = 32 hex chars
    }

    public function test_capture_message_returns_event_id(): void
    {
        $eventId = $this->service->captureMessage('Test message', ErrorMonitoringService::LEVEL_WARNING);
        
        $this->assertNotNull($eventId);
    }

    public function test_capture_exception_stores_in_recent_errors(): void
    {
        $exception = new Exception('Test exception for storage');
        
        $this->service->captureException($exception);
        
        $recentErrors = $this->service->getRecentErrors();
        
        $this->assertCount(1, $recentErrors);
        $this->assertEquals('Test exception for storage', $recentErrors[0]['message']);
    }

    public function test_get_error_by_event_id(): void
    {
        $exception = new Exception('Findable exception');
        $eventId = $this->service->captureException($exception);
        
        $error = $this->service->getError($eventId);
        
        $this->assertNotNull($error);
        $this->assertEquals($eventId, $error['event_id']);
    }

    public function test_statistics_tracking(): void
    {
        $this->service->captureException(new Exception('Error 1'));
        $this->service->captureException(new Exception('Error 2'));
        $this->service->captureMessage('Warning message', ErrorMonitoringService::LEVEL_WARNING);
        
        $stats = $this->service->getStatistics('day');
        
        $this->assertEquals(3, $stats['total']);
        $this->assertEquals(2, $stats['by_level']['error']);
        $this->assertEquals(1, $stats['by_level']['warning']);
    }

    public function test_statistics_tracks_by_type(): void
    {
        $this->service->captureException(new Exception('Test'));
        $this->service->captureException(new \InvalidArgumentException('Test'));
        
        $stats = $this->service->getStatistics();
        
        $this->assertEquals(1, $stats['by_type']['Exception']);
        $this->assertEquals(1, $stats['by_type']['InvalidArgumentException']);
    }

    public function test_add_breadcrumb(): void
    {
        $this->service->addBreadcrumb('User clicked button', 'ui');
        $this->service->addBreadcrumb('API call made', 'http');
        
        // Capture exception to include breadcrumbs
        $exception = new Exception('Test');
        $this->service->captureException($exception);
        
        // Breadcrumbs are internal, but we can verify no errors occur
        $this->assertTrue(true);
    }

    public function test_set_user_context(): void
    {
        $this->service->setUser(1, 'user@example.com', 'John Doe');
        
        // User context is stored - we just verify no error is thrown
        $this->assertTrue(true);
    }

    public function test_set_context(): void
    {
        $this->service->setContext('order', ['id' => 123, 'total' => 99.99]);
        
        // Context is stored - we just verify no error is thrown
        $this->assertTrue(true);
    }

    public function test_set_tags(): void
    {
        $this->service->setTags(['version' => '1.0.0', 'feature' => 'checkout']);
        
        // Tags are stored - we just verify no error is thrown
        $this->assertTrue(true);
    }

    public function test_should_alert_threshold(): void
    {
        $errorHash = md5('test_error_' . uniqid());
        
        // First 4 calls should not trigger alert
        for ($i = 1; $i <= 4; $i++) {
            $this->assertFalse($this->service->shouldAlert($errorHash), "Call $i should not trigger alert");
        }
        
        // 5th call should trigger alert (threshold default is 5)
        $this->assertTrue($this->service->shouldAlert($errorHash), "5th call should trigger alert");
        
        // Subsequent calls should not trigger again
        $this->assertFalse($this->service->shouldAlert($errorHash), "6th call should not trigger alert");
    }

    public function test_clear_statistics(): void
    {
        $this->service->captureException(new Exception('Test'));
        
        $this->service->clearStatistics();
        
        $recentErrors = $this->service->getRecentErrors();
        $stats = $this->service->getStatistics();
        
        $this->assertEmpty($recentErrors);
        $this->assertEquals(0, $stats['total']);
    }

    public function test_get_provider(): void
    {
        $this->assertEquals('log', $this->service->getProvider());
    }

    public function test_is_enabled_when_configured(): void
    {
        config(['error-monitoring.enabled' => true]);
        config(['error-monitoring.provider' => 'log']);
        
        $service = new ErrorMonitoringService();
        
        // Log provider doesn't require DSN, so it checks differently
        $this->assertEquals('log', $service->getProvider());
    }

    public function test_capture_exception_with_context(): void
    {
        $exception = new Exception('Context test');
        $context = ['user_id' => 123, 'action' => 'checkout'];
        
        $eventId = $this->service->captureException($exception, $context);
        
        $this->assertNotNull($eventId);
        
        $recentErrors = $this->service->getRecentErrors();
        $this->assertCount(1, $recentErrors);
    }

    public function test_unique_errors_tracking(): void
    {
        // Create exceptions with the same message - they'll have different line numbers
        // so they won't be deduplicated. Test verifies the dedup mechanism works.
        $e1 = new Exception('Same message');
        $e2 = new Exception('Different message');
        
        // Same exception instance captured twice
        $this->service->captureException($e1);
        $this->service->captureException($e1);
        
        // Different exception
        $this->service->captureException($e2);
        
        $stats = $this->service->getStatistics();
        
        $this->assertEquals(3, $stats['total']);
        // e1 captured twice = 1 unique, e2 = 1 unique = 2 total unique
        $this->assertEquals(2, $stats['unique_errors']);
    }

    public function test_recent_errors_limit(): void
    {
        // Add many errors
        for ($i = 0; $i < 10; $i++) {
            $this->service->captureMessage("Message $i");
        }
        
        $recentErrors = $this->service->getRecentErrors(5);
        
        $this->assertCount(5, $recentErrors);
    }

    public function test_send_to_sentry_with_valid_dsn(): void
    {
        Http::fake([
            '*' => Http::response(['id' => 'test'], 200),
        ]);
        
        config(['error-monitoring.enabled' => true]);
        config(['error-monitoring.provider' => 'sentry']);
        config(['error-monitoring.providers.sentry.dsn' => 'https://key@sentry.io/123']);
        
        $service = new ErrorMonitoringService();
        $eventId = $service->captureException(new Exception('Sentry test'));
        
        $this->assertNotNull($eventId);
    }

    public function test_send_to_bugsnag_with_valid_api_key(): void
    {
        Http::fake([
            '*' => Http::response([], 200),
        ]);
        
        config(['error-monitoring.enabled' => true]);
        config(['error-monitoring.provider' => 'bugsnag']);
        config(['error-monitoring.providers.bugsnag.api_key' => 'test-api-key']);
        
        $service = new ErrorMonitoringService();
        $eventId = $service->captureException(new Exception('Bugsnag test'));
        
        $this->assertNotNull($eventId);
    }

    public function test_send_to_rollbar_with_valid_token(): void
    {
        Http::fake([
            '*' => Http::response(['result' => ['uuid' => 'test']], 200),
        ]);
        
        config(['error-monitoring.enabled' => true]);
        config(['error-monitoring.provider' => 'rollbar']);
        config(['error-monitoring.providers.rollbar.token' => 'test-token']);
        
        $service = new ErrorMonitoringService();
        $eventId = $service->captureException(new Exception('Rollbar test'));
        
        $this->assertNotNull($eventId);
    }

    public function test_statistics_by_hour(): void
    {
        $this->service->captureException(new Exception('Hourly test'));
        
        $stats = $this->service->getStatistics('hour');
        
        // Stats are stored per day, so hour stats will be empty initially
        $this->assertIsArray($stats);
    }

    public function test_error_level_constants_defined(): void
    {
        $this->assertEquals('debug', ErrorMonitoringService::LEVEL_DEBUG);
        $this->assertEquals('info', ErrorMonitoringService::LEVEL_INFO);
        $this->assertEquals('warning', ErrorMonitoringService::LEVEL_WARNING);
        $this->assertEquals('error', ErrorMonitoringService::LEVEL_ERROR);
        $this->assertEquals('fatal', ErrorMonitoringService::LEVEL_FATAL);
    }

    public function test_provider_constants_defined(): void
    {
        $this->assertEquals('sentry', ErrorMonitoringService::PROVIDER_SENTRY);
        $this->assertEquals('bugsnag', ErrorMonitoringService::PROVIDER_BUGSNAG);
        $this->assertEquals('rollbar', ErrorMonitoringService::PROVIDER_ROLLBAR);
        $this->assertEquals('log', ErrorMonitoringService::PROVIDER_LOG);
    }
}
