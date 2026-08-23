<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Admission;
use App\Models\Course;
use App\Models\CourseAssignment;
use App\Models\Lecturer;
use App\Models\Program;
use App\Models\Student;
use App\Models\StudentCertificate;
use App\Models\StudentGrade;
use App\Models\StudentInvoice;
use App\Models\StudentPayment;
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
                'total_collected' => (float) StudentPayment::where('status', 'paid')->sum('amount'),
                'total_outstanding' => $this->getOutstandingBalance(),
                'collection_rate' => (function () {
                    $invoiced = (float) StudentInvoice::sum('amount');
                    $collected = (float) StudentPayment::where('status', 'paid')->sum('amount');

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
                    'total' => (int) $row->total,
                ])
                ->values()
                ->all()
            ),

            // ── Payments Breakdown by Method ────────────────────────────────
            'payments_by_method' => Inertia::defer(fn () => StudentPayment::where('status', 'paid')
                ->selectRaw('payment_method, count(*) as transactions, sum(amount) as total')
                ->groupBy('payment_method')
                ->get()
                ->map(fn ($row) => [
                    'method' => $row->payment_method ?? 'unknown',
                    'label' => ucwords(str_replace('_', ' ', $row->payment_method ?? 'Unknown')),
                    'transactions' => (int) $row->transactions,
                    'total' => (float) $row->total,
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
                    'total' => (int) $row->total,
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
                    'semester' => 'Semester '.$row->semester,
                    'total' => (int) $row->total,
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
                    'gpa' => (float) $g->gpa,
                    'courses_taken' => (int) $g->courses_taken,
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
                'total_revenue' => (float) StudentPayment::where('status', 'paid')->sum('amount'),
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
                'total_revenue' => (float) StudentPayment::where('status', 'paid')->sum('amount'),
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
                'total_revenue' => (float) StudentPayment::where('status', 'paid')->sum('amount'),
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
                'total_students' => Student::count(),
                'active_students' => Student::where('enrollment_status', 'enrolled')->count(),
                'graduated_students' => Student::where('enrollment_status', 'graduated')->count(),
                'suspended_students' => Student::where('enrollment_status', 'suspended')->count(),
                'pending_students' => Student::where('enrollment_status', 'pending')->count(),
                'total_revenue' => (float) StudentPayment::where('status', 'paid')->sum('amount'),
                'outstanding_balance' => $this->getOutstandingBalance(),
            ]),
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
                'total_revenue' => (float) StudentPayment::where('status', 'paid')->sum('amount'),
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
