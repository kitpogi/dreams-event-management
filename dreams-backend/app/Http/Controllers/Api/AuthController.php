<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\ChangePasswordRequest;
use App\Http\Requests\Auth\ResetPasswordRequest;
use App\Models\User;
use App\Mail\PasswordResetMail;
use App\Mail\EmailVerificationMail;
use App\Exceptions\UnauthorizedException;
use App\Exceptions\AuthenticationException;
use App\Services\TokenService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Carbon\Carbon;

/**
 * @OA\Post(
 *     path="/api/auth/register",
 *     summary="Register a new user",
 *     tags={"Authentication"},
 *     @OA\RequestBody(
 *         required=true,
 *         @OA\JsonContent(
 *             required={"name", "email", "password", "password_confirmation"},
 *             @OA\Property(property="name", type="string", example="John Doe"),
 *             @OA\Property(property="email", type="string", format="email", example="john@example.com"),
 *             @OA\Property(property="password", type="string", format="password", example="password123", minLength=8),
 *             @OA\Property(property="password_confirmation", type="string", format="password", example="password123"),
 *             @OA\Property(property="phone", type="string", example="+1234567890", nullable=true)
 *         )
 *     ),
 *     @OA\Response(
 *         response=201,
 *         description="User registered successfully",
 *         @OA\JsonContent(
 *             @OA\Property(property="token", type="string", example="1|abcdef123456..."),
 *             @OA\Property(property="user", type="object"),
 *             @OA\Property(property="message", type="string", example="Registration successful! Please check your email to verify your account.")
 *         )
 *     ),
 *     @OA\Response(response=422, description="Validation error")
 * )
 */
class AuthController extends Controller
{
    protected $tokenService;

    public function __construct(TokenService $tokenService)
    {
        $this->tokenService = $tokenService;
    }

