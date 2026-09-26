<?php

namespace App\Http\Controllers\Student;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class GradesController extends StudentBaseController
{
    /**
     * Display the student's grades grouped by semester.
     */
    public function index(Request $request): Response
    {
        $student = $this->getStudent($request);
        $student->load(['program']);

        $semesterFilter = $request->query('semester');

        $gradesQuery = $student->grades()->with('course');

        if ($semesterFilter && $semesterFilter !== 'all') {
            $gradesQuery->where('semester', (int) $semesterFilter);
        }

        $grades = $gradesQuery->orderBy('semester')->orderBy('course_name')->get();

        // Group by semester
        $bySemester = $grades->groupBy('semester')->map(function ($semGrades, $sem) {
            $completed = $semGrades->whereNotNull('grade_point')->where('credits', '>', 0);
            $totalCredits = $completed->sum('credits');
            $totalPoints = $completed->sum(fn ($g) => (float) $g->grade_point * (int) $g->credits);
            $semGpa = $totalCredits > 0 ? round($totalPoints / $totalCredits, 2) : null;

            return [
                'semester' => $sem,
                'gpa' => $semGpa,
                'grades' => $semGrades->values(),
            ];
        })->values();

        // Overall stats
        $allCompleted = $student->grades()->whereNotNull('grade_point')->where('credits', '>', 0)->get();
        $totalCredits = $allCompleted->sum('credits');
        $totalPoints = $allCompleted->sum(fn ($g) => (float) $g->grade_point * (int) $g->credits);
        $cgpa = $totalCredits > 0 ? round($totalPoints / $totalCredits, 2) : null;

        $availableSemesters = $student->grades()
            ->distinct()
            ->orderBy('semester')
            ->pluck('semester');

        return Inertia::render('Student/grades/index', [
            'student' => $student,
            'grades_by_semester' => $bySemester,
            'stats' => [
                'cgpa' => $cgpa ?? $student->gpa,
                'total_credits' => $totalCredits,
                'passed' => $allCompleted->where('status', 'passed')->count(),
                'failed' => $allCompleted->where('status', 'failed')->count(),
                'in_progress' => $student->grades()->where('status', 'in_progress')->count(),
            ],
            'available_semesters' => $availableSemesters,
            'filters' => [
                'semester' => $semesterFilter ?? 'all',
            ],
        ]);
    }
}
