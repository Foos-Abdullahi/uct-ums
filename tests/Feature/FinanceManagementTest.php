<?php

use App\Enums\AccountCategoryType;
use App\Enums\ExpenseStatus;
use App\Enums\ExpenseType;
use App\Enums\UserRole;
use App\Models\Account;
use App\Models\AccountCategory;
use App\Models\Expense;
use App\Models\Student;
use App\Models\StudentInvoice;
use App\Models\User;
use Database\Seeders\ChartOfAccountsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;

uses(RefreshDatabase::class);

// ─── Expense Index ────────────────────────────────────────────────────────────

test('admin can view the expense index page', function () {
    $admin = User::factory()->role(UserRole::SuperAdmin)->create();
    $this->actingAs($admin);

    $response = $this->get(route('admin.expenses.index'));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page->component('Admin/finance/expenses'));
});

test('admin can filter expenses by status and account', function () {
    $admin = User::factory()->role(UserRole::SuperAdmin)->create();
    $this->actingAs($admin);

    $utilities = Account::factory()->expenseAccount(AccountCategoryType::ExpensesOperating, 6110)->create();
    $salary = Account::factory()->expenseAccount(AccountCategoryType::ExpensesDirectAcademic, 5000)->create();

    Expense::factory()->create(['status' => 'pending_approval', 'expense_type' => 'utilities', 'account_id' => $utilities->id]);
    Expense::factory()->create(['status' => 'paid', 'expense_type' => 'salary', 'account_id' => $salary->id]);

    $response = $this->get(route('admin.expenses.index', [
        'status' => 'pending_approval',
        'account_id' => $utilities->id,
    ]));

    $response->assertOk()->assertInertia(
        fn ($page) => $page->has('filters')
            ->where('filters.status', 'pending_approval')
            ->where('filters.account_id', $utilities->id)
            ->has('expense_accounts')
    );
});

// ─── Expense Create & Store ───────────────────────────────────────────────────

test('admin can create an expense and submit for approval', function () {
    $admin = User::factory()->role(UserRole::SuperAdmin)->create();
    $approver = User::factory()->role(UserRole::Finance)->create();
    $this->actingAs($admin);

    $account = Account::factory()->expenseAccount(AccountCategoryType::ExpensesOperating, 6110)->create();

    $response = $this->post(route('admin.expenses.store'), [
        'title' => 'Electricity bill',
        'description' => 'Monthly campus electricity',
        'account_id' => $account->id,
        'amount' => 1500.50,
        'expense_date' => '2026-09-01',
        'vendor' => 'Golis Electric',
        'budget_line' => 'Operations',
        'status' => 'pending_approval',
    ]);

    $response->assertRedirect();

    $expense = Expense::where('title', 'Electricity bill')->first();

    expect($expense)->not->toBeNull()
        ->and($expense->expense_no)->toStartWith('EXP-')
        ->and($expense->amount)->toBe('1500.50')
        ->and($expense->status)->toBe('pending_approval')
        ->and($expense->account_id)->toBe($account->id);

    // Approval chain was created
    expect($expense->approvals()->count())->toBe(count(Expense::APPROVAL_LEVELS));
});

test('expense requires validation on required fields', function () {
    $admin = User::factory()->role(UserRole::SuperAdmin)->create();
    $this->actingAs($admin);

    $response = $this->post(route('admin.expenses.store'), []);

    $response->assertSessionHasErrors(['title', 'account_id', 'amount', 'expense_date']);
});

test('expense cannot be recorded against a non-expense account', function () {
    $admin = User::factory()->role(UserRole::SuperAdmin)->create();
    $this->actingAs($admin);

    $asset = Account::factory()->expenseAccount(AccountCategoryType::Assets, 1010)->create();

    $response = $this->post(route('admin.expenses.store'), [
        'title' => 'Should fail',
        'account_id' => $asset->id,
        'amount' => 100,
        'expense_date' => '2026-09-01',
        'status' => 'pending_approval',
    ]);

    expect($response->getSession()->get('errors'))->not->toBeNull()
        ->and(Expense::where('title', 'Should fail')->exists())->toBeFalse();
});

// ─── Expense Show ─────────────────────────────────────────────────────────────

