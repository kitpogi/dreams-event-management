<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use App\Models\User;

class PushNotificationService
{
    protected string $fcmUrl = 'https://fcm.googleapis.com/fcm/send';
    protected string $fcmV1Url = 'https://fcm.googleapis.com/v1/projects/{project_id}/messages:send';
    protected ?string $serverKey;
    protected ?string $projectId;
    protected bool $enabled;

    public function __construct()
    {
        $this->serverKey = config('services.firebase.server_key');
        $this->projectId = config('services.firebase.project_id');
        $this->enabled = config('services.firebase.push_enabled', false);
    }

    /**
     * Check if push notifications are enabled.
     */
    public function isEnabled(): bool
    {
        return $this->enabled && !empty($this->serverKey);
    }

    /**
     * Send a push notification to a single device.
     */
    public function sendToDevice(string $deviceToken, string $title, string $body, array $data = []): array
    {
        if (!$this->isEnabled()) {
            return $this->result(false, 'Push notifications are disabled');
        }

        return $this->send([
            'to' => $deviceToken,
            'notification' => [
                'title' => $title,
                'body' => $body,
                'sound' => 'default',
                'click_action' => $data['click_action'] ?? 'FLUTTER_NOTIFICATION_CLICK',
            ],
            'data' => $data,
            'priority' => $data['priority'] ?? 'high',
        ]);
    }

    /**
     * Send a push notification to multiple devices.
     */
    public function sendToDevices(array $deviceTokens, string $title, string $body, array $data = []): array
    {
        if (!$this->isEnabled()) {
            return $this->result(false, 'Push notifications are disabled');
        }

        if (empty($deviceTokens)) {
            return $this->result(false, 'No device tokens provided');
        }

        // FCM allows max 1000 tokens per request
        $chunks = array_chunk($deviceTokens, 1000);
        $results = [];

        foreach ($chunks as $chunk) {
            $results[] = $this->send([
                'registration_ids' => $chunk,
                'notification' => [
                    'title' => $title,
                    'body' => $body,
                    'sound' => 'default',
                    'click_action' => $data['click_action'] ?? 'FLUTTER_NOTIFICATION_CLICK',
                ],
                'data' => $data,
                'priority' => $data['priority'] ?? 'high',
            ]);
        }

        $successCount = array_sum(array_column($results, 'success_count'));
        $failureCount = array_sum(array_column($results, 'failure_count'));

        return $this->result(true, 'Sent to multiple devices', [
            'success_count' => $successCount,
            'failure_count' => $failureCount,
            'batch_count' => count($chunks),
        ]);
    }

    /**
     * Send a push notification to a topic.
     */
    public function sendToTopic(string $topic, string $title, string $body, array $data = []): array
    {
        if (!$this->isEnabled()) {
            return $this->result(false, 'Push notifications are disabled');
        }

        return $this->send([
            'to' => '/topics/' . $topic,
            'notification' => [
                'title' => $title,
                'body' => $body,
                'sound' => 'default',
            ],
            'data' => $data,
            'priority' => $data['priority'] ?? 'high',
        ]);
    }

    /**
     * Send a push notification to a user.
     */
    public function sendToUser(User|int $user, string $title, string $body, array $data = []): array
    {
        $userId = $user instanceof User ? $user->id : $user;
        $tokens = $this->getUserDeviceTokens($userId);

        if (empty($tokens)) {
            return $this->result(false, 'User has no registered devices');
        }

        if (count($tokens) === 1) {
            return $this->sendToDevice($tokens[0], $title, $body, $data);
        }

        return $this->sendToDevices($tokens, $title, $body, $data);
    }

    /**
     * Send a data-only message (silent push).
     */
    public function sendData(string $deviceToken, array $data): array
    {
        if (!$this->isEnabled()) {
            return $this->result(false, 'Push notifications are disabled');
        }

        return $this->send([
            'to' => $deviceToken,
            'data' => $data,
            'priority' => 'high',
            'content_available' => true,
        ]);
    }

