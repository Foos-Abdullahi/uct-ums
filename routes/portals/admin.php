<?php

use App\Enums\UserRole;
use App\Http\Controllers\Admin\AdmissionController;
use App\Http\Controllers\Admin\AssignmentController;
use App\Http\Controllers\Admin\ChartOfAccountsController;
use App\Http\Controllers\Admin\CourseController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\EnrollmentController;
use App\Http\Controllers\Admin\ExpenseController;
use App\Http\Controllers\Admin\FinanceController;
use App\Http\Controllers\Admin\LecturerController;
use App\Http\Controllers\Admin\ProgramController;
use App\Http\Controllers\Admin\ReportController;
use App\Http\Controllers\Admin\RoleController;
use App\Http\Controllers\Admin\SemesterController;
use App\Http\Controllers\Admin\SettingController;
use App\Http\Controllers\Admin\StudentController;
use App\Http\Controllers\Admin\TranscriptController;
use Illuminate\Support\Facades\Route;

$backOfficeRoles = implode(',', [
    UserRole::SuperAdmin->value,
    UserRole::Registrar->value,
    UserRole::Finance->value,
    UserRole::Hr->value,
]);

Route::middleware(['auth', 'verified', 'role:'.$backOfficeRoles])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {
        Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

        // Students Management
        Route::prefix('students')->name('students.')->group(function () {
            Route::get('/', [StudentController::class, 'index'])
                ->middleware('permission:students.view')->name('index');
            Route::get('/create', [StudentController::class, 'create'])
                ->middleware('permission:students.create')->name('create');
            Route::post('/', [StudentController::class, 'store'])
                ->middleware('permission:students.create')->name('store');
            Route::post('/import', [StudentController::class, 'import'])
                ->middleware('permission:students.create')->name('import');
            Route::get('/{student}', [StudentController::class, 'show'])
                ->middleware('permission:students.view')->name('show');
            Route::get('/{student}/edit', [StudentController::class, 'edit'])
                ->middleware('permission:students.edit')->name('edit');
            Route::put('/{student}', [StudentController::class, 'update'])
                ->middleware('permission:students.edit')->name('update');
            Route::delete('/{student}', [StudentController::class, 'destroy'])
                ->middleware('permission:students.delete')->name('destroy');

            // Student profile actions
            Route::post('/{student}/toggle-status', [StudentController::class, 'toggleStatus'])
                ->middleware('permission:students.edit')->name('toggle-status');
            Route::post('/{student}/reset-password', [StudentController::class, 'resetPassword'])
                ->middleware('permission:students.edit')->name('reset-password');
            Route::post('/{student}/documents', [StudentController::class, 'storeDocument'])
                ->middleware('permission:students.edit')->name('documents.store');
            Route::delete('/{student}/documents/{document}', [StudentController::class, 'destroyDocument'])
                ->middleware('permission:students.edit')->name('documents.destroy');
            Route::post('/{student}/invoices', [StudentController::class, 'storeInvoice'])
                ->middleware('permission:finance.invoices.create')->name('invoices.store');
            Route::post('/{student}/payments', [StudentController::class, 'storePayment'])
                ->middleware('permission:finance.payments.create')->name('payments.store');
            Route::patch('/{student}/payments/{payment}/status', [StudentController::class, 'updatePaymentStatus'])
                ->middleware('permission:finance.payments.verify')->name('payments.status');
            Route::post('/{student}/certificates', [StudentController::class, 'generateCertificate'])
                ->middleware('permission:academics.transcripts')->name('certificates.store');
            Route::post('/{student}/grades', [StudentController::class, 'storeGrade'])
                ->middleware('permission:academics.grades')->name('grades.store');
            Route::delete('/{student}/grades/{grade}', [StudentController::class, 'destroyGrade'])
                ->middleware('permission:academics.grades')->name('grades.destroy');
        });

        // Admissions Management
        Route::prefix('admissions')->name('admissions.')->group(function () {
            Route::get('/', [AdmissionController::class, 'index'])
                ->middleware('permission:admissions.view')->name('index');
            Route::get('/create', [AdmissionController::class, 'create'])
                ->middleware('permission:admissions.review')->name('create');
            Route::post('/', [AdmissionController::class, 'store'])
                ->middleware('permission:admissions.review')->name('store');
            Route::get('/{admission}', [AdmissionController::class, 'show'])
                ->middleware('permission:admissions.view')->name('show');
            Route::patch('/{admission}/status', [AdmissionController::class, 'updateStatus'])
                ->middleware('permission:admissions.decision')->name('update-status');
            Route::post('/{admission}/convert', [AdmissionController::class, 'convertToStudent'])
                ->middleware('permission:admissions.convert')->name('convert');
            Route::delete('/{admission}', [AdmissionController::class, 'destroy'])
                ->middleware('permission:admissions.delete')->name('destroy');
        });

        // Lecturers Management
        Route::prefix('lecturers')->name('lecturers.')->group(function () {
            Route::get('/', [LecturerController::class, 'index'])
                ->middleware('permission:lecturers.view')->name('index');
            Route::get('/create', [LecturerController::class, 'create'])
                ->middleware('permission:lecturers.create')->name('create');
            Route::post('/', [LecturerController::class, 'store'])
                ->middleware('permission:lecturers.create')->name('store');
            Route::get('/{lecturer}', [LecturerController::class, 'show'])
                ->middleware('permission:lecturers.view')->name('show');
            Route::get('/{lecturer}/edit', [LecturerController::class, 'edit'])
                ->middleware('permission:lecturers.edit')->name('edit');
            Route::put('/{lecturer}', [LecturerController::class, 'update'])
                ->middleware('permission:lecturers.edit')->name('update');
            Route::delete('/{lecturer}', [LecturerController::class, 'destroy'])
                ->middleware('permission:lecturers.delete')->name('destroy');

            // Lecturer profile actions
            Route::post('/{lecturer}/toggle-status', [LecturerController::class, 'toggleStatus'])
                ->middleware('permission:lecturers.edit')->name('toggle-status');
            Route::post('/{lecturer}/reset-password', [LecturerController::class, 'resetPassword'])
                ->middleware('permission:lecturers.edit')->name('reset-password');
            Route::post('/{lecturer}/assign-course', [LecturerController::class, 'assignCourse'])
                ->middleware('permission:lecturers.assign')->name('assign-course');
        });

        // Teaching & Course Assignments Management
        Route::prefix('assignments')->middleware('permission:lecturers.assign')->name('assignments.')->group(function () {
            Route::get('/', [AssignmentController::class, 'index'])->name('index');
            Route::get('/create', [AssignmentController::class, 'create'])->name('create');
            Route::post('/', [AssignmentController::class, 'store'])->name('store');
            Route::get('/{assignment}', [AssignmentController::class, 'show'])->name('show');
            Route::get('/{assignment}/edit', [AssignmentController::class, 'edit'])->name('edit');
            Route::put('/{assignment}', [AssignmentController::class, 'update'])->name('update');
            Route::delete('/{assignment}', [AssignmentController::class, 'destroy'])->name('destroy');

            // Assignment actions
            Route::patch('/{assignment}/status', [AssignmentController::class, 'updateStatus'])->name('status');
        });

        // Academic Programs Management
        Route::prefix('programs')->middleware('permission:academics.programs')->name('programs.')->group(function () {
            Route::get('/', [ProgramController::class, 'index'])->name('index');
            Route::get('/create', [ProgramController::class, 'create'])->name('create');
            Route::post('/', [ProgramController::class, 'store'])->name('store');
            Route::get('/{program}', [ProgramController::class, 'show'])->name('show');
            Route::get('/{program}/edit', [ProgramController::class, 'edit'])->name('edit');
            Route::put('/{program}', [ProgramController::class, 'update'])->name('update');
            Route::delete('/{program}', [ProgramController::class, 'destroy'])->name('destroy');
            Route::post('/{program}/toggle-status', [ProgramController::class, 'toggleStatus'])->name('toggle-status');
        });

        // Courses Management
        Route::prefix('courses')->middleware('permission:academics.courses')->name('courses.')->group(function () {
            Route::get('/', [CourseController::class, 'index'])->name('index');
            Route::get('/create', [CourseController::class, 'create'])->name('create');
            Route::post('/', [CourseController::class, 'store'])->name('store');
            Route::get('/{course}', [CourseController::class, 'show'])->name('show');
            Route::get('/{course}/edit', [CourseController::class, 'edit'])->name('edit');
            Route::put('/{course}', [CourseController::class, 'update'])->name('update');
            Route::delete('/{course}', [CourseController::class, 'destroy'])->name('destroy');
            Route::post('/{course}/toggle-status', [CourseController::class, 'toggleStatus'])->name('toggle-status');
        });

        // Semesters Overview
        Route::get('semesters', [SemesterController::class, 'index'])
            ->middleware('permission:academics.semesters')->name('semesters.index');

        // Enrollments
        Route::prefix('enrollments')->middleware('permission:academics.enrollments')->name('enrollments.')->group(function () {
            Route::get('/', [EnrollmentController::class, 'index'])->name('index');
            Route::patch('/{student}/status', [EnrollmentController::class, 'updateStatus'])->name('status');
        });

        // Transcripts
        Route::get('transcripts', [TranscriptController::class, 'index'])
            ->middleware('permission:academics.transcripts')->name('transcripts.index');

        // Finance Management
        Route::prefix('finance')->name('finance.')->group(function () {
            Route::middleware('permission:finance.view')->group(function () {
                Route::get('/', [FinanceController::class, 'overview'])->name('overview');
                Route::get('/fees', [FinanceController::class, 'fees'])->name('fees');
                Route::get('/invoices', [FinanceController::class, 'invoices'])->name('invoices');
                Route::get('/invoices/{invoice}', [FinanceController::class, 'invoiceDetails'])->name('invoices.show');
            });

            Route::get('/payments', [FinanceController::class, 'payments'])
                ->middleware('permission:finance.view')->name('payments');
            Route::post('/payments', [FinanceController::class, 'storePayment'])
                ->middleware('permission:finance.payments.create')->name('payments.store');
            Route::patch('/payments/{payment}/status', [FinanceController::class, 'updatePaymentStatus'])
                ->middleware('permission:finance.payments.verify')->name('payments.status');

            Route::post('/invoices', [FinanceController::class, 'storeInvoice'])
                ->middleware('permission:finance.invoices.create')->name('invoices.store');
            Route::put('/invoices/{invoice}', [FinanceController::class, 'updateInvoice'])
                ->middleware('permission:finance.invoices.create')->name('invoices.update');
            Route::delete('/invoices/{invoice}', [FinanceController::class, 'destroyInvoice'])
                ->middleware('permission:finance.invoices.delete')->name('invoices.destroy');

            Route::get('/chart-of-accounts', [ChartOfAccountsController::class, 'index'])
                ->middleware('permission:finance.accounts.view')->name('chart-of-accounts');
            Route::get('/chart-of-accounts/import', [ChartOfAccountsController::class, 'importIndex'])
                ->middleware('permission:finance.accounts.import')->name('chart-of-accounts.import');
            Route::post('/chart-of-accounts/import-preview', [ChartOfAccountsController::class, 'importPreview'])
                ->middleware('permission:finance.accounts.import')->name('chart-of-accounts.import-preview');
            Route::post('/chart-of-accounts/import', [ChartOfAccountsController::class, 'importStore'])
                ->middleware('permission:finance.accounts.import')->name('chart-of-accounts.import-store');
            Route::post('/chart-of-accounts', [ChartOfAccountsController::class, 'store'])
                ->middleware('permission:finance.accounts.create')->name('chart-of-accounts.store');
            Route::put('/chart-of-accounts/{account}', [ChartOfAccountsController::class, 'update'])
                ->middleware('permission:finance.accounts.edit')->name('chart-of-accounts.update');
            Route::delete('/chart-of-accounts/{account}', [ChartOfAccountsController::class, 'destroy'])
                ->middleware('permission:finance.accounts.edit')->name('chart-of-accounts.destroy');
            Route::post('/chart-of-accounts/{account}/status', [ChartOfAccountsController::class, 'toggleStatus'])
                ->middleware('permission:finance.accounts.deactivate')->name('chart-of-accounts.status');
            Route::get('/chart-of-accounts/{account}', [ChartOfAccountsController::class, 'show'])
                ->middleware('permission:finance.accounts.history')->name('chart-of-accounts.show');
        });

        // Expense Management
        Route::prefix('expenses')->name('expenses.')->group(function () {
            Route::middleware('permission:finance.expenses.view')->group(function () {
                Route::get('/', [ExpenseController::class, 'index'])->name('index');
                Route::get('/{expense}', [ExpenseController::class, 'show'])->name('show');
            });

            Route::post('/', [ExpenseController::class, 'store'])
                ->middleware('permission:finance.expenses.create')->name('store');

            Route::middleware('permission:finance.expenses.edit')->group(function () {
                Route::put('/{expense}', [ExpenseController::class, 'update'])->name('update');
                Route::patch('/{expense}/status', [ExpenseController::class, 'updateStatus'])->name('status');
            });

            Route::middleware('permission:finance.expenses.approve')->group(function () {
                Route::post('/{expense}/mark-paid', [ExpenseController::class, 'markPaid'])->name('mark-paid');
                Route::post('/{expense}/approve', [ExpenseController::class, 'approve'])->name('approve');
                Route::post('/{expense}/reject', [ExpenseController::class, 'reject'])->name('reject');
            });

            Route::delete('/{expense}', [ExpenseController::class, 'destroy'])
                ->middleware('permission:finance.expenses.delete')->name('destroy');
        });

        // Reports
        Route::prefix('reports')->middleware('permission:reports.view')->name('reports.')->group(function () {
            Route::get('/', [ReportController::class, 'index'])->name('index');
            Route::get('/overview', [ReportController::class, 'overview'])->name('overview');
            Route::get('/students', [ReportController::class, 'students'])->name('students');
            Route::get('/academic', [ReportController::class, 'academic'])->name('academic');
            Route::get('/attendance', [ReportController::class, 'attendance'])->name('attendance');
            Route::get('/finance', [ReportController::class, 'finance'])->name('finance');
            Route::get('/graduation', [ReportController::class, 'graduation'])->name('graduation');
        });

        // System Settings, Users, Roles, Audit Logs
        Route::prefix('settings')->name('settings.')->group(function () {
            Route::middleware('permission:settings.system')->group(function () {
                Route::get('system', [SettingController::class, 'system'])->name('system');
                Route::post('system', [SettingController::class, 'updateSystem'])->name('system.update');
            });

            Route::prefix('users')->middleware('permission:settings.users')->group(function () {
                Route::get('/', [SettingController::class, 'users'])->name('users');
                Route::post('/', [SettingController::class, 'storeUser'])->name('users.store');
                Route::put('/{user}', [SettingController::class, 'updateUser'])->name('users.update');
                Route::post('/{user}/toggle-status', [SettingController::class, 'toggleUserStatus'])->name('users.toggle-status');
                Route::post('/{user}/reset-password', [SettingController::class, 'resetUserPassword'])->name('users.reset-password');
                Route::delete('/{user}', [SettingController::class, 'destroyUser'])->name('users.destroy');
            });

            // Roles & Permissions CRUD
            Route::prefix('roles')->middleware('permission:settings.roles')->name('roles.')->group(function () {
                Route::get('/', [RoleController::class, 'index'])->name('index');
                Route::get('/create', [RoleController::class, 'create'])->name('create');
                Route::post('/', [RoleController::class, 'store'])->name('store');
                Route::get('/{role}', [RoleController::class, 'show'])->name('show');
                Route::get('/{role}/edit', [RoleController::class, 'edit'])->name('edit');
                Route::put('/{role}', [RoleController::class, 'update'])->name('update');
                Route::delete('/{role}', [RoleController::class, 'destroy'])->name('destroy');
            });
            Route::get('roles', [RoleController::class, 'index'])
                ->middleware('permission:settings.roles')->name('roles');

            Route::get('audit-log', [SettingController::class, 'auditLog'])
                ->middleware('permission:settings.audit_logs')->name('audit-log');
        });

        // Direct Route Aliases for backwards compatibility
        Route::get('system', [SettingController::class, 'system'])
            ->middleware('permission:settings.system')->name('system.index');
        Route::get('users', [SettingController::class, 'users'])
            ->middleware('permission:settings.users')->name('users.index');
        Route::get('roles', [RoleController::class, 'index'])
            ->middleware('permission:settings.roles')->name('roles.index');
        Route::get('roles/create', [RoleController::class, 'create'])
            ->middleware('permission:settings.roles')->name('roles.create');
        Route::get('roles/{role}', [RoleController::class, 'show'])
            ->middleware('permission:settings.roles')->name('roles.show');
        Route::get('roles/{role}/edit', [RoleController::class, 'edit'])
            ->middleware('permission:settings.roles')->name('roles.edit');
        Route::get('permissions', [RoleController::class, 'index'])
            ->middleware('permission:settings.roles')->name('permissions.index');
        Route::get('audit-log', [SettingController::class, 'auditLog'])
            ->middleware('permission:settings.audit_logs')->name('audit-log.index');
    });
