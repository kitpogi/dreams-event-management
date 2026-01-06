<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    use HasFactory;

    protected $fillable = [
        'booking_id',
        'payment_intent_id',
        'payment_method_id',
        'amount',
        'currency',
        'payment_method',
        'status',
        'transaction_id',
        'metadata',
        'failure_reason',
        'paid_at',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'metadata' => 'array',
        'paid_at' => 'datetime',
    ];

    /**
     * Get the booking that owns the payment.
     */
    public function booking()
    {
        return $this->belongsTo(BookingDetail::class, 'booking_id', 'booking_id');
    }

    /**
     * Check if payment is successful.
     */
    public function isPaid(): bool
    {
        return $this->status === 'paid';
    }

    /**
     * Check if payment is pending.
     */
    public function isPending(): bool
    {
        return $this->status === 'pending' || $this->status === 'processing';
    }

    /**
     * Check if payment failed.
     */
    public function isFailed(): bool
    {
        return $this->status === 'failed' || $this->status === 'cancelled';
    }

    /**
     * Get payment method display name.
     */
    public function getPaymentMethodDisplayAttribute(): string
    {
        return match($this->payment_method) {
            'card' => 'Credit/Debit Card',
            'gcash' => 'GCash',
            'maya' => 'Maya',
            'qr_ph' => 'QR Ph',
            'bank_transfer' => 'Bank Transfer',
            'otc' => 'Over-the-Counter',
            default => ucfirst($this->payment_method ?? 'Unknown'),
        };
    }
}

