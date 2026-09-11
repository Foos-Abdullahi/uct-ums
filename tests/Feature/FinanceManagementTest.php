<?php

use App\Enums\ExpenseStatus;
use App\Enums\ExpenseType;
use App\Enums\UserRole;
use App\Models\Expense;
use App\Models\Student;
use App\Models\StudentInvoice;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

// ─── Expense Index ────────────────────────────────────────────────────────────

test('admin can view the expense index page', function () {
    $admin = User::factory()->role(UserRole::SuperAdmin)->create();
    $this->actingAs($admin);

    $response = $this->get(route('admin.expenses.index'));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page->component('Admin/finance/expenses'));
});

test('admin can filter expenses by status and type', function () {
    $admin = User::factory()->role(UserRole::SuperAdmin)->create();
    $this->actingAs($admin);

    Expense::factory()->create(['status' => 'pending_approval', 'expense_type' => 'utilities']);
    Expense::factory()->create(['status' => 'paid', 'expense_type' => 'salary']);

    $response = $this->get(route('admin.expenses.index', [
        'status' => 'pending_approval',
        'expense_type' => 'utilities',
    ]));

    $response->assertOk()->assertInertia(
        fn ($page) => $page->has('filters')
            ->where('filters.status', 'pending_approval')
            ->where('filters.expense_type', 'utilities')
    );
});

// ─── Expense Create & Store ───────────────────────────────────────────────────

test('admin can create an expense and submit for approval', function () {
    $admin = User::factory()->role(UserRole::SuperAdmin)->create();
    $approver = User::factory()->role(UserRole::Finance)->create();
    $this->actingAs($admin);

    $response = $this->post(route('admin.expenses.store'), [
        'title' => 'Electricity bill',
        'description' => 'Monthly campus electricity',
        'expense_type' => 'utilities',
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
        ->and($expense->expense_type)->toBe('utilities');

    // Approval chain was created
    expect($expense->approvals()->count())->toBe(count(Expense::APPROVAL_LEVELS));
});

test('expense requires validation on required fields', function () {
    $admin = User::factory()->role(UserRole::SuperAdmin)->create();
    $this->actingAs($admin);

    $response = $this->post(route('admin.expenses.store'), []);

    $response->assertSessionHasErrors(['title', 'expense_type', 'amount', 'expense_date']);
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
