<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

/**
 * Session-based auth check for the JSON API layer.
 *
 * The existing Laravel ESS authentication stores the logged-in user inside
 * `session('authUser')` (see App\Http\Controllers\Auth\AuthenticatedSessionController).
 * Because our JSON consumers (the React Self-Service Portal, Postman, etc.)
 * cannot follow HTML redirects, we return a 401 JSON response instead of
 * the redirect that the regular `isAuth` middleware performs.
 */
class EssApiAuth
{
    public function handle(Request $request, Closure $next)
    {
        if (!$request->session()->has('authUser')) {
            return response()->json([
                'message' => 'Unauthenticated.',
                'code'    => 'UNAUTHENTICATED',
            ], 401);
        }

        return $next($request);
    }
}
