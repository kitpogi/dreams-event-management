<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BookingReminder extends Model
{
    use HasFactory;

    protected $table = 'booking_reminders';

    protected $fillable = [
        'booking_id',
        'reminder_type',
        'reminder_date',
        'event_date',
    ];

    protected $casts = [
        'reminder_date' => 'date',
        'event_date' => 'date',
    ];

    public function booking()
    {
        return $this->belongsTo(BookingDetail::class, 'booking_id', 'booking_id');
    }
}
