<?php

namespace App\Repositories;

use App\Models\RecommendationLog;

class RecommendationLogRepository extends BaseRepository
{
    public function __construct(RecommendationLog $model)
    {
        parent::__construct($model);
        $this->orderBy = 'created_at';
        $this->orderDirection = 'desc';
    }

    /**
     * Get logs for recommendation
     */
    public function getByRecommendation(int $recommendationId, int $perPage = 15)
    {
        return $this->model
            ->with($this->relations)
            ->where('recommendation_id', $recommendationId)
            ->orderBy($this->orderBy, $this->orderDirection)
            ->paginate($perPage);
    }

    /**
     * Get logs by action type
     */
    public function getByAction(string $action)
    {
        return $this->model
            ->with($this->relations)
            ->where('action', $action)
            ->orderBy($this->orderBy, $this->orderDirection)
            ->get();
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
     * Get view logs
     */
    public function getViews(int $perPage = 15)
    {
        return $this->model
            ->with($this->relations)
            ->where('action', 'view')
            ->orderBy($this->orderBy, $this->orderDirection)
            ->paginate($perPage);
    }

    /**
     * Get click logs
     */
    public function getClicks(int $perPage = 15)
    {
        return $this->model
            ->with($this->relations)
            ->where('action', 'click')
            ->orderBy($this->orderBy, $this->orderDirection)
            ->paginate($perPage);
    }

    /**
     * Get logs for user
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
     * Get popular recommendations by view count
     */
    public function getPopularByViews(int $limit = 10)
    {
        return $this->model
            ->select('recommendation_id')
            ->where('action', 'view')
            ->groupBy('recommendation_id')
            ->orderByRaw('COUNT(*) DESC')
            ->limit($limit)
            ->with($this->relations)
            ->get();
    }

    /**
     * Get conversion logs
     */
    public function getConversions(int $perPage = 15)
    {
        return $this->model
            ->with($this->relations)
            ->where('action', 'conversion')
            ->orderBy($this->orderBy, $this->orderDirection)
            ->paginate($perPage);
    }

    /**
     * Get logs by interaction type
     */
    public function getByInteractionType(string $interactionType)
    {
        return $this->model
            ->with($this->relations)
            ->where('interaction_type', $interactionType)
            ->orderBy($this->orderBy, $this->orderDirection)
            ->get();
    }
}
