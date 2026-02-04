<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Testimonial;
use App\Services\ClientService;
use App\Traits\CachesPermissions;

class TestimonialPolicy
{
    use CachesPermissions;

    protected $clientService;

    public function __construct(ClientService $clientService)
    {
        $this->clientService = $clientService;
    }

    /**
     * Determine if the user can view any testimonials.
     */
    public function viewAny(User $user): bool
    {
        // Testimonials are public (can be viewed by anyone)
        return true;
    }

    /**
     * Determine if the user can view the testimonial.
     */
    public function view(User $user, Testimonial $testimonial): bool
    {
        // Testimonials are public
        return true;
    }

    /**
     * Determine if the user can create testimonials.
     */
    public function create(User $user): bool
    {
        // Clients can create testimonials, admin can create for any client (cached)
        return $this->isClientCached($user) || $this->isAdminCached($user);
    }

    /**
     * Determine if the user can update the testimonial.
     */
    public function update(User $user, Testimonial $testimonial): bool
    {
        return $this->getCachedOrCheck($user, 'update', $testimonial, function () use ($user) {
            // Admin can update any testimonial
            if ($this->isAdminCached($user)) {
                return true;
            }

            // Clients can only update their own testimonials (if we track ownership)
            // For now, we'll allow clients to update if they created it
            // This would require adding a user_id or client_id to testimonials table
            // For now, we'll restrict to admin only for updates
            return false;
        });
    }

    /**
     * Determine if the user can delete the testimonial.
     */
    public function delete(User $user, Testimonial $testimonial): bool
    {
        // Only admin can delete testimonials (cached)
        return $this->getCachedOrCheck($user, 'delete', $testimonial, fn() => $this->isAdminCached($user));
    }

    /**
     * Determine if the user can submit a testimonial as a client.
     */
    public function clientSubmit(User $user): bool
    {
        // Only authenticated clients can submit testimonials (cached)
        return $this->isClientCached($user);
    }
}
