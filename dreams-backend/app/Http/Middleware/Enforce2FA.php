<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Auth;

/**
 * Middleware for enforcing 2FA on protected routes
 */
class Enforce2FA
{
    /**
     * Routes that should be excluded from 2FA check
     */
    private array $excludedRoutes = [
        'api/auth/login',
        'api/auth/logout',
        'api/auth/2fa/verify',
        'api/auth/2fa/setup',
    ];

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Skip if user is not authenticated
        if (!Auth::check()) {
            return $next($request);
        }

        $user = Auth::user();

        // Skip if 2FA is not enabled for this user
        if (!$user->two_factor_enabled) {
            return $next($request);
        }

        // Skip if route is excluded
        if ($this->isExcludedRoute($request)) {
            return $next($request);
        }

        // Check if 2FA has been verified in this session
        if (!session('2fa_verified')) {
            return response()->json([
                'success' => false,
                'message' => '2FA verification required',
                'errors' => ['2fa_required' => 'Two-factor authentication verification is required'],
            ], 403);
        }

        return $next($request);
    }

    /**
     * Check if route is excluded from 2FA
     */
    private function isExcludedRoute(Request $request): bool
    {
        foreach ($this->excludedRoutes as $route) {
            if ($request->is($route)) {
                return true;
            }
        }

        return false;
    }
}
