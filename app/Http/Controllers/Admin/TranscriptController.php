<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Program;
use App\Models\Student;
use App\Models\StudentCertificate;
use App\Models\StudentGrade;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TranscriptController extends Controller
{
    /**
     * Display student transcripts directory with GPA, credits, and grade statistics.
     */
    public function index(Request $request): Response
    {
        $search = $request->query('search');
        $programId = $request->query('program_id');
        $perPage = (int) $request->query('per_page', 10);

        $query = Student::query()
            ->with(['user', 'program', 'grades', 'certificates'])
            ->withCount(['grades', 'certificates'])
            ->when($search, function ($q) use ($search) {
                $q->where(function ($sub) use ($search) {
                    $sub->where('matric_no', 'like', "%{$search}%")
                        ->orWhereHas('user', fn ($u) => $u->where('name', 'like', "%{$search}%")->orWhere('email', 'like', "%{$search}%"));
                });
            })
            ->when($programId && $programId !== 'all', fn ($q) => $q->where('program_id', $programId))
            ->orderByDesc('gpa');

        $programs = Program::query()->orderBy('name')->get(['id', 'name', 'code']);

        return Inertia::render('Admin/transcripts/index', [
            'stats' => Inertia::defer(fn () => [
                'total_students' => Student::count(),
                'avg_institution_gpa' => round((float) StudentGrade::whereNotNull('grade_point')->avg('grade_point'), 2),
                'total_grades_recorded' => StudentGrade::count(),
                'certificates_issued' => StudentCertificate::count(),
            ]),
            'transcripts' => Inertia::defer(fn () => $query->paginate($perPage)->withQueryString()),
            'programs' => $programs,
            'filters' => [
                'search' => $search ?? '',
                'program_id' => $programId ?? 'all',
                'per_page' => $perPage,
            ],
        ]);
    }
}
