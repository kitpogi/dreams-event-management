<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware for role-based access control.
 * 
 * Usage in routes:
 * - Route::get('/admin/...', ...)->middleware('role:admin');
 * - Route::get('/staff/...', ...)->middleware('role:admin,coordinator');
 */
class CheckRole
{
    /**
     * Handle an incoming request.
     *
     * @param Request $request
     * @param Closure $next
     * @param string ...$roles Allowed roles (comma-separated or multiple params)
     * @return Response
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Authentication required.',
                'error_code' => 'UNAUTHENTICATED',
            ], 401);
        }

        // Flatten comma-separated roles
        $allowedRoles = [];
        foreach ($roles as $roleGroup) {
            $allowedRoles = array_merge($allowedRoles, array_map('trim', explode(',', $roleGroup)));
        }

        $userRole = $user->role ?? 'client';

        if (!in_array($userRole, $allowedRoles)) {
            return response()->json([
                'success' => false,
                'message' => 'You do not have the required role to access this resource.',
                'error_code' => 'FORBIDDEN',
                'required_roles' => $allowedRoles,
            ], 403);
        }

        return $next($request);
    }
}