test('admin can view expense detail with approval trail', function () {
    $admin = User::factory()->role(UserRole::SuperAdmin)->create();
    $this->actingAs($admin);

    $approver = User::factory()->role(UserRole::Finance)->create();
    $expense = Expense::factory()->create(['status' => 'pending_approval']);
    $expense->buildApprovalChain();

    $response = $this->get(route('admin.expenses.show', $expense));

    $response->assertOk()
        ->assertInertia(
            fn ($page) => $page
                ->component('Admin/finance/expense-details')
                ->has('expense')
        );
});

// ─── Multi-level Approval Workflow ────────────────────────────────────────────

test('approval chain assigns distinct approvers per level when available', function () {
    $admin = User::factory()->role(UserRole::SuperAdmin)->create();
    $finance1 = User::factory()->role(UserRole::Finance)->create();
    $finance2 = User::factory()->role(UserRole::Finance)->create();
    $this->actingAs($admin);

    $expense = Expense::factory()->create(['status' => 'pending_approval']);
    $expense->buildApprovalChain();

    $approvals = $expense->approvals()->orderBy('level')->get();

    // Level 1 should be the finance user
    $level1 = $approvals->firstWhere('level', 1);
    expect($level1->approver_id)->toBe($finance1->id);

    // Level 2 prefers a different user
    $level2 = $approvals->firstWhere('level', 2);
    expect($level2->approver_id)->not->toBe($finance1->id);
});

test('full approval chain marks expense approved', function () {
    $admin = User::factory()->role(UserRole::SuperAdmin)->create();
    User::factory()->role(UserRole::Finance)->count(2)->create();
    $this->actingAs($admin);

    $expense = Expense::factory()->create(['status' => 'pending_approval']);
    $expense->buildApprovalChain();

    $approvals = $expense->approvals()->orderBy('level')->get();

    foreach ($approvals as $approval) {
        $approver = User::find($approval->approver_id);
        $this->actingAs($approver);

        $route = $approver->role === UserRole::SuperAdmin
            ? route('admin.expenses.approve', $expense)
            : route('finance.expenses.approve', $expense);

        $response = $this->post($route, [
            'comment' => "Level {$approval->level} approved",
        ]);

        $response->assertRedirect();
    }

    $expense->refresh();

    expect($expense->status)->toBe('approved')
        ->and($expense->approvedApprovals()->count())->toBe(count(Expense::APPROVAL_LEVELS));
});

test('rejecting an expense at any level marks it rejected', function () {
    $admin = User::factory()->role(UserRole::SuperAdmin)->create();
    User::factory()->role(UserRole::Finance)->create();
    $this->actingAs($admin);

    $expense = Expense::factory()->create(['status' => 'pending_approval']);
    $expense->buildApprovalChain();

    $level1 = $expense->approvals()->where('level', 1)->first();
    $approver = User::find($level1->approver_id);
    $this->actingAs($approver);

    $route = $approver->role === UserRole::SuperAdmin
        ? route('admin.expenses.reject', $expense)
        : route('finance.expenses.reject', $expense);

    $response = $this->post($route, [
        'comment' => 'Insufficient documentation',
    ]);

    $response->assertRedirect();

    $expense->refresh();
    expect($expense->status)->toBe('rejected');
});

test('marked expense as paid only when approved', function () {
    $admin = User::factory()->role(UserRole::SuperAdmin)->create();
    $this->actingAs($admin);

    $pending = Expense::factory()->create(['status' => 'pending_approval']);
    $response = $this->post(route('admin.expenses.mark-paid', $pending));
    $response->assertRedirect();
    expect($pending->refresh()->status)->toBe('pending_approval');

    $approved = Expense::factory()->approved()->create();
    $response = $this->post(route('admin.expenses.mark-paid', $approved));
    expect($approved->refresh()->status)->toBe('paid');
});

// ─── Expense Delete ───────────────────────────────────────────────────────────

test('admin can delete a draft or rejected expense', function () {
    $admin = User::factory()->role(UserRole::SuperAdmin)->create();
    $this->actingAs($admin);

    $expense = Expense::factory()->approved()->create();

    $response = $this->delete(route('admin.expenses.destroy', $expense));
    $response->assertRedirect();

    // Approved expenses can't be deleted
    expect(Expense::find($expense->id))->not->toBeNull();

    $draft = Expense::factory()->create(['status' => 'draft']);
    $this->delete(route('admin.expenses.destroy', $draft));

    expect(Expense::find($draft->id))->toBeNull();
});

