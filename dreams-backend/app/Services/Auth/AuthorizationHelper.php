<?php

namespace App\Services\Auth;

use Illuminate\Database\Eloquent\Model;

/**
 * Helper class for authorization checks with consistent patterns
 */
class AuthorizationHelper
{
    /**
     * Check if user owns the resource (by user_id field)
     */
    public static function isOwner($user, Model $resource): bool
    {
        return $user && $user->id === ($resource->user_id ?? null);
    }

    /**
     * Check if user is coordinator for a booking
     */
    public static function isCoordinator($user, ?int $coordinatorId): bool
    {
        return $user && $user->isCoordinator() && $user->id === $coordinatorId;
    }

    /**
     * Check if user is admin
     */
    public static function isAdmin($user): bool
    {
        return $user && $user->isAdmin();
    }

    /**
     * Check if user can manage coordinators (super admin)
     */
    public static function canManageCoordinators($user): bool
    {
        return $user && $user->role === 'admin';
    }

    /**
     * Check if user can view resource (owner or admin)
     */
    public static function canView($user, Model $resource): bool
    {
        return static::isOwner($user, $resource) || static::isAdmin($user);
    }

    /**
     * Check if user can update resource (owner or admin)
     */
    public static function canUpdate($user, Model $resource): bool
    {
        return static::isOwner($user, $resource) || static::isAdmin($user);
    }

    /**
     * Check if user can delete resource (owner or admin)
     */
    public static function canDelete($user, Model $resource): bool
    {
        return static::isOwner($user, $resource) || static::isAdmin($user);
    }

    /**
     * Check if booking can be modified (not approved or completed)
     */
    public static function canModifyBooking(Model $booking): bool
    {
        $modifiableStatuses = ['pending', 'cancelled'];
        return in_array($booking->booking_status ?? null, $modifiableStatuses);
    }

    /**
     * Check if payment can be refunded
     */
    public static function canRefundPayment(Model $payment): bool
    {
        $refundableStatuses = ['completed'];
        return in_array($payment->status ?? null, $refundableStatuses);
    }

    /**
     * Get user role level (for role-based comparisons)
     */
    public static function getRoleLevel($user): int
    {
        if (!$user) {
            return 0;
        }

        return match($user->role) {
            'admin' => 3,
            'coordinator' => 2,
            'client' => 1,
            default => 0,
        };
    }

    /**
     * Check if user has higher or equal role
     */
    public static function hasRoleLevel($user, string $requiredRole): bool
    {
        $userLevel = static::getRoleLevel($user);
        $requiredLevel = static::getRoleLevel((object) ['role' => $requiredRole]);
        
        return $userLevel >= $requiredLevel;
    }
}
