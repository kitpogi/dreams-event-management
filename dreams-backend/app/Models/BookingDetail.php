<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Review;

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
        'coordinator_id',
        'event_date',
        'event_time',
        'event_venue',
        'guest_count',
        'booking_status',
        'special_requests',
        'internal_notes',
        'total_amount',
        'deposit_amount',
        'payment_required',
        'payment_status',
    ];

    protected $casts = [
        'event_date' => 'date',
        'total_amount' => 'decimal:2',
        'deposit_amount' => 'decimal:2',
        'payment_required' => 'boolean',
    ];

    public function client()
    {
        return $this->belongsTo(Client::class, 'client_id', 'client_id');
    }

    public function eventPackage()
    {
        return $this->belongsTo(EventPackage::class, 'package_id', 'package_id');
    }

    public function review()
    {
        return $this->hasOne(Review::class, 'booking_id', 'booking_id');
    }

    public function reminders()
    {
        return $this->hasMany(BookingReminder::class, 'booking_id', 'booking_id');
    }

    public function coordinator()
    {
        return $this->belongsTo(User::class, 'coordinator_id', 'id');
    }

    public function payments()
    {
        return $this->hasMany(Payment::class, 'booking_id', 'booking_id');
    }

    public function paidPayments()
    {
        return $this->hasMany(Payment::class, 'booking_id', 'booking_id')
            ->where('status', 'paid');
    }
}


