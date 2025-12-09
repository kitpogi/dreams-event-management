<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class PortfolioItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'category',
        'description',
        'event_date',
        'image_path',
        'is_featured',
        'display_order',
    ];

    protected $casts = [
        'event_date' => 'date',
        'is_featured' => 'boolean',
        'display_order' => 'integer',
    ];

    protected $appends = [
        'image_url',
    ];

    public function getImageUrlAttribute(): ?string
    {
        if (!$this->image_path) {
            return null;
        }

        if (Str::startsWith($this->image_path, ['http://', 'https://'])) {
            return $this->image_path;
        }

        return asset(Storage::url($this->image_path));
    }
}


