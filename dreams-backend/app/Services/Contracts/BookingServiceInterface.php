<?php

namespace App\Services\Contracts;

use App\Models\BookingDetail;
use App\Models\Client;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Pagination\LengthAwarePaginator;

/**
 * Contract for Booking Service operations.
 */
interface BookingServiceInterface
{
    /**
     * Create a new booking.
     *
     * @param array $data Booking data
     * @param User $user The authenticated user
     * @return BookingDetail
     */
    public function createBooking(array $data, User $user): BookingDetail;

    /**
     * Update an existing booking.
     *
     * @param int $bookingId
     * @param array $data
     * @return BookingDetail
     */
    public function updateBooking(int $bookingId, array $data): BookingDetail;

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
     * Cancel a booking.
     *
     * @param int $bookingId
     * @param string|null $reason
     * @return BookingDetail
     */
    public function cancelBooking(int $bookingId, ?string $reason = null): BookingDetail;

    /**
     * Check if a date is available for booking.
     *
     * @param Carbon $date
     * @param int|null $packageId
     * @param int|null $excludeBookingId
     * @return bool
     */
    public function isDateAvailable(Carbon $date, ?int $packageId = null, ?int $excludeBookingId = null): bool;

    /**
     * Get bookings for a user.
     *
     * @param User $user
     * @param array $filters
     * @param int $perPage
     * @return LengthAwarePaginator
     */
    public function getUserBookings(User $user, array $filters = [], int $perPage = 15): LengthAwarePaginator;

    /**
     * Get booking statistics.
     *
     * @param Carbon|null $startDate
     * @param Carbon|null $endDate
     * @return array
     */
    public function getStatistics(?Carbon $startDate = null, ?Carbon $endDate = null): array;

    /**
     * Send booking confirmation email.
     *
     * @param BookingDetail $booking
     * @return void
     */
    public function sendConfirmationEmail(BookingDetail $booking): void;

    /**
     * Assign coordinator to booking.
     *
     * @param int $bookingId
     * @param int $coordinatorId
     * @return BookingDetail
     */
    public function assignCoordinator(int $bookingId, int $coordinatorId): BookingDetail;
}
