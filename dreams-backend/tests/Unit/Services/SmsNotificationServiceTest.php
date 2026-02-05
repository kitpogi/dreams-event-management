<?php

namespace Tests\Unit\Services;

use App\Models\User;
use App\Services\SmsNotificationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Tests\TestCase;

class SmsNotificationServiceTest extends TestCase
{
    use RefreshDatabase;

    protected SmsNotificationService $service;

    protected function setUp(): void
    {
        parent::setUp();
        
        Config::set('services.sms.enabled', true);
        Config::set('services.sms.driver', 'log');
        
        $this->service = new SmsNotificationService();
        Cache::flush();
    }

    public function test_is_enabled_returns_true_when_configured(): void
    {
        $this->assertTrue($this->service->isEnabled());
    }

    public function test_is_enabled_returns_false_when_disabled(): void
    {
        Config::set('services.sms.enabled', false);
        $service = new SmsNotificationService();

        $this->assertFalse($service->isEnabled());
    }

    public function test_get_driver_returns_configured_driver(): void
    {
        Config::set('services.sms.driver', 'twilio');
        $service = new SmsNotificationService();

        $this->assertEquals('twilio', $service->getDriver());
    }

    public function test_send_returns_disabled_when_not_enabled(): void
    {
        Config::set('services.sms.enabled', false);
        $service = new SmsNotificationService();

        $result = $service->send('+639123456789', 'Test message');

        $this->assertFalse($result['success']);
        $this->assertStringContainsString('disabled', $result['message']);
    }

    public function test_send_validates_phone_number(): void
    {
        $result = $this->service->send('invalid', 'Test message');

        $this->assertFalse($result['success']);
        $this->assertStringContainsString('Invalid phone number', $result['message']);
    }

    public function test_send_validates_message_length(): void
    {
        $longMessage = str_repeat('a', 1601);
        $result = $this->service->send('+639123456789', $longMessage);

        $this->assertFalse($result['success']);
        $this->assertStringContainsString('too long', $result['message']);
    }

    public function test_send_via_log_driver_succeeds(): void
    {
        $result = $this->service->send('+639123456789', 'Test message');

        $this->assertTrue($result['success']);
        $this->assertEquals('log', $result['driver']);
        $this->assertStringContainsString('log_', $result['message_id']);
    }

    public function test_send_normalizes_philippine_numbers(): void
    {
        // Philippine number starting with 0 should be converted to +63
        $result = $this->service->send('09123456789', 'Test message');

        $this->assertTrue($result['success']);
    }

    public function test_send_to_user_returns_error_when_no_phone(): void
    {
        $user = User::factory()->create(['phone' => null]);

        $result = $this->service->sendToUser($user, 'Test message');

        $this->assertFalse($result['success']);
        $this->assertStringContainsString('no phone number', $result['message']);
    }

    public function test_send_to_user_sends_to_user_phone(): void
    {
        $user = User::factory()->create(['phone' => '+639123456789']);

        $result = $this->service->sendToUser($user, 'Test message');

        $this->assertTrue($result['success']);
        $this->assertEquals($user->id, $result['user_id']);
    }

    public function test_send_bulk_sends_to_multiple_recipients(): void
    {
        $recipients = ['+639123456781', '+639123456782', '+639123456783'];
        $result = $this->service->sendBulk($recipients, 'Bulk message');

        $this->assertTrue($result['success']);
        $this->assertEquals(3, $result['total']);
        $this->assertEquals(3, $result['sent']);
        $this->assertEquals(0, $result['failed']);
    }

    public function test_send_bulk_handles_failures(): void
    {
        $recipients = ['+639123456781', 'invalid', '+639123456783'];
        $result = $this->service->sendBulk($recipients, 'Bulk message');

        $this->assertFalse($result['success']);
        $this->assertEquals(3, $result['total']);
        $this->assertEquals(2, $result['sent']);
        $this->assertEquals(1, $result['failed']);
    }

    public function test_send_otp_formats_message_correctly(): void
    {
        $result = $this->service->sendOtp('+639123456789', '123456', 5);

        $this->assertTrue($result['success']);
    }

    public function test_send_booking_confirmation(): void
    {
        $result = $this->service->sendBookingConfirmation('+639123456789', [
            'event_type' => 'Wedding',
            'event_date' => '2025-12-25',
            'reference' => 'BK-12345',
        ]);

        $this->assertTrue($result['success']);
    }

    public function test_send_booking_reminder(): void
    {
        $result = $this->service->sendBookingReminder('+639123456789', [
            'event_type' => 'Birthday Party',
            'event_date' => 'tomorrow',
            'reference' => 'BK-12345',
        ]);

        $this->assertTrue($result['success']);
    }

