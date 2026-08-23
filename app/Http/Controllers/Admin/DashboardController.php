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
use App\Models\StudentInvoice;
use App\Models\StudentPayment;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Display the comprehensive admin dashboard with deferred stats and operational insights.
     */
    public function index(Request $request): Response
    {
        return Inertia::render('Admin/dashboard', [
            'stats' => Inertia::defer(function () {
                $totalStudents = Student::count();
                $activeStudents = Student::where('enrollment_status', 'enrolled')->count();
                $pendingStudents = Student::where('enrollment_status', 'pending')->count();
                $suspendedStudents = Student::where('enrollment_status', 'suspended')->count();
                $graduatedStudents = Student::where('enrollment_status', 'graduated')->count();

                $totalLecturers = Lecturer::count();
                $activeLecturers = Lecturer::where('employment_status', 'active')->count();

                $totalCourses = Course::count();
                $activeCourses = Course::where('status', 'active')->count();
                $totalPrograms = Program::count();

                $totalRevenue = (float) (StudentPayment::where('status', 'approved')->sum('amount') ?: 0);
                $totalInvoiced = (float) (StudentInvoice::sum('amount') ?: 0);
                $totalPaidInvoices = (float) (StudentInvoice::sum('paid_amount') ?: 0);
                $outstandingBalance = max(0, $totalInvoiced - $totalPaidInvoices);
                $collectionRate = $totalInvoiced > 0 ? round(($totalPaidInvoices / $totalInvoiced) * 100, 1) : 0;

                $totalApplications = Admission::count();
                $pendingApplications = Admission::where('status', 'pending')->count();
                $approvedApplications = Admission::where('status', 'approved')->count();
                $convertedApplications = Admission::where('status', 'converted')->count();
                $rejectedApplications = Admission::where('status', 'rejected')->count();

                $totalAssignments = CourseAssignment::count();
                $activeAssignments = CourseAssignment::where('status', 'active')->count();
                $totalCertificates = StudentCertificate::count();

                return [
                    'total_students' => $totalStudents,
                    'active_students' => $activeStudents,
                    'pending_students' => $pendingStudents,
                    'suspended_students' => $suspendedStudents,
                    'graduated_students' => $graduatedStudents,
                    'total_lecturers' => $totalLecturers,
                    'active_lecturers' => $activeLecturers,
                    'total_courses' => $totalCourses,
                    'active_courses' => $activeCourses,
                    'total_programs' => $totalPrograms,
                    'total_revenue' => $totalRevenue,
                    'total_invoiced' => $totalInvoiced,
                    'outstanding_balance' => $outstandingBalance,
                    'collection_rate' => $collectionRate,
                    'total_applications' => $totalApplications,
                    'pending_applications' => $pendingApplications,
                    'approved_applications' => $approvedApplications,
                    'converted_applications' => $convertedApplications,
                    'rejected_applications' => $rejectedApplications,
                    'total_assignments' => $totalAssignments,
                    'active_assignments' => $activeAssignments,
                    'total_certificates' => $totalCertificates,
                ];
            }),

            'programs_distribution' => Inertia::defer(function () {
                return Program::query()
                    ->withCount(['students', 'courses'])
                    ->orderByDesc('students_count')
                    ->take(6)
                    ->get()
                    ->map(fn (Program $p) => [
                        'id' => $p->id,
                        'name' => $p->name,
                        'code' => $p->code ?? ('PRG-'.str_pad((string) $p->id, 3, '0', STR_PAD_LEFT)),
                        'department' => $p->department ?? 'Academic Dept',
                        'faculty' => $p->faculty ?? 'Faculty of Studies',
                        'level' => ucfirst($p->degree_level ?? 'undergraduate'),
                        'students_count' => $p->students_count,
                        'courses_count' => $p->courses_count,
                    ]);
            }),

            'recent_applications' => Inertia::defer(function () {
                return Admission::query()
                    ->with('program')
                    ->latest('id')
                    ->take(6)
                    ->get()
                    ->map(fn (Admission $a) => [
                        'id' => $a->id,
                        'application_no' => $a->application_no,
                        'name' => $a->full_name,
                        'email' => $a->email,
                        'program' => $a->program?->name ?? 'General Studies',
                        'program_code' => $a->program?->code ?? ('PRG-'.str_pad((string) ($a->program?->id ?? 1), 3, '0', STR_PAD_LEFT)),
                        'status' => $a->status,
                        'created_at' => $a->created_at?->diffForHumans() ?? 'Recently',
                        'date' => $a->created_at?->format('M d, Y') ?? 'N/A',
                    ]);
            }),

            'recent_payments' => Inertia::defer(function () {
                return StudentPayment::query()
                    ->with(['student.user', 'invoice'])
                    ->latest('id')
                    ->take(6)
                    ->get()
                    ->map(fn (StudentPayment $p) => [
                        'id' => $p->id,
                        'transaction_no' => $p->transaction_no,
                        'student_name' => $p->student?->user?->name ?? 'Student #'.$p->student_id,
                        'matric_no' => $p->student?->matric_no ?? 'N/A',
                        'amount' => (float) $p->amount,
                        'payment_method' => str_replace('_', ' ', ucfirst($p->payment_method)),
                        'status' => $p->status,
                        'date' => $p->payment_date ? $p->payment_date->format('M d, Y') : ($p->created_at?->format('M d, Y') ?? 'N/A'),
                    ]);
            }),

            'recent_assignments' => Inertia::defer(function () {
                return CourseAssignment::query()
                    ->with(['lecturer.user', 'course'])
                    ->latest('id')
                    ->take(6)
                    ->get()
                    ->map(fn (CourseAssignment $ca) => [
                        'id' => $ca->id,
                        'course_code' => $ca->course?->code ?? 'N/A',
                        'course_name' => $ca->course?->name ?? 'Course Title',
                        'lecturer_name' => $ca->lecturer?->user?->name ?? 'Lecturer #'.$ca->lecturer_id,
                        'department' => $ca->lecturer?->department ?? 'Faculty',
                        'schedule' => ($ca->schedule_day ? $ca->schedule_day.' ' : '').($ca->schedule_time ?? 'TBA'),
                        'room' => $ca->room ?? 'Main Campus',
                        'status' => $ca->status,
                    ]);
            }),

            'recent_students' => Inertia::defer(function () {
                return Student::query()
                    ->with(['user', 'program'])
                    ->latest('id')
                    ->take(6)
                    ->get()
                    ->map(fn (Student $s) => [
                        'id' => $s->id,
                        'name' => $s->user?->name ?? 'Student',
                        'email' => $s->user?->email ?? '',
                        'matric_no' => $s->matric_no,
                        'program' => $s->program?->name ?? 'General Program',
                        'enrollment_status' => $s->enrollment_status ?? 'enrolled',
                        'fee_status' => is_object($s->fee_status) ? $s->fee_status->value : ($s->fee_status ?? 'unpaid'),
                        'current_semester' => $s->current_semester ?? 1,
                        'created_at' => $s->created_at?->format('M d, Y') ?? 'Recently',
                    ]);
            }),

            'semester_distribution' => Inertia::defer(function () {
                return Student::query()
                    ->selectRaw('current_semester, count(*) as total')
                    ->whereNotNull('current_semester')
                    ->groupBy('current_semester')
                    ->orderBy('current_semester')
                    ->get()
                    ->map(fn ($row) => [
                        'semester' => 'Semester '.(int) $row->current_semester,
                        'total' => (int) $row->total,
                    ]);
            }),
        ]);
    }
}
