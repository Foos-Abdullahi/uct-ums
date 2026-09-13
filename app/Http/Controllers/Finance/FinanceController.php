<?php

namespace App\Http\Controllers\Finance;

use App\Enums\ExpenseStatus;
use App\Enums\ExpenseType;
use App\Http\Controllers\Controller;
use App\Models\Expense;
use App\Models\ExpenseApproval;
use App\Models\StudentInvoice;
use App\Models\StudentPayment;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class FinanceController extends Controller
{
    /**
     * Display the finance portal dashboard.
     */
    public function dashboard(): Response
    {
        $financeUser = auth()->user();

        return Inertia::render('finance/dashboard', [
            'stats' => Inertia::defer(fn () => [
                'total_collected' => (float) StudentPayment::where('status', 'paid')->sum('amount'),
                'total_billed' => (float) StudentInvoice::sum('amount'),
                'outstanding' => (float) StudentInvoice::selectRaw('COALESCE(SUM(amount - paid_amount), 0) as balance')->value('balance'),
                'total_expenses' => (float) Expense::whereIn('status', ['approved', 'paid'])->sum('amount'),
                'pending_approvals' => (int) ExpenseApproval::where('approver_id', $financeUser->id)
                    ->where('action', 'pending')
                    ->count(),
                'net_flow' => (float) StudentPayment::where('status', 'paid')->sum('amount')
                    - Expense::whereIn('status', ['approved', 'paid'])->sum('amount'),
            ]),
            'recent_payments' => Inertia::defer(fn () => StudentPayment::with(['student.user', 'student.program', 'invoice'])
                ->latest('payment_date')
                ->take(8)
                ->get()
            ),
            'recent_invoices' => Inertia::defer(fn () => StudentInvoice::with(['student.user'])
                ->latest()
                ->take(6)
                ->get()
            ),
            'recent_expenses' => Inertia::defer(fn () => Expense::with(['creator', 'approvals.approver'])
                ->latest('expense_date')
                ->take(6)
                ->get()
            ),
            'expenses_by_type' => Inertia::defer(fn () => Expense::whereIn('status', ['approved', 'paid'])
                ->select('expense_type', DB::raw('SUM(amount) as total'), DB::raw('COUNT(*) as count'))
                ->groupBy('expense_type')
                ->get()
            ),
            'revenue_by_method' => Inertia::defer(fn () => StudentPayment::where('status', 'paid')
                ->select('payment_method', DB::raw('SUM(amount) as total'), DB::raw('COUNT(*) as count'))
                ->groupBy('payment_method')
                ->get()
            ),
        ]);
    }

    /**
     * My approval queue.
     */
    public function approvals(Request $request): Response
    {
        $financeUser = auth()->user();

        $status = $request->query('status');
        $perPage = (int) $request->query('per_page', 10);

        $query = Expense::whereHas('approvals', function ($q) use ($financeUser) {
            $q->where('approver_id', $financeUser->id);
        })
            ->with(['creator', 'approver', 'approvals.approver'])
            ->when($status && $status !== 'all', fn ($q) => $q->where('status', $status))
            ->latest('expense_date');

        return Inertia::render('finance/approvals/index', [
            'expenses' => Inertia::defer(fn () => $query->paginate($perPage)->withQueryString()),
            'expense_types' => ExpenseType::values(),
            'expense_statuses' => ExpenseStatus::values(),
            'level_roles' => Expense::APPROVAL_LEVELS,
            'stats' => Inertia::defer(fn () => [
                'my_pending' => (int) ExpenseApproval::where('approver_id', $financeUser->id)
                    ->where('action', 'pending')
                    ->count(),
                'my_approved' => (int) ExpenseApproval::where('approver_id', $financeUser->id)
                    ->where('action', 'approved')
                    ->count(),
                'my_rejected' => (int) ExpenseApproval::where('approver_id', $financeUser->id)
                    ->where('action', 'rejected')
                    ->count(),
                'total_pending_amount' => (float) Expense::where('status', 'pending_approval')
                    ->whereHas('approvals', fn ($q) => $q->where('approver_id', $financeUser->id)->where('action', 'pending'))
                    ->sum('amount'),
            ]),
            'filters' => [
                'status' => $status ?? 'all',
                'per_page' => $perPage,
            ],
        ]);
    }

    /**
     * Display the finance expense management roster.
     */
    public function expenses(Request $request): Response
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

        return Inertia::render('finance/expenses/index', [
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
     * Store a new expense request.
     */
    public function storeExpense(Request $request): RedirectResponse
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

        $expenseNo = 'EXP-'.date('Y').'-'.str_pad((string) (Expense::withTrashed()->count() + 1), 5, '0', STR_PAD_LEFT);

        $status = $validated['status'] ?? ExpenseStatus::PendingApproval->value;

        $expense = Expense::create([
            ...$validated,
            'expense_no' => $expenseNo,
            'status' => $status,
            'created_by' => $request->user()->id,
        ]);

        if ($status === ExpenseStatus::PendingApproval->value) {
            $this->buildApprovalChain($expense);
        }

        return back()->with('success', "Expense {$expenseNo} of \${$expense->amount} submitted.");
    }

    /**
     * Display a single expense with its full approval trail.
     */
    public function showExpense(Expense $expense): Response
    {
        $expense->load(['creator', 'approver', 'approvals.approver']);

        return Inertia::render('finance/expenses/show', [
            'expense' => $expense,
            'level_roles' => Expense::APPROVAL_LEVELS,
        ]);
    }

    /**
     * Approve an expense at the current approval level (Finance portal).
     */
    public function approveExpense(Request $request, Expense $expense): RedirectResponse
    {
        $validated = $request->validate([
            'comment' => ['nullable', 'string', 'max:1000'],
        ]);

        $approval = $expense->pendingApprovals()
            ->where('approver_id', $request->user()->id)
            ->orderBy('level')
            ->first();

        if (! $approval) {
            return back()->with('error', 'No pending approval assigned to you for this expense.');
        }

        $approval->update([
            'action' => 'approved',
            'comment' => $validated['comment'] ?? null,
            'acted_at' => now(),
        ]);

        if ($expense->approvedApprovals()->count() >= count(Expense::APPROVAL_LEVELS)) {
            $expense->update([
                'status' => ExpenseStatus::Approved->value,
                'approved_by' => $request->user()->id,
                'approved_at' => now(),
            ]);

            return back()->with('success', "Expense {$expense->expense_no} fully approved.");
        }

        return back()->with('success', 'Expense approved. Next approval level required.');
    }

    /**
     * Reject an expense at the current approval level (Finance portal).
     */
    public function rejectExpense(Request $request, Expense $expense): RedirectResponse
    {
        $validated = $request->validate([
            'comment' => ['required', 'string', 'max:1000'],
        ]);

        $approval = $expense->pendingApprovals()
            ->where('approver_id', $request->user()->id)
            ->orderBy('level')
            ->first();

        if (! $approval) {
            return back()->with('error', 'No pending approval assigned to you for this expense.');
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

        return back()->with('success', "Expense {$expense->expense_no} rejected.");
    }

    /**
     * Mark an approved expense as paid (Finance portal).
     */
    public function markExpensePaid(Expense $expense): RedirectResponse
    {
        if ($expense->status !== ExpenseStatus::Approved->value) {
            return back()->with('error', 'Only approved expenses can be marked as paid.');
        }

        $expense->update(['status' => ExpenseStatus::Paid->value]);

        return back()->with('success', "Expense {$expense->expense_no} marked as paid.");
    }

    /**
     * Display the finance portal invoice roster.
     */
    public function invoices(Request $request): Response
    {
        $search = $request->query('search');
        $status = $request->query('status');
        $type = $request->query('type');
        $perPage = (int) $request->query('per_page', 10);

        $query = StudentInvoice::query()
            ->with(['student.user', 'student.program'])
            ->withCount('items')
            ->when($search, function ($q) use ($search) {
                $q->where(function ($sub) use ($search) {
                    $sub->where('invoice_no', 'like', "%{$search}%")
                        ->orWhere('title', 'like', "%{$search}%")
                        ->orWhereHas('student.user', fn ($u) => $u->where('name', 'like', "%{$search}%")->orWhere('email', 'like', "%{$search}%"))
                        ->orWhereHas('student', fn ($s) => $s->where('matric_no', 'like', "%{$search}%"));
                });
            })
            ->when($status && $status !== 'all', function ($q) use ($status) {
                if ($status === 'overdue') {
                    $q->where('status', '!=', 'paid')
                        ->whereNotNull('due_date')
                        ->where('due_date', '<', now()->toDateString());
                } else {
                    $q->where('status', $status);
                }
            })
            ->when($type && $type !== 'all', fn ($q) => $q->where('type', $type))
            ->latest();

        return Inertia::render('finance/invoices/index', [
            'stats' => Inertia::defer(fn () => [
                'total_billed' => (float) StudentInvoice::sum('amount'),
                'total_paid' => (float) StudentInvoice::sum('paid_amount'),
                'total_balance' => (float) StudentInvoice::selectRaw('COALESCE(SUM(amount - paid_amount), 0) as balance')->value('balance'),
                'total_invoices' => (int) StudentInvoice::count(),
                'overdue_count' => (int) StudentInvoice::where('status', '!=', 'paid')
                    ->whereNotNull('due_date')
                    ->where('due_date', '<', now()->toDateString())
                    ->count(),
            ]),
            'invoices' => Inertia::defer(fn () => $query->paginate($perPage)->withQueryString()),
            'filters' => [
                'search' => $search ?? '',
                'status' => $status ?? 'all',
                'type' => $type ?? 'all',
                'per_page' => $perPage,
            ],
        ]);
    }

    /**
     * Display a single invoice with full details.
     */
    public function showInvoice(StudentInvoice $invoice): Response
    {
        $invoice->load(['student.user', 'student.program', 'items', 'payments']);

        return Inertia::render('finance/invoices/show', [
            'invoice' => $invoice,
        ]);
    }

    /**
     * Display the finance portal payment roster.
     */
    public function payments(Request $request): Response
    {
        $search = $request->query('search');
        $status = $request->query('status');
        $method = $request->query('payment_method');
        $perPage = (int) $request->query('per_page', 10);

        $query = StudentPayment::query()
            ->with(['student.user', 'student.program', 'invoice'])
            ->when($search, function ($q) use ($search) {
                $q->where(function ($sub) use ($search) {
                    $sub->where('transaction_no', 'like', "%{$search}%")
                        ->orWhereHas('student.user', fn ($u) => $u->where('name', 'like', "%{$search}%")->orWhere('email', 'like', "%{$search}%"))
                        ->orWhereHas('student', fn ($s) => $s->where('matric_no', 'like', "%{$search}%"));
                });
            })
            ->when($status && $status !== 'all', fn ($q) => $q->where('status', $status))
            ->when($method && $method !== 'all', fn ($q) => $q->where('payment_method', $method))
            ->latest('payment_date');

        return Inertia::render('finance/payments/index', [
            'stats' => Inertia::defer(fn () => [
                'total_collected' => (float) StudentPayment::where('status', 'paid')->sum('amount'),
                'pending_verification' => (int) StudentPayment::where('status', 'pending')->count(),
                'total_transactions' => (int) StudentPayment::count(),
                'today_collected' => (float) StudentPayment::where('status', 'paid')->whereDate('payment_date', now()->toDateString())->sum('amount'),
            ]),
            'payments' => Inertia::defer(fn () => $query->paginate($perPage)->withQueryString()),
            'filters' => [
                'search' => $search ?? '',
                'status' => $status ?? 'all',
                'payment_method' => $method ?? 'all',
                'per_page' => $perPage,
            ],
        ]);
    }

    /**
     * Update payment verification status from the finance portal.
     */
    public function updatePaymentStatus(Request $request, StudentPayment $payment): RedirectResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'string', 'in:paid,pending,rejected'],
        ]);

        $oldStatus = $payment->status;
        $payment->update(['status' => $validated['status']]);

        if ($oldStatus !== 'paid' && $validated['status'] === 'paid' && $payment->invoice_id) {
            $invoice = $payment->invoice;
            if ($invoice) {
                $newPaid = $invoice->paid_amount + $payment->amount;
                $invoice->update([
                    'paid_amount' => $newPaid,
                    'status' => $newPaid >= $invoice->amount ? 'paid' : 'partial',
                ]);
            }

            $student = $payment->student;
            if ($student) {
                $totalBilled = (float) $student->invoices()->sum('amount');
                $totalPaid = (float) $student->invoices()->sum('paid_amount');
                $status = $totalBilled > 0
                    ? ($totalPaid >= $totalBilled ? 'paid' : ($totalPaid > 0 ? 'partial' : 'unpaid'))
                    : $student->fee_status;
                $student->update(['fee_status' => $status]);
            }
        }

        return back()->with('success', "Payment {$payment->transaction_no} marked as {$validated['status']}.");
    }

    /**
     * Build the full multi-level approval chain for an expense.
     */
    private function buildApprovalChain(Expense $expense): void
    {
        foreach (array_keys(Expense::APPROVAL_LEVELS) as $level) {
            $alreadyAssigned = ExpenseApproval::where('expense_id', $expense->id)->pluck('approver_id');

            $roles = match (true) {
                $level <= 1 => ['finance'],
                $level === 2 => ['super_admin', 'finance'],
                default => ['super_admin'],
            };

            $approver = User::query()
                ->whereIn('role', $roles)
                ->where('is_active', true)
                ->when($alreadyAssigned->isNotEmpty(), fn ($q) => $q->whereNotIn('id', $alreadyAssigned))
                ->orderBy('id')
                ->first()
                ?? User::query()
                    ->whereIn('role', $roles)
                    ->where('is_active', true)
                    ->orderBy('id')
                    ->first();

            if ($approver) {
                ExpenseApproval::create([
                    'expense_id' => $expense->id,
                    'approver_id' => $approver->id,
                    'level' => $level,
                    'action' => 'pending',
                ]);
            }
        }
    }
}
