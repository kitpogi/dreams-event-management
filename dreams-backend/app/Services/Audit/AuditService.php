<?php

namespace App\Services\Audit;

use App\Models\AuditLog;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Storage;

/**
 * Enhanced audit logging service with search, export, and analytics capabilities.
 */
class AuditService
{
    /**
     * Action categories for filtering.
     */
    public const CATEGORY_AUTH = 'auth';
    public const CATEGORY_BOOKING = 'booking';
    public const CATEGORY_PACKAGE = 'package';
    public const CATEGORY_USER = 'user';
    public const CATEGORY_PAYMENT = 'payment';
    public const CATEGORY_SYSTEM = 'system';

    /**
     * Export formats.
     */
    public const FORMAT_JSON = 'json';
    public const FORMAT_CSV = 'csv';

    /**
     * Get audit log entries with advanced filtering.
     *
     * @param array<string, mixed> $filters
     */
    public function search(array $filters = [], int $perPage = 20): LengthAwarePaginator
    {
        $query = AuditLog::query()->with('user');

        // Filter by user
        if (!empty($filters['user_id'])) {
            $query->where('user_id', $filters['user_id']);
        }

        // Filter by action
        if (!empty($filters['action'])) {
            $query->where('action', 'like', "%{$filters['action']}%");
        }

        // Filter by category (action prefix)
        if (!empty($filters['category'])) {
            $query->where('action', 'like', "{$filters['category']}.%");
        }

        // Filter by model type
        if (!empty($filters['model_type'])) {
            $query->where('model_type', $filters['model_type']);
        }

        // Filter by model ID
        if (!empty($filters['model_id'])) {
            $query->where('model_id', $filters['model_id']);
        }

        // Filter by date range
        if (!empty($filters['start_date'])) {
            $query->where('created_at', '>=', $filters['start_date']);
        }

        if (!empty($filters['end_date'])) {
            $query->where('created_at', '<=', $filters['end_date']);
        }

        // Filter by IP address
        if (!empty($filters['ip_address'])) {
            $query->where('ip_address', $filters['ip_address']);
        }

        // Full-text search in description
        if (!empty($filters['search'])) {
            $query->where(function (Builder $q) use ($filters) {
                $q->where('description', 'like', "%{$filters['search']}%")
                    ->orWhere('action', 'like', "%{$filters['search']}%");
            });
        }

        // Sorting
        $sortBy = $filters['sort_by'] ?? 'created_at';
        $sortOrder = $filters['sort_order'] ?? 'desc';
        $query->orderBy($sortBy, $sortOrder);

        return $query->paginate($perPage);
    }

    /**
     * Get a single audit log entry with full details.
     */
    public function find(int $id): ?AuditLog
    {
        return AuditLog::with('user')->find($id);
    }

    /**
     * Get audit history for a specific model.
     */
    public function getModelHistory(string $modelType, int $modelId): Collection
    {
        return AuditLog::query()
            ->where('model_type', $modelType)
            ->where('model_id', $modelId)
            ->with('user')
            ->orderByDesc('created_at')
            ->get();
    }

    /**
     * Get audit history for a specific user.
     */
    public function getUserHistory(int $userId, int $limit = 50): Collection
    {
        return AuditLog::query()
            ->where('user_id', $userId)
            ->orderByDesc('created_at')
            ->limit($limit)
            ->get();
    }

    /**
     * Export audit logs.
     *
     * @param array<string, mixed> $filters
     */
    public function export(array $filters = [], string $format = self::FORMAT_JSON): string
    {
        $query = AuditLog::query()->with('user');

        // Apply same filters as search
        $this->applyFilters($query, $filters);

        $logs = $query->orderByDesc('created_at')->get();

        $filename = sprintf(
            'audit_export_%s.%s',
            now()->format('Y-m-d_His'),
            $format
        );

        $path = "exports/{$filename}";

        match ($format) {
            self::FORMAT_JSON => $this->exportJson($logs, $path),
            self::FORMAT_CSV => $this->exportCsv($logs, $path),
            default => throw new \InvalidArgumentException("Unsupported format: {$format}"),
        };

        return $path;
    }

