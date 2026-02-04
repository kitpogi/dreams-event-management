<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Venue;
use App\Traits\CachesPermissions;

class VenuePolicy
{
    use CachesPermissions;

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
        // Only admin can create venues (cached)
        return $this->isAdminCached($user);
    }

    /**
     * Determine if the user can update the venue.
     */
    public function update(User $user, Venue $venue): bool
    {
        // Only admin can update venues (cached)
        return $this->getCachedOrCheck($user, 'update', $venue, fn() => $this->isAdminCached($user));
    }

    /**
     * Determine if the user can delete the venue.
     */
    public function delete(User $user, Venue $venue): bool
    {
        // Only admin can delete venues (cached with additional checks)
        return $this->getCachedOrCheck($user, 'delete', $venue, function () use ($user, $venue) {
            if (!$this->isAdminCached($user)) {
                return false;
            }

            // Check if venue is used in any packages
            return !$venue->packages()->exists();
        });
    }
}
