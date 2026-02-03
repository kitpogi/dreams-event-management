<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Services\Logging\QueryMonitor;

class LoggingServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        // Services are registered as singletons for convenience
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        // Enable query monitoring in all environments
        QueryMonitor::enable();

        // Set slower threshold for production
        if ($this->app->isProduction()) {
            QueryMonitor::setThreshold(1000); // 1 second in production
        }
    }
}
