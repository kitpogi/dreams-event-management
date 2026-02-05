<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\PushNotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class PushNotificationController extends Controller
{
    public function __construct(
        protected PushNotificationService $pushService
    ) {}

    /**
     * Register a device for push notifications.
     *
     * @OA\Post(
     *     path="/api/push/register",
     *     tags={"Push Notifications"},
     *     @OA\RequestBody(required=true),
     *     @OA\Response(response=200, description="Device registered")
     * )
     */
    public function registerDevice(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'device_token' => 'required|string|min:32',
            'device_type' => 'nullable|string|in:ios,android,web',
            'device_name' => 'nullable|string|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = $request->user();

        $this->pushService->registerDevice(
            $user->id,
            $request->input('device_token'),
            $request->input('device_type', 'unknown'),
            $request->input('device_name')
        );

        return response()->json([
            'success' => true,
            'message' => 'Device registered successfully',
        ]);
    }

    /**
     * Unregister a device from push notifications.
     *
     * @OA\Delete(
     *     path="/api/push/unregister",
     *     tags={"Push Notifications"},
     *     @OA\RequestBody(required=true),
     *     @OA\Response(response=200, description="Device unregistered")
     * )
     */
    public function unregisterDevice(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'device_token' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = $request->user();

        $this->pushService->unregisterDevice(
            $user->id,
            $request->input('device_token')
        );

        return response()->json([
            'success' => true,
            'message' => 'Device unregistered successfully',
        ]);
    }

    /**
     * Get user's registered devices.
     *
     * @OA\Get(
     *     path="/api/push/devices",
     *     tags={"Push Notifications"},
     *     @OA\Response(response=200, description="List of devices")
     * )
     */
    public function getDevices(Request $request): JsonResponse
    {
        $user = $request->user();
        $devices = $this->pushService->getUserDevices($user->id);

        // Mask tokens for security
        $devices = array_map(function ($device) {
            $device['token'] = substr($device['token'], 0, 20) . '...';
            return $device;
        }, $devices);

        return response()->json([
            'success' => true,
            'data' => $devices,
        ]);
    }

    /**
     * Clear all registered devices.
     *
     * @OA\Delete(
     *     path="/api/push/devices",
     *     tags={"Push Notifications"},
     *     @OA\Response(response=200, description="All devices cleared")
     * )
     */
    public function clearDevices(Request $request): JsonResponse
    {
        $user = $request->user();
        $this->pushService->clearUserDevices($user->id);

        return response()->json([
            'success' => true,
            'message' => 'All devices cleared',
        ]);
    }

    /**
     * Subscribe to a notification topic.
     *
     * @OA\Post(
     *     path="/api/push/subscribe",
     *     tags={"Push Notifications"},
     *     @OA\RequestBody(required=true),
     *     @OA\Response(response=200, description="Subscribed to topic")
     * )
     */
    public function subscribe(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'device_token' => 'required|string',
            'topic' => 'required|string|max:50|regex:/^[a-zA-Z0-9_-]+$/',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $result = $this->pushService->subscribeToTopic(
            $request->input('device_token'),
            $request->input('topic')
        );

        return response()->json($result, $result['success'] ? 200 : 400);
    }

    /**
     * Unsubscribe from a notification topic.
     *
     * @OA\Post(
     *     path="/api/push/unsubscribe",
     *     tags={"Push Notifications"},
     *     @OA\RequestBody(required=true),
     *     @OA\Response(response=200, description="Unsubscribed from topic")
     * )
     */
    public function unsubscribe(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'device_token' => 'required|string',
            'topic' => 'required|string|max:50',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $result = $this->pushService->unsubscribeFromTopic(
            $request->input('device_token'),
            $request->input('topic')
        );

        return response()->json($result, $result['success'] ? 200 : 400);
    }

    /**
     * Send a test notification to the current user.
     *
     * @OA\Post(
     *     path="/api/push/test",
     *     tags={"Push Notifications"},
     *     @OA\Response(response=200, description="Test notification sent")
     * )
     */
    public function sendTest(Request $request): JsonResponse
    {
        $user = $request->user();

        $result = $this->pushService->sendToUser(
            $user,
            'Test Notification',
            'This is a test notification from Dreams Event Management.',
            ['type' => 'test']
        );

        return response()->json($result, $result['success'] ? 200 : 400);
    }

    /**
     * Get push notification status.
     *
     * @OA\Get(
     *     path="/api/push/status",
     *     tags={"Push Notifications"},
     *     @OA\Response(response=200, description="Push notification status")
     * )
     */
    public function status(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => [
                'enabled' => $this->pushService->isEnabled(),
                'statistics' => $this->pushService->getStatistics(),
            ],
        ]);
    }

    /**
     * Admin: Send notification to a user.
     *
     * @OA\Post(
     *     path="/api/admin/push/send",
     *     tags={"Push Notifications"},
     *     @OA\RequestBody(required=true),
     *     @OA\Response(response=200, description="Notification sent")
     * )
     */
    public function adminSend(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'user_id' => 'required|integer|exists:users,id',
            'title' => 'required|string|max:100',
            'body' => 'required|string|max:500',
            'data' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $result = $this->pushService->sendToUser(
            $request->input('user_id'),
            $request->input('title'),
            $request->input('body'),
            $request->input('data', [])
        );

        return response()->json($result, $result['success'] ? 200 : 400);
    }

    /**
     * Admin: Broadcast notification to all users.
     *
     * @OA\Post(
     *     path="/api/admin/push/broadcast",
     *     tags={"Push Notifications"},
     *     @OA\RequestBody(required=true),
     *     @OA\Response(response=200, description="Broadcast sent")
     * )
     */
    public function adminBroadcast(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:100',
            'body' => 'required|string|max:500',
            'data' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $result = $this->pushService->broadcast(
            $request->input('title'),
            $request->input('body'),
            $request->input('data', [])
        );

        return response()->json($result, $result['success'] ? 200 : 400);
    }
}
