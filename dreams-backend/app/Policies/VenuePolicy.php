<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Venue;

class VenuePolicy
{
    /**
     * Determine if the user can view any venues.
     */
    public function viewAny(User $user): bool
    {
        // Venues are public (can be viewed by anyone, including unauthenticated users)
        // But for consistency, we'll allow authenticated users
        return true;
    }

    /**
     * Determine if the user can view the venue.
     */
    public function view(User $user, Venue $venue): bool
    {
        // Venues are public
        return true;
    }

    /**
     * Determine if the user can create venues.
     */
    public function create(User $user): bool
    {
        // Only admin can create venues
        return $user->isAdmin();
    }

    /**
     * Determine if the user can update the venue.
     */
    public function update(User $user, Venue $venue): bool
    {
        // Only admin can update venues
        return $user->isAdmin();
    }

    /**
     * Determine if the user can delete the venue.
     */
    public function delete(User $user, Venue $venue): bool
    {
        // Only admin can delete venues
        // Additional check: cannot delete if venue is used in packages
        if (!$user->isAdmin()) {
            return false;
        }

        // Check if venue is used in any packages
        return !$venue->packages()->exists();
    }
}
