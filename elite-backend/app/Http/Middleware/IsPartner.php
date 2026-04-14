<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class IsPartner
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || $user->role !== 'partner') {
            return response()->json([
                'message' => 'Forbidden. Partner access required.',
            ], 403);
        }

        if ($user->account_status !== 'active') {
            return response()->json([
                'message' => 'Your partner account is pending approval or inactive.',
            ], 403);
        }

        return $next($request);
    }
}
