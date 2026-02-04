<?php

namespace App\Repositories\Contracts;

use App\Models\BookingDetail;
use App\Models\Client;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

/**
 * Booking Repository Interface
 * 
 * Defines the contract for booking-specific repository operations.
 */
interface BookingRepositoryInterface extends RepositoryInterface
{
    /**
     * Get bookings for a specific client.
     *
     * @param int $clientId
     * @param int $perPage
     * @return LengthAwarePaginator
     */
    public function getByClient(int $clientId, int $perPage = 15): LengthAwarePaginator;

    /**
     * Get bookings for a specific user (via their client record).
     *
     * @param User $user
     * @param int $perPage
     * @return LengthAwarePaginator
     */
    public function getByUser(User $user, int $perPage = 15): LengthAwarePaginator;

    /**
     * Get bookings by status.
     *
     * @param string $status
     * @param int $perPage
     * @return LengthAwarePaginator
     */
    public function getByStatus(string $status, int $perPage = 15): LengthAwarePaginator;

    /**
     * Get upcoming bookings.
     *
     * @param int $perPage
     * @return LengthAwarePaginator
     */
    public function getUpcoming(int $perPage = 15): LengthAwarePaginator;

    /**
     * Get bookings within a date range.
     *
     * @param Carbon $startDate
     * @param Carbon $endDate
     * @param int $perPage
     * @return LengthAwarePaginator
     */
    public function getByDateRange(Carbon $startDate, Carbon $endDate, int $perPage = 15): LengthAwarePaginator;

    /**
     * Check if a date is available for booking.
     *
     * @param Carbon $date
     * @param int|null $excludeBookingId
     * @return bool
     */
    public function isDateAvailable(Carbon $date, ?int $excludeBookingId = null): bool;

    /**
     * Get conflicting bookings for a date.
     *
     * @param Carbon $date
     * @param int|null $excludeBookingId
     * @return Collection
     */
    public function getConflictingBookings(Carbon $date, ?int $excludeBookingId = null): Collection;

    /**
     * Update booking status.
     *
     * @param int $bookingId
     * @param string $status
     * @param string|null $notes
     * @return BookingDetail
     */
    public function updateStatus(int $bookingId, string $status, ?string $notes = null): BookingDetail;

    /**
     * Get bookings pending approval.
     *
     * @param int $perPage
     * @return LengthAwarePaginator
     */
    public function getPendingApproval(int $perPage = 15): LengthAwarePaginator;

    /**
     * Get completed bookings.
     *
     * @param int $perPage
     * @return LengthAwarePaginator
     */
    public function getCompleted(int $perPage = 15): LengthAwarePaginator;

    /**
     * Get booking statistics.
     *
     * @param Carbon|null $startDate
     * @param Carbon|null $endDate
     * @return array
     */
    public function getStatistics(?Carbon $startDate = null, ?Carbon $endDate = null): array;

    /**
     * Search bookings.
     *
     * @param string $query
     * @param array $filters
     * @param int $perPage
     * @return LengthAwarePaginator
     */
    public function search(string $query, array $filters = [], int $perPage = 15): LengthAwarePaginator;

    /**
     * Get bookings that need reminders.
     *
     * @param int $daysAhead
     * @return Collection
     */
    public function getBookingsNeedingReminders(int $daysAhead = 1): Collection;

    /**
     * Mark past approved bookings as completed.
     *
     * @return int Number of bookings marked as completed
     */
    public function markPastBookingsAsCompleted(): int;
}