// ─── Invoice Line Items ───────────────────────────────────────────────────────

test('admin can create an invoice with line items, tax, and discount', function () {
    $admin = User::factory()->role(UserRole::SuperAdmin)->create();
    $student = Student::factory()->create();
    $this->actingAs($admin);

    $response = $this->post(route('admin.finance.invoices.store'), [
        'student_id' => $student->id,
        'title' => 'Semester Fee Assessment',
        'description' => 'Fall 2026 tuition',
        'type' => 'tuition',
        'amount' => 1100.00,
        'tax_amount' => 50.00,
        'discount_amount' => 100.00,
        'due_date' => '2026-12-31',
        'issue_date' => '2026-09-01',
        'items' => [
            [
                'description' => 'Tuition - Core courses',
                'quantity' => 1,
                'unit_price' => 700.00,
                'amount' => 700.00,
            ],
            [
                'description' => 'Lab fee - Computer Science',
                'quantity' => 2,
                'unit_price' => 200.00,
                'amount' => 400.00,
            ],
        ],
    ]);

    $response->assertRedirect();

    $invoice = StudentInvoice::where('title', 'Semester Fee Assessment')->first();

    expect($invoice)->not->toBeNull()
        ->and($invoice->invoice_no)->toStartWith('INV-')
        ->and($invoice->amount)->toBe('1100.00')
        ->and($invoice->tax_amount)->toBe('50.00')
        ->and($invoice->discount_amount)->toBe('100.00')
        ->and($invoice->status)->toBe('unpaid');

    expect($invoice->items()->count())->toBe(2)
        ->and($invoice->subtotal())->toBeGreaterThan(0);
});

test('admin can view invoice details with line items and payments', function () {
    $admin = User::factory()->role(UserRole::SuperAdmin)->create();
    $this->actingAs($admin);

    $invoice = StudentInvoice::factory()->withItems(2)->create();

    $response = $this->get(route('admin.finance.invoices.show', $invoice));

    $response->assertOk()
        ->assertInertia(
            fn ($page) => $page
                ->component('Admin/finance/invoice-details')
                ->has('invoice')
        );
});

test('admin can update an invoice with no payments collected', function () {
    $admin = User::factory()->role(UserRole::SuperAdmin)->create();
    $this->actingAs($admin);

    $invoice = StudentInvoice::factory()->withItems(2)->create(['paid_amount' => 0]);

    $response = $this->put(route('admin.finance.invoices.update', $invoice), [
        'title' => 'Updated Tuition Fee',
        'type' => 'tuition',
        'amount' => 999.00,
        'tax_amount' => 10.00,
        'discount_amount' => 0,
        'due_date' => '2026-12-31',
        'issue_date' => '2026-09-01',
        'status' => 'unpaid',
        'items' => [
            [
                'id' => $invoice->items()->first()->id,
                'description' => 'Updated line item',
                'quantity' => 3,
                'unit_price' => 333.00,
                'amount' => 999.00,
            ],
        ],
    ]);

    $response->assertRedirect();

    $invoice->refresh();
    expect($invoice->title)->toBe('Updated Tuition Fee')
        ->and($invoice->amount)->toBe('999.00')
        ->and($invoice->items()->count())->toBe(1);
});

// ─── Finance Portal ───────────────────────────────────────────────────────────

test('finance user can view the finance dashboard', function () {
    $finance = User::factory()->role(UserRole::Finance)->create();
    $this->actingAs($finance);

    $response = $this->get(route('finance.dashboard'));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page->component('finance/dashboard'));
});

test('finance user can view the expense roster', function () {
    $finance = User::factory()->role(UserRole::Finance)->create();
    $this->actingAs($finance);

    Expense::factory()->count(3)->create();

    $response = $this->get(route('finance.expenses.index'));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page->component('finance/expenses/index'));
});

test('finance user can view the approval queue', function () {
    $finance = User::factory()->role(UserRole::Finance)->create();
    $this->actingAs($finance);

    $response = $this->get(route('finance.approvals.index'));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page->component('finance/approvals/index'));
});

