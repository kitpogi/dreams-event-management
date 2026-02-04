<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Services\PasswordPolicyService;

/**
 * Middleware to check if user's password has expired.
 * 
 * Blocks access to protected routes until password is changed.
 * Allows access to password change and logout endpoints.
 */
class CheckPasswordExpired
{
    protected PasswordPolicyService $passwordPolicy;

    /**
     * Routes that are allowed even with expired password.
     */
    protected array $allowedRoutes = [
        'api/auth/change-password',
        'api/auth/logout',
        'api/auth/password-status',
    ];

    public function __construct(PasswordPolicyService $passwordPolicy)
    {
        $this->passwordPolicy = $passwordPolicy;
    }

    /**
     * Handle an incoming request.
     *
     * @param Request $request
     * @param Closure $next
     * @return Response
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            return $next($request);
        }

        // Check if current route is allowed
        $currentPath = $request->path();
        foreach ($this->allowedRoutes as $allowed) {
            if (str_starts_with($currentPath, $allowed)) {
                return $next($request);
            }
        }

        // Check if password has expired
        if ($this->passwordPolicy->isPasswordExpired($user) || $user->password_expired) {
            return response()->json([
                'success' => false,
                'message' => 'Your password has expired. Please change your password to continue.',
                'error_code' => 'PASSWORD_EXPIRED',
                'password_status' => $this->passwordPolicy->getPasswordStatus($user),
            ], 403);
        }

        // Add password warning header if applicable
        $response = $next($request);

        if ($this->passwordPolicy->shouldShowExpirationWarning($user)) {
            $daysRemaining = $this->passwordPolicy->getDaysUntilExpiration($user);
            $response->headers->set('X-Password-Expires-In-Days', (string) $daysRemaining);
            $response->headers->set('X-Password-Warning', 'true');
        }

        return $response;
    }
}
