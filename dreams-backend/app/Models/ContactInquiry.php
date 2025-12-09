<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ContactInquiry extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'first_name',
        'last_name',
        'email',
        'mobile_number',
        'event_type',
        'date_of_event',
        'preferred_venue',
        'budget',
        'estimated_guests',
        'message',
        'status',
    ];

    protected $casts = [
        'date_of_event' => 'date',
        'budget' => 'decimal:2',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

}

