<?php

namespace App\Policies;

use App\Models\User;
use App\Models\PortfolioItem;

class PortfolioPolicy
{
    /**
     * Determine if the user can view any portfolio items.
     */
    public function viewAny(User $user): bool
    {
        // Portfolio items are public (can be viewed by anyone)
        return true;
    }

    /**
     * Determine if the user can view the portfolio item.
     */
    public function view(User $user, PortfolioItem $portfolioItem): bool
    {
        // Portfolio items are public
        return true;
    }

    /**
     * Determine if the user can create portfolio items.
     */
    public function create(User $user): bool
    {
        // Only admin can create portfolio items
        return $user->isAdmin();
    }

    /**
     * Determine if the user can update the portfolio item.
     */
    public function update(User $user, PortfolioItem $portfolioItem): bool
    {
        // Only admin can update portfolio items
        return $user->isAdmin();
    }

    /**
     * Determine if the user can delete the portfolio item.
     */
    public function delete(User $user, PortfolioItem $portfolioItem): bool
    {
        // Only admin can delete portfolio items
        return $user->isAdmin();
    }
}
