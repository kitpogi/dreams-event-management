<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PackageImage extends Model
{
    use HasFactory;

    protected $fillable = [
        'package_id',
        'image_url',
        'is_primary',
    ];

    protected $casts = [
        'is_primary' => 'boolean',
    ];

    public function package()
    {
        return $this->belongsTo(EventPackage::class, 'package_id');
    }
}

