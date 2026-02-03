<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Services\Encryption\FieldEncryptionService;

class EncryptionServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        $this->app->singleton(FieldEncryptionService::class, function ($app) {
            return new FieldEncryptionService();
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
