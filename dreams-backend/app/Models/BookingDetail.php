<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Review;

/**
 * @property int $booking_id
 * @property int|null $client_id
 * @property int|null $package_id
 * @property int|null $coordinator_id
 * @property string|null $event_date
 * @property string|null $event_time
 * @property string|null $event_duration
 * @property string|null $event_end_time
 * @property string|null $event_venue
 * @property int|null $guest_count
 * @property string|null $booking_status
 * @property string|null $special_requests
 * @property string|null $internal_notes
 * @property string|null $event_type
 * @property string|null $theme
 * @property string|null $budget_range
 * @property string|null $alternate_contact
 * @property float|null $total_amount
 * @property float|null $deposit_amount
 * @property bool|null $payment_required
 * @property string|null $payment_status
 * @property string|null $mood_board
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 */
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
        'event_duration',
        'event_end_time',
        'event_venue',
        'guest_count',
        'booking_status',
        'special_requests',
        'internal_notes',
        'event_type',
        'theme',
        'budget_range',
        'alternate_contact',
        'total_amount',
        'deposit_amount',
        'payment_required',
        'payment_status',
        'mood_board',
    ];

    protected $casts = [
        'event_date' => 'date',
        'event_duration' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'deposit_amount' => 'decimal:2',
        'payment_required' => 'boolean',
        'mood_board' => 'array',
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

    /**
     * Get total amount paid for this booking.
     */
    public function getTotalPaidAttribute()
    {
        return $this->payments()
            ->where('status', 'paid')
            ->sum('amount');
    }

    /**
     * Get remaining balance for this booking.
     */
    public function getRemainingBalanceAttribute()
    {
        $totalAmount = $this->total_amount ?? 0;
        $totalPaid = (float) $this->payments()
            ->where('status', 'paid')
            ->sum('amount');
        return max(0, $totalAmount - $totalPaid);
    }
}


