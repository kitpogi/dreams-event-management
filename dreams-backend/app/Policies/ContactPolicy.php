<?php

namespace App\Policies;

use App\Models\User;
use App\Models\ContactInquiry;
use App\Traits\CachesPermissions;

class ContactPolicy
{
    use CachesPermissions;

    /**
     * Determine if the user can view any contact inquiries.
     */
    public function viewAny(User $user): bool
    {
        // Only admin can view contact inquiries (cached)
        return $this->isAdminCached($user);
    }

    /**
     * Determine if the user can view the contact inquiry.
     */
    public function view(User $user, ContactInquiry $contactInquiry): bool
    {
        // Only admin can view contact inquiries (cached)
        return $this->getCachedOrCheck($user, 'view', $contactInquiry, fn() => $this->isAdminCached($user));
    }

    /**
     * Determine if the user can create contact inquiries.
     */
    public function create(User $user): bool
    {
        // Anyone can create contact inquiries (public endpoint)
        return true;
    }

    /**
     * Determine if the user can update the contact inquiry.
     */
    public function update(User $user, ContactInquiry $contactInquiry): bool
    {
        // Only admin can update contact inquiries (cached)
        return $this->getCachedOrCheck($user, 'update', $contactInquiry, fn() => $this->isAdminCached($user));
    }

    /**
     * Determine if the user can delete the contact inquiry.
     */
    public function delete(User $user, ContactInquiry $contactInquiry): bool
    {
        // Only admin can delete contact inquiries (cached)
        return $this->getCachedOrCheck($user, 'delete', $contactInquiry, fn() => $this->isAdminCached($user));
    }

    /**
     * Determine if the user can reply to the contact inquiry.
     */
    public function reply(User $user, ContactInquiry $contactInquiry): bool
    {
        // Only admin can reply to contact inquiries (cached)
        return $this->getCachedOrCheck($user, 'reply', $contactInquiry, fn() => $this->isAdminCached($user));
    }
}
