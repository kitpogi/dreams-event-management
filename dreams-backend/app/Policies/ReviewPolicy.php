<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Review;

class ReviewPolicy
{
    /**
     * Determine if the user can view any reviews.
     */
    public function viewAny(User $user): bool
    {
        return true; // All users can view reviews
    }

    /**
     * Determine if the user can view the review.
     */
    public function view(User $user, Review $review): bool
    {
        return true; // All users can view reviews
    }

    /**
     * Determine if the user can create reviews.
     */
    public function create(User $user): bool
    {
        // Only authenticated clients can create reviews
        return $user->role === 'client';
    }

    /**
     * Determine if the user can update the review.
     */
    public function update(User $user, Review $review): bool
    {
        // Users can only update their own reviews, or admin can update any
        if ($user->isAdmin()) {
            return true;
        }

        // Check if user is the author of the review
        // Assuming Review has a user_id or client_id relationship
        return $review->client_id && $user->id === $review->client_id;
    }

    /**
     * Determine if the user can delete the review.
     */
    public function delete(User $user, Review $review): bool
    {
        // Users can delete their own reviews, or admin can delete any
        if ($user->isAdmin()) {
            return true;
        }

        // Check if user is the author of the review
        return $review->client_id && $user->id === $review->client_id;
    }
}