    /**
     * Subscribe a device to a topic.
     */
    public function subscribeToTopic(string $deviceToken, string $topic): array
    {
        if (!$this->isEnabled()) {
            return $this->result(false, 'Push notifications are disabled');
        }

        $response = Http::withHeaders([
            'Authorization' => 'key=' . $this->serverKey,
            'Content-Type' => 'application/json',
        ])->post('https://iid.googleapis.com/iid/v1/' . $deviceToken . '/rel/topics/' . $topic);

        if ($response->successful()) {
            return $this->result(true, 'Subscribed to topic', ['topic' => $topic]);
        }

        return $this->result(false, 'Failed to subscribe to topic', ['error' => $response->body()]);
    }

    /**
     * Unsubscribe a device from a topic.
     */
    public function unsubscribeFromTopic(string $deviceToken, string $topic): array
    {
        if (!$this->isEnabled()) {
            return $this->result(false, 'Push notifications are disabled');
        }

        $response = Http::withHeaders([
            'Authorization' => 'key=' . $this->serverKey,
            'Content-Type' => 'application/json',
        ])->delete('https://iid.googleapis.com/iid/v1/' . $deviceToken . '/rel/topics/' . $topic);

        if ($response->successful()) {
            return $this->result(true, 'Unsubscribed from topic', ['topic' => $topic]);
        }

        return $this->result(false, 'Failed to unsubscribe from topic', ['error' => $response->body()]);
    }

    /**
     * Register a device token for a user.
     */
    public function registerDevice(int $userId, string $deviceToken, string $deviceType = 'unknown', ?string $deviceName = null): bool
    {
        $key = $this->getDeviceTokenCacheKey($userId);
        $devices = Cache::get($key, []);

        // Check if token already exists
        foreach ($devices as &$device) {
            if ($device['token'] === $deviceToken) {
                $device['updated_at'] = now()->toIso8601String();
                Cache::put($key, $devices, now()->addYear());
                return true;
            }
        }

        // Add new device
        $devices[] = [
            'token' => $deviceToken,
            'type' => $deviceType,
            'name' => $deviceName,
            'created_at' => now()->toIso8601String(),
            'updated_at' => now()->toIso8601String(),
        ];

        Cache::put($key, $devices, now()->addYear());

        Log::info('Device registered for push notifications', [
            'user_id' => $userId,
            'device_type' => $deviceType,
        ]);

        return true;
    }

    /**
     * Unregister a device token for a user.
     */
    public function unregisterDevice(int $userId, string $deviceToken): bool
    {
        $key = $this->getDeviceTokenCacheKey($userId);
        $devices = Cache::get($key, []);

        $devices = array_filter($devices, fn($device) => $device['token'] !== $deviceToken);

        Cache::put($key, array_values($devices), now()->addYear());

        Log::info('Device unregistered from push notifications', [
            'user_id' => $userId,
        ]);

        return true;
    }

    /**
     * Get all device tokens for a user.
     */
    public function getUserDeviceTokens(int $userId): array
    {
        $key = $this->getDeviceTokenCacheKey($userId);
        $devices = Cache::get($key, []);

        return array_column($devices, 'token');
    }

    /**
     * Get all registered devices for a user.
     */
    public function getUserDevices(int $userId): array
    {
        $key = $this->getDeviceTokenCacheKey($userId);
        return Cache::get($key, []);
    }

    /**
     * Clear all device tokens for a user.
     */
    public function clearUserDevices(int $userId): bool
    {
        $key = $this->getDeviceTokenCacheKey($userId);
        Cache::forget($key);

        return true;
    }

    /**
     * Send notification to all users (broadcast).
     */
    public function broadcast(string $title, string $body, array $data = []): array
    {
        // Send to 'all' topic - devices must be subscribed to this topic
        return $this->sendToTopic('all', $title, $body, $data);
    }

    /**
     * Send notification to users with a specific role.
     */
    public function sendToRole(string $role, string $title, string $body, array $data = []): array
    {
        return $this->sendToTopic('role_' . $role, $title, $body, $data);
    }

