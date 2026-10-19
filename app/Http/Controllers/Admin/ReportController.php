<?php

namespace App\Http\Controllers\Admin;

use App\Enums\AccountType;
use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\Admission;
use App\Models\Course;
use App\Models\CourseAssignment;
use App\Models\Expense;
use App\Models\FinancialBudget;
use App\Models\Lecturer;
use App\Models\Program;
use App\Models\Student;
use App\Models\StudentCertificate;
use App\Models\StudentGrade;
use App\Models\StudentInvoice;
use App\Models\StudentPayment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReportController extends Controller
{
    /**
     * Unified reports dashboard – all metrics, charts and summaries in one page.
     */
    public function index(): Response
    {
        return Inertia::render('Admin/reports/index', [

            // ── Core KPIs ──────────────────────────────────────────────────────
            'kpis' => Inertia::defer(fn () => [
                'total_students' => Student::count(),
                'active_students' => Student::where('enrollment_status', 'enrolled')->count(),
                'graduated_students' => Student::where('enrollment_status', 'graduated')->count(),
                'pending_students' => Student::where('enrollment_status', 'pending')->count(),
                'suspended_students' => Student::where('enrollment_status', 'suspended')->count(),
                'withdrawn_students' => Student::where('enrollment_status', 'withdrawn')->count(),
                'total_lecturers' => Lecturer::count(),
                'active_lecturers' => Lecturer::where('employment_status', 'active')->count(),
                'total_courses' => Course::count(),
                'active_courses' => Course::where('status', 'active')->count(),
                'total_programs' => Program::count(),
                'total_assignments' => CourseAssignment::count(),
                'active_assignments' => CourseAssignment::where('status', 'active')->count(),
                'total_admissions' => Admission::count(),
                'pending_admissions' => Admission::where('status', 'pending')
                    ->orWhere('status', 'under_review')->count(),
                'approved_admissions' => Admission::where('status', 'approved')->count(),
                'rejected_admissions' => Admission::where('status', 'rejected')->count(),
                'total_invoiced' => (float) StudentInvoice::sum('amount'),
                'total_collected' => (float) StudentPayment::whereIn('status', ['paid', 'approved'])->sum('amount'),
                'total_outstanding' => $this->getOutstandingBalance(),
                'collection_rate' => (function () {
                    $invoiced = (float) StudentInvoice::sum('amount');
                    $collected = (float) StudentPayment::whereIn('status', ['paid', 'approved'])->sum('amount');

                    return $invoiced > 0 ? round(($collected / $invoiced) * 100, 1) : 0;
                })(),
                'total_certificates' => StudentCertificate::count(),
            ]),

            // ── Student Enrolment by Program ────────────────────────────────
            'programs_data' => Inertia::defer(fn () => Program::withCount('students')
                ->withCount('courses')
                ->get()
                ->map(fn (Program $p) => [
                    'id' => $p->id,
                    'name' => $p->name,
                    'short_name' => $this->shortenProgramName($p->name),
                    'level' => ucfirst($p->degree_level ?? 'undergraduate'),
                    'students_count' => $p->students_count,
                    'courses_count' => $p->courses_count,
                ])
                ->sortByDesc('students_count')
                ->values()
                ->all()
            ),

            // ── Admissions Pipeline by Status ────────────────────────────────
            'admissions_pipeline' => Inertia::defer(fn () => Admission::selectRaw('status, count(*) as total')
                ->groupBy('status')
                ->get()
                ->map(fn ($row) => [
                    'status' => $row->status,
                    'label' => ucwords(str_replace('_', ' ', $row->status)),
                    'total' => (int) $row['total'],
                ])
                ->values()
                ->all()
            ),

            // ── Payments Breakdown by Method ────────────────────────────────
            'payments_by_method' => Inertia::defer(fn () => StudentPayment::whereIn('status', ['paid', 'approved'])
                ->selectRaw('payment_method, count(*) as transactions, sum(amount) as total')
                ->groupBy('payment_method')
                ->get()
                ->map(fn ($row) => [
                    'method' => $row->payment_method ?? 'unknown',
                    'label' => ucwords(str_replace('_', ' ', $row->payment_method ?? 'Unknown')),
                    'transactions' => (int) $row['transactions'],
                    'total' => (float) $row['total'],
                ])
                ->values()
                ->all()
            ),

            // ── Course Assignments by Dept / Role ──────────────────────────
            'assignments_by_role' => Inertia::defer(fn () => CourseAssignment::selectRaw('role, count(*) as total')
                ->groupBy('role')
                ->get()
                ->map(fn ($row) => [
                    'role' => $row->role,
                    'label' => ucwords(str_replace('_', ' ', $row->role)),
                    'total' => (int) $row['total'],
                ])
                ->values()
                ->all()
            ),

            // ── Semester Cohort Distribution ────────────────────────────────
            'semester_cohorts' => Inertia::defer(fn () => Student::whereNotNull('current_semester')
                ->selectRaw('current_semester as semester, count(*) as total')
                ->groupBy('current_semester')
                ->orderBy('current_semester')
                ->get()
                ->map(fn ($row) => [
                    'semester' => 'Semester '.$row['semester'],
                    'total' => (int) $row['total'],
                ])
                ->values()
                ->all()
            ),

            // ── Recent Payments Feed ─────────────────────────────────────────
            'recent_payments' => Inertia::defer(fn () => StudentPayment::with(['student.user'])
                ->where('status', 'paid')
                ->latest('payment_date')
                ->take(8)
                ->get()
                ->map(fn (StudentPayment $p) => [
                    'id' => $p->id,
                    'amount' => (float) $p->amount,
                    'method' => ucwords(str_replace('_', ' ', $p->payment_method ?? 'N/A')),
                    'date' => optional($p->payment_date)->format('d M Y') ?? 'N/A',
                    'student_name' => optional(optional($p->student)->user)->name ?? 'Unknown',
                    'matric_no' => optional($p->student)->matric_no ?? 'N/A',
                    'reference_no' => $p->transaction_no ?? 'N/A',
                ])
                ->values()
                ->all()
            ),

            // ── Top Students by GPA ──────────────────────────────────────────
            'top_students' => Inertia::defer(fn () => StudentGrade::selectRaw('student_id, round(avg(grade_point), 2) as gpa, count(*) as courses_taken')
                ->whereNotNull('grade_point')
                ->groupBy('student_id')
                ->orderByDesc('gpa')
                ->take(6)
                ->with(['student.user', 'student.program'])
                ->get()
                ->map(fn ($g) => [
                    'name' => optional(optional($g->student)->user)->name ?? 'Unknown',
                    'matric_no' => optional($g->student)->matric_no ?? 'N/A',
                    'program' => optional(optional($g->student)->program)->name ?? 'N/A',
                    'gpa' => (float) $g['gpa'],
                    'courses_taken' => (int) $g['courses_taken'],
                ])
                ->values()
                ->all()
            ),
        ]);
    }

    /**
     * Overview report page (kept for direct URL access).
     */
    public function overview(): Response
    {
        return $this->index();
    }

    /**
     * Students sub-report page.
     */
    public function students(): Response
    {
        return Inertia::render('Admin/reports/components/students', [
            'stats' => Inertia::defer(fn () => [
                'total_students' => Student::count(),
                'active_students' => Student::where('enrollment_status', 'enrolled')->count(),
                'graduated_students' => Student::where('enrollment_status', 'graduated')->count(),
                'suspended_students' => Student::where('enrollment_status', 'suspended')->count(),
                'pending_students' => Student::where('enrollment_status', 'pending')->count(),
                'total_revenue' => (float) StudentPayment::whereIn('status', ['paid', 'approved'])->sum('amount'),
                'outstanding_balance' => $this->getOutstandingBalance(),
            ]),
        ]);
    }

    /**
     * Academic sub-report page.
     */
    public function academic(): Response
    {
        return Inertia::render('Admin/reports/components/academic', [
            'stats' => Inertia::defer(fn () => [
                'total_students' => Student::count(),
                'active_students' => Student::where('enrollment_status', 'enrolled')->count(),
                'graduated_students' => Student::where('enrollment_status', 'graduated')->count(),
                'suspended_students' => Student::where('enrollment_status', 'suspended')->count(),
                'pending_students' => Student::where('enrollment_status', 'pending')->count(),
                'total_revenue' => (float) StudentPayment::whereIn('status', ['paid', 'approved'])->sum('amount'),
                'outstanding_balance' => 0,
            ]),
        ]);
    }

    /**
     * Attendance sub-report page.
     */
    public function attendance(): Response
    {
        return Inertia::render('Admin/reports/components/attendance', [
            'stats' => Inertia::defer(fn () => [
                'total_students' => Student::count(),
                'active_students' => Student::where('enrollment_status', 'enrolled')->count(),
                'graduated_students' => Student::where('enrollment_status', 'graduated')->count(),
                'suspended_students' => Student::where('enrollment_status', 'suspended')->count(),
                'pending_students' => Student::where('enrollment_status', 'pending')->count(),
                'total_revenue' => (float) StudentPayment::whereIn('status', ['paid', 'approved'])->sum('amount'),
                'outstanding_balance' => 0,
            ]),
        ]);
    }

    /**
     * Finance sub-report page.
     */
    public function finance(): Response
    {
        return Inertia::render('Admin/reports/components/finance', [
            'stats' => Inertia::defer(fn () => [
                'total_revenue' => (float) StudentPayment::whereIn('status', ['paid', 'approved'])->sum('amount'),
                'paid' => (float) StudentPayment::whereIn('status', ['paid', 'approved'])->sum('amount'),
                'outstanding' => $this->getOutstandingBalance(),
                'overdue' => (float) StudentInvoice::where('status', '!=', 'paid')->whereDate('due_date', '<', today())->selectRaw('COALESCE(SUM(amount - paid_amount), 0) as balance')->value('balance'),
            ]),
            'transactions' => Inertia::defer(function () {
                $transactions = StudentInvoice::with('student.user')->latest('issue_date')->paginate(10);

                return [
                    'data' => $transactions->getCollection()->map(fn (StudentInvoice $invoice) => [
                        'invoice_no' => $invoice->invoice_no,
                        'student_name' => $invoice->student?->user?->name ?? 'Unknown',
                        'amount' => (float) $invoice->amount,
                        'paid' => (float) $invoice->paid_amount,
                        'balance' => $invoice->balance(),
                        'status' => $invoice->status,
                    ])->all(),
                    'pagination' => [
                        'current_page' => $transactions->currentPage(),
                        'last_page' => $transactions->lastPage(),
                        'per_page' => $transactions->perPage(),
                        'total' => $transactions->total(),
                    ],
                ];
            }),
        ]);
    }

    public function feeCollections(Request $request): Response
    {
        $invoiceQuery = StudentInvoice::with(['student.user', 'student.program'])
            ->when($request->query('academic_year'), fn ($query, $year) => $query->where('academic_year', $year))
            ->when($request->query('semester'), fn ($query, $semester) => $query->where('semester', $semester))
            ->when($request->query('program_id'), fn ($query, $programId) => $query->whereHas('student', fn ($student) => $student->where('program_id', $programId)))
            ->when($request->query('from'), fn ($query, $from) => $query->whereDate('issue_date', '>=', $from))
            ->when($request->query('to'), fn ($query, $to) => $query->whereDate('issue_date', '<=', $to));
        $invoices = (clone $invoiceQuery)->latest('issue_date')->get();
        $paymentsQuery = StudentPayment::whereIn('status', ['paid', 'approved'])
            ->whereHas('invoice', fn ($invoice) => $invoice
                ->when($request->query('academic_year'), fn ($query, $year) => $query->where('academic_year', $year))
                ->when($request->query('semester'), fn ($query, $semester) => $query->where('semester', $semester))
                ->when($request->query('program_id'), fn ($query, $programId) => $query->whereHas('student', fn ($student) => $student->where('program_id', $programId)))
                ->when($request->query('from'), fn ($query, $from) => $query->whereDate('issue_date', '>=', $from))
                ->when($request->query('to'), fn ($query, $to) => $query->whereDate('issue_date', '<=', $to)))
            ->when($request->query('from'), fn ($query, $from) => $query->whereDate('payment_date', '>=', $from))
            ->when($request->query('to'), fn ($query, $to) => $query->whereDate('payment_date', '<=', $to));
        $payments = (float) $paymentsQuery->sum('amount');

        return $this->renderFinancialReport('Student Fees & Collections', [
            'charges' => (float) $invoices->sum('amount'),
            'collections' => (float) $payments,
            'outstanding' => (float) $invoices->sum(fn (StudentInvoice $invoice) => $invoice->balance()),
            'overdue' => (float) $invoices->filter(fn (StudentInvoice $invoice) => $invoice->due_date?->isPast() && $invoice->status !== 'paid')->sum(fn (StudentInvoice $invoice) => $invoice->balance()),
        ], $invoices->map(fn (StudentInvoice $invoice) => [
            'student' => $invoice->student?->user?->name ?? 'Unknown',
            'matric_no' => $invoice->student?->matric_no ?? '',
            'program' => $invoice->student?->program?->name ?? '',
            'academic_year' => $invoice->academic_year ?? '',
            'semester' => $invoice->semester ?? '',
            'invoice' => $invoice->invoice_no,
            'charged' => (float) $invoice->amount,
            'collected' => (float) $invoice->paid_amount,
            'balance' => $invoice->balance(),
            'status' => $invoice->status,
        ])->values()->all(), [
            'filters' => $request->only(['from', 'to', 'academic_year', 'semester', 'program_id']),
            'options' => [
                'academic_years' => Student::whereNotNull('academic_year')->distinct()->orderByDesc('academic_year')->pluck('academic_year'),
                'semesters' => range(1, (int) config('academic.total_semesters')),
                'programs' => Program::orderBy('name')->get(['id', 'name']),
            ],
        ]);
    }

    public function incomeRevenue(Request $request): Response
    {
        $payments = StudentPayment::whereIn('status', ['paid', 'approved'])
            ->when($request->query('from'), fn ($query, $from) => $query->whereDate('payment_date', '>=', $from))
            ->when($request->query('to'), fn ($query, $to) => $query->whereDate('payment_date', '<=', $to))
            ->with('invoice')->get();
        $rows = $payments->groupBy(fn (StudentPayment $payment) => $payment->invoice?->type ?? 'other')
            ->map(fn ($group, $type) => [
                'fee_type' => ucfirst(str_replace('_', ' ', $type)),
                'revenue_account' => match ($type) {
                    'tuition' => '4000 · Tuition Revenue',
                    'registration' => '4100 · Admission & Registration Fees',
                    'exam' => '4110 · Examination Fees',
                    default => '4900 · Other Income',
                },
                'transactions' => $group->count(),
                'revenue' => (float) $group->sum('amount'),
            ])->values()->all();

        return $this->renderFinancialReport('Income & Revenue', [
            'total_revenue' => (float) $payments->sum('amount'),
            'transactions' => $payments->count(),
        ], $rows, ['filters' => $request->only(['from', 'to'])]);
    }

    public function expensesReport(Request $request): Response
    {
        $expenses = Expense::with('account')
            ->when($request->query('from'), fn ($query, $from) => $query->whereDate('expense_date', '>=', $from))
            ->when($request->query('to'), fn ($query, $to) => $query->whereDate('expense_date', '<=', $to))
            ->when($request->query('status'), fn ($query, $status) => $query->where('status', $status))
            ->when($request->query('vendor'), fn ($query, $vendor) => $query->where('vendor', 'like', "%{$vendor}%"))
            ->get();
        $rows = $expenses->map(fn (Expense $expense) => [
            'expense_no' => $expense->expense_no,
            'account' => $expense->account?->name ?? 'Unassigned',
            'vendor' => $expense->vendor ?? '',
            'date' => $expense->expense_date?->toDateString() ?? '',
            'status' => $expense->status,
            'recorded' => in_array($expense->status, ['draft', 'rejected', 'cancelled'], true) ? 0 : (float) $expense->amount,
            'paid' => $expense->status === 'paid' ? (float) $expense->amount : 0,
        ])->values()->all();

        return $this->renderFinancialReport('Expenses', [
            'total_recorded' => (float) $expenses->whereIn('status', ['pending_approval', 'approved', 'paid'])->sum('amount'),
            'paid' => (float) $expenses->where('status', 'paid')->sum('amount'),
            'drafts' => (float) $expenses->where('status', 'draft')->sum('amount'),
        ], $rows, ['filters' => $request->only(['from', 'to', 'status', 'vendor'])]);
    }

    public function cashFlow(Request $request): Response
    {
        $period = $request->query('group_by', 'daily');
        $dateBucket = fn ($date) => $date?->format($period === 'monthly' ? 'Y-m' : 'Y-m-d') ?? 'Undated';
        $inflows = StudentPayment::with('paymentAccount')->whereIn('status', ['paid', 'approved'])
            ->when($request->query('from'), fn ($query, $from) => $query->whereDate('payment_date', '>=', $from))
            ->when($request->query('to'), fn ($query, $to) => $query->whereDate('payment_date', '<=', $to))
            ->get()->groupBy(fn (StudentPayment $payment) => $dateBucket($payment->payment_date).'|'.($payment->paymentAccount?->name ?? 'Unassigned'));
        $outflows = Expense::with('paymentAccount')->where('status', 'paid')
            ->where(function ($query) use ($request) {
                $query->where(function ($paid) use ($request) {
                    $paid->whereNotNull('paid_at')
                        ->when($request->query('from'), fn ($dateQuery, $from) => $dateQuery->whereDate('paid_at', '>=', $from))
                        ->when($request->query('to'), fn ($dateQuery, $to) => $dateQuery->whereDate('paid_at', '<=', $to));
                })->orWhere(function ($legacy) use ($request) {
                    $legacy->whereNull('paid_at')
                        ->when($request->query('from'), fn ($dateQuery, $from) => $dateQuery->whereDate('expense_date', '>=', $from))
                        ->when($request->query('to'), fn ($dateQuery, $to) => $dateQuery->whereDate('expense_date', '<=', $to));
                });
            })
            ->get()->groupBy(fn (Expense $expense) => $dateBucket($expense->paid_at ?? $expense->expense_date).'|'.($expense->paymentAccount?->name ?? 'Unassigned'));
        $dates = $inflows->keys()->merge($outflows->keys())->unique()->sort()->values();
        $rows = $dates->map(function (string $dateAndAccount) use ($inflows, $outflows): array {
            [$date, $account] = array_pad(explode('|', $dateAndAccount, 2), 2, 'Unassigned');
            $income = (float) ($inflows->get($dateAndAccount)?->sum('amount') ?? 0);
            $expenses = (float) ($outflows->get($dateAndAccount)?->sum('amount') ?? 0);

            return ['date' => $date, 'account' => $account, 'inflow' => $income, 'outflow' => $expenses, 'net_cash' => $income - $expenses];
        })->all();
        $totalInflows = (float) collect($rows)->sum('inflow');
        $totalOutflows = (float) collect($rows)->sum('outflow');

        return $this->renderFinancialReport('Cash Flow', [
            'inflows' => $totalInflows,
            'outflows' => $totalOutflows,
            'net_cash' => $totalInflows - $totalOutflows,
        ], $rows, ['filters' => $request->only(['from', 'to', 'group_by'])]);
    }

    public function budgetVsActual(Request $request): Response
    {
        $period = $request->query('period', now()->format('Y'));
        $budgets = FinancialBudget::with('account')->where('financial_period', $period)->get()->keyBy('account_id');
        [$year, $month] = array_pad(explode('-', $period, 2), 2, null);
        $expenses = Expense::with('account')
            ->where('status', 'paid')
            ->where(function ($query) use ($year, $month) {
                $query->where(function ($paidAt) use ($year, $month) {
                    $paidAt->whereYear('paid_at', $year);
                    if ($month) {
                        $paidAt->whereMonth('paid_at', (int) $month);
                    }
                })->orWhere(function ($legacyDate) use ($year, $month) {
                    $legacyDate->whereNull('paid_at')->whereYear('expense_date', $year);
                    if ($month) {
                        $legacyDate->whereMonth('expense_date', (int) $month);
                    }
                });
            })
            ->get()
            ->groupBy('account_id');
        $accountIds = $budgets->keys()->merge($expenses->keys())->unique();
        $rows = $accountIds->map(function ($accountId) use ($budgets, $expenses): array {
            $budget = $budgets->get($accountId);
            $actual = (float) ($expenses->get($accountId)?->sum('amount') ?? 0);
            $planned = (float) ($budget?->amount ?? 0);

            return [
                'account' => $budget?->account?->name ?? $expenses->get($accountId)?->first()?->account?->name ?? 'Unknown',
                'budget' => $planned,
                'actual' => $actual,
                'variance' => $planned - $actual,
                'utilization_percent' => $planned > 0 ? round($actual / $planned * 100, 1) : null,
            ];
        })->values()->all();

        return Inertia::render('Admin/reports/financial-detail', [
            'title' => 'Budget vs Actual',
            'stats' => ['budget' => (float) $budgets->sum('amount'), 'actual' => (float) collect($rows)->sum('actual')],
            'rows' => $rows,
            'accounts' => Account::where('type', AccountType::Expense->value)->orderBy('code')->get(['id', 'code', 'name']),
            'period' => $period,
            'showBudgetForm' => true,
        ]);
    }

    public function incomeStatement(Request $request): Response
    {
        $income = StudentPayment::whereIn('status', ['paid', 'approved'])
            ->when($request->query('from'), fn ($query, $from) => $query->whereDate('payment_date', '>=', $from))
            ->when($request->query('to'), fn ($query, $to) => $query->whereDate('payment_date', '<=', $to))
            ->with('invoice')->get()
            ->groupBy(fn (StudentPayment $payment) => $payment->invoice?->type ?? 'other')
            ->map(fn ($group, $type) => ['section' => 'Revenue', 'account' => ucfirst($type), 'amount' => (float) $group->sum('amount')]);
        $expenses = Expense::with('account')->where('status', 'paid')
            ->where(function ($query) use ($request) {
                $query->where(function ($paid) use ($request) {
                    $paid->whereNotNull('paid_at')
                        ->when($request->query('from'), fn ($dateQuery, $from) => $dateQuery->whereDate('paid_at', '>=', $from))
                        ->when($request->query('to'), fn ($dateQuery, $to) => $dateQuery->whereDate('paid_at', '<=', $to));
                })->orWhere(function ($legacy) use ($request) {
                    $legacy->whereNull('paid_at')
                        ->when($request->query('from'), fn ($dateQuery, $from) => $dateQuery->whereDate('expense_date', '>=', $from))
                        ->when($request->query('to'), fn ($dateQuery, $to) => $dateQuery->whereDate('expense_date', '<=', $to));
                });
            })
            ->get()
            ->groupBy(fn (Expense $expense) => $expense->account?->name ?? 'Unassigned')
            ->map(fn ($group, $account) => ['section' => 'Expenses', 'account' => $account, 'amount' => (float) $group->sum('amount')]);
        $rows = $income->concat($expenses)->values();
        $revenue = (float) $income->sum('amount');
        $expenseTotal = (float) $expenses->sum('amount');

        return $this->renderFinancialReport('Income Statement', [
            'revenue' => $revenue,
            'expenses' => $expenseTotal,
            'surplus_deficit' => $revenue - $expenseTotal,
        ], $rows->all(), ['filters' => $request->only(['from', 'to'])]);
    }

    public function storeBudget(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'account_id' => ['required', 'exists:accounts,id'],
            'financial_period' => ['required', 'regex:/^\d{4}(?:-\d{2})?$/'],
            'amount' => ['required', 'numeric', 'min:0'],
        ]);

        FinancialBudget::updateOrCreate(
            ['account_id' => $validated['account_id'], 'financial_period' => $validated['financial_period']],
            ['amount' => $validated['amount']],
        );

        return back()->with('success', 'Budget saved.');
    }

    /** @param array<string, int|float> $stats
     * @param  array<int, array<string, string|int|float|null>>  $rows
     */
    private function renderFinancialReport(string $title, array $stats, array $rows, array $extra = []): Response
    {
        return Inertia::render('Admin/reports/financial-detail', [
            'title' => $title,
            'stats' => $stats,
            'rows' => $rows,
            ...$extra,
        ]);
    }

    /**
     * Graduation sub-report page.
     */
    public function graduation(): Response
    {
        return Inertia::render('Admin/reports/components/graduation', [
            'stats' => Inertia::defer(fn () => [
                'total_students' => Student::count(),
                'active_students' => Student::where('enrollment_status', 'enrolled')->count(),
                'graduated_students' => Student::where('enrollment_status', 'graduated')->count(),
                'suspended_students' => Student::where('enrollment_status', 'suspended')->count(),
                'pending_students' => Student::where('enrollment_status', 'pending')->count(),
                'total_revenue' => (float) StudentPayment::whereIn('status', ['paid', 'approved'])->sum('amount'),
                'outstanding_balance' => 0,
            ]),
        ]);
    }

    /**
     * Get total outstanding balance across all student invoices.
     */
    private function getOutstandingBalance(): float
    {
        return (float) (StudentInvoice::selectRaw('COALESCE(SUM(amount - paid_amount), 0) as total')->value('total') ?? 0);
    }

    /**
     * Shorten a long program name to an acronym-style short label.
     */
    private function shortenProgramName(string $name): string
    {
        $name = preg_replace('/^Bachelor of Science in /i', 'B.Sc. ', $name);
        $name = preg_replace('/^Master of Science in /i', 'M.Sc. ', $name);

        return $name ?? 'Program';
    }
}
