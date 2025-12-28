<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Review;

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