test('finance user can view invoices and payment rosters', function () {
    $finance = User::factory()->role(UserRole::Finance)->create();
    $this->actingAs($finance);

    $this->get(route('finance.invoices.index'))->assertOk();
    $this->get(route('finance.payments.index'))->assertOk();
});

test('finance user can submit an expense from the finance portal', function () {
    $finance = User::factory()->role(UserRole::Finance)->create();
    $this->actingAs($finance);

    $response = $this->post(route('finance.expenses.store'), [
        'title' => 'Campus maintenance supplies',
        'expense_type' => 'supplies',
        'amount' => 800.00,
        'expense_date' => '2026-09-10',
        'status' => 'pending_approval',
    ]);

    $response->assertRedirect();

    $expense = Expense::where('title', 'Campus maintenance supplies')->first();
    expect($expense)->not->toBeNull()
        ->and($expense->created_by)->toBe($finance->id);
});

// ─── Enum integrity ───────────────────────────────────────────────────────────

test('expense status and type enums expose expected values', function () {
    expect(ExpenseStatus::values())->toBe(['draft', 'pending_approval', 'approved', 'paid', 'rejected', 'cancelled'])
        ->and(ExpenseType::values())->toBe(['salary', 'utilities', 'equipment', 'maintenance', 'supplies', 'others']);
});

// ─── Chart of Accounts ────────────────────────────────────────────────────────

test('chart of accounts seeder seeds the full UCT ledger', function () {
    $this->seed(ChartOfAccountsSeeder::class);

    expect(AccountCategory::count())->toBe(7)
        ->and(Account::count())->toBe(56);

    expect(Account::where('code', 6110)->first()?->name)->toBe('Electricity & Utilities')
        ->and(Account::where('code', 1590)->first()?->normal_balance->value)->toBe('credit')
        ->and(Account::where('code', 7900)->first()?->isExpenseAccount())->toBeTrue()
        ->and(Account::where('code', 4000)->first()?->isExpenseAccount())->toBeFalse();
});

test('chart of accounts seeder backfills legacy expenses onto accounts', function () {
    $expense = Expense::factory()->create(['account_id' => null, 'expense_type' => 'utilities']);

    $this->seed(ChartOfAccountsSeeder::class);

    $expense->refresh();

    expect($expense->account_id)->not->toBeNull()
        ->and(Account::find($expense->account_id)?->code)->toBe(6110);
});

test('admin can view the chart of accounts page', function () {
    $admin = User::factory()->role(UserRole::SuperAdmin)->create();
    $this->actingAs($admin);

    $this->seed(ChartOfAccountsSeeder::class);

    $response = $this->get(route('admin.finance.chart-of-accounts'));

    $response->assertOk()
        ->assertInertia(
            fn ($page) => $page
                ->component('Admin/finance/chart-of-accounts')
                ->has('categories', 7)
        );
});

test('chart of accounts page shows posted expense totals per expense account', function () {
    $admin = User::factory()->role(UserRole::SuperAdmin)->create();
    $this->actingAs($admin);

    $this->seed(ChartOfAccountsSeeder::class);

    $account = Account::where('code', 6110)->first();
    Expense::factory()->paid()->create(['account_id' => $account->id, 'amount' => 500]);

    $response = $this->get(route('admin.finance.chart-of-accounts'));

    $response->assertOk()->assertInertia(
        fn ($page) => $page
            ->where('categories.5.accounts.3.code', 6110)
            ->where('categories.5.accounts.3.expense_count', 1)
            ->where('categories.5.accounts.3.total_amount', 500)
    );
});

// ─── Chart of Accounts — Management Actions ──────────────────────────────────

test('admin can create a new account in the chosen group', function () {
    $admin = User::factory()->role(UserRole::SuperAdmin)->create();
    $this->actingAs($admin);

    $this->seed(ChartOfAccountsSeeder::class);

    $revenue = AccountCategory::where('type', AccountCategoryType::Revenue->value)->first();

    $this->post(route('admin.finance.chart-of-accounts.store'), [
        'account_category_id' => $revenue->id,
        'code' => 4140,
        'name' => 'Graduation Ceremony Fees',
        'description' => 'Gown hire and ceremony charges',
    ])->assertRedirect();

    $account = Account::where('code', 4140)->first();

    expect($account)->not->toBeNull()
        ->and($account->name)->toBe('Graduation Ceremony Fees')
        ->and($account->type->value)->toBe('revenue')
        ->and($account->normal_balance->value)->toBe('credit')
        ->and($account->status->value)->toBe('active')
        ->and($account->histories()->where('action', 'created')->exists())->toBeTrue();
});

