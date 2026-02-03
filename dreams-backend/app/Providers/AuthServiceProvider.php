<?php

namespace App\Providers;

use App\Models\BookingDetail;
use App\Models\EventPackage;
use App\Models\Payment;
use App\Models\Venue;
use App\Models\PortfolioItem;
use App\Models\Testimonial;
use App\Policies\BookingPolicy;
use App\Policies\PackagePolicy;
use App\Policies\PaymentPolicy;
use App\Policies\VenuePolicy;
use App\Policies\PortfolioPolicy;
use App\Policies\TestimonialPolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        BookingDetail::class => BookingPolicy::class,
        EventPackage::class => PackagePolicy::class,
        \App\Models\ContactInquiry::class => \App\Policies\ContactPolicy::class,
        \App\Models\Review::class => \App\Policies\ReviewPolicy::class,
        Payment::class => PaymentPolicy::class,
        Venue::class => VenuePolicy::class,
        PortfolioItem::class => PortfolioPolicy::class,
        Testimonial::class => TestimonialPolicy::class,
    ];

    /**
     * Register any authentication / authorization services.
     */
    public function boot(): void
    {
        $this->registerPolicies();
    }
}
