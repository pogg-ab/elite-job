<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class IsAdmin
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        // Allow only superadmin and staff for admin panel routes.
        if (! $user || ! in_array($user->role, ['superadmin', 'staff'], true)) {
            return response()->json([
                'message' => 'Forbidden. Admin access required.',
            ], 403);
        }

        // staff accounts must be active
        if ($user->role === 'staff' && $user->account_status !== 'active') {
            return response()->json([
                'message' => 'Your admin account is pending approval or inactive.',
            ], 403);
        }

        return $next($request);
    }
}
