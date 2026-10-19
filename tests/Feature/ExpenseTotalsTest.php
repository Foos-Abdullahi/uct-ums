<?php

use App\Enums\AccountCategoryType;
use App\Enums\ExpenseStatus;
use App\Enums\UserRole;
use App\Models\Account;
use App\Models\Expense;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
    $this->actingAs(User::factory()->role(UserRole::SuperAdmin)->create());
});

test('a newly recorded pending expense immediately changes expense totals', function () {
    $account = Account::factory()
        ->expenseAccount(AccountCategoryType::ExpensesOperating, 6110)
        ->create();

    $this->post(route('admin.expenses.store'), [
        'title' => 'October electricity',
        'account_id' => $account->id,
        'amount' => 1250.50,
        'expense_date' => now()->toDateString(),
        'status' => ExpenseStatus::PendingApproval->value,
    ])->assertSessionHas('success');

    $expense = Expense::sole();

    expect($expense->status)->toBe(ExpenseStatus::PendingApproval->value)
        ->and((float) Expense::includedInTotals()->sum('amount'))->toBe(1250.50);

    $this->get(route('admin.expenses.index'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/finance/expenses')
            ->loadDeferredProps(fn (Assert $reload) => $reload
                ->where('stats.total_spent', fn ($value) => (float) $value === 1250.50)
                ->where('stats.month_expenses', fn ($value) => (float) $value === 1250.50)
                ->where('stats.pending_approval', 1)));

    $this->get(route('admin.finance.overview'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/finance/index')
            ->loadDeferredProps(fn (Assert $reload) => $reload
                ->where('expense_stats.total_spent', fn ($value) => (float) $value === 1250.50)
                ->where('expense_stats.pending_approval', 1)));
});

test('expense totals include active records once and exclude non financial statuses', function () {
    Expense::factory()->create(['status' => ExpenseStatus::PendingApproval->value, 'amount' => 100]);
    Expense::factory()->approved()->create(['amount' => 200]);
    Expense::factory()->paid()->create(['amount' => 300]);
    Expense::factory()->create(['status' => ExpenseStatus::Draft->value, 'amount' => 400]);
    Expense::factory()->rejected()->create(['amount' => 500]);
    Expense::factory()->create(['status' => ExpenseStatus::Cancelled->value, 'amount' => 600]);

    expect(Expense::includedInTotals()->count())->toBe(3)
        ->and((float) Expense::includedInTotals()->sum('amount'))->toBe(600.0);
});

test('status transitions count an expense once and remove it when rejected', function () {
    $expense = Expense::factory()->create([
        'status' => ExpenseStatus::PendingApproval->value,
        'amount' => 750,
    ]);

    expect((float) Expense::includedInTotals()->sum('amount'))->toBe(750.0);

    $this->patch(route('admin.expenses.status', $expense), [
        'status' => ExpenseStatus::Approved->value,
    ])->assertSessionHas('success');

    expect((float) Expense::includedInTotals()->sum('amount'))->toBe(750.0);

    $this->patch(route('admin.expenses.status', $expense), [
        'status' => ExpenseStatus::Paid->value,
    ])->assertSessionHas('success');

    expect((float) Expense::includedInTotals()->sum('amount'))->toBe(750.0);

    $this->patch(route('admin.expenses.status', $expense), [
        'status' => ExpenseStatus::Rejected->value,
    ])->assertSessionHas('success');

    expect($expense->fresh()->status)->toBe(ExpenseStatus::Rejected->value)
        ->and((float) Expense::includedInTotals()->sum('amount'))->toBe(0.0);
});
