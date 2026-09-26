<?php

namespace App\Http\Controllers\Lecturer;

use App\Http\Controllers\Controller;
use App\Models\Lecturer;
use Illuminate\Http\Request;

abstract class LecturerBaseController extends Controller
{
    /**
     * Get or create the lecturer record for the authenticated user.
     */
    protected function getLecturer(Request $request): Lecturer
    {
        $user = $request->user();

        if (! $user) {
            abort(401);
        }

        $lecturer = $user->lecturer;

        if (! $lecturer) {
            $lecturer = Lecturer::query()->firstOrCreate(
                ['user_id' => $user->id],
                [
                    'lecturer_no' => 'LEC-'.str_pad((string) $user->id, 5, '0', STR_PAD_LEFT),
                    'department' => 'Academic Affairs',
                    'designation' => 'Lecturer',
                    'employment_status' => 'active',
                    'contract_type' => 'full_time',
                ]
            );
        }

        return $lecturer;
    }
}
