<?php

namespace App\Http\Controllers\Admin;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\CourseAssignment;
use App\Models\Lecturer;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class LecturerController extends Controller
{
    /**
     * Display a listing of lecturers with deferred stats and pagination.
     */
    public function index(Request $request): Response
    {
        $perPage = (int) $request->input('per_page', 10);
        if ($perPage <= 0 || $perPage > 100) {
            $perPage = 10;
        }

        $search = $request->input('search');
        $department = $request->input('department');
        $faculty = $request->input('faculty');
        $employmentStatus = $request->input('employment_status');
        $contractType = $request->input('contract_type');

        $query = Lecturer::query()
            ->with(['user', 'courseAssignments.course'])
            ->search($search)
            ->filterDepartment($department)
            ->filterFaculty($faculty)
            ->filterEmploymentStatus($employmentStatus)
            ->filterContractType($contractType)
            ->latest('id');

        $departments = Lecturer::query()
            ->whereNotNull('department')
            ->distinct()
            ->pluck('department');

        $faculties = Lecturer::query()
            ->whereNotNull('faculty')
            ->distinct()
            ->pluck('faculty');

        return Inertia::render('Admin/lecturers/index', [
            'stats' => Inertia::defer(fn () => [
                'total_lecturers' => Lecturer::count(),
                'active_lecturers' => Lecturer::where('employment_status', 'active')->count(),
                'on_leave_lecturers' => Lecturer::where('employment_status', 'on_leave')->count(),
                'full_time_lecturers' => Lecturer::where('contract_type', 'full_time')->count(),
                'part_time_lecturers' => Lecturer::where('contract_type', 'part_time')->count(),
            ]),
            'lecturers' => Inertia::defer(fn () => $query->paginate($perPage)->withQueryString()),
            'departments' => $departments,
            'faculties' => $faculties,
            'filters' => [
                'search' => $search ?? '',
                'department' => $department ?? 'all',
                'faculty' => $faculty ?? 'all',
                'employment_status' => $employmentStatus ?? 'all',
                'contract_type' => $contractType ?? 'all',
                'per_page' => $perPage,
            ],
        ]);
    }

    /**
     * Show form to create a new lecturer.
     */
    public function create(): Response
    {
        return Inertia::render('Admin/lecturers/create', [
            'departments' => [
                'Software Engineering',
                'Computer Networks & Cyber Security',
                'Data Science & Artificial Intelligence',
                'Information Technology',
                'Multimedia & Animation',
            ],
            'faculties' => [
                'Faculty of Computing & Information Technology',
                'Faculty of Engineering',
            ],
            'designations' => [
                'Professor',
                'Associate Professor',
                'Senior Lecturer',
                'Lecturer',
                'Assistant Lecturer',
                'Lab Instructor',
            ],
        ]);
    }

    /**
     * Store a newly created lecturer.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['nullable', 'string', 'min:8'],
            'lecturer_no' => ['nullable', 'string', 'max:50', 'unique:lecturers,lecturer_no'],
            'department' => ['required', 'string', 'max:255'],
            'faculty' => ['nullable', 'string', 'max:255'],
            'designation' => ['required', 'string', 'max:100'],
            'qualification' => ['nullable', 'string', 'max:255'],
            'specialization' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
            'gender' => ['nullable', 'string', 'in:Male,Female,Other'],
            'date_of_birth' => ['nullable', 'date'],
            'address' => ['nullable', 'string', 'max:500'],
            'hire_date' => ['nullable', 'date'],
            'employment_status' => ['nullable', 'string', 'in:active,on_leave,sabbatical,terminated'],
            'contract_type' => ['nullable', 'string', 'in:full_time,part_time,adjunct,visiting'],
            'office_location' => ['nullable', 'string', 'max:255'],
            'bio' => ['nullable', 'string', 'max:2000'],
        ]);

        $lecturer = DB::transaction(function () use ($validated) {
            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password'] ?? 'password123'),
                'role' => UserRole::Lecturer,
                'is_active' => true,
                'email_verified_at' => now(),
            ]);

            $lecturerNo = $validated['lecturer_no'] ?? null;
            if (! $lecturerNo) {
                $nextId = (Lecturer::withTrashed()->max('id') ?? 0) + 1;
                $lecturerNo = 'UCT-LEC-'.str_pad((string) $nextId, 5, '0', STR_PAD_LEFT);
            }

            return Lecturer::create([
                'user_id' => $user->id,
                'lecturer_no' => $lecturerNo,
                'department' => $validated['department'],
                'faculty' => $validated['faculty'] ?? 'Faculty of Computing & Information Technology',
                'designation' => $validated['designation'],
                'qualification' => $validated['qualification'] ?? null,
                'specialization' => $validated['specialization'] ?? null,
                'phone' => $validated['phone'] ?? null,
                'gender' => $validated['gender'] ?? 'Male',
                'date_of_birth' => $validated['date_of_birth'] ?? null,
                'address' => $validated['address'] ?? null,
                'hire_date' => $validated['hire_date'] ?? now()->toDateString(),
                'employment_status' => $validated['employment_status'] ?? 'active',
                'contract_type' => $validated['contract_type'] ?? 'full_time',
                'office_location' => $validated['office_location'] ?? null,
                'bio' => $validated['bio'] ?? null,
            ]);
        });

        return redirect()->route('admin.lecturers.show', $lecturer)
            ->with('success', "Lecturer {$lecturer->lecturer_no} registered successfully.");
    }

    /**
     * Display a lecturer profile.
     */
    public function show(Lecturer $lecturer): Response
    {
        $lecturer->load([
            'user',
            'courseAssignments' => fn ($q) => $q->with('course.program')->latest('id'),
        ]);

        $activeAssignments = $lecturer->courseAssignments->where('status', 'active');
        $weeklyWorkload = $activeAssignments->sum('workload_hours');

        $courses = Course::query()
            ->active()
            ->select('id', 'code', 'name', 'credit_hours', 'semester')
            ->orderBy('code')
            ->get();

        return Inertia::render('Admin/lecturers/show', [
            'lecturer' => $lecturer,
            'summary' => [
                'total_assignments' => $lecturer->courseAssignments->count(),
                'active_assignments_count' => $activeAssignments->count(),
                'weekly_workload_hours' => $weeklyWorkload,
            ],
            'available_courses' => $courses,
        ]);
    }

    /**
     * Show form to edit a lecturer.
     */
    public function edit(Lecturer $lecturer): Response
    {
        $lecturer->load('user');

        return Inertia::render('Admin/lecturers/edit', [
            'lecturer' => $lecturer,
            'departments' => [
                'Software Engineering',
                'Computer Networks & Cyber Security',
                'Data Science & Artificial Intelligence',
                'Information Technology',
                'Multimedia & Animation',
            ],
            'faculties' => [
                'Faculty of Computing & Information Technology',
                'Faculty of Engineering',
            ],
            'designations' => [
                'Professor',
                'Associate Professor',
                'Senior Lecturer',
                'Lecturer',
                'Assistant Lecturer',
                'Lab Instructor',
            ],
        ]);
    }

    /**
     * Update lecturer profile and account.
     */
    public function update(Request $request, Lecturer $lecturer): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users', 'email')->ignore($lecturer->user_id)],
            'lecturer_no' => ['required', 'string', 'max:50', Rule::unique('lecturers', 'lecturer_no')->ignore($lecturer->id)],
            'department' => ['required', 'string', 'max:255'],
            'faculty' => ['nullable', 'string', 'max:255'],
            'designation' => ['required', 'string', 'max:100'],
            'qualification' => ['nullable', 'string', 'max:255'],
            'specialization' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
            'gender' => ['nullable', 'string', 'in:Male,Female,Other'],
            'date_of_birth' => ['nullable', 'date'],
            'address' => ['nullable', 'string', 'max:500'],
            'hire_date' => ['nullable', 'date'],
            'employment_status' => ['required', 'string', 'in:active,on_leave,sabbatical,terminated'],
            'contract_type' => ['required', 'string', 'in:full_time,part_time,adjunct,visiting'],
            'office_location' => ['nullable', 'string', 'max:255'],
            'bio' => ['nullable', 'string', 'max:2000'],
        ]);

        DB::transaction(function () use ($lecturer, $validated) {
            $lecturer->user->update([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'is_active' => $validated['employment_status'] !== 'terminated',
            ]);

            $lecturer->update([
                'lecturer_no' => $validated['lecturer_no'],
                'department' => $validated['department'],
                'faculty' => $validated['faculty'] ?? $lecturer->faculty,
                'designation' => $validated['designation'],
                'qualification' => $validated['qualification'] ?? null,
                'specialization' => $validated['specialization'] ?? null,
                'phone' => $validated['phone'] ?? null,
                'gender' => $validated['gender'] ?? 'Male',
                'date_of_birth' => $validated['date_of_birth'] ?? null,
                'address' => $validated['address'] ?? null,
                'hire_date' => $validated['hire_date'] ?? null,
                'employment_status' => $validated['employment_status'],
                'contract_type' => $validated['contract_type'],
                'office_location' => $validated['office_location'] ?? null,
                'bio' => $validated['bio'] ?? null,
            ]);
        });

        return redirect()->route('admin.lecturers.show', $lecturer)
            ->with('success', 'Lecturer profile updated successfully.');
    }

    /**
     * Soft delete lecturer profile and deactivate login.
     */
    public function destroy(Lecturer $lecturer): RedirectResponse
    {
        DB::transaction(function () use ($lecturer) {
            $lecturer->user->update(['is_active' => false]);
            $lecturer->delete();
        });

        return redirect()->route('admin.lecturers.index')
            ->with('success', 'Lecturer record deleted successfully.');
    }

    /**
     * Toggle employment and active status.
     */
    public function toggleStatus(Lecturer $lecturer): RedirectResponse
    {
        $newStatus = $lecturer->employment_status === 'active' ? 'on_leave' : 'active';

        DB::transaction(function () use ($lecturer, $newStatus) {
            $lecturer->update(['employment_status' => $newStatus]);
            $lecturer->user->update(['is_active' => $newStatus === 'active']);
        });

        return back()->with('success', "Lecturer status changed to {$newStatus}.");
    }

    /**
     * Reset login password for a lecturer.
     */
    public function resetPassword(Request $request, Lecturer $lecturer): RedirectResponse
    {
        $validated = $request->validate([
            'password' => ['required', 'string', 'min:8'],
        ]);

        $lecturer->user->update([
            'password' => Hash::make($validated['password']),
        ]);

        return back()->with('success', 'Password reset successfully.');
    }

    /**
     * Assign a course directly from the lecturer profile.
     */
    public function assignCourse(Request $request, Lecturer $lecturer): RedirectResponse
    {
        $validated = $request->validate([
            'course_id' => ['required', 'exists:courses,id'],
            'academic_year' => ['required', 'string', 'max:20'],
            'semester' => ['required', 'string', 'max:50'],
            'section' => ['required', 'string', 'max:50'],
            'role' => ['required', 'string', 'in:lead_lecturer,co_lecturer,assistant,lab_instructor'],
            'workload_hours' => ['required', 'integer', 'min:1', 'max:30'],
            'room' => ['nullable', 'string', 'max:100'],
            'schedule_day' => ['nullable', 'string', 'max:50'],
            'schedule_time' => ['nullable', 'string', 'max:50'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        CourseAssignment::create([
            ...$validated,
            'lecturer_id' => $lecturer->id,
            'status' => 'active',
        ]);

        return back()->with('success', 'Course assigned to lecturer successfully.');
    }
}
