<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Recommendation extends Model
{
    use HasFactory;

    protected $table = 'recommendations';
    protected $primaryKey = 'recommendation_id';
    public $incrementing = true;
    protected $keyType = 'int';

    protected $fillable = [
        'client_id',
        'package_id',
        'score',
        'reason',
    ];

    public function client()
    {
        return $this->belongsTo(Client::class, 'client_id', 'client_id');
    }

    public function eventPackage()
    {
        return $this->belongsTo(EventPackage::class, 'package_id', 'package_id');
    }
}


