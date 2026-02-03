<?php

namespace App\Repositories;

use App\Models\AuditLog;

class AuditLogRepository extends BaseRepository
{
    public function __construct(AuditLog $model)
    {
        parent::__construct($model);
        $this->orderBy = 'created_at';
        $this->orderDirection = 'desc';
    }

    /**
     * Get logs by user
     */
    public function getByUser(int $userId, int $perPage = 15)
    {
        return $this->model
            ->with($this->relations)
            ->where('user_id', $userId)
            ->orderBy($this->orderBy, $this->orderDirection)
            ->paginate($perPage);
    }

    /**
     * Get logs by action
     */
    public function getByAction(string $action, int $perPage = 15)
    {
        return $this->model
            ->with($this->relations)
            ->where('action', $action)
            ->orderBy($this->orderBy, $this->orderDirection)
            ->paginate($perPage);
    }

    /**
     * Get logs by model type
     */
    public function getByModel(string $modelType, int $perPage = 15)
    {
        return $this->model
            ->with($this->relations)
            ->where('auditable_type', $modelType)
            ->orderBy($this->orderBy, $this->orderDirection)
            ->paginate($perPage);
    }

    /**
     * Get logs by model ID
     */
    public function getByModelId(int $modelId, int $perPage = 15)
    {
        return $this->model
            ->with($this->relations)
            ->where('auditable_id', $modelId)
            ->orderBy($this->orderBy, $this->orderDirection)
            ->paginate($perPage);
    }

    /**
     * Get logs by date range
     */
    public function getByDateRange(\DateTime $startDate, \DateTime $endDate, int $perPage = 15)
    {
        return $this->model
            ->with($this->relations)
            ->whereBetween('created_at', [$startDate, $endDate])
            ->orderBy($this->orderBy, $this->orderDirection)
            ->paginate($perPage);
    }

    /**
     * Get create logs
     */
    public function getCreates(int $perPage = 15)
    {
        return $this->getByAction('create', $perPage);
    }

    /**
     * Get update logs
     */
    public function getUpdates(int $perPage = 15)
    {
        return $this->getByAction('update', $perPage);
    }

    /**
     * Get delete logs
     */
    public function getDeletes()
    {
        return $this->getByAction('delete', PHP_INT_MAX);
    }

    /**
     * Get recent activity
     */
    public function getRecentActivity(int $days = 7, int $limit = 50)
    {
        return $this->model
            ->with($this->relations)
            ->where('created_at', '>=', now()->subDays($days))
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
    }

    /**
     * Get logs with specific IP
     */
    public function getByIp(string $ipAddress)
    {
        return $this->model
            ->with($this->relations)
            ->where('ip_address', $ipAddress)
            ->orderBy($this->orderBy, $this->orderDirection)
            ->get();
    }
}
