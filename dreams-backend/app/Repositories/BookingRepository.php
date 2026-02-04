<?php

namespace App\Repositories;

use App\Models\BookingDetail;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class BookingRepository extends BaseRepository
{
    public function __construct(BookingDetail $model)
    {
        parent::__construct($model);
        $this->orderBy = 'created_at';
        $this->orderDirection = 'desc';
        $this->relations = ['eventPackage', 'client', 'coordinator', 'payments'];
    }

    /**
     * Get bookings by client ID with pagination
     */
    public function getByClientId(int $clientId, int $perPage = 15): LengthAwarePaginator
    {
        return $this->model
            ->with($this->relations)
            ->where('client_id', $clientId)
            ->orderBy($this->orderBy, $this->orderDirection)
            ->paginate($perPage);
    }

    /**
     * Get bookings by coordinator ID with pagination
     */
    public function getByCoordinatorId(int $coordinatorId, int $perPage = 15): LengthAwarePaginator
    {
        return $this->model
            ->with($this->relations)
            ->where('coordinator_id', $coordinatorId)
            ->orderBy($this->orderBy, $this->orderDirection)
            ->paginate($perPage);
    }

    /**
     * Get all bookings with pagination (for admin)
     */
    public function getAllPaginated(int $perPage = 15, int $page = 1): LengthAwarePaginator
    {
        return $this->model
            ->with($this->relations)
            ->orderBy($this->orderBy, $this->orderDirection)
            ->paginate($perPage, ['*'], 'page', $page);
    }

    /**
     * Get status counts for all bookings
     */
    public function getStatusCounts(): Collection
    {
        return $this->model
            ->selectRaw('LOWER(booking_status) as status, COUNT(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status');
    }

    /**
     * Get status counts for a specific client
     */
    public function getStatusCountsForClient(int $clientId): Collection
    {
        return $this->model
            ->where('client_id', $clientId)
            ->selectRaw('LOWER(booking_status) as status, COUNT(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status');
    }

    /**
     * Get status counts for a specific coordinator
     */
    public function getStatusCountsForCoordinator(int $coordinatorId): Collection
    {
        return $this->model
            ->where('coordinator_id', $coordinatorId)
            ->selectRaw('LOWER(booking_status) as status, COUNT(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status');
    }

    /**
     * Find booking with all relations
     */
    public function findWithRelations(int $id): ?BookingDetail
    {
        return $this->model
            ->with(['eventPackage.venue', 'client', 'coordinator', 'payments'])
            ->find($id);
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
     * Search bookings with pagination
     */
    public function searchPaginated(string $query, int $perPage = 15): \Illuminate\Pagination\LengthAwarePaginator
    {
        return $this->model
            ->with($this->relations)
            ->where('event_venue', 'LIKE', "%{$query}%")
            ->orWhere('special_requests', 'LIKE', "%{$query}%")
            ->orderBy($this->orderBy, $this->orderDirection)
            ->paginate($perPage);
    }

    /**
     * Update booking status
     */
    public function updateStatus(int $id, string $status): bool
    {
        $booking = $this->find($id);
        if (!$booking) {
            return false;
        }
        return $booking->update(['booking_status' => $status]);
    }

    /**
     * Check if booking belongs to client
     */
    public function belongsToClient(int $bookingId, int $clientId): bool
    {
        return $this->model
            ->where('booking_id', $bookingId)
            ->where('client_id', $clientId)
            ->exists();
    }

    /**
     * Check if booking belongs to coordinator
     */
    public function belongsToCoordinator(int $bookingId, int $coordinatorId): bool
    {
        return $this->model
            ->where('booking_id', $bookingId)
            ->where('coordinator_id', $coordinatorId)
            ->exists();
    }

    /**
     * Get bookings for date range
     */
    public function getForDateRange(string $startDate, string $endDate): Collection
    {
        return $this->model
            ->with($this->relations)
            ->whereBetween('event_date', [$startDate, $endDate])
            ->orderBy('event_date', 'asc')
            ->get();
    }

    /**
     * Count bookings by status
     */
    public function countByStatus(string $status): int
    {
        return $this->model
            ->where('booking_status', $status)
            ->count();
    }
}
