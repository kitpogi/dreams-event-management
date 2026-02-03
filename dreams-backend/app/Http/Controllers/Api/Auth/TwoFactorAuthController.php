<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Services\Auth\TwoFactorAuthService;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use App\Services\Logging\StructuredLogger;

class TwoFactorAuthController extends Controller
{
    private TwoFactorAuthService $twoFactorService;

    public function __construct(TwoFactorAuthService $twoFactorService)
    {
        $this->twoFactorService = $twoFactorService;
        $this->middleware('auth:sanctum');
    }

    /**
     * Setup 2FA for user
     */
    public function setup(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'method' => 'required|in:app,email,sms',
        ]);

        /** @var User $user */
        $user = Auth::user();
        
        if ($user->two_factor_enabled) {
            return response()->json([
                'success' => false,
                'message' => 'Two-factor authentication is already enabled',
            ], 400);
        }

        $result = $user->enableTwoFactorAuth($validated['method']);

        StructuredLogger::info('2FA Setup Initiated', [
            'type' => '2fa_setup',
            'user_id' => $user->id,
            'method' => $validated['method'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Two-factor authentication setup initiated',
            'data' => [
                'secret_key' => $result['secret_key'] ?? null,
                'qr_code_url' => $result['qr_code_url'] ?? null,
                'backup_codes' => $result['backup_codes'] ?? [],
                'method' => $validated['method'],
            ],
        ]);
    }

    /**
     * Verify 2FA setup with confirmation code
     */
    public function verify(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'token' => 'required|string',
        ]);

        /** @var User $user */
        $user = Auth::user();

        if (!$user->two_factor_enabled) {
            return response()->json([
                'success' => false,
                'message' => 'Two-factor authentication is not setup',
            ], 400);
        }

        if (!$user->verifyTwoFactorToken($validated['token'])) {
            StructuredLogger::warning('2FA Verification Failed', [
                'type' => '2fa_verification_failed',
                'user_id' => $user->id,
                'method' => $user->two_factor_method,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Invalid verification code',
            ], 401);
        }

        // Mark 2FA as verified in session
        session(['2fa_verified' => true]);

        StructuredLogger::info('2FA Verification Successful', [
            'type' => '2fa_verification_success',
            'user_id' => $user->id,
            'method' => $user->two_factor_method,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Two-factor authentication verified successfully',
        ]);
    }

    /**
     * Disable 2FA for user
     */
    public function disable(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'password' => 'required|string',
        ]);

        /** @var User $user */
        $user = Auth::user();

        // Verify password
        if (!Hash::check($validated['password'], $user->password)) {
            StructuredLogger::warning('2FA Disable Failed - Invalid Password', [
                'type' => '2fa_disable_failed',
                'user_id' => $user->id,
                'reason' => 'invalid_password',
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Invalid password',
            ], 401);
        }

        $user->disableTwoFactorAuth();

        StructuredLogger::info('2FA Disabled', [
            'type' => '2fa_disabled',
            'user_id' => $user->id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Two-factor authentication disabled successfully',
        ]);
    }

    /**
     * Get 2FA status for user
     */
    public function status(): JsonResponse
    {
        /** @var User $user */
        $user = Auth::user();

        return response()->json([
            'success' => true,
            'data' => [
                'enabled' => $user->two_factor_enabled,
                'method' => $user->two_factor_method,
                'backup_codes_remaining' => $user->getRemainingBackupCodesCount(),
                'verified_in_session' => session('2fa_verified') === true,
            ],
        ]);
    }

    /**
     * Generate new backup codes
     */
    public function regenerateBackupCodes(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'password' => 'required|string',
        ]);

        /** @var User $user */
        $user = Auth::user();

        if (!$user->two_factor_enabled) {
            return response()->json([
                'success' => false,
                'message' => 'Two-factor authentication is not enabled',
            ], 400);
        }

        // Verify password
        if (!Hash::check($validated['password'], $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid password',
            ], 401);
        }

        $backupCodes = $this->twoFactorService->generateBackupCodes();
        $user->update(['twoFactorCodes' => json_encode($backupCodes)]);

        StructuredLogger::info('Backup Codes Regenerated', [
            'type' => 'backup_codes_regenerated',
            'user_id' => $user->id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Backup codes regenerated successfully',
            'data' => [
                'backup_codes' => $backupCodes,
            ],
        ]);
    }

    /**
     * Send email OTP
     */
    public function sendEmailOTP(): JsonResponse
    {
        /** @var User $user */
        $user = Auth::user();

        if ($user->two_factor_method !== 'email') {
            return response()->json([
                'success' => false,
                'message' => 'Email 2FA is not enabled',
            ], 400);
        }

        $otp = $this->twoFactorService->generateEmailOTP($user->id);

        // TODO: Send email with OTP
        // Mail::send(new SendTwoFactorOTP($user, $otp));

        StructuredLogger::info('Email OTP Sent', [
            'type' => 'email_otp_sent',
            'user_id' => $user->id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Verification code sent to your email',
        ]);
    }

    /**
     * Send SMS OTP
     */
    public function sendSmsOTP(): JsonResponse
    {
        /** @var User $user */
        $user = Auth::user();

        if ($user->two_factor_method !== 'sms') {
            return response()->json([
                'success' => false,
                'message' => 'SMS 2FA is not enabled',
            ], 400);
        }

        $otp = $this->twoFactorService->generateSmsOTP($user->id);

        // TODO: Send SMS with OTP via Twilio or similar service
        // Sms::send($user->phone, "Your verification code is: {$otp}");

        StructuredLogger::info('SMS OTP Sent', [
            'type' => 'sms_otp_sent',
            'user_id' => $user->id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Verification code sent to your phone',
        ]);
    }
}
