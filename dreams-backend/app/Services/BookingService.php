<?php

namespace App\Services;

use App\Events\BookingStatusChanged;
use App\Events\NewBookingCreated;
use App\Jobs\SendBookingConfirmation;
use App\Jobs\SendBookingStatusUpdate;
use App\Mail\BookingConfirmationMail;
use App\Mail\BookingStatusUpdateMail;
use App\Models\BookingDetail;
use App\Models\Client;
use App\Models\EventPackage;
use App\Models\User;
use App\Repositories\BookingRepository;
use App\Services\Contracts\BookingServiceInterface;
use App\Services\Contracts\ClientServiceInterface;
use Carbon\Carbon;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

/**
 * Service for handling all booking-related business logic.
 * 
 * This service encapsulates complex booking operations, keeping controllers thin
 * and business logic centralized and testable.
 */
class BookingService implements BookingServiceInterface
{
    /**
     * Default deposit percentage for bookings.
     */
    protected const DEFAULT_DEPOSIT_PERCENTAGE = 0.30;

    /**
     * Cache TTL for booking statistics (in seconds).
     */
    protected const STATS_CACHE_TTL = 300;

    public function __construct(
        protected BookingRepository $bookingRepository,
        protected ClientService $clientService
    ) {}

    /**
     * Create a new booking.
     *
     * @param array $data Booking data
     * @param User $user The authenticated user
     * @return BookingDetail
     * @throws \InvalidArgumentException
     */
    public function createBooking(array $data, User $user): BookingDetail
    {
        // Validate package exists
        $package = EventPackage::with('venue')->findOrFail($data['package_id']);

        // Parse and validate event date
        $eventDate = $this->parseEventDate($data['event_date']);

        // Check date availability
        if (!$this->isDateAvailable($eventDate, $package->id)) {
            throw new \InvalidArgumentException('The selected date is not available for booking.');
        }

        // Validate guest count
        $guestCount = $this->resolveGuestCount($data);
        $this->validateGuestCapacity($guestCount, $package);

        // Resolve venue
        $eventVenue = $this->resolveEventVenue($data, $package);

        // Get or create client
        $client = $this->clientService->findOrCreateFromUser($user);

        // Calculate payment amounts
        $paymentDetails = $this->calculatePaymentAmounts($package);

        // Build booking data
        $bookingData = $this->buildBookingData($data, $client, $eventVenue, $guestCount, $paymentDetails);

        // Create booking within transaction
        $booking = DB::transaction(function () use ($bookingData) {
            return BookingDetail::create($bookingData);
        });

        // Load relationships
        $booking->load(['client', 'eventPackage', 'coordinator']);

        // Send confirmation email asynchronously
        $this->dispatchConfirmationEmail($booking);

        // Broadcast new booking event
        $this->broadcastNewBooking($booking);

        // Clear relevant caches
        $this->clearBookingCaches($client->client_id);

        Log::info('Booking created successfully', [
            'booking_id' => $booking->booking_id,
            'client_id' => $client->client_id,
            'package_id' => $data['package_id'],
        ]);

        return $booking;
    }

    /**
     * Update an existing booking.
     *
     * @param int $bookingId
     * @param array $data
     * @return BookingDetail
     */
    public function updateBooking(int $bookingId, array $data): BookingDetail
    {
        $booking = $this->bookingRepository->findWithRelations($bookingId);

        if (!$booking) {
            throw new \InvalidArgumentException('Booking not found.');
        }

        // Handle date change
        if (isset($data['event_date']) && $data['event_date'] !== $booking->event_date) {
            $newDate = $this->parseEventDate($data['event_date']);
            if (!$this->isDateAvailable($newDate, $booking->package_id, $bookingId)) {
                throw new \InvalidArgumentException('The selected date is not available.');
            }
        }

        // Handle guest count mapping
        if (isset($data['number_of_guests'])) {
            $data['guest_count'] = (int) $data['number_of_guests'];
            unset($data['number_of_guests']);
        }

        // Handle empty event_time
        if (isset($data['event_time']) && $data['event_time'] === '') {
            $data['event_time'] = null;
        }

        // Filter allowed fields
        $allowedFields = [
            'event_date', 'event_time', 'event_venue', 'guest_count',
            'special_requests', 'event_type', 'theme', 'budget_range',
            'alternate_contact'
        ];
        $updateData = array_intersect_key($data, array_flip($allowedFields));

        DB::transaction(function () use ($booking, $updateData) {
            $booking->update($updateData);
        });

        $booking->refresh();
        $this->clearBookingCaches($booking->client_id);

        Log::info('Booking updated', [
            'booking_id' => $bookingId,
            'updated_fields' => array_keys($updateData),
        ]);

        return $booking;
    }

