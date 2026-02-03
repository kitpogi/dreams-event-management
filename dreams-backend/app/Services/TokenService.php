<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Str;
use Carbon\Carbon;

class TokenService
{
    /**
     * Create access and refresh tokens for a user
     *
     * @param User $user
     * @param string|null $deviceName
     * @return array
     */
    public function createTokens(User $user, ?string $deviceName = null): array
    {
        $deviceName = $deviceName ?? $this->detectDevice();
        
        // Create access token (short-lived: 1 hour)
        $accessToken = $user->createToken(
            'access_token',
            ['*'],
            now()->addHour()
        )->plainTextToken;

        // Create refresh token (long-lived: 30 days)
        $refreshToken = $user->createToken(
            'refresh_token',
            ['refresh'],
            now()->addDays(30)
        )->plainTextToken;

        // Store device information in token name
        $user->tokens()
            ->where('name', 'refresh_token')
            ->latest()
            ->first()
            ->update(['name' => "refresh_token_{$deviceName}"]);

        return [
            'access_token' => $accessToken,
            'refresh_token' => $refreshToken,
            'token_type' => 'Bearer',
            'expires_in' => 3600, // 1 hour in seconds
        ];
    }

    /**
     * Refresh access token using refresh token
     *
     * @param string $refreshToken
     * @return array|null
     */
    public function refreshAccessToken(string $refreshToken): ?array
    {
        // Find the token
        $token = \Laravel\Sanctum\PersonalAccessToken::findToken($refreshToken);
        
        if (!$token || !$token->can('refresh')) {
            return null;
        }

        // Check if token is expired
        if ($token->expires_at && $token->expires_at->isPast()) {
            $token->delete();
            return null;
        }

        $user = $token->tokenable;

        // Revoke old access tokens for this user
        $this->revokeAccessTokens($user);

        // Create new access token
        $newAccessToken = $user->createToken(
            'access_token',
            ['*'],
            now()->addHour()
        )->plainTextToken;

        return [
            'access_token' => $newAccessToken,
            'token_type' => 'Bearer',
            'expires_in' => 3600,
        ];
    }

    /**
     * Revoke all access tokens for a user
     *
     * @param User $user
     * @return void
     */
    public function revokeAccessTokens(User $user): void
    {
        $user->tokens()
            ->where('name', 'access_token')
            ->delete();
    }

    /**
     * Revoke a specific refresh token
     *
     * @param string $refreshToken
     * @return bool
     */
    public function revokeRefreshToken(string $refreshToken): bool
    {
        $token = \Laravel\Sanctum\PersonalAccessToken::findToken($refreshToken);
        
        if ($token && $token->can('refresh')) {
            $token->delete();
            return true;
        }

        return false;
    }

    /**
     * Revoke all tokens for a user
     *
     * @param User $user
     * @return void
     */
    public function revokeAllTokens(User $user): void
    {
        $user->tokens()->delete();
    }

    /**
     * Detect device name from request
     *
     * @return string
     */
    protected function detectDevice(): string
    {
        $userAgent = request()->userAgent() ?? 'Unknown';
        
        // Simple device detection
        if (str_contains($userAgent, 'Mobile')) {
            return 'Mobile';
        } elseif (str_contains($userAgent, 'Tablet')) {
            return 'Tablet';
        } else {
            return 'Desktop';
        }
    }
}
