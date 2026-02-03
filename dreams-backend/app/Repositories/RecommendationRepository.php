<?php

namespace App\Repositories;

use App\Models\Recommendation;

class RecommendationRepository extends BaseRepository
{
    public function __construct(Recommendation $model)
    {
        parent::__construct($model);
        $this->orderBy = 'created_at';
        $this->orderDirection = 'desc';
    }

    /**
     * Get recommendations for user
     */
    public function getForUser(int $userId, int $perPage = 15)
    {
        return $this->model
            ->with($this->relations)
            ->where('user_id', $userId)
            ->orderBy($this->orderBy, $this->orderDirection)
            ->paginate($perPage);
    }

    /**
     * Get recommendations by venue
     */
    public function getByVenue(int $venueId)
    {
        return $this->model
            ->with($this->relations)
            ->where('venue_id', $venueId)
            ->orderBy($this->orderBy, $this->orderDirection)
            ->get();
    }

    /**
     * Get recommendations by coordinator
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
     * Get active recommendations
     */
    public function getActive(int $perPage = 15)
    {
        return $this->model
            ->with($this->relations)
            ->where('status', 'active')
            ->orderBy($this->orderBy, $this->orderDirection)
            ->paginate($perPage);
    }

    /**
     * Get recommendations by score
     */
    public function getByMinScore(float $minScore)
    {
        return $this->model
            ->with($this->relations)
            ->where('recommendation_score', '>=', $minScore)
            ->orderBy('recommendation_score', 'desc')
            ->get();
    }

    /**
     * Get top recommendations
     */
    public function getTop(int $limit = 10)
    {
        return $this->model
            ->with($this->relations)
            ->where('status', 'active')
            ->orderBy('recommendation_score', 'desc')
            ->limit($limit)
            ->get();
    }

    /**
     * Get recommendations by event type
     */
    public function getByEventType(string $eventType, int $perPage = 15)
    {
        return $this->model
            ->with($this->relations)
            ->where('event_type', $eventType)
            ->where('status', 'active')
            ->orderBy('recommendation_score', 'desc')
            ->paginate($perPage);
    }

    /**
     * Get recommendations by budget range
     */
    public function getByBudgetRange(float $minBudget, float $maxBudget, int $perPage = 15)
    {
        return $this->model
            ->with($this->relations)
            ->where('status', 'active')
            ->whereBetween('estimated_budget', [$minBudget, $maxBudget])
            ->orderBy('recommendation_score', 'desc')
            ->paginate($perPage);
    }
}
