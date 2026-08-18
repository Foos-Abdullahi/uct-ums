<?php

use App\Enums\UserRole;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified', 'role:'.UserRole::SuperAdmin->value])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {
        Route::inertia('dashboard', 'admin/dashboard')->name('dashboard');
        Route::inertia('users', 'admin/users/index')->name('users.index');
        Route::inertia('roles', 'admin/roles/index')->name('roles.index');
        Route::inertia('permissions', 'admin/permissions/index')->name('permissions.index');
        Route::inertia('audit-log', 'admin/audit-log/index')->name('audit-log.index');
        Route::inertia('system', 'admin/system/index')->name('system.index');
    });