    /**
     * Schedule a push notification (store for later sending).
     */
    public function schedule(
        string $deviceToken,
        string $title,
        string $body,
        \DateTimeInterface $sendAt,
        array $data = []
    ): string {
        $notificationId = uniqid('scheduled_push_', true);

        Cache::put('scheduled_push:' . $notificationId, [
            'device_token' => $deviceToken,
            'title' => $title,
            'body' => $body,
            'data' => $data,
            'send_at' => $sendAt->format('Y-m-d H:i:s'),
            'created_at' => now()->toIso8601String(),
        ], $sendAt->getTimestamp() - time() + 3600); // Keep for 1 hour after send time

        return $notificationId;
    }

    /**
     * Cancel a scheduled push notification.
     */
    public function cancelScheduled(string $notificationId): bool
    {
        return Cache::forget('scheduled_push:' . $notificationId);
    }

    /**
     * Get notification delivery statistics.
     */
    public function getStatistics(?int $userId = null): array
    {
        $key = $userId ? 'push_stats:user:' . $userId : 'push_stats:global';

        return Cache::get($key, [
            'total_sent' => 0,
            'total_success' => 0,
            'total_failed' => 0,
            'by_type' => [],
            'last_sent_at' => null,
        ]);
    }

    /**
     * Send the FCM request.
     */
    protected function send(array $payload): array
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => 'key=' . $this->serverKey,
                'Content-Type' => 'application/json',
            ])->post($this->fcmUrl, $payload);

            $body = $response->json();

            // Update statistics
            $this->updateStatistics($body);

            if ($response->successful()) {
                $successCount = $body['success'] ?? 0;
                $failureCount = $body['failure'] ?? 0;

                // Handle failed tokens
                if ($failureCount > 0 && isset($body['results'])) {
                    $this->handleFailedTokens($payload, $body['results']);
                }

                return $this->result(true, 'Notification sent', [
                    'message_id' => $body['message_id'] ?? null,
                    'success_count' => $successCount,
                    'failure_count' => $failureCount,
                ]);
            }

            Log::error('FCM request failed', [
                'status' => $response->status(),
                'response' => $body,
            ]);

            return $this->result(false, $body['error'] ?? 'FCM request failed');

        } catch (\Exception $e) {
            Log::error('Push notification error', [
                'message' => $e->getMessage(),
            ]);

            return $this->result(false, 'Push notification error: ' . $e->getMessage());
        }
    }

    /**
     * Handle failed tokens (remove invalid ones).
     */
    protected function handleFailedTokens(array $payload, array $results): void
    {
        $tokens = $payload['registration_ids'] ?? [$payload['to'] ?? null];

        foreach ($results as $index => $result) {
            if (isset($result['error'])) {
                $token = $tokens[$index] ?? null;
                
                if ($token && in_array($result['error'], ['InvalidRegistration', 'NotRegistered'])) {
                    // Token is invalid - should be removed from user's devices
                    Log::warning('Invalid FCM token detected', [
                        'token' => substr($token, 0, 20) . '...',
                        'error' => $result['error'],
                    ]);
                }
            }
        }
    }

    /**
     * Update push notification statistics.
     */
    protected function updateStatistics(array $response): void
    {
        $key = 'push_stats:global';
        $stats = Cache::get($key, [
            'total_sent' => 0,
            'total_success' => 0,
            'total_failed' => 0,
            'last_sent_at' => null,
        ]);

        $stats['total_sent']++;
        $stats['total_success'] += $response['success'] ?? 0;
        $stats['total_failed'] += $response['failure'] ?? 0;
        $stats['last_sent_at'] = now()->toIso8601String();

        Cache::put($key, $stats, now()->addDays(30));
    }

    /**
     * Get the cache key for user device tokens.
     */
    protected function getDeviceTokenCacheKey(int $userId): string
    {
        return 'push_devices:user:' . $userId;
    }

    /**
     * Build a result array.
     */
    protected function result(bool $success, string $message, array $data = []): array
    {
        return array_merge([
            'success' => $success,
            'message' => $message,
        ], $data);
    }
}
