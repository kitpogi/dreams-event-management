<?php

namespace App\Policies;

use App\Models\User;
use App\Models\BookingDetail;
use App\Services\ClientService;

class BookingPolicy
{
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
        // Admin and coordinators can view all bookings
        if ($user->isAdmin()) {
            // Coordinators can only view their assigned bookings
            if ($user->isCoordinator()) {
                return $booking->coordinator_id === $user->id;
            }
            return true;
        }

        // Clients can only view their own bookings
        $client = $this->clientService->getByUserEmail($user->email);
        return $client && $booking->client_id === $client->client_id;
    }

    /**
     * Determine if the user can create bookings.
     */
    public function create(User $user): bool
    {
        // Only clients can create bookings
        return $user->role === 'client';
    }

    /**
     * Determine if the user can update the booking.
     */
    public function update(User $user, BookingDetail $booking): bool
    {
        // Admin can update any booking
        if ($user->isAdmin()) {
            return true;
        }

        // Clients can only update their own bookings (with restrictions)
        $client = $this->clientService->getByUserEmail($user->email);
        if ($client && $booking->client_id === $client->client_id) {
            // Clients can only update bookings that are not confirmed/completed
            return !in_array(strtolower($booking->booking_status), ['confirmed', 'completed', 'cancelled']);
        }

        return false;
    }

    /**
     * Determine if the user can delete the booking.
     */
    public function delete(User $user, BookingDetail $booking): bool
    {
        // Only admin can delete bookings
        return $user->role === 'admin';
    }

    /**
     * Determine if the user can update booking status.
     */
    public function updateStatus(User $user, BookingDetail $booking): bool
    {
        // Only admin can update booking status
        return $user->isAdmin();
    }

    /**
     * Determine if the user can assign coordinator.
     */
    public function assignCoordinator(User $user, BookingDetail $booking): bool
    {
        // Only admin can assign coordinators
        return $user->role === 'admin';
    }
}