    /**
     * Update booking status.
     *
     * @param int $bookingId
     * @param string $status
     * @param string|null $notes
     * @return BookingDetail
     */
    public function updateStatus(int $bookingId, string $status, ?string $notes = null): BookingDetail
    {
        $booking = $this->bookingRepository->findWithRelations($bookingId);

        if (!$booking) {
            throw new \InvalidArgumentException('Booking not found.');
        }

        $oldStatus = $booking->booking_status;

        // Normalize status (map Confirmed to Approved)
        $status = $this->normalizeStatus($status);

        // Skip if no change
        if ($oldStatus === $status) {
            return $booking;
        }

        // Validate status transition
        $this->validateStatusTransition($oldStatus, $status);

        DB::transaction(function () use ($booking, $status, $notes) {
            $updateData = ['booking_status' => $status];
            if ($notes) {
                $updateData['admin_notes'] = $notes;
            }
            $booking->update($updateData);
        });

        $booking->refresh();
        $booking->load(['client', 'eventPackage']);

        // Send status update notification
        $this->dispatchStatusUpdateEmail($booking, $oldStatus, $status);

        // Broadcast status change
        $this->broadcastStatusChange($booking, $oldStatus, $status);

        // Clear caches
        $this->clearBookingCaches($booking->client_id);

        Log::info('Booking status updated', [
            'booking_id' => $bookingId,
            'old_status' => $oldStatus,
            'new_status' => $status,
        ]);

        return $booking;
    }

    /**
     * Cancel a booking.
     *
     * @param int $bookingId
     * @param string|null $reason
     * @return BookingDetail
     */
    public function cancelBooking(int $bookingId, ?string $reason = null): BookingDetail
    {
        $booking = $this->bookingRepository->findWithRelations($bookingId);

        if (!$booking) {
            throw new \InvalidArgumentException('Booking not found.');
        }

        // Check if already cancelled
        if (strtolower($booking->booking_status) === 'cancelled') {
            throw new \InvalidArgumentException('Booking is already cancelled.');
        }

        // Check if can be cancelled (not completed)
        if (strtolower($booking->booking_status) === 'completed') {
            throw new \InvalidArgumentException('Cannot cancel a completed booking.');
        }

        $oldStatus = $booking->booking_status;

        DB::transaction(function () use ($booking, $reason) {
            $booking->update([
                'booking_status' => 'Cancelled',
                'cancellation_reason' => $reason,
                'cancelled_at' => now(),
            ]);
        });

        $booking->refresh();

        // Send cancellation notification
        $this->dispatchStatusUpdateEmail($booking, $oldStatus, 'Cancelled');

        // Broadcast cancellation
        $this->broadcastStatusChange($booking, $oldStatus, 'Cancelled');

        // Clear caches
        $this->clearBookingCaches($booking->client_id);

        Log::info('Booking cancelled', [
            'booking_id' => $bookingId,
            'reason' => $reason,
        ]);

        return $booking;
    }

    /**
     * Check if a date is available for booking.
     *
     * @param Carbon $date
     * @param int|null $packageId
     * @param int|null $excludeBookingId
     * @return bool
     */
    public function isDateAvailable(Carbon $date, ?int $packageId = null, ?int $excludeBookingId = null): bool
    {
        $query = BookingDetail::whereDate('event_date', $date->toDateString())
            ->whereNotIn('booking_status', ['Cancelled', 'cancelled']);

        if ($packageId) {
            $query->where('package_id', $packageId);
        }

        if ($excludeBookingId) {
            $query->where('booking_id', '!=', $excludeBookingId);
        }

        return !$query->exists();
    }

