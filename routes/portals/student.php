<?php

use App\Enums\UserRole;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified', 'role:'.UserRole::Student->value])
    ->prefix('student')
    ->name('student.')
    ->group(function () {
        Route::inertia('fees/locked', 'student/fees/locked')->name('fees.locked');

        Route::middleware('fee.gate')->group(function () {
            Route::inertia('dashboard', 'student/dashboard')->name('dashboard');
            Route::inertia('courses', 'student/courses/index')->name('courses.index');
            Route::inertia('grades', 'student/grades/index')->name('grades.index');
            Route::inertia('attendance', 'student/attendance/index')->name('attendance.index');
            Route::inertia('fees', 'student/fees/index')->name('fees.index');
            Route::inertia('documents', 'student/documents/index')->name('documents.index');
        });
    });
