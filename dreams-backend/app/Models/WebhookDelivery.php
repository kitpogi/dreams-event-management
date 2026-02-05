<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Webhook delivery log model.
 *
 * @property int $id
 * @property int $webhook_id
 * @property string $event
 * @property string $payload
 * @property string $status
 * @property int|null $status_code
 * @property string|null $response_body
 * @property string|null $error_message
 * @property int $attempts
 * @property \Illuminate\Support\Carbon|null $last_attempt_at
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 */
class WebhookDelivery extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'webhook_id',
        'event',
        'payload',
        'status',
        'status_code',
        'response_body',
        'error_message',
        'attempts',
        'last_attempt_at',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'attempts' => 'integer',
        'status_code' => 'integer',
        'last_attempt_at' => 'datetime',
    ];

    /**
     * Status constants.
     */
    public const STATUS_PENDING = 'pending';
    public const STATUS_SUCCESS = 'success';
    public const STATUS_FAILED = 'failed';

    /**
     * Get the webhook that owns this delivery.
     */
    public function webhook(): BelongsTo
    {
        return $this->belongsTo(Webhook::class);
    }

    /**
     * Scope to filter by status.
     */
    public function scopeWithStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope to get failed deliveries.
     */
    public function scopeFailed($query)
    {
        return $query->where('status', self::STATUS_FAILED);
    }

    /**
     * Scope to get successful deliveries.
     */
    public function scopeSuccessful($query)
    {
        return $query->where('status', self::STATUS_SUCCESS);
    }

    /**
     * Scope to get pending deliveries.
     */
    public function scopePending($query)
    {
        return $query->where('status', self::STATUS_PENDING);
    }

    /**
     * Check if delivery can be retried.
     */
    public function canRetry(): bool
    {
        return $this->status === self::STATUS_FAILED && $this->attempts < 3;
    }

    /**
     * Mark as successful.
     */
    public function markAsSuccess(int $statusCode, ?string $responseBody = null): void
    {
        $this->update([
            'status' => self::STATUS_SUCCESS,
            'status_code' => $statusCode,
            'response_body' => $responseBody ? substr($responseBody, 0, 1000) : null,
            'attempts' => $this->attempts + 1,
            'last_attempt_at' => now(),
        ]);
    }

    /**
     * Mark as failed.
     */
    public function markAsFailed(?int $statusCode = null, ?string $errorMessage = null): void
    {
        $this->update([
            'status' => self::STATUS_FAILED,
            'status_code' => $statusCode,
            'error_message' => $errorMessage ? substr($errorMessage, 0, 500) : null,
            'attempts' => $this->attempts + 1,
            'last_attempt_at' => now(),
        ]);
    }

    /**
     * Get parsed payload.
     */
    public function getParsedPayload(): array
    {
        return json_decode($this->payload, true) ?? [];
    }
}
