<?php

namespace App\Repositories;

use App\Models\Venue;
use Illuminate\Pagination\LengthAwarePaginator;

class VenueRepository extends BaseRepository
{
    public function __construct(Venue $model)
    {
        parent::__construct($model);
        $this->orderBy = 'created_at';
        $this->orderDirection = 'desc';
    }

    /**
     * Get venues by coordinator
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
     * Get venues by location
     */
    public function getByLocation(string $location)
    {
        return $this->model
            ->with($this->relations)
            ->where('location', 'LIKE', "%{$location}%")
            ->orderBy($this->orderBy, $this->orderDirection)
            ->get();
    }

    /**
     * Get featured venues
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
     * Get venues with capacity
     */
    public function getWithCapacity(int $minCapacity)
    {
        return $this->model
            ->with($this->relations)
            ->where('capacity', '>=', $minCapacity)
            ->orderBy($this->orderBy, $this->orderDirection)
            ->get();
    }

    /**
     * Get approved venues
     */
    public function getApproved()
    {
        return $this->model
            ->with($this->relations)
            ->where('is_approved', true)
            ->orderBy($this->orderBy, $this->orderDirection)
            ->get();
    }

    /**
     * Get pending approval venues
     */
    public function getPendingApproval()
    {
        return $this->model
            ->with($this->relations)
            ->where('is_approved', false)
            ->orderBy('created_at', 'asc')
            ->get();
    }

    /**
     * Search venues with pagination
     */
    public function searchPaginated(string $query, int $perPage = 15): LengthAwarePaginator
    {
        return $this->model
            ->with($this->relations)
            ->where('venue_name', 'LIKE', "%{$query}%")
            ->orWhere('location', 'LIKE', "%{$query}%")
            ->orWhere('venue_description', 'LIKE', "%{$query}%")
            ->where('is_approved', true)
            ->orderBy($this->orderBy, $this->orderDirection)
            ->paginate($perPage);
    }

    /**
     * Get venues by availability
     */
    public function getByAvailability(\DateTime $eventDate)
    {
        return $this->model
            ->with($this->relations)
            ->where('is_approved', true)
            ->whereDoesntHave('bookings', function ($query) use ($eventDate) {
                $query->where('event_date', $eventDate)
                    ->whereIn('status', ['approved', 'completed']);
            })
            ->orderBy($this->orderBy, $this->orderDirection)
            ->get();
    }

    /**
     * Get average rating for venue
     */
    public function getAverageRating(int $venueId)
    {
        return $this->model
            ->find($venueId)
            ?->reviews()
            ->where('status', 'approved')
            ->avg('rating') ?? 0;
    }
}
