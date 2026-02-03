<?php

namespace App\Traits;

use App\Services\Auth\TwoFactorAuthService;

/**
 * Trait for adding 2FA support to User model
 *
 * @mixin \App\Models\User
 */
trait HasTwoFactorAuth
{
    /**
     * Enable 2FA for user
     */
    public function enableTwoFactorAuth(string $method = 'app'): array
    {
        $service = new TwoFactorAuthService();
        $secretKey = $service->generateSecretKey();
        $backupCodes = $service->generateBackupCodes();

        $this->update([
            'two_factor_enabled' => true,
            'two_factor_method' => $method,
            'two_factor_secret' => encrypt($secretKey),
            'twoFactorCodes' => json_encode($backupCodes),
        ]);

        return [
            'secret_key' => $secretKey,
            'backup_codes' => $backupCodes,
            'qr_code_url' => $method === 'app' ? $service->getQRCodeUrl($this->email, $secretKey) : null,
        ];
    }

    /**
     * Disable 2FA for user
     */
    public function disableTwoFactorAuth(): void
    {
        $this->update([
            'two_factor_enabled' => false,
            'two_factor_method' => null,
            'two_factor_secret' => null,
            'twoFactorCodes' => null,
        ]);
    }

    /**
     * Get 2FA secret key
     */
    public function getTwoFactorSecret(): ?string
    {
        return $this->two_factor_secret ? decrypt($this->two_factor_secret) : null;
    }

    /**
     * Check if 2FA is enabled
     */
    public function hasTwoFactorEnabled(): bool
    {
        return (bool) $this->two_factor_enabled;
    }

    /**
     * Get 2FA method
     */
    public function getTwoFactorMethod(): ?string
    {
        return $this->two_factor_method;
    }

    /**
     * Verify 2FA token
     */
    public function verifyTwoFactorToken(string $token): bool
    {
        if (!$this->hasTwoFactorEnabled()) {
            return false;
        }

        $service = new TwoFactorAuthService();

        // Try app-based OTP
        if ($this->two_factor_method === 'app') {
            $secret = $this->getTwoFactorSecret();
            if ($secret && $service->verifyOTP($secret, $token)) {
                return true;
            }
        }

        // Try backup code
        return $service->verifyBackupCode($this->id, $token);
    }

    /**
     * Get remaining backup codes count
     */
    public function getRemainingBackupCodesCount(): int
    {
        if (!$this->twoFactorCodes) {
            return 0;
        }

        $codes = json_decode($this->twoFactorCodes, true) ?? [];
        return count($codes);
    }
}
