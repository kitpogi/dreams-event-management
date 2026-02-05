<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Email log model for tracking email delivery and engagement.
 *
 * @property int $id
 * @property string $tracking_id
 * @property string $type
 * @property string $recipient
 * @property string $subject
 * @property string $status
 * @property array|null $metadata
 * @property array|null $clicks
 * @property int|null $open_count
 * @property int|null $click_count
 * @property int|null $attempts
 * @property string|null $bounce_type
 * @property string|null $bounce_message
 * @property string|null $error_message
 * @property \Illuminate\Support\Carbon|null $sent_at
 * @property \Illuminate\Support\Carbon|null $opened_at
 * @property \Illuminate\Support\Carbon|null $clicked_at
 * @property \Illuminate\Support\Carbon|null $bounced_at
 * @property \Illuminate\Support\Carbon|null $failed_at
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 */
class EmailLog extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'tracking_id',
        'type',
        'recipient',
        'subject',
        'status',
        'metadata',
        'clicks',
        'open_count',
        'click_count',
        'attempts',
        'bounce_type',
        'bounce_message',
        'error_message',
        'sent_at',
        'opened_at',
        'clicked_at',
        'bounced_at',
        'failed_at',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'metadata' => 'array',
        'clicks' => 'array',
        'open_count' => 'integer',
        'click_count' => 'integer',
        'attempts' => 'integer',
        'sent_at' => 'datetime',
        'opened_at' => 'datetime',
        'clicked_at' => 'datetime',
        'bounced_at' => 'datetime',
        'failed_at' => 'datetime',
    ];

    /**
     * Status constants.
     */
    public const STATUS_QUEUED = 'queued';
    public const STATUS_SENT = 'sent';
    public const STATUS_DELIVERED = 'delivered';
    public const STATUS_OPENED = 'opened';
    public const STATUS_CLICKED = 'clicked';
    public const STATUS_BOUNCED = 'bounced';
    public const STATUS_FAILED = 'failed';

    /**
     * Scope to filter by status.
     */
    public function scopeWithStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope to filter by type.
     */
    public function scopeOfType($query, string $type)
    {
        return $query->where('type', $type);
    }

    /**
     * Scope to get failed emails.
     */
    public function scopeFailed($query)
    {
        return $query->where('status', self::STATUS_FAILED);
    }

    /**
     * Scope to get bounced emails.
     */
    public function scopeBounced($query)
    {
        return $query->where('status', self::STATUS_BOUNCED);
    }

    /**
     * Scope to get opened emails.
     */
    public function scopeOpened($query)
    {
        return $query->whereNotNull('opened_at');
    }

    /**
     * Scope to get clicked emails.
     */
    public function scopeClicked($query)
    {
        return $query->whereNotNull('clicked_at');
    }

    /**
     * Check if email was opened.
     */
    public function wasOpened(): bool
    {
        return $this->opened_at !== null;
    }

    /**
     * Check if email was clicked.
     */
    public function wasClicked(): bool
    {
        return $this->clicked_at !== null;
    }

    /**
     * Check if email bounced.
     */
    public function hasBounced(): bool
    {
        return $this->status === self::STATUS_BOUNCED;
    }

    /**
     * Check if email failed.
     */
    public function hasFailed(): bool
    {
        return $this->status === self::STATUS_FAILED;
    }

    /**
     * Check if email can be retried.
     */
    public function canRetry(): bool
    {
        return $this->status === self::STATUS_FAILED && ($this->attempts ?? 0) < 3;
    }

    /**
     * Get engagement score (0-100).
     */
    public function getEngagementScore(): int
    {
        $score = 0;

        if ($this->status === self::STATUS_SENT) {
            $score += 10;
        }

        if ($this->wasOpened()) {
            $score += 40;
        }

        if ($this->wasClicked()) {
            $score += 50;
        }

        return min(100, $score);
    }
}
