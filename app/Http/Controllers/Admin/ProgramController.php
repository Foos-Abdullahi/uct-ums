<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Program;
use App\Models\Student;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProgramController extends Controller
{
    /**
     * Display a listing of academic programs with statistics and filters.
     */
    public function index(Request $request): Response
    {
        $search = $request->query('search');
        $faculty = $request->query('faculty');
        $degreeLevel = $request->query('degree_level');
        $status = $request->query('status');
        $perPage = (int) $request->query('per_page', 10);

        $query = Program::query()
            ->withCount(['students', 'courses'])
            ->when($search, fn ($q) => $q->search($search))
            ->when($faculty && $faculty !== 'all', fn ($q) => $q->where('faculty', $faculty))
            ->when($degreeLevel && $degreeLevel !== 'all', fn ($q) => $q->where('degree_level', $degreeLevel))
            ->when($status && $status !== 'all', fn ($q) => $q->where('status', $status))
            ->orderBy('name');

        $faculties = Program::query()
            ->whereNotNull('faculty')
            ->distinct()
            ->pluck('faculty');

        return Inertia::render('Admin/programs/index', [
            'stats' => Inertia::defer(fn () => [
                'total_programs' => Program::count(),
                'active_programs' => Program::where('status', 'active')->count(),
                'total_students' => Student::count(),
                'total_courses' => Course::count(),
                'faculties_count' => Program::distinct('faculty')->count('faculty'),
            ]),
            'programs' => Inertia::defer(fn () => $query->paginate($perPage)->withQueryString()),
            'faculties' => $faculties,
            'filters' => [
                'search' => $search ?? '',
                'faculty' => $faculty ?? 'all',
                'degree_level' => $degreeLevel ?? 'all',
                'status' => $status ?? 'all',
                'per_page' => $perPage,
            ],
        ]);
    }

    /**
     * Show the form for creating a new program.
     */
    public function create(): Response
    {
        $faculties = Program::query()
            ->whereNotNull('faculty')
            ->distinct()
            ->pluck('faculty');

        $departments = Program::query()
            ->whereNotNull('department')
            ->distinct()
            ->pluck('department');

        return Inertia::render('Admin/programs/create', [
            'faculties' => $faculties,
            'departments' => $departments,
        ]);
    }

    /**
     * Store a newly created program in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:50', 'unique:programs,code'],
            'degree_level' => ['required', 'string', 'in:bachelor,master,doctorate,diploma,certificate'],
            'duration_semesters' => ['required', 'integer', 'min:1', 'max:16'],
            'total_credits' => ['required', 'integer', 'min:1', 'max:300'],
            'department' => ['nullable', 'string', 'max:255'],
            'faculty' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', 'string', 'in:active,inactive,archived'],
            'description' => ['nullable', 'string', 'max:2000'],
        ]);

        $program = Program::create([
            ...$validated,
            'status' => $validated['status'] ?? 'active',
        ]);

        return redirect()->route('admin.programs.show', $program)
            ->with('success', 'Academic program created successfully.');
    }

    /**
     * Display the specified program.
     */
    public function show(Program $program): Response
    {
        $program->loadCount(['students', 'courses', 'admissions']);
        $program->load(['courses' => fn ($q) => $q->orderBy('semester')->orderBy('code')]);

        return Inertia::render('Admin/programs/show', [
            'program' => $program,
        ]);
    }

    /**
     * Show the form for editing the specified program.
     */
    public function edit(Program $program): Response
    {
        $faculties = Program::query()
            ->whereNotNull('faculty')
            ->distinct()
            ->pluck('faculty');

        $departments = Program::query()
            ->whereNotNull('department')
            ->distinct()
            ->pluck('department');

        return Inertia::render('Admin/programs/edit', [
            'program' => $program,
            'faculties' => $faculties,
            'departments' => $departments,
        ]);
    }

    /**
     * Update the specified program in storage.
     */
    public function update(Request $request, Program $program): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:50', 'unique:programs,code,'.$program->id],
            'degree_level' => ['required', 'string', 'in:bachelor,master,doctorate,diploma,certificate'],
            'duration_semesters' => ['required', 'integer', 'min:1', 'max:16'],
            'total_credits' => ['required', 'integer', 'min:1', 'max:300'],
            'department' => ['nullable', 'string', 'max:255'],
            'faculty' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', 'string', 'in:active,inactive,archived'],
            'description' => ['nullable', 'string', 'max:2000'],
        ]);

        $program->update($validated);

        return redirect()->route('admin.programs.show', $program)
            ->with('success', 'Academic program updated successfully.');
    }

    /**
     * Remove the specified program from storage.
     */
    public function destroy(Program $program): RedirectResponse
    {
        $studentsCount = $program->students()->count();

        if ($studentsCount > 0) {
            return back()->with('error', "Cannot delete program. It has {$studentsCount} enrolled student(s).");
        }

        $program->delete();

        return redirect()->route('admin.programs.index')
            ->with('success', 'Academic program deleted successfully.');
    }

    /**
     * Toggle program active status.
     */
    public function toggleStatus(Program $program): RedirectResponse
    {
        $newStatus = $program->status === 'active' ? 'inactive' : 'active';
        $program->update(['status' => $newStatus]);

        return back()->with('success', "Program status changed to {$newStatus}.");
    }
}
