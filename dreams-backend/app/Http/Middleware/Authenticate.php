<?php

namespace App\Http\Middleware;

use Illuminate\Auth\Middleware\Authenticate as Middleware;
use Illuminate\Http\Request;

class Authenticate extends Middleware
{
    protected function redirectTo(Request $request): ?string
    {
        // For API requests, return null (no redirect)
        // For web requests, you can add a login route if needed
        return $request->expectsJson() || $request->is('api/*') ? null : null;
    }
}