    /**
     * Get bookings for a user.
     *
     * @param User $user
     * @param array $filters
     * @param int $perPage
     * @return LengthAwarePaginator
     */
    public function getUserBookings(User $user, array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        if ($user->isAdmin()) {
            if ($user->isCoordinator()) {
                return $this->bookingRepository->getByCoordinatorId($user->id, $perPage);
            }
            return $this->bookingRepository->getAllPaginated($perPage);
        }

        // Client user
        $client = $this->clientService->getByUserEmail($user->email);
        if (!$client) {
            return new LengthAwarePaginator([], 0, $perPage);
        }

        return $this->bookingRepository->getByClientId($client->client_id, $perPage);
    }

    /**
     * Get booking statistics.
     *
     * @param Carbon|null $startDate
     * @param Carbon|null $endDate
     * @return array
     */
    public function getStatistics(?Carbon $startDate = null, ?Carbon $endDate = null): array
    {
        $cacheKey = 'booking_stats_' . ($startDate?->format('Y-m-d') ?? 'all') . '_' . ($endDate?->format('Y-m-d') ?? 'all');

        return Cache::remember($cacheKey, self::STATS_CACHE_TTL, function () use ($startDate, $endDate) {
            $query = BookingDetail::query();

            if ($startDate) {
                $query->whereDate('event_date', '>=', $startDate);
            }
            if ($endDate) {
                $query->whereDate('event_date', '<=', $endDate);
            }

            $statusCounts = (clone $query)
                ->selectRaw('LOWER(booking_status) as status, COUNT(*) as count')
                ->groupBy('status')
                ->pluck('count', 'status')
                ->toArray();

            $totalRevenue = (clone $query)
                ->whereIn('booking_status', ['Approved', 'Confirmed', 'Completed'])
                ->sum('total_amount');

            $avgBookingValue = (clone $query)
                ->whereNotNull('total_amount')
                ->avg('total_amount');

            return [
                'total_bookings' => $query->count(),
                'status_breakdown' => $statusCounts,
                'total_revenue' => round($totalRevenue, 2),
                'average_booking_value' => round($avgBookingValue ?? 0, 2),
                'pending_count' => $statusCounts['pending'] ?? 0,
                'approved_count' => $statusCounts['approved'] ?? 0,
                'completed_count' => $statusCounts['completed'] ?? 0,
                'cancelled_count' => $statusCounts['cancelled'] ?? 0,
            ];
        });
    }

    /**
     * Send booking confirmation email.
     *
     * @param BookingDetail $booking
     * @return void
     */
    public function sendConfirmationEmail(BookingDetail $booking): void
    {
        $this->dispatchConfirmationEmail($booking);
    }

    /**
     * Assign coordinator to booking.
     *
     * @param int $bookingId
     * @param int $coordinatorId
     * @return BookingDetail
     */
    public function assignCoordinator(int $bookingId, int $coordinatorId): BookingDetail
    {
        $booking = $this->bookingRepository->findWithRelations($bookingId);

        if (!$booking) {
            throw new \InvalidArgumentException('Booking not found.');
        }

        // Verify coordinator exists and has coordinator role
        $coordinator = User::where('id', $coordinatorId)
            ->where('role', 'coordinator')
            ->first();

        if (!$coordinator) {
            throw new \InvalidArgumentException('Invalid coordinator ID.');
        }

        $booking->update(['coordinator_id' => $coordinatorId]);
        $booking->refresh();
        $booking->load('coordinator');

        Log::info('Coordinator assigned to booking', [
            'booking_id' => $bookingId,
            'coordinator_id' => $coordinatorId,
        ]);

        return $booking;
    }

    /**
     * Get upcoming bookings that need reminders.
     *
     * @param int $daysAhead
     * @return Collection
     */
    public function getBookingsNeedingReminders(int $daysAhead = 7): Collection
    {
        return $this->bookingRepository->getUpcoming($daysAhead)
            ->filter(function ($booking) {
                return in_array(strtolower($booking->booking_status), ['approved', 'confirmed']);
            });
    }

