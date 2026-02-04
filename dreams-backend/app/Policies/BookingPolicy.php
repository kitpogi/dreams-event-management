<?php

namespace App\Policies;

use App\Models\User;
use App\Models\BookingDetail;
use App\Services\ClientService;
use App\Traits\CachesPermissions;

class BookingPolicy
{
    use CachesPermissions;

    protected $clientService;

    public function __construct(ClientService $clientService)
    {
        $this->clientService = $clientService;
    }

    /**
     * Determine if the user can view any bookings.
     */
    public function viewAny(User $user): bool
    {
        return true; // All authenticated users can view bookings
    }

    /**
     * Determine if the user can view the booking.
     */
    public function view(User $user, BookingDetail $booking): bool
    {
        return $this->getCachedOrCheck($user, 'view', $booking, function () use ($user, $booking) {
            // Admin and coordinators can view all bookings
            if ($this->isAdminCached($user)) {
                // Coordinators can only view their assigned bookings
                if ($this->isCoordinatorCached($user)) {
                    return $booking->coordinator_id === $user->id;
                }
                return true;
            }

            // Clients can only view their own bookings
            $client = $this->clientService->getByUserEmail($user->email);
            return $client && $booking->client_id === $client->client_id;
        });
    }

    /**
     * Determine if the user can create bookings.
     */
    public function create(User $user): bool
    {
        return $this->getCachedOrCheck($user, 'create', null, function () use ($user) {
            // Only clients can create bookings
            return $this->isClientCached($user);
        });
    }

    /**
     * Determine if the user can update the booking.
     */
    public function update(User $user, BookingDetail $booking): bool
    {
        return $this->getCachedOrCheck($user, 'update', $booking, function () use ($user, $booking) {
            // Admin can update any booking
            if ($this->isAdminCached($user)) {
                return true;
            }

            // Clients can only update their own bookings (with restrictions)
            $client = $this->clientService->getByUserEmail($user->email);
            if ($client && $booking->client_id === $client->client_id) {
                // Clients can only update bookings that are not confirmed/completed
                return !in_array(strtolower($booking->booking_status), ['confirmed', 'completed', 'cancelled']);
            }

            return false;
        });
    }

    /**
     * Determine if the user can delete the booking.
     */
    public function delete(User $user, BookingDetail $booking): bool
    {
        return $this->getCachedOrCheck($user, 'delete', $booking, function () use ($user) {
            // Only admin can delete bookings
            return $this->isAdminCached($user) && !$this->isCoordinatorCached($user);
        });
    }

    /**
     * Determine if the user can update booking status.
     */
    public function updateStatus(User $user, BookingDetail $booking): bool
    {
        return $this->getCachedOrCheck($user, 'updateStatus', $booking, function () use ($user) {
            // Only admin can update booking status
            return $this->isAdminCached($user);
        });
    }

    /**
     * Determine if the user can assign coordinator.
     */
    public function assignCoordinator(User $user, BookingDetail $booking): bool
    {
        return $this->getCachedOrCheck($user, 'assignCoordinator', $booking, function () use ($user) {
            // Only admin can assign coordinators
            return $this->isAdminCached($user) && !$this->isCoordinatorCached($user);
        });
    }
}
