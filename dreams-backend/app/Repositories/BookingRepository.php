<?php

namespace App\Repositories;

use App\Models\BookingDetail;

class BookingRepository extends BaseRepository
{
    public function __construct(BookingDetail $model)
    {
        parent::__construct($model);
        $this->orderBy = 'created_at';
        $this->orderDirection = 'desc';
    }

    /**
     * Get bookings by user ID
     */
    public function getByUserId(int $userId, int $perPage = 15)
    {
        return $this->model
            ->with($this->relations)
            ->where('user_id', $userId)
            ->orderBy($this->orderBy, $this->orderDirection)
            ->paginate($perPage);
    }

    /**
     * Get bookings by status
     */
    public function getByStatus(string $status)
    {
        return $this->model
            ->with($this->relations)
            ->where('booking_status', $status)
            ->orderBy($this->orderBy, $this->orderDirection)
            ->get();
    }

    /**
     * Get upcoming bookings
     */
    public function getUpcoming(int $days = 7)
    {
        return $this->model
            ->with($this->relations)
            ->whereDate('event_date', '<=', now()->addDays($days))
            ->whereDate('event_date', '>=', now())
            ->orderBy('event_date', 'asc')
            ->get();
    }

    /**
     * Get pending bookings
     */
    public function getPending()
    {
        return $this->getByStatus('pending');
    }

    /**
     * Get approved bookings
     */
    public function getApproved()
    {
        return $this->getByStatus('approved');
    }

    /**
     * Get completed bookings
     */
    public function getCompleted()
    {
        return $this->getByStatus('completed');
    }

    /**
     * Get cancelled bookings
     */
    public function getCancelled()
    {
        return $this->getByStatus('cancelled');
    }

    /**
     * Search bookings
     */
    public function search(string $query, int $perPage = 15)
    {
        return $this->model
            ->with($this->relations)
            ->where('event_venue', 'LIKE', "%{$query}%")
            ->orWhere('special_requests', 'LIKE', "%{$query}%")
            ->orderBy($this->orderBy, $this->orderDirection)
            ->paginate($perPage);
    }
}
