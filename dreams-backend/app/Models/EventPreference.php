<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EventPreference extends Model
{
    use HasFactory;

    protected $table = 'event_preferences';
    protected $primaryKey = 'preference_id';
    public $incrementing = true;
    protected $keyType = 'int';

    protected $fillable = [
        'client_id',
        'user_id',
        'preferred_event_type',
        'preferred_budget',
        'preferred_theme',
        'preferred_guest_count',
        'preferred_venue',
        'preferences',
    ];

    protected $casts = [
        'preferred_budget' => 'decimal:2',
        'preferred_guest_count' => 'integer',
        'preferences' => 'array',
    ];

    public function client()
    {
        return $this->belongsTo(Client::class, 'client_id', 'client_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'id');
    }
}

