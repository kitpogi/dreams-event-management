<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BookingDetail extends Model
{
    use HasFactory;

    protected $table = 'booking_details';
    protected $primaryKey = 'booking_id';
    public $incrementing = true;
    protected $keyType = 'int';

    protected $fillable = [
        'client_id',
        'package_id',
        'event_date',
        'event_venue',
        'guest_count',
        'booking_status',
        'special_requests',
    ];

    protected $casts = [
        'event_date' => 'date',
    ];

    public function client()
    {
        return $this->belongsTo(Client::class, 'client_id', 'client_id');
    }

    public function eventPackage()
    {
        return $this->belongsTo(EventPackage::class, 'package_id', 'package_id');
    }
}


