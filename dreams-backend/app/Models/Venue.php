<?php

namespace App\Models;

use App\Traits\HasEncryptedFields;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Venue extends Model
{
    use HasFactory, HasEncryptedFields;

    protected $fillable = [
        'name',
        'location',
        'capacity',
        'description',
    ];

    /**
     * Fields that should be encrypted in database
     */
    protected array $encrypted = [
        'location',
    ];

    public function packages()
    {
        return $this->hasMany(EventPackage::class, 'venue_id', 'id');
    }
}

