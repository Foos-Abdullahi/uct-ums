<?php

namespace App\Http\Controllers\Admin;

use App\Enums\ExpenseStatus;
use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\Expense;
use App\Models\ExpenseApproval;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ExpenseController extends Controller
{
    /**
     * Display the expense management roster with filters.
     */
    public function index(Request $request): Response
    {
        $search = $request->query('search');
        $status = $request->query('status');
        $accountId = $request->query('account_id');
        $perPage = (int) $request->query('per_page', 10);

        $query = Expense::query()
            ->with(['creator', 'approver', 'approvals.approver', 'account.category'])
            ->when($search, function ($q) use ($search) {
                $q->where(function ($sub) use ($search) {
                    $sub->where('expense_no', 'like', "%{$search}%")
                        ->orWhere('title', 'like', "%{$search}%")
                        ->orWhere('vendor', 'like', "%{$search}%")
                        ->orWhere('budget_line', 'like', "%{$search}%")
                        ->orWhereHas('account', function ($account) use ($search) {
                            $account->where('name', 'like', "%{$search}%")
                                ->orWhere('code', 'like', "%{$search}%");
                        });
                });
            })
            ->when($status && $status !== 'all', fn ($q) => $q->where('status', $status))
            ->when($accountId && $accountId !== 'all', fn ($q) => $q->where('account_id', $accountId))
            ->latest('expense_date');

        return Inertia::render('Admin/finance/expenses', [
            'stats' => Inertia::defer(fn () => [
                'total_spent' => (float) Expense::whereIn('status', ['approved', 'paid'])->sum('amount'),
                'pending_approval' => (int) Expense::where('status', 'pending_approval')->count(),
                'total_expenses' => (int) Expense::count(),
                'month_expenses' => (float) Expense::whereIn('status', ['approved', 'paid'])
                    ->where('expense_date', '>=', now()->startOfMonth())
                    ->sum('amount'),
                'rejected_count' => (int) Expense::where('status', 'rejected')->count(),
            ]),
            'expenses' => Inertia::defer(fn () => $query->paginate($perPage)->withQueryString()),
            'expense_accounts' => $this->expenseAccounts(),
            'expense_statuses' => ExpenseStatus::values(),
            'level_roles' => Expense::APPROVAL_LEVELS,
            'filters' => [
                'search' => $search ?? '',
                'status' => $status ?? 'all',
                'account_id' => $accountId && $accountId !== 'all' ? (int) $accountId : 'all',
                'per_page' => $perPage,
            ],
        ]);
    }

    /**
     * Store a newly created expense.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'account_id' => ['required', 'integer', 'exists:accounts,id'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'expense_date' => ['required', 'date'],
            'vendor' => ['nullable', 'string', 'max:255'],
            'budget_line' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', 'string', 'in:'.implode(',', ExpenseStatus::values())],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $account = Account::findOrFail((int) $validated['account_id']);

        if (! $account->isExpenseAccount()) {
            return back()->withErrors(['account_id' => 'Please choose an expense account from the chart of accounts.'])->withInput();
        }

        $expenseNo = $this->nextExpenseNo();

        $status = $validated['status'] ?? ExpenseStatus::PendingApproval->value;

        $expense = Expense::create([
            ...$validated,
            'expense_type' => $account->legacyExpenseType()->value,
            'expense_no' => $expenseNo,
            'status' => $status,
            'created_by' => $request->user()->id,
        ]);

        // If submitted for approval, create the first approval level
        if ($status === ExpenseStatus::PendingApproval->value) {
            $expense->buildApprovalChain();
        }

        return back()->with('success', "Expense {$expenseNo} of \${$expense->amount} recorded.");
    }

    /**
     * Display a single expense with approvals and payment history.
     */
    public function show(Expense $expense): Response
    {
        $expense->load(['creator', 'approver', 'approvals.approver', 'account.category']);

        return Inertia::render('Admin/finance/expense-details', [
            'expense' => [
                ...$expense->toArray(),
                'level_roles' => Expense::APPROVAL_LEVELS,
                'canApprove' => $expense->needsApproval(),
            ],
        ]);
    }

    /**
     * Update an expense.
     */
    public function update(Request $request, Expense $expense): RedirectResponse
    {
        if (in_array($expense->status, ['paid', 'rejected', 'cancelled'])) {
            return back()->with('error', 'Cannot edit an expense that is paid, rejected, or cancelled.');
        }

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'account_id' => ['required', 'integer', 'exists:accounts,id'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'expense_date' => ['required', 'date'],
            'vendor' => ['nullable', 'string', 'max:255'],
            'budget_line' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $account = Account::findOrFail((int) $validated['account_id']);

        if (! $account->isExpenseAccount()) {
            return back()->withErrors(['account_id' => 'Please choose an expense account from the chart of accounts.'])->withInput();
        }

        $expense->update([
            ...$validated,
            'expense_type' => $account->legacyExpenseType()->value,
        ]);

        return back()->with('success', "Expense {$expense->expense_no} updated.");
    }

    /**
     * Delete an expense (only drafts or rejected are eligible).
     */
    public function destroy(Request $request, Expense $expense): RedirectResponse
    {
        if (! in_array($expense->status, ['draft', 'rejected', 'cancelled', 'pending_approval'])) {
            return back()->with('error', 'Only draft, rejected, cancelled or pending expenses can be deleted.');
        }

        $expense->delete();

        return back()->with('success', "Expense {$expense->expense_no} deleted.");
    }

    /**
     * Mark an expense as paid after it has been approved.
     */
    public function markPaid(Expense $expense): RedirectResponse
    {
        if ($expense->status !== ExpenseStatus::Approved->value) {
            return back()->with('error', 'Only approved expenses can be marked as paid.');
        }

        $expense->update([
            'status' => ExpenseStatus::Paid->value,
        ]);

        return back()->with('success', "Expense {$expense->expense_no} marked as paid.");
    }

    /**
     * Process a single approval level.
     * Any admin with access to this route may approve — the route is gated by role:super_admin.
     */
    public function approve(Request $request, Expense $expense): RedirectResponse
    {
        $validated = $request->validate([
            'comment' => ['nullable', 'string', 'max:1000'],
        ]);

        $approval = $this->currentApproval($expense);

        if (! $approval) {
            return back()->with('error', 'No pending approval to process for this expense.');
        }

        $approval->update([
            'action' => 'approved',
            'approver_id' => $request->user()->id,
            'comment' => $validated['comment'] ?? null,
            'acted_at' => now(),
        ]);

        $approvedCount = $expense->approvedApprovals()->count();

        if ($approvedCount >= count(Expense::APPROVAL_LEVELS)) {
            $expense->update([
                'status' => ExpenseStatus::Approved->value,
                'approved_by' => $request->user()->id,
                'approved_at' => now(),
            ]);

            return back()->with('success', "Expense {$expense->expense_no} fully approved at all levels.");
        }

        $nextLevel = $approvedCount + 1;

        if (! $expense->pendingApprovals()->where('level', $nextLevel)->exists()) {
            $this->createLevelApproval($expense, $nextLevel);
        }

        return back()->with('success', "Approval level {$approval->level} approved. Next approval required.");
    }

    /**
     * Reject an expense at the current approval level.
     * Any admin with access to this route may reject — the route is gated by role:super_admin.
     */
    public function reject(Request $request, Expense $expense): RedirectResponse
    {
        $validated = $request->validate([
            'comment' => ['required', 'string', 'max:1000'],
        ]);

        $approval = $this->currentApproval($expense);

        if (! $approval) {
            return back()->with('error', 'No pending approval to process for this expense.');
        }

        DB::transaction(function () use ($approval, $expense, $validated, $request) {
            $approval->update([
                'action' => 'rejected',
                'approver_id' => $request->user()->id,
                'comment' => $validated['comment'],
                'acted_at' => now(),
            ]);

            $expense->update([
                'status' => ExpenseStatus::Rejected->value,
            ]);
        });

        return back()->with('success', "Expense {$expense->expense_no} rejected at approval level {$approval->level}.");
    }

    /**
     * Update the status of an expense directly.
     */
    public function updateStatus(Request $request, Expense $expense): RedirectResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'string', 'in:'.implode(',', ExpenseStatus::values())],
        ]);

        $expense->update(['status' => $validated['status']]);

        // Reset approval chain when pushed back to draft or pending
        if (in_array($validated['status'], ['draft', 'pending_approval'])) {
            $expense->approvals()->delete();

            if ($validated['status'] === 'pending_approval') {
                $expense->buildApprovalChain();
            }
        }

        return back()->with('success', "Expense {$expense->expense_no} status updated to {$validated['status']}.");
    }

    /**
     * Expense accounts grouped by category, used for recording and filtering.
     *
     * @return array<int, array{id: int, code: int, name: string, normal_balance: string, category: string}>
     */
    private function expenseAccounts(): array
    {
        return Account::query()
            ->with('category')
            ->where('status', 'active')
            ->orderBy('code')
            ->get()
            ->filter(fn (Account $account) => $account->isExpenseAccount())
            ->map(fn (Account $account) => [
                'id' => $account->id,
                'code' => $account->code,
                'name' => $account->name,
                'normal_balance' => $account->normal_balance->value,
                'category' => $account->category?->type->label() ?? '',
            ])
            ->values()
            ->all();
    }

    /**
     * Generate the next sequential expense number.
     */
    private function nextExpenseNo(): string
    {
        return 'EXP-'.date('Y').'-'.str_pad((string) (Expense::withTrashed()->count() + 1), 5, '0', STR_PAD_LEFT);
    }

    /**
     * Get the current pending approval for an expense.
     */
    private function currentApproval(Expense $expense): ?ExpenseApproval
    {
        return $expense->pendingApprovals()
            ->orderBy('level')
            ->first();
    }

    /**
     * Create an approval record for a given level on the expense.
     */
    private function createLevelApproval(Expense $expense, int $level): void
    {
        ExpenseApproval::create([
            'expense_id' => $expense->id,
            'approver_id' => $expense->created_by,
            'level' => $level,
            'action' => 'pending',
        ]);
    }
}
