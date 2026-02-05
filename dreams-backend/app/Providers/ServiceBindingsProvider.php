<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

// Service Interfaces
use App\Services\Contracts\BookingServiceInterface;
use App\Services\Contracts\ClientServiceInterface;
use App\Services\Contracts\EmailTrackingServiceInterface;
use App\Services\Contracts\EncryptionServiceInterface;
use App\Services\Contracts\FileEncryptionServiceInterface;
use App\Services\Contracts\ImageServiceInterface;
use App\Services\Contracts\PaymentServiceInterface;
use App\Services\Contracts\RecommendationServiceInterface;
use App\Services\Contracts\WebhookServiceInterface;

// Service Implementations
use App\Services\BookingService;
use App\Services\ClientService;
use App\Services\EmailTrackingService;
use App\Services\Encryption\FieldEncryptionService;
use App\Services\Encryption\FileEncryptionService;
use App\Services\ImageService;
use App\Services\PaymentService;
use App\Services\RecommendationService;
use App\Services\WebhookService;

/**
 * Application Services Provider
 * 
 * Binds service interfaces to their concrete implementations.
 * This enables dependency injection of services throughout the application.
 */
class ServiceBindingsProvider extends ServiceProvider
{
    /**
     * All service bindings.
     *
     * @var array<class-string, class-string>
     */
    protected array $services = [
        BookingServiceInterface::class => BookingService::class,
        ClientServiceInterface::class => ClientService::class,
        WebhookServiceInterface::class => WebhookService::class,
        EmailTrackingServiceInterface::class => EmailTrackingService::class,
        FileEncryptionServiceInterface::class => FileEncryptionService::class,
    ];

    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Bind service interfaces to implementations
        foreach ($this->services as $interface => $implementation) {
            $this->app->bind($interface, $implementation);
        }

        // Bind concrete services as singletons for performance
        $this->app->singleton(BookingService::class);
        $this->app->singleton(ClientService::class);
        $this->app->singleton(WebhookService::class);
        $this->app->singleton(EmailTrackingService::class);
        $this->app->singleton(FileEncryptionService::class);
        $this->app->singleton(ImageService::class);
        $this->app->singleton(PaymentService::class);
        $this->app->singleton(RecommendationService::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
