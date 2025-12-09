<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class Testimonial extends Model
{
    use HasFactory;

    protected $fillable = [
        'client_name',
        'client_initials',
        'event_type',
        'event_date',
        'rating',
        'message',
        'avatar_path',
        'is_featured',
    ];

    protected $casts = [
        'event_date' => 'date',
        'rating' => 'integer',
        'is_featured' => 'boolean',
    ];

    protected $appends = [
        'avatar_url',
    ];

    public function getAvatarUrlAttribute(): ?string
    {
        if (!$this->avatar_path) {
            return null;
        }

        if (Str::startsWith($this->avatar_path, ['http://', 'https://'])) {
            return $this->avatar_path;
        }

        return asset(Storage::url($this->avatar_path));
    }
}


