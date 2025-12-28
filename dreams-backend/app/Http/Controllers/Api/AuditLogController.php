<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    /**
     * Get audit logs with filtering and pagination (Admin only)
     */
    public function index(Request $request)
    {
        if (!$request->user()->isAdmin()) {
            return response()->json([
                'message' => 'Unauthorized. Admin access required.'
            ], 403);
        }

        // Pagination controls
        $perPage = (int) $request->query('per_page', 20);
        $perPage = max(1, min($perPage, 100));
        $page = (int) $request->query('page', 1);
        $page = max(1, $page);

        $query = AuditLog::with('user');

        // Filter by user
        if ($request->filled('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        // Filter by action
        if ($request->filled('action')) {
            $query->where('action', 'like', '%' . $request->action . '%');
        }

        // Filter by model type
        if ($request->filled('model_type')) {
            $query->where('model_type', $request->model_type);
        }

        // Filter by date range
        if ($request->filled('start_date')) {
            $query->whereDate('created_at', '>=', $request->start_date);
        }
        if ($request->filled('end_date')) {
            $query->whereDate('created_at', '<=', $request->end_date);
        }

        // Search in description
        if ($request->filled('search')) {
            $query->where('description', 'like', '%' . $request->search . '%');
        }

        // Sort by created_at descending (newest first)
        $logs = $query->orderByDesc('created_at')
            ->paginate($perPage, ['*'], 'page', $page);

        return response()->json([
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
     * Get statistics about audit logs (Admin only)
     */
    public function stats(Request $request)
    {
        if (!$request->user()->isAdmin()) {
            return response()->json([
                'message' => 'Unauthorized. Admin access required.'
            ], 403);
        }

        $query = AuditLog::query();

        // Apply date range if provided
        if ($request->filled('start_date')) {
            $query->whereDate('created_at', '>=', $request->start_date);
        }
        if ($request->filled('end_date')) {
            $query->whereDate('created_at', '<=', $request->end_date);
        }

        // Get action counts
        $actionCounts = (clone $query)
            ->selectRaw('action, COUNT(*) as count')
            ->groupBy('action')
            ->orderByDesc('count')
            ->limit(10)
            ->pluck('count', 'action');

        // Get most active users
        $activeUsers = (clone $query)
            ->whereNotNull('user_id')
            ->selectRaw('user_id, COUNT(*) as count')
            ->groupBy('user_id')
            ->orderByDesc('count')
            ->limit(10)
            ->with('user:id,name,email')
            ->get()
            ->map(function ($log) {
                return [
                    'user' => $log->user,
                    'count' => $log->count,
                ];
            });

        // Get logs by model type
        $modelTypeCounts = (clone $query)
            ->whereNotNull('model_type')
            ->selectRaw('model_type, COUNT(*) as count')
            ->groupBy('model_type')
            ->orderByDesc('count')
            ->pluck('count', 'model_type');

        return response()->json([
            'data' => [
                'total_logs' => $query->count(),
                'action_counts' => $actionCounts,
                'active_users' => $activeUsers,
                'model_type_counts' => $modelTypeCounts,
            ],
        ]);
    }

    /**
     * Get a single audit log entry (Admin only)
     */
    public function show($id)
    {
        $log = AuditLog::with('user')->findOrFail($id);
        return response()->json(['data' => $log]);
    }
}
