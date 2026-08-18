<?php

use App\Enums\UserRole;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified', 'role:'.UserRole::Finance->value])
    ->prefix('finance')
    ->name('finance.')
    ->group(function () {
        Route::inertia('dashboard', 'finance/dashboard')->name('dashboard');
        Route::inertia('fee-structures', 'finance/fee-structures/index')->name('fee-structures.index');
        Route::inertia('invoices', 'finance/invoices/index')->name('invoices.index');
        Route::inertia('payments', 'finance/payments/index')->name('payments.index');
        Route::inertia('overrides', 'finance/overrides/index')->name('overrides.index');
        Route::inertia('reports', 'finance/reports/index')->name('reports.index');
    });
