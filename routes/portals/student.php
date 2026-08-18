<?php

use App\Enums\UserRole;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified', 'role:'.UserRole::Student->value])
    ->prefix('student')
    ->name('student.')
    ->group(function () {
        Route::inertia('fees/locked', 'Student/fees/locked')->name('fees.locked');

        Route::middleware('fee.gate')->group(function () {
            Route::inertia('dashboard', 'Student/dashboard')->name('dashboard');
            Route::inertia('courses', 'Student/courses/index')->name('courses.index');
            Route::inertia('grades', 'Student/grades/index')->name('grades.index');
            Route::inertia('attendance', 'Student/attendance/index')->name('attendance.index');
            Route::inertia('fees', 'Student/fees/index')->name('fees.index');
            Route::inertia('documents', 'Student/documents/index')->name('documents.index');
        });
    });
