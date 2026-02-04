<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\BookingDetail;
use App\Models\Recommendation;
use App\Models\Review;
use App\Models\EventPreference;

/**
 * @property int $client_id
 * @property string|null $client_lname
 * @property string|null $client_fname
 * @property string|null $client_mname
 * @property string|null $client_email
 * @property string|null $client_contact
 * @property string|null $client_address
 * @property string|null $client_password
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 */
class Client extends Model
{
    use HasFactory;

    protected $table = 'clients';
    protected $primaryKey = 'client_id';
    public $incrementing = true;
    protected $keyType = 'int';

    protected $fillable = [
        'client_lname',
        'client_fname',
        'client_mname',
        'client_email',
        'client_contact',
        'client_address',
        'client_password',
    ];

    public function bookings()
    {
        return $this->hasMany(BookingDetail::class, 'client_id', 'client_id');
    }

    public function recommendations()
    {
        return $this->hasMany(Recommendation::class, 'client_id', 'client_id');
    }

    public function reviews()
    {
        return $this->hasMany(Review::class, 'client_id', 'client_id');
    }

    public function eventPreference()
    {
        return $this->hasOne(EventPreference::class, 'client_id', 'client_id');
    }
}


