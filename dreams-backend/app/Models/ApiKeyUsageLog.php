<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $api_key_id
 * @property string $endpoint
 * @property string $method
 * @property string|null $ip_address
 * @property int|null $response_code
 * @property int|null $response_time_ms
 * @property \Illuminate\Support\Carbon $created_at
 */
class ApiKeyUsageLog extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'api_key_id',
        'endpoint',
        'method',
        'ip_address',
        'response_code',
        'response_time_ms',
        'created_at',
    ];

    protected $casts = [
        'created_at' => 'datetime',
    ];

    /**
     * Get the API key that owns this log entry.
     */
    public function apiKey(): BelongsTo
    {
        return $this->belongsTo(ApiKey::class);
    }
}
