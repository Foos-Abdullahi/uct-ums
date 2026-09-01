<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Program;
use App\Models\Student;
use App\Models\StudentInvoice;
use App\Models\StudentPayment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class FinanceController extends Controller
{
    /**
     * Display the Finance Overview control center.
     */
    public function overview(): Response
    {
        return Inertia::render('Admin/finance/index', [
            'stats' => Inertia::defer(fn () => [
                'total_invoiced' => (float) StudentInvoice::sum('amount'),
                'total_collected' => (float) StudentPayment::where('status', 'paid')->sum('amount'),
                'total_outstanding' => (float) StudentInvoice::selectRaw('COALESCE(SUM(amount - paid_amount), 0) as balance')->value('balance'),
                'pending_payments' => (int) StudentPayment::where('status', 'pending')->count(),
                'overdue_invoices' => (int) StudentInvoice::where('status', '!=', 'paid')
                    ->whereNotNull('due_date')
                    ->where('due_date', '<', now()->toDateString())
                    ->count(),
            ]),
            'recent_payments' => Inertia::defer(fn () => StudentPayment::with(['student.user', 'student.program', 'invoice'])
                ->latest('payment_date')
                ->take(8)
                ->get()
            ),
            'recent_invoices' => Inertia::defer(fn () => StudentInvoice::with(['student.user', 'student.program'])
                ->latest()
                ->take(6)
                ->get()
            ),
            'revenue_by_method' => Inertia::defer(fn () => StudentPayment::where('status', 'paid')
                ->select('payment_method', DB::raw('SUM(amount) as total'), DB::raw('COUNT(*) as count'))
                ->groupBy('payment_method')
                ->get()
            ),
            'invoices_by_type' => Inertia::defer(fn () => StudentInvoice::select('type', DB::raw('SUM(amount) as total'), DB::raw('COUNT(*) as count'))
                ->groupBy('type')
                ->get()
            ),
        ]);
    }

    /**
     * Display Tuition & Fee Structure management.
     */
    public function fees(Request $request): Response
    {
        $search = $request->query('search');
        $programId = $request->query('program_id');
        $feeStatus = $request->query('fee_status');
        $perPage = (int) $request->query('per_page', 10);

        $studentsQuery = Student::query()
            ->with(['user', 'program', 'invoices'])
            ->withSum('invoices as total_billed', 'amount')
            ->withSum('invoices as total_paid', 'paid_amount')
            ->when($search, function ($q) use ($search) {
                $q->where(function ($sub) use ($search) {
                    $sub->where('matric_no', 'like', "%{$search}%")
                        ->orWhereHas('user', fn ($u) => $u->where('name', 'like', "%{$search}%")->orWhere('email', 'like', "%{$search}%"));
                });
            })
            ->when($programId && $programId !== 'all', fn ($q) => $q->where('program_id', $programId))
            ->when($feeStatus && $feeStatus !== 'all', fn ($q) => $q->where('fee_status', $feeStatus))
            ->orderBy('matric_no');

        $programs = Program::query()->orderBy('name')->get(['id', 'name', 'code', 'degree_level']);

        return Inertia::render('Admin/finance/fees', [
            'stats' => Inertia::defer(fn () => [
                'total_students' => Student::count(),
                'fully_paid_students' => Student::where('fee_status', 'paid')->count(),
                'partial_students' => Student::where('fee_status', 'partial')->count(),
                'unpaid_students' => Student::where('fee_status', 'unpaid')->count(),
                'total_receivables' => (float) StudentInvoice::selectRaw('COALESCE(SUM(amount - paid_amount), 0) as balance')->value('balance'),
            ]),
            'students' => Inertia::defer(fn () => $studentsQuery->paginate($perPage)->withQueryString()),
            'programs' => $programs,
            'filters' => [
                'search' => $search ?? '',
                'program_id' => $programId ?? 'all',
                'fee_status' => $feeStatus ?? 'all',
                'per_page' => $perPage,
            ],
        ]);
    }

    /**
     * Display Payments roster with filters and recording modal.
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

        $students = Student::with('user')->get()->map(fn ($s) => [
            'id' => $s->id,
            'matric_no' => $s->matric_no,
            'name' => $s->user?->name ?? 'Unknown',
        ]);

        return Inertia::render('Admin/finance/payments', [
            'stats' => Inertia::defer(fn () => [
                'total_collected' => (float) StudentPayment::where('status', 'paid')->sum('amount'),
                'pending_verification' => (int) StudentPayment::where('status', 'pending')->count(),
                'total_transactions' => (int) StudentPayment::count(),
                'today_collected' => (float) StudentPayment::where('status', 'paid')->whereDate('payment_date', now()->toDateString())->sum('amount'),
            ]),
            'payments' => Inertia::defer(fn () => $query->paginate($perPage)->withQueryString()),
            'students' => $students,
            'filters' => [
                'search' => $search ?? '',
                'status' => $status ?? 'all',
                'payment_method' => $method ?? 'all',
                'per_page' => $perPage,
            ],
        ]);
    }

    /**
     * Record a new student payment.
     */
    public function storePayment(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'student_id' => ['required', 'exists:students,id'],
            'invoice_id' => ['nullable', 'exists:student_invoices,id'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'payment_method' => ['required', 'string', 'in:bank_transfer,cash,evc_plus,zaad,sahay,credit_card'],
            'payment_date' => ['required', 'date'],
            'status' => ['required', 'string', 'in:paid,pending,rejected'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $transactionNo = 'TXN-'.date('Ymd').'-'.strtoupper(substr(uniqid(), -5));

        $payment = StudentPayment::create([
            ...$validated,
            'transaction_no' => $transactionNo,
        ]);

        // If linked to an invoice and paid, update the invoice paid amount
        if ($payment->invoice_id && $payment->status === 'paid') {
            $invoice = StudentInvoice::find($payment->invoice_id);
            if ($invoice) {
                $newPaid = $invoice->paid_amount + $payment->amount;
                $newStatus = $newPaid >= $invoice->amount ? 'paid' : 'partial';
                $invoice->update([
                    'paid_amount' => $newPaid,
                    'status' => $newStatus,
                ]);
            }
        }

        // Refresh student overall fee status
        $student = Student::find($validated['student_id']);
        if ($student) {
            $totalBilled = (float) $student->invoices()->sum('amount');
            $totalPaid = (float) $student->invoices()->sum('paid_amount');
            if ($totalBilled > 0) {
                if ($totalPaid >= $totalBilled) {
                    $student->update(['fee_status' => 'paid']);
                } elseif ($totalPaid > 0) {
                    $student->update(['fee_status' => 'partial']);
                } else {
                    $student->update(['fee_status' => 'unpaid']);
                }
            }
        }

        return back()->with('success', "Payment {$transactionNo} of \${$payment->amount} recorded successfully.");
    }

    /**
     * Update payment verification status (Approve / Reject).
     */
    public function updatePaymentStatus(Request $request, StudentPayment $payment): RedirectResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'string', 'in:paid,pending,rejected'],
        ]);

        $oldStatus = $payment->status;
        $newStatus = $validated['status'];

        $payment->update(['status' => $newStatus]);

        // If status changed to paid and invoice attached, increment invoice paid amount
        if ($oldStatus !== 'paid' && $newStatus === 'paid' && $payment->invoice_id) {
            $invoice = $payment->invoice;
            if ($invoice) {
                $newPaid = $invoice->paid_amount + $payment->amount;
                $invStatus = $newPaid >= $invoice->amount ? 'paid' : 'partial';
                $invoice->update([
                    'paid_amount' => $newPaid,
                    'status' => $invStatus,
                ]);
            }
        }

        return back()->with('success', "Payment {$payment->transaction_no} marked as {$newStatus}.");
    }

    /**
     * Display Invoices roster with filters and creation modal.
     */
    public function invoices(Request $request): Response
    {
        $search = $request->query('search');
        $status = $request->query('status');
        $type = $request->query('type');
        $perPage = (int) $request->query('per_page', 10);

        $query = StudentInvoice::query()
            ->with(['student.user', 'student.program'])
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

        $students = Student::with('user')->get()->map(fn ($s) => [
            'id' => $s->id,
            'matric_no' => $s->matric_no,
            'name' => $s->user?->name ?? 'Unknown',
        ]);

        return Inertia::render('Admin/finance/invoices', [
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
            'students' => $students,
            'filters' => [
                'search' => $search ?? '',
                'status' => $status ?? 'all',
                'type' => $type ?? 'all',
                'per_page' => $perPage,
            ],
        ]);
    }

    /**
     * Create a new student invoice.
     */
    public function storeInvoice(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'student_id' => ['required', 'exists:students,id'],
            'title' => ['required', 'string', 'max:255'],
            'type' => ['required', 'string', 'in:tuition,admission,examination,library,laboratory,graduation,hostel,other'],
            'amount' => ['required', 'numeric', 'min:1'],
            'due_date' => ['nullable', 'date'],
        ]);

        $invoiceNo = 'INV-'.date('Y').'-'.str_pad((string) (StudentInvoice::count() + 1), 5, '0', STR_PAD_LEFT);

        $invoice = StudentInvoice::create([
            ...$validated,
            'invoice_no' => $invoiceNo,
            'paid_amount' => 0.00,
            'status' => 'unpaid',
        ]);

        // Update student fee status to unpaid or partial
        $student = Student::find($validated['student_id']);
        if ($student && $student->fee_status === 'paid') {
            $student->update(['fee_status' => 'partial']);
        }

        return back()->with('success', "Invoice {$invoiceNo} for \${$invoice->amount} issued successfully.");
    }

    /**
     * Delete an invoice if no paid payments attached.
     */
    public function destroyInvoice(StudentInvoice $invoice): RedirectResponse
    {
        if ($invoice->paid_amount > 0) {
            return back()->with('error', "Cannot delete invoice {$invoice->invoice_no} because payments have already been collected.");
        }

        $invoice->delete();

        return back()->with('success', "Invoice {$invoice->invoice_no} deleted successfully.");
    }
}
