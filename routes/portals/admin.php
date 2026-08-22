<?php

use App\Enums\UserRole;
use App\Http\Controllers\Admin\AdmissionController;
use App\Http\Controllers\Admin\AssignmentController;
use App\Http\Controllers\Admin\LecturerController;
use App\Http\Controllers\Admin\StudentController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified', 'role:'.UserRole::SuperAdmin->value])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {
        Route::inertia('dashboard', 'Admin/dashboard')->name('dashboard');

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

        Route::inertia('users', 'Admin/users/index')->name('users.index');
        Route::inertia('roles', 'Admin/roles/index')->name('roles.index');
        Route::inertia('permissions', 'Admin/permissions/index')->name('permissions.index');
        Route::inertia('audit-log', 'Admin/audit-log/index')->name('audit-log.index');
        Route::inertia('system', 'Admin/system/index')->name('system.index');
    });
