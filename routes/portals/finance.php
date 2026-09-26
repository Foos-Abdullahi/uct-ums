<?php

use App\Enums\UserRole;
use App\Http\Controllers\Finance\FinanceController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified', 'role:'.UserRole::Finance->value])
    ->prefix('finance')
    ->name('finance.')
    ->group(function () {
        Route::get('dashboard', [FinanceController::class, 'dashboard'])->name('dashboard');
        Route::inertia('fee-structures', 'finance/fee-structures/index')
            ->middleware('permission:finance.view')->name('fee-structures.index');
        Route::inertia('overrides', 'finance/overrides/index')
            ->middleware('permission:finance.view')->name('overrides.index');
        Route::inertia('reports', 'finance/reports/index')
            ->middleware('permission:reports.view')->name('reports.index');

        // Invoices
        Route::middleware('permission:finance.view')->group(function () {
            Route::get('invoices', [FinanceController::class, 'invoices'])->name('invoices.index');
            Route::get('invoices/{invoice}', [FinanceController::class, 'showInvoice'])->name('invoices.show');
        });

        // Payments
        Route::get('payments', [FinanceController::class, 'payments'])
            ->middleware('permission:finance.view')->name('payments.index');
        Route::patch('payments/{payment}/status', [FinanceController::class, 'updatePaymentStatus'])
            ->middleware('permission:finance.payments.verify')->name('payments.status');

        // Expenses
        Route::middleware('permission:finance.expenses.view')->group(function () {
            Route::get('expenses', [FinanceController::class, 'expenses'])->name('expenses.index');
            Route::get('expenses/{expense}', [FinanceController::class, 'showExpense'])->name('expenses.show');
        });
        Route::post('expenses', [FinanceController::class, 'storeExpense'])
            ->middleware('permission:finance.expenses.create')->name('expenses.store');
        Route::middleware('permission:finance.expenses.approve')->group(function () {
            Route::post('expenses/{expense}/approve', [FinanceController::class, 'approveExpense'])->name('expenses.approve');
            Route::post('expenses/{expense}/reject', [FinanceController::class, 'rejectExpense'])->name('expenses.reject');
            Route::post('expenses/{expense}/mark-paid', [FinanceController::class, 'markExpensePaid'])->name('expenses.mark-paid');
        });

        // Approval Queue
        Route::get('approvals', [FinanceController::class, 'approvals'])
            ->middleware('permission:finance.expenses.approve')->name('approvals.index');
    });
