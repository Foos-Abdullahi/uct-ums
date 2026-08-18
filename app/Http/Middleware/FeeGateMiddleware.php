<?php

namespace App\Http\Middleware;

use App\Enums\UserRole;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class FeeGateMiddleware
{
    /**
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || $user->role !== UserRole::Student) {
            return $next($request);
        }

        $student = $user->student;

        if (! $student || ! $student->fee_status->blocksAccess()) {
            return $next($request);
        }

        $allowedRoutes = [
            'student.fees.locked',
            'student.fees.index',
            'profile.edit',
            'logout',
        ];

        if ($request->routeIs(...$allowedRoutes)) {
            return $next($request);
        }

        return redirect()->route('student.fees.locked');
    }
}
