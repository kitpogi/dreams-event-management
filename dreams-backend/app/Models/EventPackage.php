<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Review;
use App\Services\Cache\RecommendationCacheService;

class EventPackage extends Model
{
    use HasFactory;

    protected $table = 'event_packages';
    protected $primaryKey = 'package_id';
    public $incrementing = true;
    protected $keyType = 'int';

    protected $fillable = [
        'package_name',
        'package_description',
        'package_category',
        'package_price',
        'capacity',
        'venue_id',
        'package_image',
        'package_inclusions',
    ];

    /**
     * Boot the model
     */
    protected static function boot()
    {
        parent::boot();

        // Clear recommendation cache when package is created, updated, or deleted
        static::saved(function ($package) {
            static::clearRecommendationCache();
        });

        static::deleted(function ($package) {
            static::clearRecommendationCache();
        });
    }

    /**
     * Clear all recommendation caches
     * This is called when packages are modified
     */
    protected static function clearRecommendationCache()
    {
        try {
            $cacheService = app(RecommendationCacheService::class);
            $cacheService->clearAll();
        } catch (\Exception $e) {
            // Don't fail if cache clearing fails
            \Log::warning('Failed to clear recommendation cache: ' . $e->getMessage());
        }
    }

    public function venue()
    {
        return $this->belongsTo(Venue::class, 'venue_id', 'id');
    }

    public function bookings()
    {
        return $this->hasMany(BookingDetail::class, 'package_id', 'package_id');
    }

    public function recommendations()
    {
        return $this->hasMany(Recommendation::class, 'package_id', 'package_id');
    }

    public function reviews()
    {
        return $this->hasMany(Review::class, 'package_id', 'package_id');
    }
}

