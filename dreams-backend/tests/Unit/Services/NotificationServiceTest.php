<?php

namespace Tests\Unit\Services;

use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class NotificationServiceTest extends TestCase
{
    use RefreshDatabase;

    protected NotificationService $notificationService;
    protected User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->notificationService = new NotificationService();
        $this->user = User::factory()->create();
    }

    /** @test */
    public function it_can_send_a_notification()
    {
        $notification = $this->notificationService->send(
            $this->user->id,
            NotificationService::TYPE_BOOKING,
            'Booking Confirmed',
            'Your booking has been confirmed.',
            ['booking_id' => 123]
        );

        $this->assertNotNull($notification);
        $this->assertEquals('Booking Confirmed', $notification->title);
        $this->assertEquals('booking', $notification->type);
    }

    /** @test */
    public function it_can_get_notifications_for_user()
    {
        // Create multiple notifications
        $this->notificationService->send($this->user->id, 'booking', 'Notification 1', 'Message 1');
        $this->notificationService->send($this->user->id, 'payment', 'Notification 2', 'Message 2');
        $this->notificationService->send($this->user->id, 'booking', 'Notification 3', 'Message 3');

        $notifications = $this->notificationService->getForUser($this->user->id);

        $this->assertCount(3, $notifications);
    }

    /** @test */
    public function it_can_filter_notifications_by_type()
    {
        $this->notificationService->send($this->user->id, 'booking', 'Booking 1', 'Message');
        $this->notificationService->send($this->user->id, 'payment', 'Payment 1', 'Message');
        $this->notificationService->send($this->user->id, 'booking', 'Booking 2', 'Message');

        $notifications = $this->notificationService->getForUser(
            $this->user->id,
            null,
            'booking'
        );

        $this->assertCount(2, $notifications);
        $this->assertTrue(collect($notifications)->every(fn($n) => $n['type'] === 'booking'));
    }

    /** @test */
    public function it_can_mark_notification_as_read()
    {
        $notification = $this->notificationService->send(
            $this->user->id,
            'booking',
            'Test',
            'Message'
        );

        // Get the notification ID from database
        $dbNotification = DB::table('notifications')
            ->where('notifiable_id', $this->user->id)
            ->first();

        $success = $this->notificationService->markAsRead($dbNotification->id, $this->user->id);

        $this->assertTrue($success);

        $notifications = $this->notificationService->getForUser($this->user->id);
        $this->assertTrue($notifications[0]['read']);
    }

    /** @test */
    public function it_can_mark_all_notifications_as_read()
    {
        $this->notificationService->send($this->user->id, 'booking', 'Test 1', 'Message');
        $this->notificationService->send($this->user->id, 'booking', 'Test 2', 'Message');
        $this->notificationService->send($this->user->id, 'booking', 'Test 3', 'Message');

        $count = $this->notificationService->markAllAsRead($this->user->id);

        $this->assertEquals(3, $count);
        $this->assertEquals(0, $this->notificationService->getUnreadCount($this->user->id));
    }

    /** @test */
    public function it_can_get_unread_count()
    {
        $this->notificationService->send($this->user->id, 'booking', 'Test 1', 'Message');
        $this->notificationService->send($this->user->id, 'booking', 'Test 2', 'Message');

        $count = $this->notificationService->getUnreadCount($this->user->id);

        $this->assertEquals(2, $count);
    }

    /** @test */
    public function it_can_delete_a_notification()
    {
        $this->notificationService->send($this->user->id, 'booking', 'Test', 'Message');

        $dbNotification = DB::table('notifications')
            ->where('notifiable_id', $this->user->id)
            ->first();

        $success = $this->notificationService->delete($dbNotification->id, $this->user->id);

        $this->assertTrue($success);
        $this->assertCount(0, $this->notificationService->getForUser($this->user->id));
    }

    /** @test */
    public function it_can_delete_all_notifications()
    {
        $this->notificationService->send($this->user->id, 'booking', 'Test 1', 'Message');
        $this->notificationService->send($this->user->id, 'booking', 'Test 2', 'Message');

        $count = $this->notificationService->deleteAll($this->user->id);

        $this->assertEquals(2, $count);
        $this->assertCount(0, $this->notificationService->getForUser($this->user->id));
    }

    /** @test */
    public function it_can_send_to_multiple_users()
    {
        $user2 = User::factory()->create();
        $user3 = User::factory()->create();

        $results = $this->notificationService->sendToMany(
            [$this->user->id, $user2->id, $user3->id],
            'system',
            'System Update',
            'A system update is available.'
        );

        $this->assertCount(3, $results);
        $this->assertEquals(1, $this->notificationService->getUnreadCount($this->user->id));
        $this->assertEquals(1, $this->notificationService->getUnreadCount($user2->id));
        $this->assertEquals(1, $this->notificationService->getUnreadCount($user3->id));
    }

    /** @test */
    public function it_returns_default_preferences_for_new_user()
    {
        $preferences = $this->notificationService->getPreferences($this->user->id);

        $this->assertArrayHasKey('channels', $preferences);
        $this->assertArrayHasKey('types', $preferences);
        $this->assertArrayHasKey('quiet_hours', $preferences);
        $this->assertTrue($preferences['channels']['email']);
        $this->assertTrue($preferences['channels']['in_app']);
    }

    /** @test */
    public function it_can_update_preferences()
    {
        $newPreferences = [
            'channels' => [
                'email' => false,
                'in_app' => true,
                'push' => false,
                'sms' => false,
            ],
            'types' => [
                'booking' => ['email' => false, 'in_app' => true],
            ],
            'quiet_hours' => [
                'enabled' => true,
                'start' => '22:00',
                'end' => '07:00',
            ],
        ];

        $success = $this->notificationService->updatePreferences($this->user->id, $newPreferences);
        $this->assertTrue($success);

        $preferences = $this->notificationService->getPreferences($this->user->id);
        $this->assertFalse($preferences['channels']['email']);
        $this->assertTrue($preferences['quiet_hours']['enabled']);
    }

    /** @test */
    public function it_can_get_statistics()
    {
        $this->notificationService->send($this->user->id, 'booking', 'Booking 1', 'Message');
        $this->notificationService->send($this->user->id, 'payment', 'Payment 1', 'Message');
        $this->notificationService->send($this->user->id, 'booking', 'Booking 2', 'Message');

        // Mark one as read
        $dbNotification = DB::table('notifications')
            ->where('notifiable_id', $this->user->id)
            ->first();
        $this->notificationService->markAsRead($dbNotification->id, $this->user->id);

        $stats = $this->notificationService->getStatistics($this->user->id);

        $this->assertEquals(3, $stats['total']);
        $this->assertEquals(2, $stats['unread']);
        $this->assertEquals(1, $stats['read']);
        $this->assertArrayHasKey('by_type', $stats);
    }

    /** @test */
    public function it_can_filter_unread_only()
    {
        $this->notificationService->send($this->user->id, 'booking', 'Test 1', 'Message');
        $this->notificationService->send($this->user->id, 'booking', 'Test 2', 'Message');

        // Mark one as read
        $dbNotification = DB::table('notifications')
            ->where('notifiable_id', $this->user->id)
            ->first();
        $this->notificationService->markAsRead($dbNotification->id, $this->user->id);

        $unreadOnly = $this->notificationService->getForUser($this->user->id, true);
        $this->assertCount(1, $unreadOnly);

        $readOnly = $this->notificationService->getForUser($this->user->id, false);
        $this->assertCount(1, $readOnly);
    }

    /** @test */
    public function it_can_mark_as_unread()
    {
        $this->notificationService->send($this->user->id, 'booking', 'Test', 'Message');

        $dbNotification = DB::table('notifications')
            ->where('notifiable_id', $this->user->id)
            ->first();

        // Mark as read first
        $this->notificationService->markAsRead($dbNotification->id, $this->user->id);
        $this->assertEquals(0, $this->notificationService->getUnreadCount($this->user->id));

        // Mark as unread
        $success = $this->notificationService->markAsUnread($dbNotification->id, $this->user->id);
        $this->assertTrue($success);
        $this->assertEquals(1, $this->notificationService->getUnreadCount($this->user->id));
    }

    /** @test */
    public function it_includes_action_url_and_priority()
    {
        $this->notificationService->send(
            $this->user->id,
            'booking',
            'Important Update',
            'Your booking needs attention.',
            ['booking_id' => 456],
            NotificationService::PRIORITY_HIGH,
            '/bookings/456'
        );

        $notifications = $this->notificationService->getForUser($this->user->id);

        $this->assertEquals('high', $notifications[0]['priority']);
        $this->assertEquals('/bookings/456', $notifications[0]['action_url']);
        $this->assertEquals(['booking_id' => 456], $notifications[0]['data']);
    }
}
