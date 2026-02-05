<?php

namespace Tests\Unit\Services;

use App\Models\User;
use App\Services\PushNotificationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class PushNotificationServiceTest extends TestCase
{
    use RefreshDatabase;

    protected PushNotificationService $service;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Configure Firebase for testing
        Config::set('services.firebase.server_key', 'test-server-key');
        Config::set('services.firebase.project_id', 'test-project');
        Config::set('services.firebase.push_enabled', true);
        
        $this->service = new PushNotificationService();
        
        Cache::flush();
    }

    public function test_is_enabled_returns_true_when_configured(): void
    {
        $this->assertTrue($this->service->isEnabled());
    }

    public function test_is_enabled_returns_false_when_disabled(): void
    {
        Config::set('services.firebase.push_enabled', false);
        $service = new PushNotificationService();

        $this->assertFalse($service->isEnabled());
    }

    public function test_is_enabled_returns_false_when_no_server_key(): void
    {
        Config::set('services.firebase.server_key', null);
        $service = new PushNotificationService();

        $this->assertFalse($service->isEnabled());
    }

    public function test_register_device_stores_token(): void
    {
        $userId = 1;
        $token = 'test-device-token-123';

        $result = $this->service->registerDevice($userId, $token, 'android', 'Test Phone');

        $this->assertTrue($result);
        
        $tokens = $this->service->getUserDeviceTokens($userId);
        $this->assertContains($token, $tokens);
    }

    public function test_register_device_updates_existing_token(): void
    {
        $userId = 1;
        $token = 'test-device-token-123';

        $this->service->registerDevice($userId, $token, 'android', 'Test Phone');
        $this->service->registerDevice($userId, $token, 'android', 'Updated Phone');

        $tokens = $this->service->getUserDeviceTokens($userId);
        $this->assertCount(1, $tokens);
    }

    public function test_unregister_device_removes_token(): void
    {
        $userId = 1;
        $token = 'test-device-token-123';

        $this->service->registerDevice($userId, $token);
        $this->service->unregisterDevice($userId, $token);

        $tokens = $this->service->getUserDeviceTokens($userId);
        $this->assertNotContains($token, $tokens);
    }

    public function test_get_user_devices_returns_all_devices(): void
    {
        $userId = 1;

        $this->service->registerDevice($userId, 'token-1', 'android', 'Phone 1');
        $this->service->registerDevice($userId, 'token-2', 'ios', 'Phone 2');
        $this->service->registerDevice($userId, 'token-3', 'web', 'Browser');

        $devices = $this->service->getUserDevices($userId);

        $this->assertCount(3, $devices);
        $this->assertEquals('android', $devices[0]['type']);
        $this->assertEquals('ios', $devices[1]['type']);
        $this->assertEquals('web', $devices[2]['type']);
    }

    public function test_clear_user_devices_removes_all(): void
    {
        $userId = 1;

        $this->service->registerDevice($userId, 'token-1');
        $this->service->registerDevice($userId, 'token-2');
        $this->service->registerDevice($userId, 'token-3');

        $this->service->clearUserDevices($userId);

        $devices = $this->service->getUserDevices($userId);
        $this->assertEmpty($devices);
    }

    public function test_send_to_device_returns_disabled_when_not_enabled(): void
    {
        Config::set('services.firebase.push_enabled', false);
        $service = new PushNotificationService();

        $result = $service->sendToDevice('test-token', 'Title', 'Body');

        $this->assertFalse($result['success']);
        $this->assertStringContainsString('disabled', $result['message']);
    }

    public function test_send_to_devices_with_empty_tokens_returns_error(): void
    {
        $result = $this->service->sendToDevices([], 'Title', 'Body');

        $this->assertFalse($result['success']);
        $this->assertStringContainsString('No device tokens', $result['message']);
    }

    public function test_send_to_user_returns_error_when_no_devices(): void
    {
        $user = User::factory()->create();

        $result = $this->service->sendToUser($user, 'Title', 'Body');

        $this->assertFalse($result['success']);
        $this->assertStringContainsString('no registered devices', $result['message']);
    }

    public function test_send_to_device_makes_fcm_request(): void
    {
        Http::fake([
            'fcm.googleapis.com/*' => Http::response([
                'success' => 1,
                'failure' => 0,
                'message_id' => '0:1234567890%abcdef',
            ], 200),
        ]);

        $result = $this->service->sendToDevice('test-token', 'Test Title', 'Test Body');

        $this->assertTrue($result['success']);
        $this->assertEquals(1, $result['success_count']);

        Http::assertSent(function ($request) {
            return $request->url() === 'https://fcm.googleapis.com/fcm/send' &&
                   $request->hasHeader('Authorization', 'key=test-server-key') &&
                   $request['notification']['title'] === 'Test Title' &&
                   $request['notification']['body'] === 'Test Body';
        });
    }

    public function test_send_to_topic_sends_to_topic_endpoint(): void
    {
        Http::fake([
            'fcm.googleapis.com/*' => Http::response([
                'success' => 1,
                'failure' => 0,
            ], 200),
        ]);

        $result = $this->service->sendToTopic('announcements', 'Announcement', 'New update available');

        $this->assertTrue($result['success']);

        Http::assertSent(function ($request) {
            return $request['to'] === '/topics/announcements';
        });
    }

    public function test_send_to_user_sends_to_registered_device(): void
    {
        Http::fake([
            'fcm.googleapis.com/*' => Http::response([
                'success' => 1,
                'failure' => 0,
            ], 200),
        ]);

        $user = User::factory()->create();
        $this->service->registerDevice($user->id, 'user-device-token');

        $result = $this->service->sendToUser($user, 'Hello', 'User notification');

        $this->assertTrue($result['success']);

        Http::assertSent(function ($request) {
            return $request['to'] === 'user-device-token';
        });
    }

    public function test_broadcast_sends_to_all_topic(): void
    {
        Http::fake([
            'fcm.googleapis.com/*' => Http::response([
                'success' => 1,
            ], 200),
        ]);

        $result = $this->service->broadcast('Broadcast', 'Message to all');

        $this->assertTrue($result['success']);

        Http::assertSent(function ($request) {
            return $request['to'] === '/topics/all';
        });
    }

    public function test_send_data_sends_silent_notification(): void
    {
        Http::fake([
            'fcm.googleapis.com/*' => Http::response([
                'success' => 1,
            ], 200),
        ]);

        $result = $this->service->sendData('test-token', ['key' => 'value', 'action' => 'sync']);

        $this->assertTrue($result['success']);

        Http::assertSent(function ($request) {
            return !isset($request['notification']) &&
                   $request['data']['key'] === 'value' &&
                   $request['content_available'] === true;
        });
    }

    public function test_schedule_stores_notification_for_later(): void
    {
        $sendAt = now()->addHours(2);

        $notificationId = $this->service->schedule(
            'test-token',
            'Scheduled Title',
            'Scheduled Body',
            $sendAt,
            ['type' => 'reminder']
        );

        $this->assertStringStartsWith('scheduled_push_', $notificationId);

        $scheduled = Cache::get('scheduled_push:' . $notificationId);
        $this->assertNotNull($scheduled);
        $this->assertEquals('Scheduled Title', $scheduled['title']);
    }

    public function test_cancel_scheduled_removes_notification(): void
    {
        $notificationId = $this->service->schedule(
            'test-token',
            'Title',
            'Body',
            now()->addHour()
        );

        $result = $this->service->cancelScheduled($notificationId);

        $this->assertTrue($result);
        $this->assertNull(Cache::get('scheduled_push:' . $notificationId));
    }

    public function test_get_statistics_returns_default_structure(): void
    {
        $stats = $this->service->getStatistics();

        $this->assertArrayHasKey('total_sent', $stats);
        $this->assertArrayHasKey('total_success', $stats);
        $this->assertArrayHasKey('total_failed', $stats);
        $this->assertEquals(0, $stats['total_sent']);
    }

    public function test_subscribe_to_topic_makes_iid_request(): void
    {
        Http::fake([
            'iid.googleapis.com/*' => Http::response([], 200),
        ]);

        $result = $this->service->subscribeToTopic('test-token', 'news');

        $this->assertTrue($result['success']);
        $this->assertEquals('news', $result['topic']);
    }

    public function test_unsubscribe_from_topic_makes_delete_request(): void
    {
        Http::fake([
            'iid.googleapis.com/*' => Http::response([], 200),
        ]);

        $result = $this->service->unsubscribeFromTopic('test-token', 'news');

        $this->assertTrue($result['success']);
    }

    public function test_send_to_multiple_devices_batches_requests(): void
    {
        Http::fake([
            'fcm.googleapis.com/*' => Http::response([
                'success' => 100,
                'failure' => 0,
            ], 200),
        ]);

        // Create 100 tokens (less than batch size of 1000)
        $tokens = array_map(fn($i) => 'token-' . $i, range(1, 100));

        $result = $this->service->sendToDevices($tokens, 'Batch Title', 'Batch Body');

        $this->assertTrue($result['success']);
        $this->assertEquals(1, $result['batch_count']);
    }

    public function test_send_handles_fcm_error_gracefully(): void
    {
        Http::fake([
            'fcm.googleapis.com/*' => Http::response([
                'error' => 'InvalidRegistration',
            ], 400),
        ]);

        $result = $this->service->sendToDevice('invalid-token', 'Title', 'Body');

        $this->assertFalse($result['success']);
    }

    public function test_send_to_role_uses_role_topic(): void
    {
        Http::fake([
            'fcm.googleapis.com/*' => Http::response([
                'success' => 1,
            ], 200),
        ]);

        $result = $this->service->sendToRole('admin', 'Admin Alert', 'Admin notification');

        $this->assertTrue($result['success']);

        Http::assertSent(function ($request) {
            return $request['to'] === '/topics/role_admin';
        });
    }
}
