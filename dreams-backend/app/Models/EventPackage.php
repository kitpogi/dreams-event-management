<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Log;
use App\Models\Review;
use App\Services\Cache\RecommendationCacheService;
use App\Traits\HasFiltering;

/**
 * @property int $package_id
 * @property string $package_name
 * @property string|null $package_description
 * @property string|null $package_category
 * @property float $package_price
 * @property int|null $capacity
 * @property int|null $venue_id
 * @property string|null $package_image
 * @property string|null $package_inclusions
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 */
class EventPackage extends Model
{
    use HasFactory;
    use HasFiltering;

    protected $table = 'event_packages';
    protected $primaryKey = 'package_id';
    public $incrementing = true;
    protected $keyType = 'int';

    /**
     * Fields that can be filtered via query parameters.
     */
    protected array $filterable = [
        'package_category',
        'venue_id',
    ];

    /**
     * Fields that can be sorted via query parameters.
     */
    protected array $sortable = [
        'package_name',
        'package_price',
        'capacity',
        'created_at',
    ];

    /**
     * Fields that are searchable via 'search' or 'q' parameter.
     */
    protected array $searchable = [
        'package_name',
        'package_description',
        'package_category',
        'package_inclusions',
    ];

    protected $fillable = [
        'package_name',
        'package_description',
        'package_category',
        'package_price',
        'capacity',
        'venue_id',
        'package_image',
        'package_inclusions',
        'is_featured',
        'is_active',
    ];

    protected $casts = [
        'package_price' => 'decimal:2',
        'capacity' => 'integer',
        'is_featured' => 'boolean',
        'is_active' => 'boolean',
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
            Log::warning('Failed to clear recommendation cache: ' . $e->getMessage());
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

