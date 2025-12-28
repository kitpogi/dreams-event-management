<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Review extends Model
{
    use HasFactory;

    protected $table = 'reviews';
    protected $primaryKey = 'review_id';
    public $incrementing = true;
    protected $keyType = 'int';

    protected $fillable = [
        'client_id',
        'package_id',
        'booking_id',
        'rating',
        'review_message',
    ];

    protected $casts = [
        'rating' => 'integer',
    ];

    public function client()
    {
        return $this->belongsTo(Client::class, 'client_id', 'client_id');
    }

    public function eventPackage()
    {
        return $this->belongsTo(EventPackage::class, 'package_id', 'package_id');
    }

    public function booking()
    {
        return $this->belongsTo(BookingDetail::class, 'booking_id', 'booking_id');
    }
}

