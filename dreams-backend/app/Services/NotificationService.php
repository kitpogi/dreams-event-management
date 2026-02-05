<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * NotificationService handles in-app notifications, preferences, and delivery.
 *
 * Features:
 * - Create, read, update notifications
 * - Mark as read/unread
 * - User notification preferences
 * - Notification grouping
 * - Batch operations
 * - Real-time broadcasting (via events)
 */
class NotificationService
{
    /**
     * Notification types.
     */
    public const TYPE_BOOKING = 'booking';
    public const TYPE_PAYMENT = 'payment';
    public const TYPE_REMINDER = 'reminder';
    public const TYPE_SYSTEM = 'system';
    public const TYPE_REVIEW = 'review';
    public const TYPE_CONTACT = 'contact';
    public const TYPE_PROMOTION = 'promotion';

    /**
     * Notification priorities.
     */
    public const PRIORITY_LOW = 'low';
    public const PRIORITY_NORMAL = 'normal';
    public const PRIORITY_HIGH = 'high';
    public const PRIORITY_URGENT = 'urgent';

    /**
     * Send a notification to a user.
     */
    public function send(
        int $userId,
        string $type,
        string $title,
        string $message,
        array $data = [],
        string $priority = self::PRIORITY_NORMAL,
        ?string $actionUrl = null
    ): ?object {
        try {
            // Check user preferences
            if (!$this->shouldSendNotification($userId, $type)) {
                Log::info('Notification skipped due to user preferences', [
                    'user_id' => $userId,
                    'type' => $type,
                ]);
                return null;
            }

            $notification = DB::table('notifications')->insertGetId([
                'id' => (string) Str::uuid(),
                'type' => $type,
                'notifiable_type' => User::class,
                'notifiable_id' => $userId,
                'data' => json_encode([
                    'title' => $title,
                    'message' => $message,
                    'data' => $data,
                    'priority' => $priority,
                    'action_url' => $actionUrl,
                ]),
                'read_at' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            Log::info('Notification sent', [
                'user_id' => $userId,
                'type' => $type,
                'title' => $title,
            ]);

            // Broadcast for real-time updates (if event exists)
            $this->broadcastNotification($userId, [
                'id' => $notification,
                'type' => $type,
                'title' => $title,
                'message' => $message,
                'data' => $data,
                'priority' => $priority,
                'action_url' => $actionUrl,
            ]);

            return (object) [
                'id' => $notification,
                'type' => $type,
                'title' => $title,
                'message' => $message,
            ];
        } catch (\Exception $e) {
            Log::error('Failed to send notification', [
                'user_id' => $userId,
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }

    /**
     * Send a notification to multiple users.
     */
    public function sendToMany(
        array $userIds,
        string $type,
        string $title,
        string $message,
        array $data = [],
        string $priority = self::PRIORITY_NORMAL,
        ?string $actionUrl = null
    ): array {
        $results = [];

        foreach ($userIds as $userId) {
            $results[$userId] = $this->send($userId, $type, $title, $message, $data, $priority, $actionUrl);
        }

        return $results;
    }

    /**
     * Send a notification to all users with a specific role.
     */
    public function sendToRole(
        string $role,
        string $type,
        string $title,
        string $message,
        array $data = [],
        string $priority = self::PRIORITY_NORMAL,
        ?string $actionUrl = null
    ): int {
        $users = User::where('role', $role)->pluck('id')->toArray();
        $results = $this->sendToMany($users, $type, $title, $message, $data, $priority, $actionUrl);

        return count(array_filter($results));
    }

    /**
     * Get notifications for a user.
     */
    public function getForUser(
        int $userId,
        ?bool $unreadOnly = null,
        ?string $type = null,
        int $limit = 50,
        int $offset = 0
    ): array {
        $query = DB::table('notifications')
            ->where('notifiable_type', User::class)
            ->where('notifiable_id', $userId);

        if ($unreadOnly === true) {
            $query->whereNull('read_at');
        } elseif ($unreadOnly === false) {
            $query->whereNotNull('read_at');
        }

        if ($type) {
            $query->where('type', $type);
        }

        $notifications = $query
            ->orderByDesc('created_at')
            ->offset($offset)
            ->limit($limit)
            ->get()
            ->map(fn($n) => $this->formatNotification($n))
            ->toArray();

        return $notifications;
    }

    /**
     * Get unread count for a user.
     */
    public function getUnreadCount(int $userId, ?string $type = null): int
    {
        $query = DB::table('notifications')
            ->where('notifiable_type', User::class)
            ->where('notifiable_id', $userId)
            ->whereNull('read_at');

        if ($type) {
            $query->where('type', $type);
        }

        return $query->count();
    }

    /**
     * Mark a notification as read.
     */
    public function markAsRead(string $notificationId, int $userId): bool
    {
        return DB::table('notifications')
            ->where('id', $notificationId)
            ->where('notifiable_id', $userId)
            ->update(['read_at' => now()]) > 0;
    }

    /**
     * Mark all notifications as read for a user.
     */
    public function markAllAsRead(int $userId, ?string $type = null): int
    {
        $query = DB::table('notifications')
            ->where('notifiable_type', User::class)
            ->where('notifiable_id', $userId)
            ->whereNull('read_at');

        if ($type) {
            $query->where('type', $type);
        }

        return $query->update(['read_at' => now()]);
    }

    /**
     * Mark a notification as unread.
     */
    public function markAsUnread(string $notificationId, int $userId): bool
    {
        return DB::table('notifications')
            ->where('id', $notificationId)
            ->where('notifiable_id', $userId)
            ->update(['read_at' => null]) > 0;
    }

    /**
     * Delete a notification.
     */
    public function delete(string $notificationId, int $userId): bool
    {
        return DB::table('notifications')
            ->where('id', $notificationId)
            ->where('notifiable_id', $userId)
            ->delete() > 0;
    }

    /**
     * Delete all notifications for a user.
     */
    public function deleteAll(int $userId, ?string $type = null): int
    {
        $query = DB::table('notifications')
            ->where('notifiable_type', User::class)
            ->where('notifiable_id', $userId);

        if ($type) {
            $query->where('type', $type);
        }

        return $query->delete();
    }

    /**
     * Get user notification preferences.
     */
    public function getPreferences(int $userId): array
    {
        $preferences = DB::table('notification_preferences')
            ->where('user_id', $userId)
            ->first();

        if (!$preferences) {
            return $this->getDefaultPreferences();
        }

        return json_decode($preferences->preferences, true);
    }

    /**
     * Update user notification preferences.
     */
    public function updatePreferences(int $userId, array $preferences): bool
    {
        $data = [
            'preferences' => json_encode($preferences),
            'updated_at' => now(),
        ];

        $exists = DB::table('notification_preferences')
            ->where('user_id', $userId)
            ->exists();

        if ($exists) {
            return DB::table('notification_preferences')
                ->where('user_id', $userId)
                ->update($data) > 0;
        }

        $data['user_id'] = $userId;
        $data['created_at'] = now();

        return DB::table('notification_preferences')->insert($data);
    }

    /**
     * Get default notification preferences.
     */
    public function getDefaultPreferences(): array
    {
        return [
            'channels' => [
                'email' => true,
                'in_app' => true,
                'push' => false,
                'sms' => false,
            ],
            'types' => [
                self::TYPE_BOOKING => ['email' => true, 'in_app' => true],
                self::TYPE_PAYMENT => ['email' => true, 'in_app' => true],
                self::TYPE_REMINDER => ['email' => true, 'in_app' => true],
                self::TYPE_SYSTEM => ['email' => false, 'in_app' => true],
                self::TYPE_REVIEW => ['email' => true, 'in_app' => true],
                self::TYPE_CONTACT => ['email' => true, 'in_app' => true],
                self::TYPE_PROMOTION => ['email' => false, 'in_app' => false],
            ],
            'quiet_hours' => [
                'enabled' => false,
                'start' => '22:00',
                'end' => '08:00',
            ],
        ];
    }

    /**
     * Check if notification should be sent based on user preferences.
     */
    protected function shouldSendNotification(int $userId, string $type): bool
    {
        $preferences = $this->getPreferences($userId);

        // Check quiet hours
        if ($this->isQuietHours($preferences)) {
            return false;
        }

        // Check if type is enabled
        $typePrefs = $preferences['types'][$type] ?? null;
        if ($typePrefs === null) {
            return true; // Default to sending if no preference
        }

        // Check if in-app is enabled for this type
        return $typePrefs['in_app'] ?? true;
    }

    /**
     * Check if currently in quiet hours.
     */
    protected function isQuietHours(array $preferences): bool
    {
        $quietHours = $preferences['quiet_hours'] ?? [];

        if (!($quietHours['enabled'] ?? false)) {
            return false;
        }

        $now = now();
        $start = $quietHours['start'] ?? '22:00';
        $end = $quietHours['end'] ?? '08:00';

        $startTime = $now->copy()->setTimeFromTimeString($start);
        $endTime = $now->copy()->setTimeFromTimeString($end);

        // Handle overnight quiet hours (e.g., 22:00 - 08:00)
        if ($startTime > $endTime) {
            return $now >= $startTime || $now <= $endTime;
        }

        return $now >= $startTime && $now <= $endTime;
    }

    /**
     * Format a notification for API response.
     */
    protected function formatNotification(object $notification): array
    {
        $data = json_decode($notification->data, true);

        return [
            'id' => $notification->id,
            'type' => $notification->type,
            'title' => $data['title'] ?? null,
            'message' => $data['message'] ?? null,
            'data' => $data['data'] ?? [],
            'priority' => $data['priority'] ?? self::PRIORITY_NORMAL,
            'action_url' => $data['action_url'] ?? null,
            'read' => $notification->read_at !== null,
            'read_at' => $notification->read_at,
            'created_at' => $notification->created_at,
        ];
    }

    /**
     * Broadcast notification for real-time updates.
     */
    protected function broadcastNotification(int $userId, array $notification): void
    {
        try {
            if (class_exists(\App\Events\NewNotification::class)) {
                event(new \App\Events\NewNotification($userId, $notification));
            }
        } catch (\Exception $e) {
            Log::warning('Failed to broadcast notification', [
                'user_id' => $userId,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Get notification statistics for a user.
     */
    public function getStatistics(int $userId): array
    {
        $total = DB::table('notifications')
            ->where('notifiable_type', User::class)
            ->where('notifiable_id', $userId)
            ->count();

        $unread = DB::table('notifications')
            ->where('notifiable_type', User::class)
            ->where('notifiable_id', $userId)
            ->whereNull('read_at')
            ->count();

        $byType = DB::table('notifications')
            ->where('notifiable_type', User::class)
            ->where('notifiable_id', $userId)
            ->select('type', DB::raw('COUNT(*) as count'))
            ->groupBy('type')
            ->pluck('count', 'type')
            ->toArray();

        return [
            'total' => $total,
            'unread' => $unread,
            'read' => $total - $unread,
            'by_type' => $byType,
        ];
    }

    /**
     * Clean up old notifications.
     */
    public function cleanup(int $daysToKeep = 30): int
    {
        return DB::table('notifications')
            ->where('created_at', '<', now()->subDays($daysToKeep))
            ->whereNotNull('read_at')
            ->delete();
    }
}
