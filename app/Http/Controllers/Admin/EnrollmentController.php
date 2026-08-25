<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Program;
use App\Models\Student;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EnrollmentController extends Controller
{
    /**
     * Display student enrollment directory with filters and statistics.
     */
    public function index(Request $request): Response
    {
        $search = $request->query('search');
        $programId = $request->query('program_id');
        $status = $request->query('status');
        $semester = $request->query('semester');
        $feeStatus = $request->query('fee_status');
        $perPage = (int) $request->query('per_page', 10);

        $query = Student::query()
            ->with(['user', 'program'])
            ->when($search, function ($q) use ($search) {
                $q->where(function ($sub) use ($search) {
                    $sub->where('matric_no', 'like', "%{$search}%")
                        ->orWhereHas('user', fn ($u) => $u->where('name', 'like', "%{$search}%")->orWhere('email', 'like', "%{$search}%"));
                });
            })
            ->when($programId && $programId !== 'all', fn ($q) => $q->where('program_id', $programId))
            ->when($status && $status !== 'all', fn ($q) => $q->where('enrollment_status', $status))
            ->when($semester && $semester !== 'all', fn ($q) => $q->where('current_semester', (int) $semester))
            ->when($feeStatus && $feeStatus !== 'all', fn ($q) => $q->where('fee_status', $feeStatus))
            ->latest('enrollment_date');

        $programs = Program::query()->orderBy('name')->get(['id', 'name', 'code']);

        return Inertia::render('Admin/enrollments/index', [
            'stats' => Inertia::defer(fn () => [
                'total_enrolled' => Student::count(),
                'active_students' => Student::where('enrollment_status', 'enrolled')->count(),
                'pending_enrollments' => Student::where('enrollment_status', 'pending')->count(),
                'graduated_students' => Student::where('enrollment_status', 'graduated')->count(),
                'suspended_students' => Student::where('enrollment_status', 'suspended')->count(),
            ]),
            'enrollments' => Inertia::defer(fn () => $query->paginate($perPage)->withQueryString()),
            'programs' => $programs,
            'filters' => [
                'search' => $search ?? '',
                'program_id' => $programId ?? 'all',
                'status' => $status ?? 'all',
                'semester' => $semester ?? 'all',
                'fee_status' => $feeStatus ?? 'all',
                'per_page' => $perPage,
            ],
        ]);
    }

    /**
     * Update student enrollment status.
     */
    public function updateStatus(Request $request, Student $student): RedirectResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'string', 'in:enrolled,pending,suspended,graduated,withdrawn'],
        ]);

        $student->update(['enrollment_status' => $validated['status']]);

        return back()->with('success', "Enrollment status updated to {$validated['status']}.");
    }
}
