<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\CourseAssignment;
use App\Models\Program;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CourseController extends Controller
{
    /**
     * Display a listing of courses with filters and deferred stats.
     */
    public function index(Request $request): Response
    {
        $search = $request->query('search');
        $programId = $request->query('program_id');
        $semester = $request->query('semester');
        $status = $request->query('status');
        $level = $request->query('level');
        $perPage = (int) $request->query('per_page', 10);

        $query = Course::query()
            ->with(['program'])
            ->withCount('assignments')
            ->when($search, fn ($q) => $q->search($search))
            ->when($programId && $programId !== 'all', fn ($q) => $q->where('program_id', $programId))
            ->when($semester && $semester !== 'all', fn ($q) => $q->where('semester', (int) $semester))
            ->when($status && $status !== 'all', fn ($q) => $q->where('status', $status))
            ->when($level && $level !== 'all', fn ($q) => $q->where('level', $level))
            ->orderBy('code');

        $programs = Program::query()->orderBy('name')->get(['id', 'name', 'code']);

        return Inertia::render('Admin/courses/index', [
            'stats' => Inertia::defer(fn () => [
                'total_courses' => Course::count(),
                'active_courses' => Course::where('status', 'active')->count(),
                'total_assignments' => CourseAssignment::count(),
                'total_credits' => Course::sum('credit_hours'),
            ]),
            'courses' => Inertia::defer(fn () => $query->paginate($perPage)->withQueryString()),
            'programs' => $programs,
            'filters' => [
                'search' => $search ?? '',
                'program_id' => $programId ?? 'all',
                'semester' => $semester ?? 'all',
                'status' => $status ?? 'all',
                'level' => $level ?? 'all',
                'per_page' => $perPage,
            ],
        ]);
    }

    /**
     * Show the form for creating a new course.
     */
    public function create(): Response
    {
        $programs = Program::query()->where('status', 'active')->orderBy('name')->get(['id', 'name', 'code']);

        return Inertia::render('Admin/courses/create', [
            'programs' => $programs,
        ]);
    }

    /**
     * Store a newly created course.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'program_id' => ['required', 'exists:programs,id'],
            'code' => ['required', 'string', 'max:50', 'unique:courses,code'],
            'name' => ['required', 'string', 'max:255'],
            'credit_hours' => ['required', 'integer', 'min:1', 'max:10'],
            'semester' => ['required', 'integer', 'min:1', 'max:16'],
            'level' => ['required', 'string', 'in:undergraduate,postgraduate,doctorate,diploma'],
            'status' => ['nullable', 'string', 'in:active,inactive,archived'],
            'description' => ['nullable', 'string', 'max:2000'],
        ]);

        $course = Course::create([
            ...$validated,
            'status' => $validated['status'] ?? 'active',
        ]);

        return redirect()->route('admin.courses.show', $course)
            ->with('success', 'Course created successfully.');
    }

    /**
     * Display the specified course.
     */
    public function show(Course $course): Response
    {
        $course->load(['program', 'assignments.lecturer.user']);
        $course->loadCount('assignments');

        return Inertia::render('Admin/courses/show', [
            'course' => $course,
        ]);
    }

    /**
     * Show the form for editing the course.
     */
    public function edit(Course $course): Response
    {
        $programs = Program::query()->where('status', 'active')->orderBy('name')->get(['id', 'name', 'code']);

        return Inertia::render('Admin/courses/edit', [
            'course' => $course,
            'programs' => $programs,
        ]);
    }

    /**
     * Update the specified course.
     */
    public function update(Request $request, Course $course): RedirectResponse
    {
        $validated = $request->validate([
            'program_id' => ['required', 'exists:programs,id'],
            'code' => ['required', 'string', 'max:50', 'unique:courses,code,'.$course->id],
            'name' => ['required', 'string', 'max:255'],
            'credit_hours' => ['required', 'integer', 'min:1', 'max:10'],
            'semester' => ['required', 'integer', 'min:1', 'max:16'],
            'level' => ['required', 'string', 'in:undergraduate,postgraduate,doctorate,diploma'],
            'status' => ['nullable', 'string', 'in:active,inactive,archived'],
            'description' => ['nullable', 'string', 'max:2000'],
        ]);

        $course->update($validated);

        return redirect()->route('admin.courses.show', $course)
            ->with('success', 'Course updated successfully.');
    }

    /**
     * Remove the specified course.
     */
    public function destroy(Course $course): RedirectResponse
    {
        $course->delete();

        return redirect()->route('admin.courses.index')
            ->with('success', 'Course deleted successfully.');
    }

    /**
     * Toggle course status.
     */
    public function toggleStatus(Course $course): RedirectResponse
    {
        $newStatus = $course->status === 'active' ? 'inactive' : 'active';
        $course->update(['status' => $newStatus]);

        return back()->with('success', "Course status updated to {$newStatus}.");
    }
}
