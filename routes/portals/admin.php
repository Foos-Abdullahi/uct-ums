<?php

use App\Enums\UserRole;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified', 'role:'.UserRole::SuperAdmin->value])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {
        Route::inertia('dashboard', 'Admin/dashboard')->name('dashboard');
        Route::inertia('users', 'Admin/users/index')->name('users.index');
        Route::inertia('roles', 'Admin/roles/index')->name('roles.index');
        Route::inertia('permissions', 'Admin/permissions/index')->name('permissions.index');
        Route::inertia('audit-log', 'Admin/audit-log/index')->name('audit-log.index');
        Route::inertia('system', 'Admin/system/index')->name('system.index');
    });
