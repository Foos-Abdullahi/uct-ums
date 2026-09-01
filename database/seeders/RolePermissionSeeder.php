<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Seeder;

class RolePermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $modules = [
            'Students' => [
                ['name' => 'View Students', 'slug' => 'students.view', 'description' => 'View student directory, profiles, and basic data.'],
                ['name' => 'Create Student', 'slug' => 'students.create', 'description' => 'Register and enroll new students.'],
                ['name' => 'Edit Student', 'slug' => 'students.edit', 'description' => 'Update student bio data and academic details.'],
                ['name' => 'Delete Student', 'slug' => 'students.delete', 'description' => 'Remove or soft delete student records.'],
                ['name' => 'Export Students', 'slug' => 'students.export', 'description' => 'Export student lists to CSV or PDF.'],
            ],
            'Admissions' => [
                ['name' => 'View Admissions', 'slug' => 'admissions.view', 'description' => 'View applicant pipeline and applications.'],
                ['name' => 'Review Application', 'slug' => 'admissions.review', 'description' => 'Screen applicant credentials and academic history.'],
                ['name' => 'Approve/Reject', 'slug' => 'admissions.decision', 'description' => 'Change application status to approved or rejected.'],
                ['name' => 'Convert to Student', 'slug' => 'admissions.convert', 'description' => 'Convert approved applicants into matriculated students.'],
                ['name' => 'Delete Application', 'slug' => 'admissions.delete', 'description' => 'Delete applicant submission records.'],
            ],
            'Lecturers' => [
                ['name' => 'View Lecturers', 'slug' => 'lecturers.view', 'description' => 'Browse faculty lecturer roster and profiles.'],
                ['name' => 'Create Lecturer', 'slug' => 'lecturers.create', 'description' => 'Onboard new faculty members.'],
                ['name' => 'Edit Lecturer', 'slug' => 'lecturers.edit', 'description' => 'Update faculty profile and contract terms.'],
                ['name' => 'Assign Courses', 'slug' => 'lecturers.assign', 'description' => 'Assign courses and sections to lecturers.'],
                ['name' => 'Delete Lecturer', 'slug' => 'lecturers.delete', 'description' => 'Remove faculty profiles.'],
            ],
            'Academics' => [
                ['name' => 'Manage Programs', 'slug' => 'academics.programs', 'description' => 'Create, edit, and configure degree programs.'],
                ['name' => 'Manage Courses', 'slug' => 'academics.courses', 'description' => 'Configure course catalog, credits, and syllabus.'],
                ['name' => 'Manage Semesters', 'slug' => 'academics.semesters', 'description' => 'Configure terms, cohort allocations, and sessions.'],
                ['name' => 'Manage Grades', 'slug' => 'academics.grades', 'description' => 'Record, edit, and post semester grades.'],
                ['name' => 'Issue Transcripts', 'slug' => 'academics.transcripts', 'description' => 'Generate and verify official academic transcripts.'],
            ],
            'Finance' => [
                ['name' => 'View Finance Overview', 'slug' => 'finance.view', 'description' => 'View financial dashboards and revenue statistics.'],
                ['name' => 'Issue Invoices', 'slug' => 'finance.invoices.create', 'description' => 'Generate student tuition and ancillary fee invoices.'],
                ['name' => 'Delete Invoices', 'slug' => 'finance.invoices.delete', 'description' => 'Cancel or remove unpaid invoices.'],
                ['name' => 'Record Payments', 'slug' => 'finance.payments.create', 'description' => 'Record cash, bank, or mobile money payments.'],
                ['name' => 'Verify Payments', 'slug' => 'finance.payments.verify', 'description' => 'Approve or reject pending transaction receipts.'],
            ],
            'Reports' => [
                ['name' => 'View Reports', 'slug' => 'reports.view', 'description' => 'Access executive reports and statistical charts.'],
                ['name' => 'Export Financials', 'slug' => 'reports.finance.export', 'description' => 'Export accounting audit trails and ledger reports.'],
                ['name' => 'Export Transcripts', 'slug' => 'reports.academic.export', 'description' => 'Export graduation and GPA records.'],
            ],
            'Settings' => [
                ['name' => 'System Settings', 'slug' => 'settings.system', 'description' => 'Configure institution identity and enrollment locks.'],
                ['name' => 'Manage Users', 'slug' => 'settings.users', 'description' => 'Create, update, deactivate users and reset passwords.'],
                ['name' => 'Manage Roles', 'slug' => 'settings.roles', 'description' => 'Full CRUD access to roles and permission mappings.'],
                ['name' => 'View Audit Logs', 'slug' => 'settings.audit_logs', 'description' => 'Inspect security events and user activity audit trail.'],
            ],
        ];

        $permissionModels = [];
        foreach ($modules as $module => $perms) {
            foreach ($perms as $p) {
                $permissionModels[$p['slug']] = Permission::updateOrCreate(
                    ['slug' => $p['slug']],
                    [
                        'module' => $module,
                        'name' => $p['name'],
                        'description' => $p['description'],
                    ]
                );
            }
        }

        // Standard System Roles
        $roles = [
            [
                'name' => 'Super Administrator',
                'slug' => 'super_admin',
                'description' => 'Unrestricted root administrator across all portals, academic curricula, finance, and system settings.',
                'is_system' => true,
                'permissions' => array_keys($permissionModels), // All permissions
            ],
            [
                'name' => 'Registrar Officer',
                'slug' => 'registrar',
                'description' => 'Manages student admissions, course matriculation, official transcripts, and graduation credentials.',
                'is_system' => true,
                'permissions' => [
                    'students.view', 'students.create', 'students.edit', 'students.export',
                    'admissions.view', 'admissions.review', 'admissions.decision', 'admissions.convert',
                    'lecturers.view', 'academics.programs', 'academics.courses', 'academics.semesters',
                    'academics.grades', 'academics.transcripts', 'finance.view', 'reports.view',
                    'reports.academic.export', 'settings.audit_logs',
                ],
            ],
            [
                'name' => 'Finance / Bursar Officer',
                'slug' => 'finance',
                'description' => 'Manages student fee ledgers, invoice issuance, payment verification (EVC/Zaad/Bank), and solvency audits.',
                'is_system' => true,
                'permissions' => [
                    'students.view', 'admissions.view', 'finance.view', 'finance.invoices.create',
                    'finance.invoices.delete', 'finance.payments.create', 'finance.payments.verify',
                    'reports.view', 'reports.finance.export',
                ],
            ],
            [
                'name' => 'Human Resources Officer',
                'slug' => 'hr',
                'description' => 'Oversees faculty onboarding, staff contracts, lecturer profiles, and workload compliance.',
                'is_system' => true,
                'permissions' => [
                    'lecturers.view', 'lecturers.create', 'lecturers.edit', 'lecturers.assign',
                    'reports.view',
                ],
            ],
            [
                'name' => 'Academic Dean',
                'slug' => 'dean',
                'description' => 'Faculty leadership overseeing departmental curricula, degree accreditations, and grade submissions.',
                'is_system' => false,
                'permissions' => [
                    'students.view', 'lecturers.view', 'lecturers.assign', 'academics.programs',
                    'academics.courses', 'academics.semesters', 'academics.grades', 'reports.view',
                ],
            ],
            [
                'name' => 'Head of Department (HOD)',
                'slug' => 'hod',
                'description' => 'Departmental coordinator managing course sections, teaching schedules, and syllabus progression.',
                'is_system' => false,
                'permissions' => [
                    'students.view', 'lecturers.view', 'lecturers.assign', 'academics.courses',
                    'academics.semesters', 'academics.grades', 'reports.view',
                ],
            ],
            [
                'name' => 'Faculty Lecturer',
                'slug' => 'lecturer',
                'description' => 'Instructs assigned course sections, inputs student assessments, and tracks student attendance.',
                'is_system' => true,
                'permissions' => [
                    'academics.grades',
                ],
            ],
            [
                'name' => 'Enrolled Student',
                'slug' => 'student',
                'description' => 'Self-service portal access to personal courses, grades, invoices, and academic documents.',
                'is_system' => true,
                'permissions' => [],
            ],
        ];

        foreach ($roles as $r) {
            $role = Role::updateOrCreate(
                ['slug' => $r['slug']],
                [
                    'name' => $r['name'],
                    'description' => $r['description'],
                    'is_system' => $r['is_system'],
                ]
            );

            $permIds = collect($r['permissions'])
                ->map(fn ($slug) => $permissionModels[$slug]->id ?? null)
                ->filter()
                ->toArray();

            $role->permissions()->sync($permIds);
        }
    }
}
