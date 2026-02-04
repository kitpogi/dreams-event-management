<?php

namespace App\Services;

use App\Models\User;
use App\Models\PasswordHistory;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class PasswordPolicyService
{
    /**
     * Number of previous passwords to check against.
     */
    protected int $historyCount;

    /**
     * Password expiration days (0 = never expires).
     */
    protected int $expirationDays;

    /**
     * Warning days before password expires.
     */
    protected int $warningDays;

    public function __construct()
    {
        $this->historyCount = config('password.password_history_count', 5);
        $this->expirationDays = config('password.password_expiration_days', 90);
        $this->warningDays = config('password.password_warning_days', 14);
    }

    /**
     * Check if a password was previously used by the user.
     *
     * @param User $user
     * @param string $newPassword
     * @return bool True if password was previously used
     */
    public function wasPasswordPreviouslyUsed(User $user, string $newPassword): bool
    {
        // Check current password
        if (Hash::check($newPassword, $user->password)) {
            return true;
        }

        // Check password history
        $previousPasswords = PasswordHistory::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->take($this->historyCount)
            ->pluck('password_hash');

        foreach ($previousPasswords as $passwordHash) {
            if (Hash::check($newPassword, $passwordHash)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Record the current password in history before changing it.
     *
     * @param User $user
     * @return void
     */
    public function recordPasswordHistory(User $user): void
    {
        PasswordHistory::create([
            'user_id' => $user->id,
            'password_hash' => $user->password,
            'created_at' => now(),
        ]);

        // Clean up old entries beyond history count
        $this->cleanupOldHistory($user);
    }

    /**
     * Update password with history tracking.
     *
     * @param User $user
     * @param string $newPassword
     * @return bool
     * @throws \Exception If password was previously used
     */
    public function updatePassword(User $user, string $newPassword): bool
    {
        if ($this->wasPasswordPreviouslyUsed($user, $newPassword)) {
            throw new \Exception("Password has been used recently. Please choose a different password.");
        }

        // Record current password in history
        $this->recordPasswordHistory($user);

        // Update to new password
        $user->password = Hash::make($newPassword);
        $user->password_changed_at = now();
        $user->password_expired = false;
        $user->save();

        return true;
    }

    /**
     * Check if user's password has expired.
     *
     * @param User $user
     * @return bool
     */
    public function isPasswordExpired(User $user): bool
    {
        if ($this->expirationDays <= 0) {
            return false;
        }

        // If password_changed_at is null, check account creation date
        $passwordDate = $user->password_changed_at ?? $user->created_at;

        if (!$passwordDate) {
            return false;
        }

        return Carbon::parse($passwordDate)->addDays($this->expirationDays)->isPast();
    }

    /**
     * Get days until password expires.
     *
     * @param User $user
     * @return int|null Null if password never expires
     */
    public function getDaysUntilExpiration(User $user): ?int
    {
        if ($this->expirationDays <= 0) {
            return null;
        }

        $passwordDate = $user->password_changed_at ?? $user->created_at;

        if (!$passwordDate) {
            return null;
        }

        $expirationDate = Carbon::parse($passwordDate)->addDays($this->expirationDays);
        $daysRemaining = now()->diffInDays($expirationDate, false);

        return max(0, (int) $daysRemaining);
    }

    /**
     * Check if password expiration warning should be shown.
     *
     * @param User $user
     * @return bool
     */
    public function shouldShowExpirationWarning(User $user): bool
    {
        $daysRemaining = $this->getDaysUntilExpiration($user);

        if ($daysRemaining === null) {
            return false;
        }

        return $daysRemaining > 0 && $daysRemaining <= $this->warningDays;
    }

    /**
     * Get password policy status for a user.
     *
     * @param User $user
     * @return array
     */
    public function getPasswordStatus(User $user): array
    {
        $daysRemaining = $this->getDaysUntilExpiration($user);
        $isExpired = $this->isPasswordExpired($user);
        $showWarning = $this->shouldShowExpirationWarning($user);

        return [
            'password_changed_at' => $user->password_changed_at?->toIso8601String(),
            'expires_in_days' => $daysRemaining,
            'is_expired' => $isExpired,
            'show_warning' => $showWarning,
            'expiration_enabled' => $this->expirationDays > 0,
            'history_count' => $this->historyCount,
        ];
    }

    /**
     * Mark expired passwords for all users.
     * This should be run as a scheduled job.
     *
     * @return int Number of users with expired passwords
     */
    public function markExpiredPasswords(): int
    {
        if ($this->expirationDays <= 0) {
            return 0;
        }

        $expirationDate = now()->subDays($this->expirationDays);

        return User::where('password_expired', false)
            ->where(function ($query) use ($expirationDate) {
                $query->where('password_changed_at', '<', $expirationDate)
                    ->orWhere(function ($q) use ($expirationDate) {
                        $q->whereNull('password_changed_at')
                            ->where('created_at', '<', $expirationDate);
                    });
            })
            ->update(['password_expired' => true]);
    }

    /**
     * Clean up old password history entries.
     *
     * @param User $user
     * @return void
     */
    protected function cleanupOldHistory(User $user): void
    {
        $keepIds = PasswordHistory::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->take($this->historyCount)
            ->pluck('id');

        PasswordHistory::where('user_id', $user->id)
            ->whereNotIn('id', $keepIds)
            ->delete();
    }

    /**
     * Get the number of passwords kept in history.
     *
     * @return int
     */
    public function getHistoryCount(): int
    {
        return $this->historyCount;
    }

    /**
     * Get the password expiration days.
     *
     * @return int
     */
    public function getExpirationDays(): int
    {
        return $this->expirationDays;
    }
}
