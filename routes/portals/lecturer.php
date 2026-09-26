<?php

use App\Enums\UserRole;
use App\Http\Controllers\Lecturer\AttendanceController;
use App\Http\Controllers\Lecturer\CourseController;
use App\Http\Controllers\Lecturer\DashboardController;
use App\Http\Controllers\Lecturer\GradebookController;
use App\Http\Controllers\Lecturer\MaterialController;
use App\Http\Controllers\Lecturer\StudentController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified', 'role:'.UserRole::Lecturer->value])
    ->prefix('lecturer')
    ->name('lecturer.')
    ->group(function () {
        // Dashboard
        Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

        // Courses
        Route::get('courses', [CourseController::class, 'index'])->name('courses.index');
        Route::get('courses/{course}', [CourseController::class, 'show'])->name('courses.show');

        // Students roster
        Route::get('students', [StudentController::class, 'index'])->name('students.index');

        // Attendance
        Route::get('attendance', [AttendanceController::class, 'index'])->name('attendance.index');
        Route::post('attendance', [AttendanceController::class, 'store'])->name('attendance.store');
        Route::delete('attendance/{attendance}', [AttendanceController::class, 'destroy'])->name('attendance.destroy');

        // Gradebook
        Route::get('gradebook', [GradebookController::class, 'index'])->name('gradebook.index');
        Route::post('gradebook', [GradebookController::class, 'store'])->name('gradebook.store');

        // Course Materials
        Route::get('materials', [MaterialController::class, 'index'])->name('materials.index');
        Route::post('materials', [MaterialController::class, 'store'])->name('materials.store');
        Route::get('materials/{material}/download', [MaterialController::class, 'download'])->name('materials.download');
        Route::delete('materials/{material}', [MaterialController::class, 'destroy'])->name('materials.destroy');
    });
