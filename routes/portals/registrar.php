<?php

use App\Enums\UserRole;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified', 'role:'.UserRole::Registrar->value])
    ->prefix('registrar')
    ->name('registrar.')
    ->group(function () {
        Route::inertia('dashboard', 'registrar/dashboard')->name('dashboard');
        Route::inertia('admissions', 'registrar/admissions/index')->name('admissions.index');
        Route::inertia('students', 'registrar/students/index')->name('students.index');
        Route::inertia('programs', 'registrar/programs/index')->name('programs.index');
        Route::inertia('courses', 'registrar/courses/index')->name('courses.index');
        Route::inertia('sections', 'registrar/sections/index')->name('sections.index');
        Route::inertia('semesters', 'registrar/semesters/index')->name('semesters.index');
        Route::inertia('enrollments', 'registrar/enrollments/index')->name('enrollments.index');
        Route::inertia('transcripts', 'registrar/transcripts/index')->name('transcripts.index');
    });
