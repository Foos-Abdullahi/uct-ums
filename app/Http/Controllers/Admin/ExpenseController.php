<?php

namespace App\Http\Controllers\Admin;

use App\Enums\AccountType;
use App\Enums\ExpenseStatus;
use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\Expense;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
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
                'total_spent' => (float) Expense::includedInTotals()->sum('amount'),
                'total_recorded' => (float) Expense::sum('amount'),
                'paid_expenses' => (float) Expense::where('status', 'paid')->sum('amount'),
                'draft_expenses' => (float) Expense::where('status', 'draft')->sum('amount'),
                'pending_approval' => (int) Expense::where('status', 'pending_approval')->count(),
                'total_expenses' => (int) Expense::count(),
                'month_expenses' => (float) Expense::includedInTotals()
                    ->where('expense_date', '>=', now()->startOfMonth())
                    ->sum('amount'),
                'rejected_count' => (int) Expense::where('status', 'rejected')->count(),
            ]),
            'expenses' => Inertia::defer(fn () => $query->paginate($perPage)->withQueryString()),
            'expense_accounts' => $this->expenseAccounts(),
            'payment_accounts' => $this->paymentAccounts(),
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
        // New expenses are treated as paid unless the user explicitly saves a draft.
        $request->merge(['status' => $request->input('status') ?: ExpenseStatus::Paid->value]);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'account_id' => ['required', 'integer', 'exists:accounts,id'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'expense_date' => ['required', 'date'],
            'vendor' => ['nullable', 'string', 'max:255'],
            'budget_line' => ['nullable', 'string', 'max:255'],
            'status' => ['required', 'string', 'in:draft,pending_approval,paid'],
            'payment_method' => ['required_if:status,paid', 'nullable', 'string', 'in:cash,bank_transfer,mobile_money,card,cheque'],
            'payment_account_id' => ['required_if:status,paid', 'nullable', 'integer', 'exists:accounts,id'],
            'reference_no' => ['nullable', 'string', 'max:255'],
            'paid_at' => ['required_if:status,paid', 'nullable', 'date'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $account = Account::findOrFail((int) $validated['account_id']);

        if (! $account->isExpenseAccount()) {
            return back()->withErrors(['account_id' => 'Please choose an expense account from the chart of accounts.'])->withInput();
        }

        $expenseNo = $this->nextExpenseNo();

        $status = $validated['status'];

        if ($status === ExpenseStatus::Paid->value && ! empty($validated['payment_account_id'])) {
            $paymentAccount = Account::findOrFail((int) $validated['payment_account_id']);
            if ($paymentAccount->type !== AccountType::Asset) {
                return back()->withErrors(['payment_account_id' => 'Choose a cash, bank, or mobile money asset account.'])->withInput();
            }
        }

        $expense = Expense::create([
            ...$validated,
            'expense_type' => $account->legacyExpenseType()->value,
            'expense_no' => $expenseNo,
            'status' => $status,
            'payment_method' => $status === ExpenseStatus::Paid->value ? $validated['payment_method'] : null,
            'payment_account_id' => $status === ExpenseStatus::Paid->value ? $validated['payment_account_id'] : null,
            'reference_no' => $status === ExpenseStatus::Paid->value ? ($validated['reference_no'] ?? null) : null,
            'paid_at' => $status === ExpenseStatus::Paid->value ? $validated['paid_at'] : null,
            'created_by' => $request->user()->id,
        ]);

        if ($status === ExpenseStatus::PendingApproval->value) {
            $expense->buildApprovalChain();
        }

        $message = match ($status) {
            ExpenseStatus::Draft->value => "Expense {$expenseNo} saved as a draft.",
            ExpenseStatus::PendingApproval->value => "Expense {$expenseNo} submitted for approval.",
            default => "Expense {$expenseNo} of \${$expense->amount} recorded as paid.",
        };

        return back()->with('success', $message);
    }

    /**
     * Display a single expense with approvals and payment history.
     */
    public function show(Expense $expense): Response
    {
        $expense->load(['creator', 'approver', 'approvals.approver', 'account.category', 'paymentAccount']);

        return Inertia::render('Admin/finance/expense-details', [
            'expense' => [
                ...$expense->toArray(),
                'level_roles' => Expense::APPROVAL_LEVELS,
                'canApprove' => $expense->needsApproval(),
            ],
            'payment_accounts' => $this->paymentAccounts(),
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
    public function markPaid(Request $request, Expense $expense): RedirectResponse
    {
        if ($expense->status !== ExpenseStatus::Approved->value) {
            return back()->withErrors([
                'expense' => 'Only approved expenses can be marked as paid.',
            ]);
        }

        $validated = $request->validate([
            'payment_method' => ['required', 'string', 'in:cash,bank_transfer,mobile_money,card,cheque'],
            'payment_account_id' => ['required', 'integer', 'exists:accounts,id'],
            'reference_no' => ['nullable', 'string', 'max:255'],
            'paid_at' => ['required', 'date'],
        ]);

        $paymentAccount = Account::findOrFail((int) $validated['payment_account_id']);
        if ($paymentAccount->type !== AccountType::Asset) {
            return back()->withErrors(['payment_account_id' => 'Choose a cash, bank, or mobile money asset account.']);
        }

        $expense->update([
            'status' => ExpenseStatus::Paid->value,
            'payment_method' => $validated['payment_method'],
            'payment_account_id' => $paymentAccount->id,
            'reference_no' => $validated['reference_no'] ?? null,
            'paid_at' => $validated['paid_at'],
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

        $result = DB::transaction(function () use ($expense, $request, $validated): array {
            $lockedExpense = Expense::query()
                ->lockForUpdate()
                ->findOrFail($expense->id);

            if ($lockedExpense->status !== ExpenseStatus::PendingApproval->value) {
                return [
                    'success' => false,
                    'message' => 'This expense is no longer pending approval. Refresh the page to see its current status.',
                ];
            }

            if ($lockedExpense->approvals()->where('action', 'rejected')->exists()) {
                return [
                    'success' => false,
                    'message' => 'This approval chain contains a rejection. Return the expense to draft, then submit it again.',
                ];
            }

            $approval = $lockedExpense->pendingApprovals()
                ->orderBy('level')
                ->lockForUpdate()
                ->first();

            if (! $approval) {
                return [
                    'success' => false,
                    'message' => 'No pending approval step is available. Return the expense to draft and submit it again.',
                ];
            }

            $approval->update([
                'action' => 'approved',
                'approver_id' => $request->user()->id,
                'comment' => $validated['comment'] ?? null,
                'acted_at' => now(),
            ]);

            if ($lockedExpense->pendingApprovals()->exists()) {
                return [
                    'success' => true,
                    'message' => "Approval level {$approval->level} completed. The next approval is now pending.",
                ];
            }

            $lockedExpense->update([
                'status' => ExpenseStatus::Approved->value,
                'approved_by' => $request->user()->id,
                'approved_at' => now(),
            ]);

            return [
                'success' => true,
                'message' => "Expense {$lockedExpense->expense_no} is fully approved and ready for payment.",
            ];
        }, 3);

        if (! $result['success']) {
            return back()->withErrors(['expense' => $result['message']]);
        }

        return back()->with('success', $result['message']);
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

        $result = DB::transaction(function () use ($expense, $validated, $request): array {
            $lockedExpense = Expense::query()
                ->lockForUpdate()
                ->findOrFail($expense->id);

            if ($lockedExpense->status !== ExpenseStatus::PendingApproval->value) {
                return [
                    'success' => false,
                    'message' => 'This expense is no longer pending approval. Refresh the page to see its current status.',
                ];
            }

            if ($lockedExpense->approvals()->where('action', 'rejected')->exists()) {
                return [
                    'success' => false,
                    'message' => 'This approval chain already contains a rejection. Return the expense to draft before starting again.',
                ];
            }

            $approval = $lockedExpense->pendingApprovals()
                ->orderBy('level')
                ->lockForUpdate()
                ->first();

            if (! $approval) {
                return [
                    'success' => false,
                    'message' => 'No pending approval step is available. Return the expense to draft and submit it again.',
                ];
            }

            $approval->update([
                'action' => 'rejected',
                'approver_id' => $request->user()->id,
                'comment' => $validated['comment'],
                'acted_at' => now(),
            ]);

            $lockedExpense->pendingApprovals()->delete();

            $lockedExpense->update([
                'status' => ExpenseStatus::Rejected->value,
                'approved_by' => null,
                'approved_at' => null,
            ]);

            return [
                'success' => true,
                'message' => "Expense {$lockedExpense->expense_no} was rejected at approval level {$approval->level}.",
            ];
        }, 3);

        if (! $result['success']) {
            return back()->withErrors(['expense' => $result['message']]);
        }

        return back()->with('success', $result['message']);
    }

    /**
     * Update the status of an expense directly.
     */
    public function updateStatus(Request $request, Expense $expense): RedirectResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'string', Rule::in(ExpenseStatus::values())],
        ]);

        $nextStatus = ExpenseStatus::from($validated['status']);
        $allowedTransitions = match ($expense->status) {
            ExpenseStatus::Draft->value => [ExpenseStatus::PendingApproval, ExpenseStatus::Cancelled],
            ExpenseStatus::PendingApproval->value => [ExpenseStatus::Draft, ExpenseStatus::Cancelled],
            ExpenseStatus::Rejected->value, ExpenseStatus::Cancelled->value => [ExpenseStatus::Draft, ExpenseStatus::PendingApproval],
            default => [],
        };

        if (! in_array($nextStatus, $allowedTransitions, true)) {
            return back()->withErrors([
                'status' => 'That status change is not allowed. Use Approve, Reject, or Record Payment for the next step.',
            ]);
        }

        DB::transaction(function () use ($expense, $nextStatus): void {
            $lockedExpense = Expense::query()
                ->lockForUpdate()
                ->findOrFail($expense->id);

            $lockedExpense->approvals()->delete();
            $lockedExpense->update([
                'status' => $nextStatus->value,
                'approved_by' => null,
                'approved_at' => null,
            ]);

            if ($nextStatus === ExpenseStatus::PendingApproval) {
                $lockedExpense->buildApprovalChain();
            }
        }, 3);

        $message = match ($nextStatus) {
            ExpenseStatus::PendingApproval => "Expense {$expense->expense_no} submitted for approval.",
            ExpenseStatus::Draft => "Expense {$expense->expense_no} returned to draft.",
            ExpenseStatus::Cancelled => "Expense {$expense->expense_no} cancelled.",
            default => "Expense {$expense->expense_no} status updated.",
        };

        return back()->with('success', $message);
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

    /** @return array<int, array{id: int, code: int, name: string}> */
    private function paymentAccounts(): array
    {
        return Account::query()
            ->where('status', 'active')
            ->where('type', AccountType::Asset->value)
            ->orderBy('code')
            ->get(['id', 'code', 'name'])
            ->toArray();
    }

    /**
     * Generate the next sequential expense number.
     */
    private function nextExpenseNo(): string
    {
        return 'EXP-'.date('Y').'-'.str_pad((string) (Expense::withTrashed()->count() + 1), 5, '0', STR_PAD_LEFT);
    }
}