    public function register(RegisterRequest $request)
    {
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'phone' => $request->phone,
            'role' => 'client',
            'email_verified_at' => null, // Not verified yet
        ]);

        // Generate email verification token
        $verificationToken = Str::random(64);
        
        // Send verification email
        try {
            Mail::to($user->email)->send(new EmailVerificationMail($user, $verificationToken));
        } catch (\Exception $e) {
            Log::error('Failed to send email verification: ' . $e->getMessage());
            // Don't fail registration if email fails, but log it
        }

        // Store verification token in database
        DB::table('password_reset_tokens')->insert([
            'email' => $user->email,
            'token' => Hash::make($verificationToken),
            'created_at' => Carbon::now(),
        ]);

        // Create tokens using TokenService
        $tokens = $this->tokenService->createTokens($user, $request->input('device_name'));

        return $this->successResponse([
            'user' => $user,
            'token' => $tokens['access_token'],
            'refresh_token' => $tokens['refresh_token'],
        ], 'Registration successful! Please check your email to verify your account.', 201);
    }

    /**
     * @OA\Post(
     *     path="/api/auth/login",
     *     summary="Login user",
     *     tags={"Authentication"},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"email", "password"},
     *             @OA\Property(property="email", type="string", format="email", example="john@example.com"),
     *             @OA\Property(property="password", type="string", format="password", example="password123")
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Login successful",
     *         @OA\JsonContent(
     *             @OA\Property(property="token", type="string", example="1|abcdef123456..."),
     *             @OA\Property(property="user", type="object")
     *         )
     *     ),
     *     @OA\Response(response=422, description="Invalid credentials")
     * )
     */
    public function login(LoginRequest $request)
    {
        $user = User::where('email', $request->email)->first();

        // Check if account is locked
        if ($user && $user->isLocked()) {
            $minutesRemaining = now()->diffInMinutes($user->locked_until, false);
            throw new AuthenticationException("Account is locked. Please try again in {$minutesRemaining} minutes.");
        }

        // Check credentials
        if (!$user || !Hash::check($request->password, $user->password)) {
            if ($user) {
                $user->incrementFailedLoginAttempts();
            }
            
            throw new AuthenticationException('Invalid email or password.');
        }

        // Reset failed login attempts on successful login
        $user->resetFailedLoginAttempts();

        // Create tokens using TokenService
        $tokens = $this->tokenService->createTokens($user, $request->input('device_name'));

        return $this->successResponse([
            'user' => $user,
            'token' => $tokens['access_token'],
            'refresh_token' => $tokens['refresh_token'],
        ], 'Login successful');
    }

    /**
     * @OA\Post(
     *     path="/api/auth/logout",
     *     summary="Logout user",
     *     tags={"Authentication"},
     *     security={{"sanctum": {}}},
     *     @OA\Response(
     *         response=200,
     *         description="Logged out successfully",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="Logged out successfully")
     *         )
     *     ),
     *     @OA\Response(response=401, description="Unauthenticated")
     * )
     */
    public function logout(Request $request)
    {
        // Revoke the current access token
        // currentAccessToken() returns a TransientToken, we need to revoke via tokens relation
        if ($request->user()) {
            $request->user()->tokens()
                ->where('name', 'access_token')
                ->delete();
        }

        return $this->successResponse(null, 'Logged out successfully');
    }

    /**
     * @OA\Get(
     *     path="/api/auth/me",
     *     summary="Get authenticated user",
     *     tags={"Authentication"},
     *     security={{"sanctum": {}}},
     *     @OA\Response(
     *         response=200,
     *         description="User information",
     *         @OA\JsonContent(type="object")
     *     ),
     *     @OA\Response(response=401, description="Unauthenticated")
     * )
     */
    public function me(Request $request)
    {
        return $this->successResponse($request->user());
    }

    /**
     * @OA\Post(
     *     path="/api/auth/create-coordinator",
     *     summary="Create a coordinator user (Admin only)",
     *     tags={"Authentication"},
     *     security={{"sanctum": {}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"name", "email", "password", "password_confirmation"},
     *             @OA\Property(property="name", type="string", example="Jane Coordinator"),
     *             @OA\Property(property="email", type="string", format="email", example="jane@example.com"),
     *             @OA\Property(property="password", type="string", format="password", example="password123", minLength=8),
     *             @OA\Property(property="password_confirmation", type="string", format="password", example="password123"),
     *             @OA\Property(property="phone", type="string", example="+1234567890", nullable=true)
     *         )
     *     ),
     *     @OA\Response(
     *         response=201,
     *         description="Coordinator created successfully",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="Coordinator created successfully"),
     *             @OA\Property(property="data", type="object")
     *         )
     *     ),
     *     @OA\Response(response=403, description="Forbidden - Admin only"),
     *     @OA\Response(response=422, description="Validation error")
     * )
     */
    public function createCoordinator(Request $request)
    {
        // Only admins (not coordinators) can create coordinators
        if ($request->user()->role !== 'admin') {
            return $this->forbiddenResponse('Unauthorized. Only admins can create coordinators.');
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => [
                'required',
                'string',
                'confirmed',
                \Illuminate\Validation\Rules\Password::min(8)
                    ->letters()
                    ->mixedCase()
                    ->numbers()
                    ->symbols()
            ],
            'phone' => 'nullable|string|max:20',
        ]);

        $coordinator = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'phone' => $request->phone,
            'role' => 'coordinator',
        ]);

        return $this->successResponse($coordinator, 'Coordinator created successfully', 201);
    }

    /**
     * Login or register with Google OAuth
     */
    public function googleLogin(Request $request)
    {
        $request->validate([
            'id_token' => 'required_without:email|string',
            'email' => 'required_without:id_token|email',
            'name' => 'required_without:id_token|string',
        ]);

        try {
            $email = null;
            $name = null;

            // If id_token is provided, verify it
            if ($request->has('id_token')) {
                $response = Http::get('https://oauth2.googleapis.com/tokeninfo', [
                    'id_token' => $request->id_token,
                ]);

                if (!$response->successful()) {
                    return response()->json([
                        'message' => 'Invalid Google token'
                    ], 401);
                }

                $googleUser = $response->json();
                $email = $googleUser['email'] ?? null;
                $name = $googleUser['name'] ?? null;
            } else {
                // Direct email/name from OAuth2 flow
                $email = $request->email;
                $name = $request->name;
            }

            if (!$email) {
                return response()->json([
                    'message' => 'Email is required'
                ], 400);
            }

            // Find or create user
            $user = User::where('email', $email)->first();

            if (!$user) {
                // Create new user
                $user = User::create([
                    'name' => $name ?? 'Google User',
                    'email' => $email,
                    'password' => Hash::make(uniqid()), // Random password for OAuth users
                    'role' => 'client',
                ]);
            }

            $tokens = $this->tokenService->createTokens($user, $request->input('device_name'));

            return $this->successResponse([
                ...$tokens,
                'user' => $user,
            ], 'Login successful');
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to authenticate with Google',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Login or register with Facebook OAuth (access token method)
     */
    public function facebookLogin(Request $request)
    {
        $request->validate([
            'access_token' => 'required|string',
        ]);

        try {
            // Verify Facebook access token and get user info
            $response = Http::get('https://graph.facebook.com/me', [
                'fields' => 'id,name,email',
                'access_token' => $request->access_token,
            ]);

            if (!$response->successful()) {
                return response()->json([
                    'message' => 'Invalid Facebook token'
                ], 401);
            }

            $facebookUser = $response->json();

            if (!isset($facebookUser['email'])) {
                return response()->json([
                    'message' => 'Email is required. Please grant email permission.'
                ], 400);
            }

            // Find or create user
            $user = User::where('email', $facebookUser['email'])->first();

            if (!$user) {
                // Create new user
                $user = User::create([
                    'name' => $facebookUser['name'],
                    'email' => $facebookUser['email'],
                    'password' => Hash::make(uniqid()), // Random password for OAuth users
                    'role' => 'client',
                ]);
            }

            $tokens = $this->tokenService->createTokens($user, $request->input('device_name'));

            return $this->successResponse([
                ...$tokens,
                'user' => $user,
            ], 'Login successful');
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to authenticate with Facebook',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Handle Facebook OAuth callback (authorization code method)
     */
    public function facebookCallback(Request $request)
    {
        $request->validate([
            'code' => 'required|string',
            'redirect_uri' => 'required|string',
        ]);

        try {
            // Exchange authorization code for access token
            $tokenResponse = Http::get('https://graph.facebook.com/v18.0/oauth/access_token', [
                'client_id' => env('FACEBOOK_APP_ID'),
                'client_secret' => env('FACEBOOK_APP_SECRET'),
                'redirect_uri' => $request->redirect_uri,
                'code' => $request->code,
            ]);

            if (!$tokenResponse->successful()) {
                return response()->json([
                    'message' => 'Failed to exchange authorization code',
                    'error' => $tokenResponse->json()
                ], 401);
            }

            $tokenData = $tokenResponse->json();
            $accessToken = $tokenData['access_token'] ?? null;

            if (!$accessToken) {
                return response()->json([
                    'message' => 'No access token received from Facebook'
                ], 401);
            }

            // Get user info with access token
            $userResponse = Http::get('https://graph.facebook.com/me', [
                'fields' => 'id,name,email',
                'access_token' => $accessToken,
            ]);

            if (!$userResponse->successful()) {
                Log::error('Facebook user info error', [
                    'response' => $userResponse->json(),
                    'status' => $userResponse->status()
                ]);
                return response()->json([
                    'message' => 'Failed to get user info from Facebook',
                    'error' => $userResponse->json()
                ], 401);
            }

            $facebookUser = $userResponse->json();

            // Debug: Log what Facebook returned
            Log::info('Facebook user data', ['user' => $facebookUser]);

            if (!isset($facebookUser['email'])) {
                Log::warning('Facebook user missing email', ['user' => $facebookUser]);
                return response()->json([
                    'message' => 'Email is required. Please grant email permission when logging in with Facebook. Your Facebook account may not have a verified email address.',
                    'debug' => [
                        'received_fields' => array_keys($facebookUser),
                        'user_id' => $facebookUser['id'] ?? null,
                        'user_name' => $facebookUser['name'] ?? null,
                    ]
                ], 400);
            }

            // Find or create user
            $user = User::where('email', $facebookUser['email'])->first();

            if (!$user) {
                // Create new user
                $user = User::create([
                    'name' => $facebookUser['name'],
                    'email' => $facebookUser['email'],
                    'password' => Hash::make(uniqid()), // Random password for OAuth users
                    'role' => 'client',
                    'email_verified_at' => now(), // Facebook emails are verified
                ]);
            }

            $tokens = $this->tokenService->createTokens($user, $request->input('device_name'));

            return $this->successResponse([
                ...$tokens,
                'user' => $user,
            ], 'Login successful');
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to authenticate with Facebook',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * @OA\Post(
     *     path="/api/auth/forgot-password",
     *     summary="Request password reset",
     *     tags={"Authentication"},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"email"},
     *             @OA\Property(property="email", type="string", format="email", example="john@example.com")
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Password reset link sent (if email exists)",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="If that email address exists in our system, we will send a password reset link.")
     *         )
     *     )
     * )
     */
    public function forgotPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            // Return success even if user doesn't exist for security (prevents email enumeration)
            return $this->successResponse(null, 'If that email address exists in our system, we will send a password reset link.');
        }

        // Generate reset token
        $token = Str::random(64);
        
        // Delete any existing tokens for this email
        DB::table('password_reset_tokens')->where('email', $request->email)->delete();
        
        // Insert new token (expires in 60 minutes)
        DB::table('password_reset_tokens')->insert([
            'email' => $request->email,
            'token' => Hash::make($token),
            'created_at' => Carbon::now(),
        ]);

        // Send password reset email
        try {
            Mail::to($request->email)->send(new PasswordResetMail($token, $request->email));
        } catch (\Exception $e) {
            Log::error('Failed to send password reset email: ' . $e->getMessage());
            return $this->errorResponse('Failed to send password reset email. Please try again later.', 500, null, 'EMAIL_SEND_FAILED');
        }

        return $this->successResponse(null, 'If that email address exists in our system, we will send a password reset link.');
    }

    /**
     * @OA\Post(
     *     path="/api/auth/reset-password",
     *     summary="Reset password with token",
     *     tags={"Authentication"},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"email", "token", "password", "password_confirmation"},
     *             @OA\Property(property="email", type="string", format="email", example="john@example.com"),
     *             @OA\Property(property="token", type="string", example="reset-token-from-email"),
     *             @OA\Property(property="password", type="string", format="password", example="newpassword123", minLength=8),
     *             @OA\Property(property="password_confirmation", type="string", format="password", example="newpassword123")
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Password reset successfully",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="Password has been reset successfully. You can now login with your new password.")
     *         )
     *     ),
     *     @OA\Response(response=400, description="Invalid or expired token"),
     *     @OA\Response(response=422, description="Validation error")
     * )
     */
    public function resetPassword(ResetPasswordRequest $request)
    {

        // Find the password reset record
        $resetRecord = DB::table('password_reset_tokens')
            ->where('email', $request->email)
            ->first();

        if (!$resetRecord) {
            return $this->errorResponse('Invalid or expired reset token.', 400, null, 'INVALID_TOKEN');
        }

        // Check if token is valid (60 minutes expiry)
        $createdAt = Carbon::parse($resetRecord->created_at);
        if ($createdAt->addMinutes(60)->isPast()) {
            DB::table('password_reset_tokens')->where('email', $request->email)->delete();
            return $this->errorResponse('This password reset token has expired. Please request a new one.', 400, null, 'TOKEN_EXPIRED');
        }

        // Verify token
        if (!Hash::check($request->token, $resetRecord->token)) {
            return $this->errorResponse('Invalid reset token.', 400, null, 'INVALID_TOKEN');
        }

        // Update user password
        $user = User::where('email', $request->email)->first();
        $user->password = Hash::make($request->password);
        $user->save();

        // Delete the reset token
        DB::table('password_reset_tokens')->where('email', $request->email)->delete();

        // Unlock account if it was locked
        $user->unlockAccount();

        return $this->successResponse(null, 'Password has been reset successfully. You can now login with your new password.');
    }

    /**
     * @OA\Post(
     *     path="/api/auth/verify-email",
     *     summary="Verify email address",
     *     tags={"Authentication"},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"email", "token"},
     *             @OA\Property(property="email", type="string", format="email", example="john@example.com"),
     *             @OA\Property(property="token", type="string", example="verification-token-from-email")
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Email verified successfully",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="Email address has been verified successfully!")
     *         )
     *     ),
     *     @OA\Response(response=400, description="Invalid or expired token"),
     *     @OA\Response(response=404, description="User not found")
     * )
     */
    public function verifyEmail(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:users,email',
            'token' => 'required|string',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return $this->notFoundResponse('User not found.');
        }

        // Check if already verified
        if ($user->email_verified_at) {
            return $this->errorResponse('Email address is already verified.', 400, null, 'ALREADY_VERIFIED');
        }

        // Find the verification token (stored in password_reset_tokens table)
        $tokenRecord = DB::table('password_reset_tokens')
            ->where('email', $request->email)
            ->first();

        if (!$tokenRecord) {
            return $this->errorResponse('Invalid or expired verification token.', 400, null, 'INVALID_TOKEN');
        }

        // Check if token is valid (24 hours expiry)
        $createdAt = Carbon::parse($tokenRecord->created_at);
        if ($createdAt->addHours(24)->isPast()) {
            DB::table('password_reset_tokens')->where('email', $request->email)->delete();
            return $this->errorResponse('This verification token has expired. Please request a new verification email.', 400, null, 'TOKEN_EXPIRED');
        }

        // Verify token
        if (!Hash::check($request->token, $tokenRecord->token)) {
            return $this->errorResponse('Invalid verification token.', 400, null, 'INVALID_TOKEN');
        }

        // Mark email as verified
        $user->email_verified_at = Carbon::now();
        $user->save();

        // Delete the verification token
        DB::table('password_reset_tokens')->where('email', $request->email)->delete();

        return $this->successResponse(null, 'Email address has been verified successfully!');
    }

    /**
     * @OA\Post(
     *     path="/api/auth/resend-verification",
     *     summary="Resend email verification",
     *     tags={"Authentication"},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"email"},
     *             @OA\Property(property="email", type="string", format="email", example="john@example.com")
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Verification email sent (if email exists and not verified)",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="If that email address exists in our system and is not verified, we will send a verification link.")
     *         )
     *     ),
     *     @OA\Response(response=400, description="Email already verified")
     * )
     */
    public function resendVerificationEmail(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:users,email',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            // Return success even if user doesn't exist for security
            return $this->successResponse(null, 'If that email address exists in our system and is not verified, we will send a verification link.');
        }

        // Check if already verified
        if ($user->email_verified_at) {
            return $this->errorResponse('Email address is already verified.', 400, null, 'ALREADY_VERIFIED');
        }

        // Generate new verification token
        $verificationToken = Str::random(64);
        
        // Delete any existing tokens for this email
        DB::table('password_reset_tokens')->where('email', $request->email)->delete();
        
        // Insert new token (expires in 24 hours)
        DB::table('password_reset_tokens')->insert([
            'email' => $request->email,
            'token' => Hash::make($verificationToken),
            'created_at' => Carbon::now(),
        ]);

        // Send verification email
        try {
            Mail::to($user->email)->send(new EmailVerificationMail($user, $verificationToken));
        } catch (\Exception $e) {
            Log::error('Failed to send email verification: ' . $e->getMessage());
            return $this->errorResponse('Failed to send verification email. Please try again later.', 500, null, 'EMAIL_SEND_FAILED');
        }

        return $this->successResponse(null, 'If that email address exists in our system and is not verified, we will send a verification link.');
    }

    /**
     * @OA\Patch(
     *     path="/api/auth/profile",
     *     summary="Update user profile",
     *     tags={"Authentication"},
     *     security={{"sanctum": {}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             @OA\Property(property="name", type="string", example="John Doe"),
     *             @OA\Property(property="email", type="string", format="email", example="john@example.com"),
     *             @OA\Property(property="phone", type="string", example="+1234567890")
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Profile updated successfully",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="Profile updated successfully"),
     *             @OA\Property(property="user", type="object")
     *         )
     *     ),
     *     @OA\Response(response=401, description="Unauthenticated"),
     *     @OA\Response(response=422, description="Validation error")
     * )
     */
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|string|email|max:255|unique:users,email,' . $user->id,
            'phone' => 'sometimes|nullable|string|max:20',
        ]);

        // If email is being changed, mark as unverified
        if (isset($validated['email']) && $validated['email'] !== $user->email) {
            $validated['email_verified_at'] = null;
        }

        $user->update($validated);

        return $this->successResponse($user->fresh(), 'Profile updated successfully');
    }

    /**
     * @OA\Post(
     *     path="/api/auth/upload-avatar",
     *     summary="Upload profile picture",
     *     tags={"Authentication"},
     *     security={{"sanctum": {}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\MediaType(
     *             mediaType="multipart/form-data",
     *             @OA\Schema(
     *                 @OA\Property(
     *                     property="profile_picture",
     *                     type="string",
     *                     format="binary"
     *                 )
     *             )
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Avatar uploaded successfully",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="Profile picture uploaded successfully"),
     *             @OA\Property(property="profile_picture", type="string", example="/storage/profile_pictures/abc123.jpg"),
     *             @OA\Property(property="user", type="object")
     *         )
     *     ),
     *     @OA\Response(response=401, description="Unauthenticated"),
     *     @OA\Response(response=422, description="Validation error")
     * )
     */
    public function uploadAvatar(Request $request)
    {
        $request->validate([
            'profile_picture' => 'required|image|mimes:jpeg,jpg,png,gif,webp|max:5120', // 5MB max
        ]);

        $user = $request->user();

        // Delete old profile picture if it exists
        if ($user->profile_picture) {
            $oldPath = str_replace('/storage/', '', $user->profile_picture);
            if (Storage::disk('public')->exists($oldPath)) {
                Storage::disk('public')->delete($oldPath);
            }
        }

        // Store new profile picture
        $path = $request->file('profile_picture')->store('profile_pictures', 'public');
        $url = '/storage/' . $path;

        // Update user
        $user->update(['profile_picture' => $url]);

        return $this->successResponse([
            'profile_picture' => $url,
            'user' => $user->fresh(),
        ], 'Profile picture uploaded successfully');
    }

    /**
     * @OA\Post(
     *     path="/api/auth/change-password",
     *     summary="Change password",
     *     tags={"Authentication"},
     *     security={{"sanctum": {}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"current_password", "new_password", "new_password_confirmation"},
     *             @OA\Property(property="current_password", type="string", format="password", example="oldpassword123"),
     *             @OA\Property(property="new_password", type="string", format="password", example="newpassword123", minLength=8),
     *             @OA\Property(property="new_password_confirmation", type="string", format="password", example="newpassword123")
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Password changed successfully",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="Password changed successfully")
     *         )
     *     ),
     *     @OA\Response(response=401, description="Unauthenticated"),
     *     @OA\Response(response=422, description="Validation error")
     * )
     */
    public function changePassword(ChangePasswordRequest $request)
    {
        $user = $request->user();

        // Verify current password
        if (!Hash::check($request->current_password, $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['The provided password is incorrect.'],
            ]);
        }

        // Update password
        $user->update([
            'password' => Hash::make($request->new_password),
        ]);

        return $this->successResponse(null, 'Password changed successfully');
    }

    /**
     * @OA\Post(
     *     path="/api/auth/refresh",
     *     summary="Refresh access token",
     *     tags={"Authentication"},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"refresh_token"},
     *             @OA\Property(property="refresh_token", type="string", example="refresh_token_here")
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Token refreshed successfully",
     *         @OA\JsonContent(
     *             @OA\Property(property="access_token", type="string"),
     *             @OA\Property(property="token_type", type="string", example="Bearer"),
     *             @OA\Property(property="expires_in", type="integer", example=3600)
     *         )
     *     ),
     *     @OA\Response(response=401, description="Invalid or expired refresh token")
     * )
     */
    public function refresh(Request $request)
    {
        $request->validate([
            'refresh_token' => 'required|string',
        ]);

        $result = $this->tokenService->refreshAccessToken($request->refresh_token);

        if (!$result) {
            return $this->unauthorizedResponse('Invalid or expired refresh token');
        }

        return $this->successResponse($result, 'Token refreshed successfully');
    }

    /**
     * @OA\Post(
     *     path="/api/auth/revoke",
     *     summary="Revoke refresh token",
     *     tags={"Authentication"},
     *     security={{"sanctum": {}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"refresh_token"},
     *             @OA\Property(property="refresh_token", type="string", example="refresh_token_here")
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Token revoked successfully"
     *     ),
     *     @OA\Response(response=401, description="Unauthenticated")
     * )
     */
    public function revoke(Request $request)
    {
        $request->validate([
            'refresh_token' => 'required|string',
        ]);

        $revoked = $this->tokenService->revokeRefreshToken($request->refresh_token);

        if (!$revoked) {
            return $this->errorResponse('Invalid refresh token', 400, null, 'INVALID_TOKEN');
        }

        return $this->successResponse(null, 'Token revoked successfully');
    }

    /**
     * @OA\Post(
     *     path="/api/auth/revoke-all",
     *     summary="Revoke all tokens for current user",
     *     tags={"Authentication"},
     *     security={{"sanctum": {}}},
     *     @OA\Response(
     *         response=200,
     *         description="All tokens revoked successfully"
     *     ),
     *     @OA\Response(response=401, description="Unauthenticated")
     * )
     */
    public function revokeAll(Request $request)
    {
        $this->tokenService->revokeAllTokens($request->user());

        return $this->successResponse(null, 'All tokens revoked successfully');
    }
}

