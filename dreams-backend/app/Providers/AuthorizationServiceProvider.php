<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Gate;
use App\Services\Auth\CachedAuthorization;
use App\Services\Auth\AuthorizationHelper;

class AuthorizationServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        // Register cached authorization service
        $this->app->singleton('cached-authorization', fn() => new CachedAuthorization());
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        // Define common gates with caching
        $this->defineGates();
    }

    /**
     * Define authorization gates
     */
    private function defineGates(): void
    {
        // Admin gates
        Gate::define('is-admin', fn($user) => 
            $user && AuthorizationHelper::isAdmin($user)
        );

        Gate::define('is-coordinator', fn($user) => 
            $user && $user->isCoordinator()
        );

        // Booking gates
        Gate::define('view-booking', fn($user, $booking) => 
            CachedAuthorization::can('view-booking', $booking)
        );

        Gate::define('update-booking', fn($user, $booking) => 
            AuthorizationHelper::canUpdate($user, $booking) && 
            AuthorizationHelper::canModifyBooking($booking)
        );

        Gate::define('delete-booking', fn($user, $booking) => 
            AuthorizationHelper::canDelete($user, $booking)
        );

        // Payment gates
        Gate::define('view-payment', fn($user, $payment) => 
            AuthorizationHelper::canView($user, $payment)
        );

        Gate::define('refund-payment', fn($user, $payment) => 
            AuthorizationHelper::isAdmin($user) && 
            AuthorizationHelper::canRefundPayment($payment)
        );

        // Review gates
        Gate::define('approve-review', fn($user) => 
            AuthorizationHelper::isAdmin($user)
        );

        Gate::define('create-review', fn($user) => 
            $user !== null
        );

        // Venue gates
        Gate::define('view-venue', fn($user, $venue) => 
            $venue->is_approved || AuthorizationHelper::isAdmin($user)
        );

        Gate::define('manage-venue', fn($user, $venue) => 
            AuthorizationHelper::isCoordinator($user, $venue->coordinator_id ?? null) ||
            AuthorizationHelper::isAdmin($user)
        );

        // Portfolio gates
        Gate::define('view-portfolio', fn($user, $portfolio) => 
            $portfolio->status === 'approved' || AuthorizationHelper::isAdmin($user)
        );

        Gate::define('manage-portfolio', fn($user, $portfolio) => 
            AuthorizationHelper::isCoordinator($user, $portfolio->coordinator_id ?? null) ||
            AuthorizationHelper::isAdmin($user)
        );

        // Audit log gates
        Gate::define('view-audit-logs', fn($user) => 
            AuthorizationHelper::isAdmin($user)
        );

        Gate::define('view-user-activity', fn($user, $targetUser) => 
            ($user && $user->id === $targetUser->id) || AuthorizationHelper::isAdmin($user)
        );
    }
}
