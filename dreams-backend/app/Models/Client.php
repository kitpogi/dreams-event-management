<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\BookingDetail;
use App\Models\Recommendation;

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
}


