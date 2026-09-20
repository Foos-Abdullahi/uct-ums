<?php

use App\Enums\UserRole;
use App\Http\Controllers\Student\AttendanceController;
use App\Http\Controllers\Student\CertificatesController;
use App\Http\Controllers\Student\CoursesController;
use App\Http\Controllers\Student\DashboardController;
use App\Http\Controllers\Student\DocumentsController;
use App\Http\Controllers\Student\FeesController;
use App\Http\Controllers\Student\GradesController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified', 'role:'.UserRole::Student->value])
    ->prefix('student')
    ->name('student.')
    ->group(function () {
        Route::inertia('fees/locked', 'Student/fees/locked')->name('fees.locked');

        Route::middleware('fee.gate')->group(function () {
            Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
            Route::get('courses', [CoursesController::class, 'index'])->name('courses.index');
            Route::get('grades', [GradesController::class, 'index'])->name('grades.index');
            Route::get('attendance', [AttendanceController::class, 'index'])->name('attendance.index');
            Route::get('fees', [FeesController::class, 'index'])->name('fees.index');
            Route::get('documents', [DocumentsController::class, 'index'])->name('documents.index');
            Route::get('certificates', [CertificatesController::class, 'index'])->name('certificates.index');
        });
    });
