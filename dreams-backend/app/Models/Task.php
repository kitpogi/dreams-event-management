<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Task extends Model
{
    use HasFactory;

    protected $table = 'booking_tasks';

    protected $fillable = [
        'booking_id',
        'title',
        'description',
        'status',
        'due_date',
    ];

    protected $casts = [
        'due_date' => 'date',
    ];

    public function booking()
    {
        return $this->belongsTo(BookingDetail::class, 'booking_id', 'booking_id');
    }
}
