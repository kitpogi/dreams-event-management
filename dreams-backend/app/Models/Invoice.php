<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Invoice extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'booking_id',
        'invoice_number',
        'amount',
        'status',
        'issued_date',
        'due_date',
        'notes'
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'issued_date' => 'date',
        'due_date' => 'date',
    ];

    const STATUS_UNPAID = 'unpaid';
    const STATUS_PAID = 'paid';
    const STATUS_VOID = 'void';
    const STATUS_OVERDUE = 'overdue';

    public function booking()
    {
        return $this->belongsTo(BookingDetail::class, 'booking_id', 'booking_id');
    }

    public function getClientAttribute()
    {
        return $this->booking ? $this->booking->client : null;
    }
}
