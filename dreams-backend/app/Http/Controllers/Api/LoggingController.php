<?php

namespace App\Http\Controllers\Api;

use App\Models\AuditLog;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class LoggingController extends Controller
{
    /**
     * Get audit logs with filtering
     */
    public function getAuditLogs(Request $request): JsonResponse
    {
        $this->authorize('viewAny', AuditLog::class);

        $query = AuditLog::query();

        // Filter by user
        if ($request->has('user_id')) {
            $query->where('user_id', $request->input('user_id'));
        }

        // Filter by action
        if ($request->has('action')) {
            $query->where('action', $request->input('action'));
        }

        // Filter by model type
        if ($request->has('auditable_type')) {
            $query->where('auditable_type', $request->input('auditable_type'));
        }

        // Filter by date range
        if ($request->has('date_from') && $request->has('date_to')) {
            $query->whereBetween('created_at', [
                $request->input('date_from'),
                $request->input('date_to'),
            ]);
        }

        $logs = $query->orderBy('created_at', 'desc')
            ->paginate($request->input('per_page', 15));

        return response()->json([
            'success' => true,
            'message' => 'Audit logs retrieved successfully',
            'data' => $logs->items(),
            'meta' => [
                'current_page' => $logs->currentPage(),
                'per_page' => $logs->perPage(),
                'total' => $logs->total(),
                'last_page' => $logs->lastPage(),
            ],
        ]);
    }

    /**
     * Get user activity
     */
    public function getUserActivity(Request $request, int $userId): JsonResponse
    {
        $this->authorize('view', AuditLog::class);

        $logs = AuditLog::where('user_id', $userId)
            ->orderBy('created_at', 'desc')
            ->paginate($request->input('per_page', 15));

        return response()->json([
            'success' => true,
            'message' => 'User activity retrieved successfully',
            'data' => $logs->items(),
            'meta' => [
                'current_page' => $logs->currentPage(),
                'per_page' => $logs->perPage(),
                'total' => $logs->total(),
                'last_page' => $logs->lastPage(),
            ],
        ]);
    }

    /**
     * Get audit trail for a specific model
     */
    public function getModelAuditTrail(Request $request, string $modelType, int $modelId): JsonResponse
    {
        $this->authorize('view', AuditLog::class);

        $logs = AuditLog::where('auditable_type', "App\\Models\\{$modelType}")
            ->where('auditable_id', $modelId)
            ->orderBy('created_at', 'desc')
            ->paginate($request->input('per_page', 15));

        return response()->json([
            'success' => true,
            'message' => 'Model audit trail retrieved successfully',
            'data' => $logs->items(),
            'meta' => [
                'current_page' => $logs->currentPage(),
                'per_page' => $logs->perPage(),
                'total' => $logs->total(),
                'last_page' => $logs->lastPage(),
            ],
        ]);
    }

    /**
     * Get action statistics
     */
    public function getActionStats(Request $request): JsonResponse
    {
        $this->authorize('viewAny', AuditLog::class);

        $stats = AuditLog::selectRaw('action, COUNT(*) as count')
            ->groupBy('action')
            ->get()
            ->mapWithKeys(fn($stat) => [$stat->action => $stat->count])
            ->toArray();

        return response()->json([
            'success' => true,
            'message' => 'Action statistics retrieved successfully',
            'data' => $stats,
        ]);
    }

    /**
     * Get activity summary
     */
    public function getActivitySummary(Request $request): JsonResponse
    {
        $this->authorize('viewAny', AuditLog::class);

        $days = $request->input('days', 7);

        $summary = AuditLog::selectRaw('DATE(created_at) as date, COUNT(*) as count')
            ->where('created_at', '>=', now()->subDays($days))
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->mapWithKeys(fn($item) => [$item->date => $item->count])
            ->toArray();

        return response()->json([
            'success' => true,
            'message' => 'Activity summary retrieved successfully',
            'data' => $summary,
        ]);
    }
}
