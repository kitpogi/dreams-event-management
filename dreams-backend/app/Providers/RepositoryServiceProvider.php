<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

// Repository Interfaces
use App\Repositories\Contracts\RepositoryInterface;
use App\Repositories\Contracts\BookingRepositoryInterface;
use App\Repositories\Contracts\PackageRepositoryInterface;
use App\Repositories\Contracts\UserRepositoryInterface;

// Repository Implementations
use App\Repositories\BookingRepository;
use App\Repositories\PackageRepository;
use App\Repositories\UserRepository;
use App\Repositories\ReviewRepository;
use App\Repositories\VenueRepository;
use App\Repositories\ContactInquiryRepository;
use App\Repositories\PortfolioRepository;
use App\Repositories\TestimonialRepository;
use App\Repositories\PaymentRepository;
use App\Repositories\InvoiceRepository;
use App\Repositories\AuditLogRepository;
use App\Repositories\TaskRepository;

/**
 * Repository Service Provider
 * 
 * Binds repository interfaces to their concrete implementations.
 * This enables dependency injection of repositories throughout the application.
 */
class RepositoryServiceProvider extends ServiceProvider
{
    /**
     * All repository bindings.
     *
     * @var array<class-string, class-string>
     */
    protected array $repositories = [
        BookingRepositoryInterface::class => BookingRepository::class,
        PackageRepositoryInterface::class => PackageRepository::class,
        UserRepositoryInterface::class => UserRepository::class,
    ];

    /**
     * Register services.
     */
    public function register(): void
    {
        // Bind interfaces to implementations
        foreach ($this->repositories as $interface => $implementation) {
            $this->app->bind($interface, $implementation);
        }

        // Bind concrete repositories as singletons for performance
        $this->app->singleton(BookingRepository::class);
        $this->app->singleton(PackageRepository::class);
        $this->app->singleton(UserRepository::class);
        $this->app->singleton(ReviewRepository::class);
        $this->app->singleton(VenueRepository::class);
        $this->app->singleton(ContactInquiryRepository::class);
        $this->app->singleton(PortfolioRepository::class);
        $this->app->singleton(TestimonialRepository::class);
        $this->app->singleton(PaymentRepository::class);
        $this->app->singleton(InvoiceRepository::class);
        $this->app->singleton(AuditLogRepository::class);
        $this->app->singleton(TaskRepository::class);
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        //
    }
}
