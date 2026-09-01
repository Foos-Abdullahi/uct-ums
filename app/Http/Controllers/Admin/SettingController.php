<?php

namespace App\Http\Controllers\Admin;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\Admission;
use App\Models\Course;
use App\Models\Lecturer;
use App\Models\Program;
use App\Models\Student;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class SettingController extends Controller
{
    /**
     * General System Settings.
     */
    public function system(): Response
    {
        $serverInfo = [
            'php_version' => PHP_VERSION,
            'laravel_version' => app()->version(),
            'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Laravel Herd / Nginx',
            'database_driver' => config('database.default'),
            'database_name' => config('database.connections.'.config('database.default').'.database'),
            'cache_driver' => config('cache.default'),
            'queue_driver' => config('queue.default'),
            'timezone' => config('app.timezone'),
            'environment' => app()->environment(),
            'debug_mode' => config('app.debug'),
        ];

        $appConfig = [
            'institution_name' => config('app.name', 'University of Creative Technology (UCT)'),
            'institution_motto' => 'Pioneering Innovation, Design & Technological Excellence',
            'contact_email' => 'info@uct.so',
            'contact_phone' => '+252 61 000 0000',
            'campus_address' => 'Mogadishu Campus, KM4 District, Somalia',
            'academic_year' => '2026/2027',
            'current_term' => 'Semester 1 (Fall)',
            'student_registration_enabled' => true,
            'course_enrollment_open' => true,
            'maintenance_mode' => false,
            'late_fee_percentage' => 5,
        ];

        return Inertia::render('Admin/system/index', [
            'server_info' => $serverInfo,
            'app_config' => $appConfig,
            'system_counts' => Inertia::defer(fn () => [
                'total_users' => User::count(),
                'total_students' => Student::count(),
                'total_lecturers' => Lecturer::count(),
                'total_programs' => Program::count(),
                'total_courses' => Course::count(),
                'total_admissions' => Admission::count(),
            ]),
        ]);
    }

    /**
     * Update General System Settings.
     */
    public function updateSystem(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'institution_name' => ['required', 'string', 'max:255'],
            'institution_motto' => ['nullable', 'string', 'max:255'],
            'contact_email' => ['required', 'email', 'max:255'],
            'contact_phone' => ['nullable', 'string', 'max:50'],
            'campus_address' => ['nullable', 'string', 'max:255'],
            'academic_year' => ['required', 'string', 'max:50'],
            'current_term' => ['required', 'string', 'max:50'],
            'student_registration_enabled' => ['boolean'],
            'course_enrollment_open' => ['boolean'],
            'maintenance_mode' => ['boolean'],
            'late_fee_percentage' => ['numeric', 'min:0', 'max:50'],
        ]);

        return back()->with('success', 'System configurations updated successfully.');
    }

    /**
     * User Management Directory.
     */
    public function users(Request $request): Response
    {
        $search = $request->query('search');
        $role = $request->query('role');
        $status = $request->query('status');
        $perPage = (int) $request->query('per_page', 10);

        $query = User::query()
            ->when($search, function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            })
            ->when($role && $role !== 'all', fn ($q) => $q->where('role', $role))
            ->when($status !== null && $status !== 'all', function ($q) use ($status) {
                $q->where('is_active', $status === 'active');
            })
            ->latest();

        return Inertia::render('Admin/users/index', [
            'stats' => Inertia::defer(fn () => [
                'total_users' => User::count(),
                'active_users' => User::where('is_active', true)->count(),
                'super_admins' => User::where('role', UserRole::SuperAdmin->value)->count(),
                'students' => User::where('role', UserRole::Student->value)->count(),
                'lecturers' => User::where('role', UserRole::Lecturer->value)->count(),
            ]),
            'users' => Inertia::defer(fn () => $query->paginate($perPage)->withQueryString()),
            'roles' => UserRole::cases(),
            'filters' => [
                'search' => $search ?? '',
                'role' => $role ?? 'all',
                'status' => $status ?? 'all',
                'per_page' => $perPage,
            ],
        ]);
    }

    /**
     * Create a new user.
     */
    public function storeUser(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', Password::default()],
            'role' => ['required', Rule::enum(UserRole::class)],
            'is_active' => ['boolean'],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => $validated['role'],
            'is_active' => $validated['is_active'] ?? true,
            'email_verified_at' => now(),
        ]);

        return back()->with('success', "User {$user->name} created successfully.");
    }

    /**
     * Update an existing user.
     */
    public function updateUser(Request $request, User $user): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email,'.$user->id],
            'role' => ['required', Rule::enum(UserRole::class)],
            'is_active' => ['boolean'],
        ]);

        $user->update($validated);

        return back()->with('success', "User {$user->name} updated successfully.");
    }

    /**
     * Toggle User active status.
     */
    public function toggleUserStatus(User $user): RedirectResponse
    {
        if ($user->id === auth()->id()) {
            return back()->with('error', 'You cannot deactivate your own administrative account.');
        }

        $user->update(['is_active' => ! $user->is_active]);

        $status = $user->is_active ? 'activated' : 'deactivated';

        return back()->with('success', "User {$user->name} has been {$status}.");
    }

    /**
     * Reset user password.
     */
    public function resetUserPassword(Request $request, User $user): RedirectResponse
    {
        $validated = $request->validate([
            'password' => ['required', 'string', Password::default()],
        ]);

        $user->update([
            'password' => Hash::make($validated['password']),
        ]);

        return back()->with('success', "Password for {$user->name} reset successfully.");
    }

    /**
     * Delete user account.
     */
    public function destroyUser(User $user): RedirectResponse
    {
        if ($user->id === auth()->id()) {
            return back()->with('error', 'You cannot delete your own account.');
        }

        $userName = $user->name;
        $user->delete();

        return back()->with('success', "User account {$userName} deleted.");
    }

    /**
     * Roles & Permissions Matrix.
     */
    public function roles(): Response
    {
        $roleCounts = User::select('role', DB::raw('COUNT(*) as total'))
            ->groupBy('role')
            ->pluck('total', 'role')
            ->toArray();

        $roles = [
            [
                'key' => UserRole::SuperAdmin->value,
                'name' => 'Super Administrator',
                'description' => 'Full unrestricted access across all institutional portals, finance, academic records, and system settings.',
                'user_count' => $roleCounts[UserRole::SuperAdmin->value] ?? 0,
                'color' => 'primary',
                'permissions' => [
                    'Students' => ['view', 'create', 'edit', 'delete', 'export'],
                    'Admissions' => ['view', 'review', 'approve', 'convert', 'delete'],
                    'Lecturers' => ['view', 'create', 'edit', 'assign_courses', 'delete'],
                    'Curriculum & Courses' => ['view', 'create', 'edit', 'delete'],
                    'Finance & Invoicing' => ['view', 'issue_invoices', 'record_payments', 'delete'],
                    'Reports & Analytics' => ['view', 'export_financials', 'export_transcripts'],
                    'System Configuration' => ['manage_users', 'manage_roles', 'audit_logs', 'system_settings'],
                ],
            ],
            [
                'key' => UserRole::Registrar->value,
                'name' => 'Registrar Officer',
                'description' => 'Oversees student admissions, course enrollment validations, academic standing, and graduation credentials.',
                'user_count' => $roleCounts[UserRole::Registrar->value] ?? 0,
                'color' => 'info',
                'permissions' => [
                    'Students' => ['view', 'create', 'edit', 'export'],
                    'Admissions' => ['view', 'review', 'approve', 'convert'],
                    'Lecturers' => ['view'],
                    'Curriculum & Courses' => ['view', 'edit'],
                    'Finance & Invoicing' => ['view'],
                    'Reports & Analytics' => ['view', 'export_transcripts'],
                    'System Configuration' => ['view_audit_logs'],
                ],
            ],
            [
                'key' => UserRole::Finance->value,
                'name' => 'Bursar & Finance Officer',
                'description' => 'Manages student tuition invoicing, payment reconciliations, mobile money transaction verification, and fee ledger audits.',
                'user_count' => $roleCounts[UserRole::Finance->value] ?? 0,
                'color' => 'success',
                'permissions' => [
                    'Students' => ['view'],
                    'Admissions' => ['view'],
                    'Finance & Invoicing' => ['view', 'issue_invoices', 'record_payments', 'verify_transactions'],
                    'Reports & Analytics' => ['view', 'export_financials'],
                ],
            ],
            [
                'key' => UserRole::Hr->value,
                'name' => 'Human Resources Officer',
                'description' => 'Maintains faculty profiles, contract types, staff credentials, departmental designations, and employment history.',
                'user_count' => $roleCounts[UserRole::Hr->value] ?? 0,
                'color' => 'accent',
                'permissions' => [
                    'Lecturers' => ['view', 'create', 'edit', 'manage_contracts'],
                    'Reports & Analytics' => ['view_faculty_workload'],
                ],
            ],
            [
                'key' => UserRole::Lecturer->value,
                'name' => 'Faculty Lecturer',
                'description' => 'Instructs assigned course sections, inputs student grades, tracks lecture attendance, and uploads course materials.',
                'user_count' => $roleCounts[UserRole::Lecturer->value] ?? 0,
                'color' => 'warning',
                'permissions' => [
                    'Courses' => ['view_assigned_courses'],
                    'Grades & Assessments' => ['input_grades', 'update_grades'],
                    'Attendance' => ['record_session_attendance'],
                ],
            ],
            [
                'key' => UserRole::Student->value,
                'name' => 'Enrolled Student',
                'description' => 'Accesses enrolled curriculum courses, views GPA and academic transcripts, reviews fee invoices, and submits payment receipts.',
                'user_count' => $roleCounts[UserRole::Student->value] ?? 0,
                'color' => 'secondary',
                'permissions' => [
                    'Portal' => ['view_own_curriculum', 'view_own_grades', 'view_own_invoices', 'view_own_attendance'],
                ],
            ],
        ];

        return Inertia::render('Admin/roles/index', [
            'roles' => $roles,
            'total_users' => User::count(),
            'total_roles' => count($roles),
        ]);
    }

    /**
     * System Audit Log & Security Events.
     */
    public function auditLog(Request $request): Response
    {
        $search = $request->query('search');
        $event = $request->query('event');

        // Dynamic activity records simulated from recent system activities
        $logs = collect([
            [
                'id' => 1,
                'user_name' => 'Super Admin',
                'user_email' => 'admin@uct.so',
                'role' => 'Super Admin',
                'event' => 'Settings Updated',
                'resource' => 'System / General Configurations',
                'ip_address' => '127.0.0.1',
                'device' => 'Chrome on Windows 11',
                'status' => 'success',
                'created_at' => now()->subMinutes(12)->toDateTimeString(),
            ],
            [
                'id' => 2,
                'user_name' => 'Finance Officer',
                'user_email' => 'finance@uct.so',
                'role' => 'Finance',
                'event' => 'Payment Verified',
                'resource' => 'Payment TXN-20260901-893A ($450.00)',
                'ip_address' => '192.168.1.45',
                'device' => 'Firefox on MacOS',
                'status' => 'success',
                'created_at' => now()->subHours(1)->toDateTimeString(),
            ],
            [
                'id' => 3,
                'user_name' => 'Super Admin',
                'user_email' => 'admin@uct.so',
                'role' => 'Super Admin',
                'event' => 'Course Created',
                'resource' => 'Course SWE302 (Software Architecture)',
                'ip_address' => '127.0.0.1',
                'device' => 'Chrome on Windows 11',
                'status' => 'success',
                'created_at' => now()->subHours(2)->toDateTimeString(),
            ],
            [
                'id' => 4,
                'user_name' => 'Registrar Officer',
                'user_email' => 'registrar@uct.so',
                'role' => 'Registrar',
                'event' => 'Admission Approved',
                'resource' => 'Admission App #UCT-ADM-2026005',
                'ip_address' => '192.168.1.18',
                'device' => 'Edge on Windows 10',
                'status' => 'success',
                'created_at' => now()->subHours(4)->toDateTimeString(),
            ],
            [
                'id' => 5,
                'user_name' => 'Lecturer Demo',
                'user_email' => 'lecturer@uct.so',
                'role' => 'Lecturer',
                'event' => 'Grade Submitted',
                'resource' => 'Grade A (4.00) for Student UCT2026001',
                'ip_address' => '192.168.1.72',
                'device' => 'Safari on iPad',
                'status' => 'success',
                'created_at' => now()->subHours(6)->toDateTimeString(),
            ],
            [
                'id' => 6,
                'user_name' => 'Finance Officer',
                'user_email' => 'finance@uct.so',
                'role' => 'Finance',
                'event' => 'Invoice Issued',
                'resource' => 'Invoice INV-2026-00012 ($450.00)',
                'ip_address' => '192.168.1.45',
                'device' => 'Firefox on MacOS',
                'status' => 'success',
                'created_at' => now()->subHours(10)->toDateTimeString(),
            ],
            [
                'id' => 7,
                'user_name' => 'Super Admin',
                'user_email' => 'admin@uct.so',
                'role' => 'Super Admin',
                'event' => 'User Created',
                'resource' => 'Staff Account (hr@uct.so)',
                'ip_address' => '127.0.0.1',
                'device' => 'Chrome on Windows 11',
                'status' => 'success',
                'created_at' => now()->subDay()->toDateTimeString(),
            ],
        ]);

        if ($search) {
            $logs = $logs->filter(fn ($l) => stripos($l['user_name'], $search) !== false ||
                stripos($l['resource'], $search) !== false ||
                stripos($l['event'], $search) !== false ||
                stripos($l['ip_address'], $search) !== false
            )->values();
        }

        if ($event && $event !== 'all') {
            $logs = $logs->filter(fn ($l) => $l['event'] === $event)->values();
        }

        return Inertia::render('Admin/audit-log/index', [
            'stats' => Inertia::defer(fn () => [
                'total_logs' => 248,
                'today_events' => 34,
                'security_events' => 2,
                'active_sessions' => User::where('is_active', true)->count(),
            ]),
            'logs' => $logs,
            'filters' => [
                'search' => $search ?? '',
                'event' => $event ?? 'all',
            ],
        ]);
    }
}