    public function test_mask_phone_number_hides_middle_digits(): void
    {
        $masked = $this->service->maskPhoneNumber('+639123456789');

        $this->assertStringStartsWith('+639', $masked);
        $this->assertStringEndsWith('89', $masked);
        $this->assertStringContainsString('*', $masked);
    }

    public function test_get_statistics_returns_default_structure(): void
    {
        $stats = $this->service->getStatistics();

        $this->assertArrayHasKey('total_sent', $stats);
        $this->assertArrayHasKey('total_success', $stats);
        $this->assertArrayHasKey('total_failed', $stats);
        $this->assertEquals(0, $stats['total_sent']);
    }

    public function test_send_records_statistics(): void
    {
        $this->service->send('+639123456789', 'Message 1');
        $this->service->send('+639123456789', 'Message 2');

        $stats = $this->service->getStatistics();

        $this->assertEquals(2, $stats['total_sent']);
        $this->assertEquals(2, $stats['total_success']);
    }

    public function test_send_via_twilio_makes_api_request(): void
    {
        Config::set('services.sms.driver', 'twilio');
        Config::set('services.sms.twilio', [
            'account_sid' => 'test_sid',
            'auth_token' => 'test_token',
            'from' => '+15551234567',
        ]);
        
        Http::fake([
            'api.twilio.com/*' => Http::response([
                'sid' => 'SM123456',
                'status' => 'queued',
            ], 201),
        ]);

        $service = new SmsNotificationService();
        $result = $service->send('+639123456789', 'Test message');

        $this->assertTrue($result['success']);
        $this->assertEquals('SM123456', $result['message_id']);

        Http::assertSent(function ($request) {
            return str_contains($request->url(), 'twilio.com') &&
                   $request['Body'] === 'Test message';
        });
    }

    public function test_send_via_nexmo_makes_api_request(): void
    {
        Config::set('services.sms.driver', 'nexmo');
        Config::set('services.sms.nexmo', [
            'api_key' => 'test_key',
            'api_secret' => 'test_secret',
            'from' => 'Dreams',
        ]);
        
        Http::fake([
            'rest.nexmo.com/*' => Http::response([
                'messages' => [[
                    'status' => '0',
                    'message-id' => 'NX123456',
                    'remaining-balance' => '100.00',
                ]],
            ], 200),
        ]);

        $service = new SmsNotificationService();
        $result = $service->send('+639123456789', 'Test message');

        $this->assertTrue($result['success']);
        $this->assertEquals('NX123456', $result['message_id']);
    }

    public function test_send_via_semaphore_makes_api_request(): void
    {
        Config::set('services.sms.driver', 'semaphore');
        Config::set('services.sms.semaphore', [
            'api_key' => 'test_api_key',
            'sender_name' => 'DREAMS',
        ]);
        
        Http::fake([
            'api.semaphore.co/*' => Http::response([[
                'message_id' => 'SEM123456',
            ]], 200),
        ]);

        $service = new SmsNotificationService();
        $result = $service->send('+639123456789', 'Test message');

        $this->assertTrue($result['success']);
        $this->assertEquals('SEM123456', $result['message_id']);
    }

    public function test_get_balance_returns_disabled_when_not_enabled(): void
    {
        Config::set('services.sms.enabled', false);
        $service = new SmsNotificationService();

        $result = $service->getBalance();

        $this->assertFalse($result['success']);
    }

    public function test_get_balance_unsupported_for_log_driver(): void
    {
        $result = $this->service->getBalance();

        $this->assertFalse($result['success']);
        $this->assertStringContainsString('not supported', $result['message']);
    }

    public function test_twilio_missing_config_returns_error(): void
    {
        Config::set('services.sms.driver', 'twilio');
        Config::set('services.sms.twilio', []);
        
        $service = new SmsNotificationService();
        $result = $service->send('+639123456789', 'Test');

        $this->assertFalse($result['success']);
        $this->assertStringContainsString('configuration incomplete', $result['message']);
    }

    public function test_send_to_user_by_id(): void
    {
        $user = User::factory()->create(['phone' => '+639123456789']);

        $result = $this->service->sendToUser($user->id, 'Test message');

        $this->assertTrue($result['success']);
        $this->assertEquals($user->id, $result['user_id']);
    }

    public function test_send_to_nonexistent_user_returns_error(): void
    {
        $result = $this->service->sendToUser(99999, 'Test message');

        $this->assertFalse($result['success']);
        $this->assertStringContainsString('not found', $result['message']);
    }
}
