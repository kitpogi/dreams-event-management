<?php

namespace App\Repositories;

use App\Models\Testimonial;
use Illuminate\Pagination\LengthAwarePaginator;

class TestimonialRepository extends BaseRepository
{
    public function __construct(Testimonial $model)
    {
        parent::__construct($model);
        $this->orderBy = 'created_at';
        $this->orderDirection = 'desc';
    }

    /**
     * Get testimonials by coordinator
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
     * Get featured testimonials
     */
    public function getFeatured(int $limit = 10)
    {
        return $this->model
            ->with($this->relations)
            ->where('is_featured', true)
            ->limit($limit)
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /**
     * Get approved testimonials
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
     * Get pending testimonials
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
     * Get testimonials by client
     */
    public function getByClient(int $clientId, int $perPage = 15)
    {
        return $this->model
            ->with($this->relations)
            ->where('client_id', $clientId)
            ->orderBy($this->orderBy, $this->orderDirection)
            ->paginate($perPage);
    }

    /**
     * Search testimonials with pagination
     */
    public function searchPaginated(string $query, int $perPage = 15): \Illuminate\Pagination\LengthAwarePaginator
    {
        return $this->model
            ->with($this->relations)
            ->where('testimonial_text', 'LIKE', "%{$query}%")
            ->orWhere('client_name', 'LIKE', "%{$query}%")
            ->where('status', 'approved')
            ->orderBy($this->orderBy, $this->orderDirection)
            ->paginate($perPage);
    }

    /**
     * Get recent testimonials
     */
    public function getRecent(int $days = 30, int $limit = 10)
    {
        return $this->model
            ->with($this->relations)
            ->where('status', 'approved')
            ->where('created_at', '>=', now()->subDays($days))
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
    }
}
