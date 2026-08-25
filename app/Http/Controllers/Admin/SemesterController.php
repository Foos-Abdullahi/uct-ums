<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\CourseAssignment;
use App\Models\Program;
use App\Models\Student;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SemesterController extends Controller
{
    /**
     * Display semester progression, cohorts, course schedules, and academic session distribution.
     */
    public function index(Request $request): Response
    {
        $programId = $request->query('program_id');

        // Aggregate data for Semesters 1 through 8
        $semesters = collect(range(1, 8))->map(function (int $semNumber) use ($programId) {
            $coursesQuery = Course::query()->where('semester', $semNumber);
            $studentsQuery = Student::query()->where('current_semester', $semNumber);

            if ($programId && $programId !== 'all') {
                $coursesQuery->where('program_id', $programId);
                $studentsQuery->where('program_id', $programId);
            }

            $courses = $coursesQuery->with('program')->get(['id', 'code', 'name', 'credit_hours', 'program_id', 'status']);
            $studentsCount = $studentsQuery->count();
            $totalCredits = $courses->sum('credit_hours');

            return [
                'semester_number' => $semNumber,
                'name' => "Semester {$semNumber}",
                'level' => $semNumber <= 2 ? 'Year 1' : ($semNumber <= 4 ? 'Year 2' : ($semNumber <= 6 ? 'Year 3' : 'Year 4')),
                'courses_count' => $courses->count(),
                'students_count' => $studentsCount,
                'total_credits' => $totalCredits,
                'courses' => $courses,
            ];
        });

        $programs = Program::query()->orderBy('name')->get(['id', 'name', 'code']);

        return Inertia::render('Admin/semesters/index', [
            'stats' => Inertia::defer(fn () => [
                'total_semesters' => 8,
                'active_cohorts' => Student::distinct('current_semester')->count('current_semester'),
                'total_courses_offered' => Course::where('status', 'active')->count(),
                'total_enrolled_students' => Student::where('enrollment_status', 'enrolled')->count(),
            ]),
            'semesters' => $semesters,
            'programs' => $programs,
            'filters' => [
                'program_id' => $programId ?? 'all',
            ],
        ]);
    }
}
