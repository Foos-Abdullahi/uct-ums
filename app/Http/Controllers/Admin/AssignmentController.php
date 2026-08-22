<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\CourseAssignment;
use App\Models\Lecturer;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AssignmentController extends Controller
{
    /**
     * Display a listing of course assignments with deferred stats and pagination.
     */
    public function index(Request $request): Response
    {
        $perPage = (int) $request->input('per_page', 10);
        if ($perPage <= 0 || $perPage > 100) {
            $perPage = 10;
        }

        $search = $request->input('search');
        $academicYear = $request->input('academic_year');
        $semester = $request->input('semester');
        $role = $request->input('role');
        $status = $request->input('status');
        $department = $request->input('department');

        $query = CourseAssignment::query()
            ->with(['lecturer.user', 'course.program'])
            ->search($search)
            ->filterAcademicYear($academicYear)
            ->filterSemester($semester)
            ->filterRole($role)
            ->filterStatus($status)
            ->filterDepartment($department)
            ->latest('id');

        $courses = Course::query()
            ->active()
            ->select('id', 'code', 'name')
            ->orderBy('code')
            ->get();

        $departments = Lecturer::query()
            ->whereNotNull('department')
            ->distinct()
            ->pluck('department');

        return Inertia::render('Admin/assignments/index', [
            'stats' => Inertia::defer(fn () => [
                'total_assignments' => CourseAssignment::count(),
                'active_assignments' => CourseAssignment::where('status', 'active')->count(),
                'lecturers_assigned' => CourseAssignment::distinct('lecturer_id')->count('lecturer_id'),
                'courses_covered' => CourseAssignment::distinct('course_id')->count('course_id'),
                'total_workload_hours' => (int) CourseAssignment::where('status', 'active')->sum('workload_hours'),
            ]),
            'assignments' => Inertia::defer(fn () => $query->paginate($perPage)->withQueryString()),
            'courses' => $courses,
            'departments' => $departments,
            'filters' => [
                'search' => $search ?? '',
                'academic_year' => $academicYear ?? 'all',
                'semester' => $semester ?? 'all',
                'role' => $role ?? 'all',
                'status' => $status ?? 'all',
                'department' => $department ?? 'all',
                'per_page' => $perPage,
            ],
        ]);
    }

    /**
     * Show form to assign a course to a lecturer.
     */
    public function create(): Response
    {
        $lecturers = Lecturer::query()
            ->with('user:id,name,email')
            ->where('employment_status', 'active')
            ->get()
            ->map(fn ($lec) => [
                'id' => $lec->id,
                'name' => $lec->user->name ?? 'Unknown',
                'lecturer_no' => $lec->lecturer_no,
                'department' => $lec->department,
                'designation' => $lec->designation,
            ]);

        $courses = Course::query()
            ->active()
            ->with('program:id,name')
            ->orderBy('code')
            ->get();

        return Inertia::render('Admin/assignments/create', [
            'lecturers' => $lecturers,
            'courses' => $courses,
        ]);
    }

    /**
     * Store a newly created course assignment.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'lecturer_id' => ['required', 'exists:lecturers,id'],
            'course_id' => ['required', 'exists:courses,id'],
            'academic_year' => ['required', 'string', 'max:20'],
            'semester' => ['required', 'string', 'max:50'],
            'section' => ['required', 'string', 'max:50'],
            'role' => ['required', 'string', 'in:lead_lecturer,co_lecturer,assistant,lab_instructor'],
            'status' => ['nullable', 'string', 'in:assigned,active,completed,cancelled'],
            'workload_hours' => ['required', 'integer', 'min:1', 'max:30'],
            'room' => ['nullable', 'string', 'max:100'],
            'schedule_day' => ['nullable', 'string', 'max:50'],
            'schedule_time' => ['nullable', 'string', 'max:50'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $assignment = CourseAssignment::create([
            ...$validated,
            'status' => $validated['status'] ?? 'active',
        ]);

        return redirect()->route('admin.assignments.show', $assignment)
            ->with('success', 'Teaching course assignment created successfully.');
    }

    /**
     * Display assignment details.
     */
    public function show(CourseAssignment $assignment): Response
    {
        $assignment->load(['lecturer.user', 'course.program']);

        return Inertia::render('Admin/assignments/show', [
            'assignment' => $assignment,
        ]);
    }

    /**
     * Show form to edit a course assignment.
     */
    public function edit(CourseAssignment $assignment): Response
    {
        $assignment->load(['lecturer.user', 'course']);

        $lecturers = Lecturer::query()
            ->with('user:id,name,email')
            ->get()
            ->map(fn ($lec) => [
                'id' => $lec->id,
                'name' => $lec->user->name ?? 'Unknown',
                'lecturer_no' => $lec->lecturer_no,
                'department' => $lec->department,
                'designation' => $lec->designation,
            ]);

        $courses = Course::query()
            ->active()
            ->with('program:id,name')
            ->orderBy('code')
            ->get();

        return Inertia::render('Admin/assignments/edit', [
            'assignment' => $assignment,
            'lecturers' => $lecturers,
            'courses' => $courses,
        ]);
    }

    /**
     * Update an existing course assignment.
     */
    public function update(Request $request, CourseAssignment $assignment): RedirectResponse
    {
        $validated = $request->validate([
            'lecturer_id' => ['required', 'exists:lecturers,id'],
            'course_id' => ['required', 'exists:courses,id'],
            'academic_year' => ['required', 'string', 'max:20'],
            'semester' => ['required', 'string', 'max:50'],
            'section' => ['required', 'string', 'max:50'],
            'role' => ['required', 'string', 'in:lead_lecturer,co_lecturer,assistant,lab_instructor'],
            'status' => ['required', 'string', 'in:assigned,active,completed,cancelled'],
            'workload_hours' => ['required', 'integer', 'min:1', 'max:30'],
            'room' => ['nullable', 'string', 'max:100'],
            'schedule_day' => ['nullable', 'string', 'max:50'],
            'schedule_time' => ['nullable', 'string', 'max:50'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $assignment->update($validated);

        return redirect()->route('admin.assignments.show', $assignment)
            ->with('success', 'Assignment updated successfully.');
    }

    /**
     * Unassign / delete a course assignment.
     */
    public function destroy(CourseAssignment $assignment): RedirectResponse
    {
        $assignment->delete();

        return redirect()->route('admin.assignments.index')
            ->with('success', 'Course assignment removed successfully.');
    }

    /**
     * Update assignment status directly (e.g. mark completed / cancelled / active).
     */
    public function updateStatus(Request $request, CourseAssignment $assignment): RedirectResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'string', 'in:assigned,active,completed,cancelled'],
        ]);

        $assignment->update($validated);

        return back()->with('success', "Assignment status updated to {$validated['status']}.");
    }
}
