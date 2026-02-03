<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Services\Auth\PermissionCache;
use Illuminate\Support\Facades\Auth;

/**
 * Middleware for caching permission checks
 */
class CachePermissions
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // If user is not authenticated, skip caching
        if (!Auth::check()) {
            return $next($request);
        }

        // Store user ID and permission cache in request for easy access
        $request->attributes->set('permission_cache', PermissionCache::class);

        return $next($request);
    }
}
