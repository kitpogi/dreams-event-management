<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;

/**
 * @property int $id
 * @property string $name
 * @property string $key
 * @property string $secret_hash
 * @property string|null $description
 * @property array|null $permissions
 * @property array|null $allowed_ips
 * @property string $rate_limit
 * @property bool $is_active
 * @property \Illuminate\Support\Carbon|null $last_used_at
 * @property \Illuminate\Support\Carbon|null $expires_at
 * @property \Illuminate\Support\Carbon $created_at
 * @property \Illuminate\Support\Carbon $updated_at
 */
class ApiKey extends Model
{
    protected $fillable = [
        'name',
        'key',
        'secret_hash',
        'description',
        'permissions',
        'allowed_ips',
        'rate_limit',
        'is_active',
        'last_used_at',
        'expires_at',
    ];

    protected $casts = [
        'permissions' => 'array',
        'allowed_ips' => 'array',
        'is_active' => 'boolean',
        'last_used_at' => 'datetime',
        'expires_at' => 'datetime',
    ];

    protected $hidden = [
        'secret_hash',
    ];

    /**
     * Generate a new API key and secret.
     *
     * @return array{key: string, secret: string}
     */
    public static function generateCredentials(): array
    {
        return [
            'key' => 'dk_' . Str::random(32),
            'secret' => Str::random(64),
        ];
    }

    /**
     * Create a new API key with generated credentials.
     *
     * @param array $attributes
     * @return array{api_key: self, credentials: array}
     */
    public static function createWithCredentials(array $attributes): array
    {
        $credentials = self::generateCredentials();

        $apiKey = self::create([
            'name' => $attributes['name'],
            'key' => $credentials['key'],
            'secret_hash' => Hash::make($credentials['secret']),
            'description' => $attributes['description'] ?? null,
            'permissions' => $attributes['permissions'] ?? null,
            'allowed_ips' => $attributes['allowed_ips'] ?? null,
            'rate_limit' => $attributes['rate_limit'] ?? '1000',
            'is_active' => $attributes['is_active'] ?? true,
            'expires_at' => $attributes['expires_at'] ?? null,
        ]);

        return [
            'api_key' => $apiKey,
            'credentials' => $credentials,
        ];
    }

    /**
     * Validate the secret against this API key.
     *
     * @param string $secret
     * @return bool
     */
    public function validateSecret(string $secret): bool
    {
        return Hash::check($secret, $this->secret_hash);
    }

    /**
     * Check if API key is valid (active and not expired).
     *
     * @return bool
     */
    public function isValid(): bool
    {
        if (!$this->is_active) {
            return false;
        }

        if ($this->expires_at && $this->expires_at->isPast()) {
            return false;
        }

        return true;
    }

    /**
     * Check if the given IP is allowed.
     *
     * @param string|null $ip
     * @return bool
     */
    public function isIpAllowed(?string $ip): bool
    {
        // If no IP whitelist, allow all
        if (empty($this->allowed_ips)) {
            return true;
        }

        if (!$ip) {
            return false;
        }

        return in_array($ip, $this->allowed_ips);
    }

    /**
     * Check if the API key has a specific permission.
     *
     * @param string $permission
     * @return bool
     */
    public function hasPermission(string $permission): bool
    {
        // If no permissions set, allow all
        if (empty($this->permissions)) {
            return true;
        }

        // Check for wildcard
        if (in_array('*', $this->permissions)) {
            return true;
        }

        return in_array($permission, $this->permissions);
    }

    /**
     * Update last used timestamp.
     *
     * @return void
     */
    public function recordUsage(): void
    {
        $this->update(['last_used_at' => now()]);
    }

    /**
     * Get usage logs for this API key.
     */
    public function usageLogs(): HasMany
    {
        return $this->hasMany(ApiKeyUsageLog::class);
    }

    /**
     * Log an API request.
     *
     * @param string $endpoint
     * @param string $method
     * @param string|null $ip
     * @param int|null $responseCode
     * @param int|null $responseTimeMs
     * @return void
     */
    public function logRequest(
        string $endpoint,
        string $method,
        ?string $ip = null,
        ?int $responseCode = null,
        ?int $responseTimeMs = null
    ): void {
        $this->usageLogs()->create([
            'endpoint' => $endpoint,
            'method' => $method,
            'ip_address' => $ip,
            'response_code' => $responseCode,
            'response_time_ms' => $responseTimeMs,
            'created_at' => now(),
        ]);
    }

    /**
     * Get rate limit as requests per hour.
     *
     * @return int
     */
    public function getRateLimitPerHour(): int
    {
        return (int) $this->rate_limit;
    }
}
