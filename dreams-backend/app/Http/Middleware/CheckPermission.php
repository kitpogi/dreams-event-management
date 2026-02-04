<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Services\PermissionCacheService;

/**
 * Middleware for granular permission checking.
 * 
 * Usage in routes:
 * - Route::get('/admin/users', ...)->middleware('permission:users.view');
 * - Route::post('/admin/users', ...)->middleware('permission:users.create');
 * - Route::middleware(['permission:bookings.manage,bookings.view'])->group(...); // OR logic
 */
class CheckPermission
{
    protected PermissionCacheService $permissionCache;

    public function __construct(PermissionCacheService $permissionCache)
    {
        $this->permissionCache = $permissionCache;
    }

    /**
     * Handle an incoming request.
     *
     * @param Request $request
     * @param Closure $next
     * @param string ...$permissions Permissions to check (comma-separated = OR, multiple params = AND)
     * @return Response
     */
    public function handle(Request $request, Closure $next, string ...$permissions): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Authentication required.',
                'error_code' => 'UNAUTHENTICATED',
            ], 401);
        }

        // Admin users have all permissions
        if ($this->permissionCache->isAdmin($user)) {
            return $next($request);
        }

        // Check if user has any of the required permissions
        foreach ($permissions as $permissionGroup) {
            // Comma-separated permissions use OR logic
            $permissionList = array_map('trim', explode(',', $permissionGroup));
            
            $hasPermission = false;
            foreach ($permissionList as $permission) {
                if ($this->userHasPermission($user, $permission)) {
                    $hasPermission = true;
                    break;
                }
            }

            // All permission groups must pass (AND logic between groups)
            if (!$hasPermission) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to perform this action.',
                    'error_code' => 'FORBIDDEN',
                    'required_permission' => $permissionGroup,
                ], 403);
            }
        }

        return $next($request);
    }

    /**
     * Check if user has a specific permission.
     *
     * @param mixed $user
     * @param string $permission
     * @return bool
     */
    protected function userHasPermission($user, string $permission): bool
    {
        // Parse permission format: resource.action (e.g., bookings.view, users.create)
        [$resource, $action] = array_pad(explode('.', $permission, 2), 2, '*');

        // Check cached permission
        $cacheKey = "permission:{$user->id}:{$permission}";
        
        return $this->permissionCache->getCachedAuthorization($user, $permission, function () use ($user, $resource, $action) {
            return $this->evaluatePermission($user, $resource, $action);
        });
    }

    /**
     * Evaluate permission based on user role and permission rules.
     *
     * @param mixed $user
     * @param string $resource
     * @param string $action
     * @return bool
     */
    protected function evaluatePermission($user, string $resource, string $action): bool
    {
        $role = $user->role ?? 'client';

        // Define permission matrix
        $permissions = $this->getPermissionMatrix();

        // Check if role has the specific permission
        if (isset($permissions[$role][$resource])) {
            $allowedActions = $permissions[$role][$resource];
            
            if ($allowedActions === '*' || $allowedActions === true) {
                return true;
            }

            if (is_array($allowedActions)) {
                return in_array($action, $allowedActions) || in_array('*', $allowedActions);
            }
        }

        // Check wildcard permissions
        if (isset($permissions[$role]['*'])) {
            return $permissions[$role]['*'] === true;
        }

        return false;
    }

    /**
     * Get the permission matrix defining what each role can do.
     *
     * @return array
     */
    protected function getPermissionMatrix(): array
    {
        return [
            'admin' => [
                '*' => true, // Admin has all permissions
            ],
            'coordinator' => [
                'bookings' => ['view', 'update', 'manage'],
                'packages' => ['view'],
                'clients' => ['view'],
                'reviews' => ['view'],
                'calendar' => ['view', 'manage'],
                'reports' => ['view'],
                'contacts' => ['view', 'reply'],
            ],
            'client' => [
                'bookings' => ['view', 'create'], // Own bookings only (enforced by policies)
                'packages' => ['view'],
                'reviews' => ['view', 'create'], // Own reviews only
                'payments' => ['view', 'create'], // Own payments only
                'profile' => ['view', 'update'],
            ],
        ];
    }
}
