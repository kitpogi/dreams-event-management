<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * @OA\Tag(
 *     name="Notifications",
 *     description="In-app notification management"
 * )
 */
class NotificationController extends Controller
{
    protected NotificationService $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    /**
     * @OA\Get(
     *     path="/api/notifications",
     *     summary="Get user notifications",
     *     tags={"Notifications"},
     *     security={{"sanctum": {}}},
     *     @OA\Parameter(
     *         name="unread_only",
     *         in="query",
     *         description="Filter to unread only",
     *         required=false,
     *         @OA\Schema(type="boolean")
     *     ),
     *     @OA\Parameter(
     *         name="type",
     *         in="query",
     *         description="Filter by notification type",
     *         required=false,
     *         @OA\Schema(type="string")
     *     ),
     *     @OA\Parameter(
     *         name="limit",
     *         in="query",
     *         description="Number of notifications to return",
     *         required=false,
     *         @OA\Schema(type="integer", default=50)
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="List of notifications",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(property="data", type="object",
     *                 @OA\Property(property="notifications", type="array", @OA\Items(type="object")),
     *                 @OA\Property(property="unread_count", type="integer")
     *             )
     *         )
     *     )
     * )
     */
    public function index(Request $request): JsonResponse
    {
        $userId = $request->user()->id;
        $unreadOnly = $request->query('unread_only') !== null ? $request->boolean('unread_only') : null;
        $type = $request->query('type');
        $limit = (int) $request->query('limit', 50);
        $offset = (int) $request->query('offset', 0);

        $notifications = $this->notificationService->getForUser(
            $userId,
            $unreadOnly,
            $type,
            $limit,
            $offset
        );

        $unreadCount = $this->notificationService->getUnreadCount($userId);

        return response()->json([
            'success' => true,
            'data' => [
                'notifications' => $notifications,
                'unread_count' => $unreadCount,
            ],
        ]);
    }

    /**
     * @OA\Get(
     *     path="/api/notifications/unread-count",
     *     summary="Get unread notification count",
     *     tags={"Notifications"},
     *     security={{"sanctum": {}}},
     *     @OA\Response(
     *         response=200,
     *         description="Unread count",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(property="data", type="object",
     *                 @OA\Property(property="unread_count", type="integer")
     *             )
     *         )
     *     )
     * )
     */
    public function unreadCount(Request $request): JsonResponse
    {
        $userId = $request->user()->id;
        $type = $request->query('type');

        $count = $this->notificationService->getUnreadCount($userId, $type);

        return response()->json([
            'success' => true,
            'data' => [
                'unread_count' => $count,
            ],
        ]);
    }

