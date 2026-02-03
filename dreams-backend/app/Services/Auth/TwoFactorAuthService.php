<?php

namespace App\Services\Auth;

use Illuminate\Support\Facades\Cache;

/**
 * Service for managing Two-Factor Authentication
 */
class TwoFactorAuthService
{
    const OTP_CACHE_PREFIX = '2fa:otp:';
    const OTP_VALIDITY_MINUTES = 5;
    const BACKUP_CODES_COUNT = 10;
    const SECRET_LENGTH = 32;

    /**
     * Generate a secret key for user
     */
    public function generateSecretKey(): string
    {
        return base64_encode(random_bytes(static::SECRET_LENGTH));
    }

    /**
     * Get QR code for setting up authenticator app
     */
    public function getQRCodeUrl(string $userEmail, string $secretKey, string $companyName = 'Dreams Event Planner'): string
    {
        // Generate provisioning URI for QR code generation
        // Format: otpauth://totp/issuer:user@domain?secret=XXX&issuer=issuer
        $secret = $secretKey;
        $label = urlencode("{$companyName}:{$userEmail}");
        
        return sprintf(
            'otpauth://totp/%s?secret=%s&issuer=%s',
            $label,
            $secret,
            urlencode($companyName)
        );
    }

    /**
     * Verify OTP from authenticator app
     */
    public function verifyOTP(string $secretKey, string $otp): bool
    {
        // TOTP time-based OTP verification
        // Check current window and +/- 1 minute windows for clock drift
        $currentTime = time();
        
        // Time step is 30 seconds
        $timeStep = 30;
        
        // Check current and adjacent time windows
        for ($i = -1; $i <= 1; $i++) {
            $time = floor($currentTime / $timeStep) + $i;
            $hash = hash_hmac('sha1', pack('N*', 0, $time), base64_decode($secretKey), true);
            $offset = ord($hash[19]) & 0xf;
            $code = (unpack('N', substr($hash, $offset, 4))[1] & 0x7fffffff) % 1000000;
            $generatedOTP = str_pad($code, 6, '0', STR_PAD_LEFT);
            
            if (hash_equals($generatedOTP, $otp)) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * Generate OTP for email/SMS verification
     */
    public function generateEmailOTP(int $userId): string
    {
        $otp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $cacheKey = static::OTP_CACHE_PREFIX . "email:{$userId}";
        
        Cache::put($cacheKey, $otp, now()->addMinutes(static::OTP_VALIDITY_MINUTES));
        
        return $otp;
    }

    /**
     * Verify email OTP
     */
    public function verifyEmailOTP(int $userId, string $otp): bool
    {
        $cacheKey = static::OTP_CACHE_PREFIX . "email:{$userId}";
        $storedOTP = Cache::get($cacheKey);
        
        if (!$storedOTP) {
            return false;
        }

        $valid = hash_equals($storedOTP, $otp);
        
        if ($valid) {
            Cache::forget($cacheKey);
        }

        return $valid;
    }

    /**
     * Generate OTP for SMS verification
     */
    public function generateSmsOTP(int $userId): string
    {
        $otp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $cacheKey = static::OTP_CACHE_PREFIX . "sms:{$userId}";
        
        Cache::put($cacheKey, $otp, now()->addMinutes(static::OTP_VALIDITY_MINUTES));
        
        return $otp;
    }

    /**
     * Verify SMS OTP
     */
    public function verifySmsOTP(int $userId, string $otp): bool
    {
        $cacheKey = static::OTP_CACHE_PREFIX . "sms:{$userId}";
        $storedOTP = Cache::get($cacheKey);
        
        if (!$storedOTP) {
            return false;
        }

        $valid = hash_equals($storedOTP, $otp);
        
        if ($valid) {
            Cache::forget($cacheKey);
        }

        return $valid;
    }

    /**
     * Generate backup codes for 2FA
     */
    public function generateBackupCodes(): array
    {
        $codes = [];
        
        for ($i = 0; $i < static::BACKUP_CODES_COUNT; $i++) {
            $codes[] = $this->generateBackupCode();
        }
        
        return $codes;
    }

    /**
     * Generate single backup code
     */
    private function generateBackupCode(): string
    {
        return implode('-', [
            str_pad(random_int(0, 9999), 4, '0', STR_PAD_LEFT),
            str_pad(random_int(0, 9999), 4, '0', STR_PAD_LEFT),
            str_pad(random_int(0, 9999), 4, '0', STR_PAD_LEFT),
        ]);
    }

    /**
     * Verify backup code and remove it
     */
    public function verifyBackupCode(int $userId, string $code): bool
    {
        $user = \App\Models\User::find($userId);
        
        if (!$user || !$user->twoFactorCodes) {
            return false;
        }

        $codes = json_decode($user->twoFactorCodes, true) ?? [];
        $key = array_search($code, $codes, true);
        
        if ($key === false) {
            return false;
        }

        // Remove used code
        unset($codes[$key]);
        $user->twoFactorCodes = json_encode(array_values($codes));
        $user->save();

        return true;
    }

    /**
     * Clear all OTPs for user
     */
    public function clearUserOTPs(int $userId): void
    {
        Cache::forget(static::OTP_CACHE_PREFIX . "email:{$userId}");
        Cache::forget(static::OTP_CACHE_PREFIX . "sms:{$userId}");
    }

    /**
     * Check if 2FA is enabled for user
     */
    public function isEnabled(int $userId): bool
    {
        $user = \App\Models\User::find($userId);
        return $user && $user->two_factor_enabled;
    }

    /**
     * Get 2FA method for user
     */
    public function getMethod(int $userId): ?string
    {
        $user = \App\Models\User::find($userId);
        return $user ? $user->two_factor_method : null;
    }
}
