<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\Student;
use Illuminate\Http\Request;

abstract class StudentBaseController extends Controller
{
    /**
     * Get the student record for the authenticated user.
     */
    protected function getStudent(Request $request): Student
    {
        $user = $request->user();

        if (! $user) {
            abort(401);
        }

        $student = $user->student;

        if (! $student) {
            abort(403, 'No student record is linked to this account.');
        }

        return $student;
    }
}
