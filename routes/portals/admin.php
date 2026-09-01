<?php

use App\Enums\UserRole;
use App\Http\Controllers\Admin\AdmissionController;
use App\Http\Controllers\Admin\AssignmentController;
use App\Http\Controllers\Admin\CourseController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\EnrollmentController;
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

Route::middleware(['auth', 'verified', 'role:'.UserRole::SuperAdmin->value])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {
        Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

        // Students Management
        Route::prefix('students')->name('students.')->group(function () {
            Route::get('/', [StudentController::class, 'index'])->name('index');
            Route::get('/create', [StudentController::class, 'create'])->name('create');
            Route::post('/', [StudentController::class, 'store'])->name('store');
            Route::get('/{student}', [StudentController::class, 'show'])->name('show');
            Route::get('/{student}/edit', [StudentController::class, 'edit'])->name('edit');
            Route::put('/{student}', [StudentController::class, 'update'])->name('update');
            Route::delete('/{student}', [StudentController::class, 'destroy'])->name('destroy');

            // Student profile actions
            Route::post('/{student}/toggle-status', [StudentController::class, 'toggleStatus'])->name('toggle-status');
            Route::post('/{student}/reset-password', [StudentController::class, 'resetPassword'])->name('reset-password');
            Route::post('/{student}/invoices', [StudentController::class, 'storeInvoice'])->name('invoices.store');
            Route::post('/{student}/payments', [StudentController::class, 'storePayment'])->name('payments.store');
            Route::patch('/{student}/payments/{payment}/status', [StudentController::class, 'updatePaymentStatus'])->name('payments.status');
            Route::post('/{student}/documents', [StudentController::class, 'storeDocument'])->name('documents.store');
            Route::delete('/{student}/documents/{document}', [StudentController::class, 'destroyDocument'])->name('documents.destroy');
            Route::post('/{student}/certificates', [StudentController::class, 'generateCertificate'])->name('certificates.store');
            Route::post('/{student}/grades', [StudentController::class, 'storeGrade'])->name('grades.store');
            Route::delete('/{student}/grades/{grade}', [StudentController::class, 'destroyGrade'])->name('grades.destroy');
        });

        // Admissions Management
        Route::prefix('admissions')->name('admissions.')->group(function () {
            Route::get('/', [AdmissionController::class, 'index'])->name('index');
            Route::get('/create', [AdmissionController::class, 'create'])->name('create');
            Route::post('/', [AdmissionController::class, 'store'])->name('store');
            Route::get('/{admission}', [AdmissionController::class, 'show'])->name('show');
            Route::patch('/{admission}/status', [AdmissionController::class, 'updateStatus'])->name('update-status');
            Route::post('/{admission}/convert', [AdmissionController::class, 'convertToStudent'])->name('convert');
            Route::delete('/{admission}', [AdmissionController::class, 'destroy'])->name('destroy');
        });

        // Lecturers Management
        Route::prefix('lecturers')->name('lecturers.')->group(function () {
            Route::get('/', [LecturerController::class, 'index'])->name('index');
            Route::get('/create', [LecturerController::class, 'create'])->name('create');
            Route::post('/', [LecturerController::class, 'store'])->name('store');
            Route::get('/{lecturer}', [LecturerController::class, 'show'])->name('show');
            Route::get('/{lecturer}/edit', [LecturerController::class, 'edit'])->name('edit');
            Route::put('/{lecturer}', [LecturerController::class, 'update'])->name('update');
            Route::delete('/{lecturer}', [LecturerController::class, 'destroy'])->name('destroy');

            // Lecturer profile actions
            Route::post('/{lecturer}/toggle-status', [LecturerController::class, 'toggleStatus'])->name('toggle-status');
            Route::post('/{lecturer}/reset-password', [LecturerController::class, 'resetPassword'])->name('reset-password');
            Route::post('/{lecturer}/assign-course', [LecturerController::class, 'assignCourse'])->name('assign-course');
        });

        // Teaching & Course Assignments Management
        Route::prefix('assignments')->name('assignments.')->group(function () {
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
        Route::prefix('programs')->name('programs.')->group(function () {
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
        Route::prefix('courses')->name('courses.')->group(function () {
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
        Route::get('semesters', [SemesterController::class, 'index'])->name('semesters.index');

        // Enrollments
        Route::prefix('enrollments')->name('enrollments.')->group(function () {
            Route::get('/', [EnrollmentController::class, 'index'])->name('index');
            Route::patch('/{student}/status', [EnrollmentController::class, 'updateStatus'])->name('status');
        });

        // Transcripts
        Route::prefix('transcripts')->name('transcripts.')->group(function () {
            Route::get('/', [TranscriptController::class, 'index'])->name('index');
        });

        // Finance Management
        Route::prefix('finance')->name('finance.')->group(function () {
            Route::get('/', [FinanceController::class, 'overview'])->name('overview');
            Route::get('/fees', [FinanceController::class, 'fees'])->name('fees');
            Route::get('/payments', [FinanceController::class, 'payments'])->name('payments');
            Route::post('/payments', [FinanceController::class, 'storePayment'])->name('payments.store');
            Route::patch('/payments/{payment}/status', [FinanceController::class, 'updatePaymentStatus'])->name('payments.status');
            Route::get('/invoices', [FinanceController::class, 'invoices'])->name('invoices');
            Route::post('/invoices', [FinanceController::class, 'storeInvoice'])->name('invoices.store');
            Route::delete('/invoices/{invoice}', [FinanceController::class, 'destroyInvoice'])->name('invoices.destroy');
        });

        // Reports
        Route::prefix('reports')->name('reports.')->group(function () {
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
            Route::get('system', [SettingController::class, 'system'])->name('system');
            Route::post('system', [SettingController::class, 'updateSystem'])->name('system.update');
            Route::get('users', [SettingController::class, 'users'])->name('users');
            Route::post('users', [SettingController::class, 'storeUser'])->name('users.store');
            Route::put('users/{user}', [SettingController::class, 'updateUser'])->name('users.update');
            Route::post('users/{user}/toggle-status', [SettingController::class, 'toggleUserStatus'])->name('users.toggle-status');
            Route::post('users/{user}/reset-password', [SettingController::class, 'resetUserPassword'])->name('users.reset-password');
            Route::delete('users/{user}', [SettingController::class, 'destroyUser'])->name('users.destroy');

            // Roles & Permissions CRUD
            Route::prefix('roles')->name('roles.')->group(function () {
                Route::get('/', [RoleController::class, 'index'])->name('index');
                Route::get('/create', [RoleController::class, 'create'])->name('create');
                Route::post('/', [RoleController::class, 'store'])->name('store');
                Route::get('/{role}', [RoleController::class, 'show'])->name('show');
                Route::get('/{role}/edit', [RoleController::class, 'edit'])->name('edit');
                Route::put('/{role}', [RoleController::class, 'update'])->name('update');
                Route::delete('/{role}', [RoleController::class, 'destroy'])->name('destroy');
            });
            Route::get('roles', [RoleController::class, 'index'])->name('roles');

            Route::get('audit-log', [SettingController::class, 'auditLog'])->name('audit-log');
        });

        // Direct Route Aliases for backwards compatibility
        Route::get('system', [SettingController::class, 'system'])->name('system.index');
        Route::get('users', [SettingController::class, 'users'])->name('users.index');
        Route::get('roles', [RoleController::class, 'index'])->name('roles.index');
        Route::get('roles/create', [RoleController::class, 'create'])->name('roles.create');
        Route::get('roles/{role}', [RoleController::class, 'show'])->name('roles.show');
        Route::get('roles/{role}/edit', [RoleController::class, 'edit'])->name('roles.edit');
        Route::get('permissions', [RoleController::class, 'index'])->name('permissions.index');
        Route::get('audit-log', [SettingController::class, 'auditLog'])->name('audit-log.index');
    });