test('account creation rejects codes outside the chosen group range', function () {
    $admin = User::factory()->role(UserRole::SuperAdmin)->create();
    $this->actingAs($admin);

    $this->seed(ChartOfAccountsSeeder::class);

    $revenue = AccountCategory::where('type', AccountCategoryType::Revenue->value)->first();

    $this->post(route('admin.finance.chart-of-accounts.store'), [
        'account_category_id' => $revenue->id,
        'code' => 6170,
        'name' => 'Misplaced account',
    ])->assertSessionHasErrors('code');

    expect(Account::where('code', 6170)->doesntExist())->toBeTrue();
});

test('account creation rejects duplicate codes', function () {
    $admin = User::factory()->role(UserRole::SuperAdmin)->create();
    $this->actingAs($admin);

    $this->seed(ChartOfAccountsSeeder::class);

    $revenue = AccountCategory::where('type', AccountCategoryType::Revenue->value)->first();

    $this->post(route('admin.finance.chart-of-accounts.store'), [
        'account_category_id' => $revenue->id,
        'code' => 4000,
        'name' => 'Duplicate tuition revenue',
    ])->assertSessionHasErrors('code');
});

test('admin can update an unused account including its code', function () {
    $admin = User::factory()->role(UserRole::SuperAdmin)->create();
    $this->actingAs($admin);

    $this->seed(ChartOfAccountsSeeder::class);

    $account = Account::where('code', 4900)->first();

    $this->put(route('admin.finance.chart-of-accounts.update', $account), [
        'account_category_id' => $account->account_category_id,
        'code' => 4910,
        'name' => 'Miscellaneous Income',
        'description' => 'Ungrouped sundry income',
    ])->assertRedirect();

    $account->refresh();

    expect($account->code)->toBe(4910)
        ->and($account->name)->toBe('Miscellaneous Income')
        ->and($account->histories()->where('action', 'updated')->exists())->toBeTrue();
});

test('an account with posted transactions cannot change its code or group', function () {
    $admin = User::factory()->role(UserRole::SuperAdmin)->create();
    $this->actingAs($admin);

    $account = Account::factory()->expenseAccount(AccountCategoryType::ExpensesOperating, 6110)->create();
    Expense::factory()->paid()->create(['account_id' => $account->id, 'amount' => 250]);

    $revenue = AccountCategory::factory()->type(AccountCategoryType::Revenue)->create();

    $this->put(route('admin.finance.chart-of-accounts.update', $account), [
        'account_category_id' => $account->account_category_id,
        'code' => 6510,
        'name' => 'Rewired code',
    ])->assertSessionHasErrors('code');

    $this->put(route('admin.finance.chart-of-accounts.update', $account), [
        'account_category_id' => $revenue->id,
        'code' => 6110,
        'name' => 'Rewired group',
    ])->assertSessionHasErrors('account_category_id');

    expect(Account::find($account->id)?->code)->toBe(6110);
});

test('admin can deactivate and reactivate an account', function () {
    $admin = User::factory()->role(UserRole::SuperAdmin)->create();
    $this->actingAs($admin);

    $account = Account::factory()->expenseAccount(AccountCategoryType::ExpensesOperating, 6110)->create();

    $this->post(route('admin.finance.chart-of-accounts.status', $account))->assertRedirect();

    expect($account->refresh()->status->value)->toBe('inactive')
        ->and($account->histories()->where('action', 'deactivated')->exists())->toBeTrue();

    $this->post(route('admin.finance.chart-of-accounts.status', $account))->assertRedirect();

    expect($account->refresh()->status->value)->toBe('active')
        ->and($account->histories()->where('action', 'reactivated')->exists())->toBeTrue();
});

