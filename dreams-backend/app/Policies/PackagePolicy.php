<?php

namespace App\Policies;

use App\Models\User;
use App\Models\EventPackage;
use App\Traits\CachesPermissions;

class PackagePolicy
{
    use CachesPermissions;

    /**
     * Determine if the user can view any packages.
     */
    public function viewAny(User $user): bool
    {
        return true; // All users (including guests) can view packages
    }

    /**
     * Determine if the user can view the package.
     */
    public function view(User $user, EventPackage $package): bool
    {
        return true; // All users can view package details
    }

    /**
     * Determine if the user can create packages.
     */
    public function create(User $user): bool
    {
        // Only admin can create packages (cached)
        return $this->isAdminCached($user);
    }

    /**
     * Determine if the user can update the package.
     */
    public function update(User $user, EventPackage $package): bool
    {
        // Only admin can update packages (cached)
        return $this->getCachedOrCheck($user, 'update', $package, fn() => $this->isAdminCached($user));
    }

    /**
     * Determine if the user can delete the package.
     */
    public function delete(User $user, EventPackage $package): bool
    {
        // Only admin can delete packages (cached)
        return $this->getCachedOrCheck($user, 'delete', $package, fn() => $this->isAdminCached($user));
    }
}
