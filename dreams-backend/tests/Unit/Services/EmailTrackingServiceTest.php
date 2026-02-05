<?php

namespace Tests\Unit\Services;

use App\Models\EmailLog;
use App\Services\EmailTrackingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EmailTrackingServiceTest extends TestCase
{
    use RefreshDatabase;

    protected EmailTrackingService $trackingService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->trackingService = new EmailTrackingService();
    }

    public function test_can_track_sent_email(): void
    {
        $trackingId = $this->trackingService->trackSent(
            'booking_confirmation',
            'test@example.com',
            'Your Booking Confirmation',
            ['booking_id' => 123]
        );

        $this->assertNotEmpty($trackingId);

        $log = EmailLog::where('tracking_id', $trackingId)->first();
        $this->assertNotNull($log);
        $this->assertEquals('booking_confirmation', $log->type);
        $this->assertEquals('test@example.com', $log->recipient);
        $this->assertEquals('sent', $log->status);
    }

    public function test_can_track_email_opened(): void
    {
        $trackingId = $this->trackingService->trackSent(
            'booking_reminder',
            'test@example.com',
            'Reminder: Your Event'
        );

        $result = $this->trackingService->trackOpened($trackingId);

        $this->assertTrue($result);

        $log = EmailLog::where('tracking_id', $trackingId)->first();
        $this->assertEquals('opened', $log->status);
        $this->assertNotNull($log->opened_at);
        $this->assertEquals(1, $log->open_count);
    }

    public function test_multiple_opens_increment_count(): void
    {
        $trackingId = $this->trackingService->trackSent(
            'booking_reminder',
            'test@example.com',
            'Reminder: Your Event'
        );

        $this->trackingService->trackOpened($trackingId);
        $this->trackingService->trackOpened($trackingId);
        $this->trackingService->trackOpened($trackingId);

        $log = EmailLog::where('tracking_id', $trackingId)->first();
        $this->assertEquals(3, $log->open_count);
    }

    public function test_can_track_link_clicked(): void
    {
        $trackingId = $this->trackingService->trackSent(
            'booking_confirmation',
            'test@example.com',
            'Your Booking'
        );

        $result = $this->trackingService->trackClicked($trackingId, 'https://example.com/view-booking');

        $this->assertTrue($result);

        $log = EmailLog::where('tracking_id', $trackingId)->first();
        $this->assertEquals('clicked', $log->status);
        $this->assertNotNull($log->clicked_at);
        $this->assertEquals(1, $log->click_count);
        $this->assertCount(1, $log->clicks);
    }

    public function test_can_track_email_bounced(): void
    {
        $trackingId = $this->trackingService->trackSent(
            'welcome',
            'invalid@example.com',
            'Welcome!'
        );

        $result = $this->trackingService->trackBounced($trackingId, 'hard', 'User unknown');

        $this->assertTrue($result);

        $log = EmailLog::where('tracking_id', $trackingId)->first();
        $this->assertEquals('bounced', $log->status);
        $this->assertEquals('hard', $log->bounce_type);
        $this->assertEquals('User unknown', $log->bounce_message);
    }

    public function test_can_track_email_failed(): void
    {
        $trackingId = $this->trackingService->trackSent(
            'notification',
            'test@example.com',
            'Important Update'
        );

        $result = $this->trackingService->trackFailed($trackingId, 'SMTP connection timeout');

        $this->assertTrue($result);

        $log = EmailLog::where('tracking_id', $trackingId)->first();
        $this->assertEquals('failed', $log->status);
        $this->assertEquals('SMTP connection timeout', $log->error_message);
    }

    public function test_get_statistics(): void
    {
        // Create test emails with various statuses
        $this->trackingService->trackSent('booking_confirmation', 'test1@example.com', 'Subject 1');
        $this->trackingService->trackSent('booking_confirmation', 'test2@example.com', 'Subject 2');
        $this->trackingService->trackSent('booking_reminder', 'test3@example.com', 'Subject 3');

        $trackingId = $this->trackingService->trackSent('notification', 'test4@example.com', 'Subject 4');
        $this->trackingService->trackOpened($trackingId);

        $stats = $this->trackingService->getStatistics();

        $this->assertEquals(4, $stats['total']);
        $this->assertArrayHasKey('by_status', $stats);
        $this->assertArrayHasKey('open_rate', $stats);
    }

    public function test_get_statistics_by_type(): void
    {
        $this->trackingService->trackSent('booking_confirmation', 'test1@example.com', 'Subject 1');
        $this->trackingService->trackSent('booking_confirmation', 'test2@example.com', 'Subject 2');

        $stats = $this->trackingService->getStatistics('booking_confirmation');

        $this->assertEquals(2, $stats['total']);
    }

    public function test_get_logs(): void
    {
        $this->trackingService->trackSent('booking_confirmation', 'test1@example.com', 'Subject 1');
        $this->trackingService->trackSent('booking_reminder', 'test2@example.com', 'Subject 2');

        $logs = $this->trackingService->getLogs();

        $this->assertCount(2, $logs);
    }

    public function test_get_logs_with_filters(): void
    {
        $this->trackingService->trackSent('booking_confirmation', 'test1@example.com', 'Subject 1');
        $this->trackingService->trackSent('booking_reminder', 'test2@example.com', 'Subject 2');

        $logs = $this->trackingService->getLogs(['type' => 'booking_confirmation']);

        $this->assertCount(1, $logs);
    }

    public function test_get_tracking_pixel_url(): void
    {
        $url = $this->trackingService->getTrackingPixelUrl('test-tracking-id');

        $this->assertStringContainsString('/api/email/track/open/test-tracking-id.gif', $url);
    }

    public function test_get_tracked_link_url(): void
    {
        $originalUrl = 'https://example.com/booking/123';
        $url = $this->trackingService->getTrackedLinkUrl('test-id', $originalUrl);

        $this->assertStringContainsString('/api/email/track/click/test-id', $url);
        $this->assertStringContainsString('url=', $url);
    }

    public function test_cannot_retry_non_failed_email(): void
    {
        $trackingId = $this->trackingService->trackSent(
            'notification',
            'test@example.com',
            'Subject'
        );

        $result = $this->trackingService->retry($trackingId);

        $this->assertFalse($result);
    }

    public function test_get_tracking_pixel_html(): void
    {
        $html = $this->trackingService->getTrackingPixelHtml('test-id');

        $this->assertStringContainsString('<img', $html);
        $this->assertStringContainsString('test-id', $html);
        $this->assertStringContainsString('width="1"', $html);
        $this->assertStringContainsString('height="1"', $html);
    }

    public function test_mask_email_hides_username(): void
    {
        $trackingId = $this->trackingService->trackSent(
            'notification',
            'johndoe@example.com',
            'Subject'
        );

        $logs = $this->trackingService->getLogs(['recipient' => 'johndoe']);
        
        // The masked email should show in the logs
        $this->assertCount(1, $logs);
        $this->assertStringContainsString('jo', $logs[0]['recipient']);
        $this->assertStringContainsString('***', $logs[0]['recipient']);
        $this->assertStringContainsString('@example.com', $logs[0]['recipient']);
    }
}
