<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Service extends Model
{
    protected $fillable = [
        'title',
        'category',
        'description',
        'details',
        'rating',
        'images',
        'icon',
        'link',
        'is_active',
        'sort_order'
    ];

    protected $casts = [
        'images' => 'array',
        'is_active' => 'boolean',
        'rating' => 'float',
        'sort_order' => 'integer'
    ];
}
