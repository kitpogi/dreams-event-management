<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Services\Auth\TwoFactorAuthService;

class TwoFactorAuthServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        $this->app->singleton(TwoFactorAuthService::class, function () {
            return new TwoFactorAuthService();
        });
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        //
    }
}