    /**
     * Bulk update status for multiple bookings.
     *
     * @param array $bookingIds
     * @param string $status
     * @return array
     */
    public function bulkUpdateStatus(array $bookingIds, string $status): array
    {
        $status = $this->normalizeStatus($status);
        $results = [
            'success_count' => 0,
            'failed_count' => 0,
            'skipped_count' => 0,
            'details' => [],
        ];

        /** @var \Illuminate\Database\Eloquent\Collection<int, BookingDetail> $bookings */
        $bookings = BookingDetail::with(['client', 'eventPackage'])
            ->whereIn('booking_id', $bookingIds)
            ->get();

        /** @var BookingDetail $booking */
        foreach ($bookings as $booking) {
            try {
                $oldStatus = $booking->booking_status;

                if ($oldStatus === $status) {
                    $results['skipped_count']++;
                    $results['details'][] = [
                        'booking_id' => $booking->booking_id,
                        'status' => 'skipped',
                        'message' => 'Status unchanged',
                    ];
                    continue;
                }

                $booking->update(['booking_status' => $status]);
                $this->dispatchStatusUpdateEmail($booking->fresh(), $oldStatus, $status);
                $this->broadcastStatusChange($booking, $oldStatus, $status);

                $results['success_count']++;
                $results['details'][] = [
                    'booking_id' => $booking->booking_id,
                    'status' => 'success',
                    'old_status' => $oldStatus,
                    'new_status' => $status,
                ];
            } catch (\Exception $e) {
                $results['failed_count']++;
                $results['details'][] = [
                    'booking_id' => $booking->booking_id,
                    'status' => 'failed',
                    'message' => $e->getMessage(),
                ];
                Log::error('Failed to update booking status', [
                    'booking_id' => $booking->booking_id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return $results;
    }

    // ==================== Protected Helper Methods ====================

    /**
     * Parse event date string to Carbon instance.
     */
    protected function parseEventDate(string $dateString): Carbon
    {
        try {
            return Carbon::parse($dateString, config('app.timezone'))->startOfDay();
        } catch (\Exception $e) {
            throw new \InvalidArgumentException('Invalid date format. Please use YYYY-MM-DD format.');
        }
    }

    /**
     * Resolve guest count from request data.
     */
    protected function resolveGuestCount(array $data): int
    {
        $guestCount = null;

        if (!empty($data['guest_count'])) {
            $guestCount = (int) $data['guest_count'];
        } elseif (!empty($data['number_of_guests'])) {
            $guestCount = (int) $data['number_of_guests'];
        }

        if (!$guestCount || $guestCount < 1) {
            throw new \InvalidArgumentException('Number of guests is required and must be at least 1.');
        }

        return $guestCount;
    }

    /**
     * Validate guest count against package capacity.
     */
    protected function validateGuestCapacity(int $guestCount, EventPackage $package): void
    {
        if (isset($package->capacity) && $guestCount > $package->capacity) {
            throw new \InvalidArgumentException('Number of guests exceeds package capacity.');
        }
    }

    /**
     * Resolve event venue from request or package.
     */
    protected function resolveEventVenue(array $data, EventPackage $package): string
    {
        if (!empty($data['event_venue'])) {
            return $data['event_venue'];
        }

        if ($package->venue) {
            return $package->venue->name ?? 'Venue to be determined';
        }

        return 'Venue to be determined';
    }

    /**
     * Calculate payment amounts for booking.
     */
    protected function calculatePaymentAmounts(EventPackage $package): array
    {
        if (!is_numeric($package->package_price) || $package->package_price <= 0) {
            throw new \InvalidArgumentException('Invalid package price.');
        }

        $totalAmount = round((float) $package->package_price, 2);
        $depositPercentage = config('booking.deposit_percentage', self::DEFAULT_DEPOSIT_PERCENTAGE);
        $depositAmount = round($totalAmount * $depositPercentage, 2);

        return [
            'total_amount' => $totalAmount,
            'deposit_amount' => $depositAmount,
        ];
    }

    /**
     * Build booking data array.
     */
    protected function buildBookingData(
        array $data,
        Client $client,
        string $eventVenue,
        int $guestCount,
        array $paymentDetails
    ): array {
        $bookingData = [
            'client_id' => $client->client_id,
            'package_id' => $data['package_id'],
            'event_date' => $data['event_date'],
            'event_venue' => $eventVenue,
            'guest_count' => $guestCount,
            'special_requests' => $data['special_requests'] ?? null,
            'event_type' => $data['event_type'] ?? null,
            'theme' => $data['theme'] ?? null,
            'budget_range' => $data['budget_range'] ?? null,
            'alternate_contact' => $data['alternate_contact'] ?? null,
            'booking_status' => 'Pending',
            'total_amount' => $paymentDetails['total_amount'],
            'deposit_amount' => $paymentDetails['deposit_amount'],
            'payment_required' => true,
            'payment_status' => 'unpaid',
        ];

        if (!empty($data['event_time'])) {
            $bookingData['event_time'] = $data['event_time'];
        }

        return $bookingData;
    }

    /**
     * Normalize booking status.
     */
    protected function normalizeStatus(string $status): string
    {
        // Map Confirmed to Approved for database consistency
        if ($status === 'Confirmed') {
            return 'Approved';
        }
        return $status;
    }

    /**
     * Validate status transition is allowed.
     */
    protected function validateStatusTransition(string $fromStatus, string $toStatus): void
    {
        $allowedTransitions = [
            'Pending' => ['Approved', 'Cancelled'],
            'Approved' => ['Completed', 'Cancelled'],
            'Completed' => [], // No transitions from completed
            'Cancelled' => [], // No transitions from cancelled
        ];

        $from = ucfirst(strtolower($fromStatus));
        $to = ucfirst(strtolower($toStatus));

        // Admin can force any status change, so we just log a warning
        if (!in_array($to, $allowedTransitions[$from] ?? [])) {
            Log::warning('Non-standard status transition', [
                'from' => $fromStatus,
                'to' => $toStatus,
            ]);
        }
    }

    /**
     * Dispatch confirmation email job.
     */
    protected function dispatchConfirmationEmail(BookingDetail $booking): void
    {
        try {
            $client = $booking->client;
            if ($client && $client->client_email) {
                if (config('queue.default') !== 'sync') {
                    SendBookingConfirmation::dispatch($booking);
                } else {
                    Mail::to($client->client_email)->send(new BookingConfirmationMail($booking));
                }
            }
        } catch (\Exception $e) {
            Log::error('Failed to send booking confirmation email', [
                'booking_id' => $booking->booking_id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Dispatch status update email job.
     */
    protected function dispatchStatusUpdateEmail(BookingDetail $booking, string $oldStatus, string $newStatus): void
    {
        try {
            $client = $booking->client;
            if ($client && $client->client_email) {
                if (config('queue.default') !== 'sync') {
                    SendBookingStatusUpdate::dispatch($booking, $oldStatus, $newStatus);
                } else {
                    Mail::to($client->client_email)->send(
                        new BookingStatusUpdateMail($booking, $oldStatus, $newStatus)
                    );
                }
            }
        } catch (\Exception $e) {
            Log::error('Failed to send booking status update email', [
                'booking_id' => $booking->booking_id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Broadcast new booking event.
     */
    protected function broadcastNewBooking(BookingDetail $booking): void
    {
        try {
            broadcast(new NewBookingCreated($booking))->toOthers();
        } catch (\Exception $e) {
            Log::error('Failed to broadcast new booking event', [
                'booking_id' => $booking->booking_id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Broadcast status change event.
     */
    protected function broadcastStatusChange(BookingDetail $booking, string $oldStatus, string $newStatus): void
    {
        try {
            broadcast(new BookingStatusChanged($booking, $oldStatus, $newStatus))->toOthers();
        } catch (\Exception $e) {
            Log::error('Failed to broadcast booking status change', [
                'booking_id' => $booking->booking_id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Clear booking-related caches.
     */
    protected function clearBookingCaches(?int $clientId = null): void
    {
        Cache::forget('booking_stats_all_all');

        if ($clientId) {
            Cache::forget("client_bookings_{$clientId}");
        }
    }
}
