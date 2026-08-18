<?php

use App\Enums\UserRole;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified', 'role:'.UserRole::Lecturer->value])
    ->prefix('lecturer')
    ->name('lecturer.')
    ->group(function () {
        Route::inertia('dashboard', 'lecturer/dashboard')->name('dashboard');
        Route::inertia('courses', 'lecturer/courses/index')->name('courses.index');
        Route::inertia('attendance', 'lecturer/attendance/index')->name('attendance.index');
        Route::inertia('gradebook', 'lecturer/gradebook/index')->name('gradebook.index');
        Route::inertia('materials', 'lecturer/materials/index')->name('materials.index');
    });
