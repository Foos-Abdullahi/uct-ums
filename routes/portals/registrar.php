<?php

use App\Enums\UserRole;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified', 'role:'.UserRole::Registrar->value])
    ->prefix('registrar')
    ->name('registrar.')
    ->group(function () {
        Route::inertia('dashboard', 'registrar/dashboard')->name('dashboard');
        Route::inertia('admissions', 'registrar/admissions/index')
            ->middleware('permission:admissions.view')->name('admissions.index');
        Route::inertia('students', 'registrar/students/index')
            ->middleware('permission:students.view')->name('students.index');
        Route::inertia('programs', 'registrar/programs/index')
            ->middleware('permission:academics.programs')->name('programs.index');
        Route::inertia('courses', 'registrar/courses/index')
            ->middleware('permission:academics.courses')->name('courses.index');
        Route::inertia('sections', 'registrar/sections/index')
            ->middleware('permission:academics.courses')->name('sections.index');
        Route::inertia('semesters', 'registrar/semesters/index')
            ->middleware('permission:academics.semesters')->name('semesters.index');
        Route::inertia('enrollments', 'registrar/enrollments/index')
            ->middleware('permission:academics.enrollments')->name('enrollments.index');
        Route::inertia('transcripts', 'registrar/transcripts/index')
            ->middleware('permission:academics.transcripts')->name('transcripts.index');
    });
