<?php

use App\Enums\UserRole;
use App\Http\Controllers\Finance\FinanceController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified', 'role:'.UserRole::Finance->value])
    ->prefix('finance')
    ->name('finance.')
    ->group(function () {
        Route::get('dashboard', [FinanceController::class, 'dashboard'])->name('dashboard');
        Route::inertia('fee-structures', 'finance/fee-structures/index')->name('fee-structures.index');
        Route::inertia('overrides', 'finance/overrides/index')->name('overrides.index');
        Route::inertia('reports', 'finance/reports/index')->name('reports.index');

        // Invoices
        Route::get('invoices', [FinanceController::class, 'invoices'])->name('invoices.index');
        Route::get('invoices/{invoice}', [FinanceController::class, 'showInvoice'])->name('invoices.show');

        // Payments
        Route::get('payments', [FinanceController::class, 'payments'])->name('payments.index');
        Route::patch('payments/{payment}/status', [FinanceController::class, 'updatePaymentStatus'])->name('payments.status');

        // Expenses
        Route::get('expenses', [FinanceController::class, 'expenses'])->name('expenses.index');
        Route::post('expenses', [FinanceController::class, 'storeExpense'])->name('expenses.store');
        Route::get('expenses/{expense}', [FinanceController::class, 'showExpense'])->name('expenses.show');
        Route::post('expenses/{expense}/approve', [FinanceController::class, 'approveExpense'])->name('expenses.approve');
        Route::post('expenses/{expense}/reject', [FinanceController::class, 'rejectExpense'])->name('expenses.reject');
        Route::post('expenses/{expense}/mark-paid', [FinanceController::class, 'markExpensePaid'])->name('expenses.mark-paid');

        // Approval Queue
        Route::get('approvals', [FinanceController::class, 'approvals'])->name('approvals.index');
    });