    /**
     * @OA\Post(
     *     path="/api/notifications/{id}/read",
     *     summary="Mark notification as read",
     *     tags={"Notifications"},
     *     security={{"sanctum": {}}},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         description="Notification ID",
     *         required=true,
     *         @OA\Schema(type="string")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Notification marked as read"
     *     )
     * )
     */
    public function markAsRead(Request $request, string $id): JsonResponse
    {
        $userId = $request->user()->id;

        $success = $this->notificationService->markAsRead($id, $userId);

        if (!$success) {
            return response()->json([
                'success' => false,
                'message' => 'Notification not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Notification marked as read',
        ]);
    }

    /**
     * @OA\Post(
     *     path="/api/notifications/mark-all-read",
     *     summary="Mark all notifications as read",
     *     tags={"Notifications"},
     *     security={{"sanctum": {}}},
     *     @OA\Response(
     *         response=200,
     *         description="All notifications marked as read"
     *     )
     * )
     */
    public function markAllAsRead(Request $request): JsonResponse
    {
        $userId = $request->user()->id;
        $type = $request->query('type');

        $count = $this->notificationService->markAllAsRead($userId, $type);

        return response()->json([
            'success' => true,
            'message' => "Marked {$count} notifications as read",
            'data' => [
                'count' => $count,
            ],
        ]);
    }

    /**
     * @OA\Post(
     *     path="/api/notifications/{id}/unread",
     *     summary="Mark notification as unread",
     *     tags={"Notifications"},
     *     security={{"sanctum": {}}},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         description="Notification ID",
     *         required=true,
     *         @OA\Schema(type="string")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Notification marked as unread"
     *     )
     * )
     */
    public function markAsUnread(Request $request, string $id): JsonResponse
    {
        $userId = $request->user()->id;

        $success = $this->notificationService->markAsUnread($id, $userId);

        if (!$success) {
            return response()->json([
                'success' => false,
                'message' => 'Notification not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Notification marked as unread',
        ]);
    }

    /**
     * @OA\Delete(
     *     path="/api/notifications/{id}",
     *     summary="Delete a notification",
     *     tags={"Notifications"},
     *     security={{"sanctum": {}}},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         description="Notification ID",
     *         required=true,
     *         @OA\Schema(type="string")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Notification deleted"
     *     )
     * )
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $userId = $request->user()->id;

        $success = $this->notificationService->delete($id, $userId);

        if (!$success) {
            return response()->json([
                'success' => false,
                'message' => 'Notification not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Notification deleted',
        ]);
    }

    /**
     * @OA\Delete(
     *     path="/api/notifications",
     *     summary="Delete all notifications",
     *     tags={"Notifications"},
     *     security={{"sanctum": {}}},
     *     @OA\Response(
     *         response=200,
     *         description="All notifications deleted"
     *     )
     * )
     */
    public function destroyAll(Request $request): JsonResponse
    {
        $userId = $request->user()->id;
        $type = $request->query('type');

        $count = $this->notificationService->deleteAll($userId, $type);

        return response()->json([
            'success' => true,
            'message' => "Deleted {$count} notifications",
            'data' => [
                'count' => $count,
            ],
        ]);
    }

    /**
     * @OA\Get(
     *     path="/api/notifications/preferences",
     *     summary="Get notification preferences",
     *     tags={"Notifications"},
     *     security={{"sanctum": {}}},
     *     @OA\Response(
     *         response=200,
     *         description="Notification preferences"
     *     )
     * )
     */
    public function getPreferences(Request $request): JsonResponse
    {
        $userId = $request->user()->id;

        $preferences = $this->notificationService->getPreferences($userId);

        return response()->json([
            'success' => true,
            'data' => [
                'preferences' => $preferences,
            ],
        ]);
    }

    /**
     * @OA\Put(
     *     path="/api/notifications/preferences",
     *     summary="Update notification preferences",
     *     tags={"Notifications"},
     *     security={{"sanctum": {}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             @OA\Property(property="channels", type="object"),
     *             @OA\Property(property="types", type="object"),
     *             @OA\Property(property="quiet_hours", type="object")
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Preferences updated"
     *     )
     * )
     */
    public function updatePreferences(Request $request): JsonResponse
    {
        $userId = $request->user()->id;

        $validated = $request->validate([
            'channels' => 'sometimes|array',
            'channels.email' => 'sometimes|boolean',
            'channels.in_app' => 'sometimes|boolean',
            'channels.push' => 'sometimes|boolean',
            'channels.sms' => 'sometimes|boolean',
            'types' => 'sometimes|array',
            'quiet_hours' => 'sometimes|array',
            'quiet_hours.enabled' => 'sometimes|boolean',
            'quiet_hours.start' => 'sometimes|date_format:H:i',
            'quiet_hours.end' => 'sometimes|date_format:H:i',
        ]);

        // Merge with existing preferences
        $currentPrefs = $this->notificationService->getPreferences($userId);
        $newPrefs = array_replace_recursive($currentPrefs, $validated);

        $success = $this->notificationService->updatePreferences($userId, $newPrefs);

        if (!$success) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update preferences',
            ], 500);
        }

        return response()->json([
            'success' => true,
            'message' => 'Preferences updated',
            'data' => [
                'preferences' => $newPrefs,
            ],
        ]);
    }

    /**
     * @OA\Get(
     *     path="/api/notifications/statistics",
     *     summary="Get notification statistics",
     *     tags={"Notifications"},
     *     security={{"sanctum": {}}},
     *     @OA\Response(
     *         response=200,
     *         description="Notification statistics"
     *     )
     * )
     */
    public function statistics(Request $request): JsonResponse
    {
        $userId = $request->user()->id;

        $stats = $this->notificationService->getStatistics($userId);

        return response()->json([
            'success' => true,
            'data' => $stats,
        ]);
    }
}
