<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Audit\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Controller for audit log management.
 * 
 * Admin only endpoints for viewing, searching, exporting, and analyzing audit logs.
 */
class AuditController extends Controller
{
    public function __construct(
        protected AuditService $auditService
    ) {}

    /**
     * Search and list audit logs.
     * 
     * @queryParam user_id int Filter by user ID
     * @queryParam action string Filter by action (partial match)
     * @queryParam category string Filter by category (auth, booking, package, etc.)
     * @queryParam model_type string Filter by model type (full class name)
     * @queryParam model_id int Filter by model ID
     * @queryParam start_date date Filter from date (Y-m-d)
     * @queryParam end_date date Filter to date (Y-m-d)
     * @queryParam ip_address string Filter by IP address
     * @queryParam search string Full-text search in description and action
     * @queryParam sort_by string Sort field (created_at, action, user_id)
     * @queryParam sort_order string Sort direction (asc, desc)
     * @queryParam per_page int Items per page (default: 20, max: 100)
     */
    public function index(Request $request): JsonResponse
    {
        $filters = $request->only([
            'user_id',
            'action',
            'category',
            'model_type',
            'model_id',
            'start_date',
            'end_date',
            'ip_address',
            'search',
            'sort_by',
            'sort_order',
        ]);

        $perPage = min((int) $request->get('per_page', 20), 100);

        $logs = $this->auditService->search($filters, $perPage);

        return response()->json([
            'success' => true,
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
     * Get a specific audit log entry.
     */
    public function show(int $id): JsonResponse
    {
        $log = $this->auditService->find($id);

        if (!$log) {
            return response()->json([
                'success' => false,
                'message' => 'Audit log not found',
                'error_code' => 'NOT_FOUND',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $log,
        ]);
    }

    /**
     * Get audit history for a specific model.
     */
    public function modelHistory(Request $request): JsonResponse
    {
        $request->validate([
            'model_type' => 'required|string',
            'model_id' => 'required|integer',
        ]);

        $history = $this->auditService->getModelHistory(
            $request->input('model_type'),
            $request->input('model_id')
        );

        return response()->json([
            'success' => true,
            'data' => $history,
        ]);
    }

    /**
     * Get audit history for a specific user.
     */
    public function userHistory(Request $request, int $userId): JsonResponse
    {
        $limit = min((int) $request->get('limit', 50), 200);

        $history = $this->auditService->getUserHistory($userId, $limit);

        return response()->json([
            'success' => true,
            'data' => $history,
        ]);
    }

    /**
     * Export audit logs.
     * 
     * @queryParam format string Export format (json, csv). Default: json
     * @queryParam All filter parameters from index endpoint
     */
    public function export(Request $request): JsonResponse
    {
        $filters = $request->only([
            'user_id',
            'action',
            'category',
            'model_type',
            'start_date',
            'end_date',
            'ip_address',
        ]);

        $format = $request->get('format', AuditService::FORMAT_JSON);

        if (!in_array($format, [AuditService::FORMAT_JSON, AuditService::FORMAT_CSV])) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid format. Supported: json, csv',
                'error_code' => 'INVALID_FORMAT',
            ], 400);
        }

        $path = $this->auditService->export($filters, $format);

        return response()->json([
            'success' => true,
            'message' => 'Export generated successfully',
            'data' => [
                'path' => $path,
                'download_url' => url("storage/{$path}"),
            ],
        ]);
    }

    /**
     * Get audit analytics.
     * 
     * @queryParam start_date date Analytics start date (Y-m-d)
     * @queryParam end_date date Analytics end date (Y-m-d)
     */
    public function analytics(Request $request): JsonResponse
    {
        $startDate = $request->get('start_date');
        $endDate = $request->get('end_date');

        $analytics = $this->auditService->getAnalytics($startDate, $endDate);

        return response()->json([
            'success' => true,
            'data' => $analytics,
        ]);
    }

    /**
     * Get available filter options.
     */
    public function filterOptions(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => [
                'categories' => $this->auditService->getCategories(),
                'model_types' => $this->auditService->getModelTypes(),
            ],
        ]);
    }

    /**
     * Cleanup old audit logs (retention policy).
     */
    public function cleanup(Request $request): JsonResponse
    {
        $request->validate([
            'retention_days' => 'integer|min:30|max:3650',
        ]);

        $retentionDays = (int) $request->get('retention_days', 365);

        $deleted = $this->auditService->cleanup($retentionDays);

        return response()->json([
            'success' => true,
            'message' => "Deleted {$deleted} audit log entries older than {$retentionDays} days",
            'data' => [
                'deleted_count' => $deleted,
                'retention_days' => $retentionDays,
            ],
        ]);
    }
}
