<?php

use App\Enums\UserRole;
use App\Http\Controllers\Admin\AdmissionController;
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

        Route::inertia('users', 'Admin/users/index')->name('users.index');
        Route::inertia('roles', 'Admin/roles/index')->name('roles.index');
        Route::inertia('permissions', 'Admin/permissions/index')->name('permissions.index');
        Route::inertia('audit-log', 'Admin/audit-log/index')->name('audit-log.index');
        Route::inertia('system', 'Admin/system/index')->name('system.index');
    });
