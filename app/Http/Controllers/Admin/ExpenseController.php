<?php

namespace App\Http\Controllers\Admin;

use App\Enums\ExpenseStatus;
use App\Enums\ExpenseType;
use App\Http\Controllers\Controller;
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
        $type = $request->query('expense_type');
        $perPage = (int) $request->query('per_page', 10);

        $query = Expense::query()
            ->with(['creator', 'approver', 'approvals.approver'])
            ->when($search, function ($q) use ($search) {
                $q->where(function ($sub) use ($search) {
                    $sub->where('expense_no', 'like', "%{$search}%")
                        ->orWhere('title', 'like', "%{$search}%")
                        ->orWhere('vendor', 'like', "%{$search}%")
                        ->orWhere('budget_line', 'like', "%{$search}%");
                });
            })
            ->when($status && $status !== 'all', fn ($q) => $q->where('status', $status))
            ->when($type && $type !== 'all', fn ($q) => $q->where('expense_type', $type))
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
            'expense_types' => ExpenseType::values(),
            'expense_statuses' => ExpenseStatus::values(),
            'level_roles' => Expense::APPROVAL_LEVELS,
            'filters' => [
                'search' => $search ?? '',
                'status' => $status ?? 'all',
                'expense_type' => $type ?? 'all',
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
            'expense_type' => ['required', 'string', 'in:'.implode(',', ExpenseType::values())],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'expense_date' => ['required', 'date'],
            'vendor' => ['nullable', 'string', 'max:255'],
            'budget_line' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', 'string', 'in:'.implode(',', ExpenseStatus::values())],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $expenseNo = $this->nextExpenseNo();

        $status = $validated['status'] ?? ExpenseStatus::PendingApproval->value;

        $expense = Expense::create([
            ...$validated,
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
        $expense->load(['creator', 'approver', 'approvals.approver']);

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
            'expense_type' => ['required', 'string', 'in:'.implode(',', ExpenseType::values())],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'expense_date' => ['required', 'date'],
            'vendor' => ['nullable', 'string', 'max:255'],
            'budget_line' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $expense->update($validated);

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

        if ($approval->approver_id !== $request->user()->id) {
            return back()->with('error', 'You are not assigned to approve this expense at this level.');
        }

        $approval->update([
            'action' => 'approved',
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

        if ($approval->approver_id !== $request->user()->id) {
            return back()->with('error', 'You are not assigned to approve this expense at this level.');
        }

        DB::transaction(function () use ($approval, $expense, $validated) {
            $approval->update([
                'action' => 'rejected',
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
}