test('accounts with transactions or system accounts cannot be deleted', function () {
    $admin = User::factory()->role(UserRole::SuperAdmin)->create();
    $this->actingAs($admin);

    $this->seed(ChartOfAccountsSeeder::class);

    $system = Account::where('code', 6110)->firstOrFail();
    $this->delete(route('admin.finance.chart-of-accounts.destroy', $system))->assertRedirect();
    expect(Account::find($system->id))->not->toBeNull();

    $used = Account::factory()->expenseAccount(AccountCategoryType::ExpensesDirectAcademic, 5200)->create();
    Expense::factory()->create(['account_id' => $used->id]);
    $this->delete(route('admin.finance.chart-of-accounts.destroy', $used))->assertRedirect();
    expect(Account::find($used->id))->not->toBeNull();

    $unused = Account::factory()->expenseAccount(AccountCategoryType::ExpensesDirectAcademic, 5210)->create();
    $id = $unused->id;
    $this->delete(route('admin.finance.chart-of-accounts.destroy', $unused))->assertRedirect();
    expect(Account::find($id))->toBeNull();
});

test('account detail endpoint reports financial activity', function () {
    $admin = User::factory()->role(UserRole::SuperAdmin)->create();
    $this->actingAs($admin);

    $account = Account::factory()->expenseAccount(AccountCategoryType::ExpensesOperating, 6110)->create();
    Expense::factory()->paid()->create(['account_id' => $account->id, 'amount' => 500]);
    Expense::factory()->create(['account_id' => $account->id, 'status' => 'pending_approval', 'amount' => 125]);

    $this->getJson(route('admin.finance.chart-of-accounts.show', $account))
        ->assertOk()
        ->assertJsonPath('account.code', 6110)
        ->assertJsonPath('account.can_change_code', false)
        ->assertJsonPath('financial.transaction_count', 2)
        ->assertJsonPath('financial.posted_count', 1)
        ->assertJsonPath('financial.total_debits', 500)
        ->assertJsonCount(2, 'recent_transactions');
});

// ─── Chart of Accounts — Excel Import ────────────────────────────────────────

test('import preview validates a workbook without saving rows', function () {
    $admin = User::factory()->role(UserRole::SuperAdmin)->create();
    $this->actingAs($admin);

    $this->seed(ChartOfAccountsSeeder::class);

    $file = UploadedFile::fake()->createWithContent('accounts.csv', implode("\n", [
        'Code,Name,Group,Type,Normal Balance,Description',
        '4910,Custom Training Income,revenue,revenue,credit,New row',
        '6110,Existing Electricity,expenses_operating,expense,debit,Already seeded',
        '9999,Out of Range,,expense,debit,Invalid',
    ]));

    $response = $this->postJson(route('admin.finance.chart-of-accounts.import-preview'), [
        'file' => $file,
    ]);

    $response->assertOk()
        ->assertJsonPath('total', 3)
        ->assertJsonPath('valid', 1)
        ->assertJsonPath('warnings', 1)
        ->assertJsonPath('errors', 1)
        ->assertJsonPath('rows.0.name', 'Custom Training Income')
        ->assertJsonPath('rows.1.warnings.0', 'Code 6110 already exists and will be skipped.')
        ->assertJsonPath('rows.2.errors.0', 'Invalid account code 9999. Codes must be between 1000 and 7999.');

    expect(Account::count())->toBe(56);
});

test('import store creates rows and skips duplicates within a transaction', function () {
    $admin = User::factory()->role(UserRole::SuperAdmin)->create();
    $this->actingAs($admin);

    $this->seed(ChartOfAccountsSeeder::class);

    $this->postJson(route('admin.finance.chart-of-accounts.import-store'), [
        'rows' => [
            ['code' => 4910, 'name' => 'Custom Training Income', 'group' => 'revenue', 'description' => 'New'],
            ['code' => 6110, 'name' => 'Already Seeded', 'group' => 'expenses_operating', 'description' => 'Duplicate'],
            ['code' => 4910, 'name' => 'Duplicated Within File', 'group' => 'revenue', 'description' => null],
        ],
    ])->assertOk()
        ->assertJsonPath('imported', 1)
        ->assertJsonPath('skipped', 2);

    $imported = Account::where('code', 4910)->first();

    expect($imported)->not->toBeNull()
        ->and($imported->name)->toBe('Custom Training Income')
        ->and($imported->type->value)->toBe('revenue')
        ->and($imported->is_system)->toBeFalse()
        ->and($imported->histories()->where('action', 'imported')->exists())->toBeTrue();
});
