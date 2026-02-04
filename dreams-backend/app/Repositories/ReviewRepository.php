<?php

namespace App\Repositories;

use App\Models\Review;
use Illuminate\Pagination\LengthAwarePaginator;

class ReviewRepository extends BaseRepository
{
    public function __construct(Review $model)
    {
        parent::__construct($model);
        $this->orderBy = 'created_at';
        $this->orderDirection = 'desc';
    }

    /**
     * Get reviews by venue
     */
    public function getByVenue(int $venueId, int $perPage = 15)
    {
        return $this->model
            ->with($this->relations)
            ->where('venue_id', $venueId)
            ->orderBy($this->orderBy, $this->orderDirection)
            ->paginate($perPage);
    }

    /**
     * Get reviews by user
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
     * Get reviews by rating
     */
    public function getByRating(int $rating)
    {
        return $this->model
            ->with($this->relations)
            ->where('rating', $rating)
            ->orderBy($this->orderBy, $this->orderDirection)
            ->get();
    }

    /**
     * Get reviews with minimum rating
     */
    public function getByMinimumRating(int $minRating)
    {
        return $this->model
            ->with($this->relations)
            ->where('rating', '>=', $minRating)
            ->orderBy('rating', 'desc')
            ->get();
    }

    /**
     * Get featured reviews
     */
    public function getFeatured(int $limit = 10)
    {
        return $this->model
            ->with($this->relations)
            ->where('is_featured', true)
            ->limit($limit)
            ->orderBy('rating', 'desc')
            ->get();
    }

    /**
     * Get approved reviews
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
     * Get pending reviews
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
     * Get average rating for venue
     */
    public function getAverageRating(int $venueId)
    {
        return $this->model
            ->where('venue_id', $venueId)
            ->where('status', 'approved')
            ->avg('rating');
    }

    /**
     * Search reviews with pagination
     */
    public function searchPaginated(string $query, int $perPage = 15): LengthAwarePaginator
    {
        return $this->model
            ->with($this->relations)
            ->where('comment', 'LIKE', "%{$query}%")
            ->orWhere('title', 'LIKE', "%{$query}%")
            ->where('status', 'approved')
            ->orderBy($this->orderBy, $this->orderDirection)
            ->paginate($perPage);
    }
}
