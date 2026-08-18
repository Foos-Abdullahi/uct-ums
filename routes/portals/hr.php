<?php

use App\Enums\UserRole;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified', 'role:'.UserRole::Hr->value])
    ->prefix('hr')
    ->name('hr.')
    ->group(function () {
        Route::inertia('dashboard', 'hr/dashboard')->name('dashboard');
        Route::inertia('staff', 'hr/staff/index')->name('staff.index');
        Route::inertia('leave', 'hr/leave/index')->name('leave.index');
    });