    /**
     * Get audit analytics.
     *
     * @return array<string, mixed>
     */
    public function getAnalytics(?string $startDate = null, ?string $endDate = null): array
    {
        $query = AuditLog::query();

        if ($startDate) {
            $query->where('created_at', '>=', $startDate);
        }

        if ($endDate) {
            $query->where('created_at', '<=', $endDate);
        }

        // Total logs
        $total = $query->count();

        // Actions breakdown
        $byAction = AuditLog::query()
            ->when($startDate, fn ($q) => $q->where('created_at', '>=', $startDate))
            ->when($endDate, fn ($q) => $q->where('created_at', '<=', $endDate))
            ->selectRaw('action, COUNT(*) as count')
            ->groupBy('action')
            ->orderByDesc('count')
            ->limit(20)
            ->pluck('count', 'action')
            ->toArray();

        // Category breakdown
        $byCategory = AuditLog::query()
            ->when($startDate, fn ($q) => $q->where('created_at', '>=', $startDate))
            ->when($endDate, fn ($q) => $q->where('created_at', '<=', $endDate))
            ->selectRaw("SUBSTRING_INDEX(action, '.', 1) as category, COUNT(*) as count")
            ->groupBy('category')
            ->orderByDesc('count')
            ->pluck('count', 'category')
            ->toArray();

        // User activity breakdown
        $byUser = AuditLog::query()
            ->when($startDate, fn ($q) => $q->where('created_at', '>=', $startDate))
            ->when($endDate, fn ($q) => $q->where('created_at', '<=', $endDate))
            ->whereNotNull('user_id')
            ->with('user:id,name')
            ->selectRaw('user_id, COUNT(*) as count')
            ->groupBy('user_id')
            ->orderByDesc('count')
            ->limit(10)
            ->get()
            ->map(fn ($item) => [
                'user_id' => $item->user_id,
                'user_name' => $item->user?->name ?? 'Unknown',
                'count' => $item->count,
            ])
            ->toArray();

        // Daily activity trend
        $dailyTrend = AuditLog::query()
            ->when($startDate, fn ($q) => $q->where('created_at', '>=', $startDate))
            ->when($endDate, fn ($q) => $q->where('created_at', '<=', $endDate))
            ->selectRaw('DATE(created_at) as date, COUNT(*) as count')
            ->groupBy('date')
            ->orderBy('date')
            ->pluck('count', 'date')
            ->toArray();

        // Hourly distribution
        $hourlyDistribution = AuditLog::query()
            ->when($startDate, fn ($q) => $q->where('created_at', '>=', $startDate))
            ->when($endDate, fn ($q) => $q->where('created_at', '<=', $endDate))
            ->selectRaw('HOUR(created_at) as hour, COUNT(*) as count')
            ->groupBy('hour')
            ->orderBy('hour')
            ->pluck('count', 'hour')
            ->toArray();

        // Top IP addresses
        $topIps = AuditLog::query()
            ->when($startDate, fn ($q) => $q->where('created_at', '>=', $startDate))
            ->when($endDate, fn ($q) => $q->where('created_at', '<=', $endDate))
            ->whereNotNull('ip_address')
            ->selectRaw('ip_address, COUNT(*) as count')
            ->groupBy('ip_address')
            ->orderByDesc('count')
            ->limit(10)
            ->pluck('count', 'ip_address')
            ->toArray();

        return [
            'total' => $total,
            'by_action' => $byAction,
            'by_category' => $byCategory,
            'by_user' => $byUser,
            'daily_trend' => $dailyTrend,
            'hourly_distribution' => $hourlyDistribution,
            'top_ips' => $topIps,
            'period' => [
                'start' => $startDate,
                'end' => $endDate,
            ],
        ];
    }

    /**
     * Apply filters to query.
     */
    protected function applyFilters(Builder $query, array $filters): void
    {
        if (!empty($filters['user_id'])) {
            $query->where('user_id', $filters['user_id']);
        }

        if (!empty($filters['action'])) {
            $query->where('action', 'like', "%{$filters['action']}%");
        }

        if (!empty($filters['category'])) {
            $query->where('action', 'like', "{$filters['category']}.%");
        }

        if (!empty($filters['model_type'])) {
            $query->where('model_type', $filters['model_type']);
        }

        if (!empty($filters['start_date'])) {
            $query->where('created_at', '>=', $filters['start_date']);
        }

        if (!empty($filters['end_date'])) {
            $query->where('created_at', '<=', $filters['end_date']);
        }

        if (!empty($filters['ip_address'])) {
            $query->where('ip_address', $filters['ip_address']);
        }
    }

    /**
     * Export to JSON format.
     */
    protected function exportJson(Collection $logs, string $path): void
    {
        $data = $logs->map(fn (AuditLog $log) => [
            'id' => $log->id,
            'user_id' => $log->user_id,
            'user_name' => $log->user?->name,
            'action' => $log->action,
            'model_type' => $log->model_type,
            'model_id' => $log->model_id,
            'description' => $log->description,
            'old_values' => $log->old_values,
            'new_values' => $log->new_values,
            'ip_address' => $log->ip_address,
            'user_agent' => $log->user_agent,
            'created_at' => $log->created_at?->toISOString(),
        ])->toArray();

        Storage::put($path, json_encode($data, JSON_PRETTY_PRINT));
    }

    /**
     * Export to CSV format.
     */
    protected function exportCsv(Collection $logs, string $path): void
    {
        $headers = ['ID', 'User ID', 'User Name', 'Action', 'Model Type', 'Model ID', 'Description', 'IP Address', 'Created At'];

        $rows = $logs->map(fn (AuditLog $log) => [
            $log->id,
            $log->user_id,
            $log->user?->name ?? '',
            $log->action,
            $log->model_type ?? '',
            $log->model_id ?? '',
            $log->description ?? '',
            $log->ip_address ?? '',
            $log->created_at?->toDateTimeString() ?? '',
        ])->toArray();

        $csv = implode(',', $headers) . "\n";
        foreach ($rows as $row) {
            $csv .= implode(',', array_map(fn ($v) => '"' . str_replace('"', '""', (string) $v) . '"', $row)) . "\n";
        }

        Storage::put($path, $csv);
    }

    /**
     * Cleanup old audit logs based on retention policy.
     */
    public function cleanup(int $retentionDays = 365): int
    {
        $cutoffDate = now()->subDays($retentionDays);

        return AuditLog::query()
            ->where('created_at', '<', $cutoffDate)
            ->delete();
    }

    /**
     * Get available action categories.
     *
     * @return array<string, string>
     */
    public function getCategories(): array
    {
        return [
            self::CATEGORY_AUTH => 'Authentication',
            self::CATEGORY_BOOKING => 'Bookings',
            self::CATEGORY_PACKAGE => 'Packages',
            self::CATEGORY_USER => 'Users',
            self::CATEGORY_PAYMENT => 'Payments',
            self::CATEGORY_SYSTEM => 'System',
        ];
    }

    /**
     * Get available model types from existing logs.
     *
     * @return array<int, string>
     */
    public function getModelTypes(): array
    {
        return AuditLog::query()
            ->whereNotNull('model_type')
            ->distinct()
            ->pluck('model_type')
            ->toArray();
    }
}
