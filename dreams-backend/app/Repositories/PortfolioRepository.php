<?php

namespace App\Repositories;

use App\Models\Portfolio;

class PortfolioRepository extends BaseRepository
{
    public function __construct(Portfolio $model)
    {
        parent::__construct($model);
        $this->orderBy = 'created_at';
        $this->orderDirection = 'desc';
    }

    /**
     * Get portfolio by coordinator
     */
    public function getByCoordinator(int $coordinatorId, int $perPage = 15)
    {
        return $this->model
            ->with($this->relations)
            ->where('coordinator_id', $coordinatorId)
            ->orderBy($this->orderBy, $this->orderDirection)
            ->paginate($perPage);
    }

    /**
     * Get portfolio by category
     */
    public function getByCategory(string $category)
    {
        return $this->model
            ->with($this->relations)
            ->where('category', $category)
            ->orderBy($this->orderBy, $this->orderDirection)
            ->get();
    }

    /**
     * Get featured portfolio items
     */
    public function getFeatured(int $limit = 10)
    {
        return $this->model
            ->with($this->relations)
            ->where('is_featured', true)
            ->limit($limit)
            ->get();
    }

    /**
     * Get approved portfolio items
     */
    public function getApproved(int $perPage = 15)
    {
        return $this->model
            ->with($this->relations)
            ->where('status', 'approved')
            ->orderBy($this->orderBy, $this->orderDirection)
            ->paginate($perPage);
    }

    /**
     * Get pending portfolio items
     */
    public function getPending()
    {
        return $this->model
            ->with($this->relations)
            ->where('status', 'pending')
            ->orderBy('created_at', 'asc')
            ->get();
    }

    /**
     * Get rejected portfolio items
     */
    public function getRejected()
    {
        return $this->model
            ->with($this->relations)
            ->where('status', 'rejected')
            ->get();
    }

    /**
     * Search portfolio
     */
    public function search(string $query, int $perPage = 15)
    {
        return $this->model
            ->with($this->relations)
            ->where('title', 'LIKE', "%{$query}%")
            ->orWhere('description', 'LIKE', "%{$query}%")
            ->where('status', 'approved')
            ->orderBy($this->orderBy, $this->orderDirection)
            ->paginate($perPage);
    }

    /**
     * Get portfolio by event type
     */
    public function getByEventType(string $eventType)
    {
        return $this->model
            ->with($this->relations)
            ->where('event_type', $eventType)
            ->where('status', 'approved')
            ->orderBy($this->orderBy, $this->orderDirection)
            ->get();
    }
}
