<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Mail\PasswordResetMail;
use App\Mail\EmailVerificationMail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Password;
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
    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'phone' => 'nullable|string|max:20',
        ]);

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
        
        // Store verification token (we'll use the same password_reset_tokens table structure)
        // Or create a separate table - for simplicity, using a signed URL approach
        // Store in a temporary way - using signed URLs with expiration
        
        // Send verification email
        try {
            Mail::to($user->email)->send(new EmailVerificationMail($user, $verificationToken));
        } catch (\Exception $e) {
            Log::error('Failed to send email verification: ' . $e->getMessage());
            // Don't fail registration if email fails, but log it
        }

        // Store verification token in database (using password_reset_tokens table with a prefix)
        DB::table('password_reset_tokens')->insert([
            'email' => $user->email,
            'token' => Hash::make($verificationToken),
            'created_at' => Carbon::now(),
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => $user,
            'message' => 'Registration successful! Please check your email to verify your account.',
        ], 201);
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
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => $user,
        ]);
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
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out successfully']);
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
        return response()->json($request->user());
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
            return response()->json([
                'message' => 'Unauthorized. Only admins can create coordinators.'
            ], 403);
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'phone' => 'nullable|string|max:20',
        ]);

        $coordinator = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'phone' => $request->phone,
            'role' => 'coordinator',
        ]);

        return response()->json([
            'message' => 'Coordinator created successfully',
            'data' => $coordinator,
        ], 201);
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

            $token = $user->createToken('auth_token')->plainTextToken;

            return response()->json([
                'token' => $token,
                'user' => $user,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to authenticate with Google',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Login or register with Facebook OAuth
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

            $token = $user->createToken('auth_token')->plainTextToken;

            return response()->json([
                'token' => $token,
                'user' => $user,
            ]);
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
            return response()->json([
                'message' => 'If that email address exists in our system, we will send a password reset link.'
            ], 200);
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
            return response()->json([
                'message' => 'Failed to send password reset email. Please try again later.'
            ], 500);
        }

        return response()->json([
            'message' => 'If that email address exists in our system, we will send a password reset link.'
        ], 200);
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
    public function resetPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:users,email',
            'token' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);

        // Find the password reset record
        $resetRecord = DB::table('password_reset_tokens')
            ->where('email', $request->email)
            ->first();

        if (!$resetRecord) {
            return response()->json([
                'message' => 'Invalid or expired reset token.'
            ], 400);
        }

        // Check if token is valid (60 minutes expiry)
        $createdAt = Carbon::parse($resetRecord->created_at);
        if ($createdAt->addMinutes(60)->isPast()) {
            DB::table('password_reset_tokens')->where('email', $request->email)->delete();
            return response()->json([
                'message' => 'This password reset token has expired. Please request a new one.'
            ], 400);
        }

        // Verify token
        if (!Hash::check($request->token, $resetRecord->token)) {
            return response()->json([
                'message' => 'Invalid reset token.'
            ], 400);
        }

        // Update user password
        $user = User::where('email', $request->email)->first();
        $user->password = Hash::make($request->password);
        $user->save();

        // Delete the reset token
        DB::table('password_reset_tokens')->where('email', $request->email)->delete();

        return response()->json([
            'message' => 'Password has been reset successfully. You can now login with your new password.'
        ], 200);
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
            return response()->json([
                'message' => 'User not found.'
            ], 404);
        }

        // Check if already verified
        if ($user->email_verified_at) {
            return response()->json([
                'message' => 'Email address is already verified.'
            ], 400);
        }

        // Find the verification token (stored in password_reset_tokens table)
        $tokenRecord = DB::table('password_reset_tokens')
            ->where('email', $request->email)
            ->first();

        if (!$tokenRecord) {
            return response()->json([
                'message' => 'Invalid or expired verification token.'
            ], 400);
        }

        // Check if token is valid (24 hours expiry)
        $createdAt = Carbon::parse($tokenRecord->created_at);
        if ($createdAt->addHours(24)->isPast()) {
            DB::table('password_reset_tokens')->where('email', $request->email)->delete();
            return response()->json([
                'message' => 'This verification token has expired. Please request a new verification email.'
            ], 400);
        }

        // Verify token
        if (!Hash::check($request->token, $tokenRecord->token)) {
            return response()->json([
                'message' => 'Invalid verification token.'
            ], 400);
        }

        // Mark email as verified
        $user->email_verified_at = Carbon::now();
        $user->save();

        // Delete the verification token
        DB::table('password_reset_tokens')->where('email', $request->email)->delete();

        return response()->json([
            'message' => 'Email address has been verified successfully!'
        ], 200);
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
            return response()->json([
                'message' => 'If that email address exists in our system and is not verified, we will send a verification link.'
            ], 200);
        }

        // Check if already verified
        if ($user->email_verified_at) {
            return response()->json([
                'message' => 'Email address is already verified.'
            ], 400);
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
            return response()->json([
                'message' => 'Failed to send verification email. Please try again later.'
            ], 500);
        }

        return response()->json([
            'message' => 'If that email address exists in our system and is not verified, we will send a verification link.'
        ], 200);
    }
}

