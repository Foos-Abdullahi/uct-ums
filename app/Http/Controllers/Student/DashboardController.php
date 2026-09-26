<?php

namespace App\Http\Controllers\Student;

use App\Models\Course;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends StudentBaseController
{
    /**
     * Display the student dashboard.
     */
    public function index(Request $request): Response
    {
        $student = $this->getStudent($request);
        $student->load(['user', 'program']);

        // Courses for the student's current program & semester
        $courses = Course::query()
            ->with(['assignments.lecturer.user'])
            ->where('program_id', $student->program_id)
            ->where('semester', $student->current_semester)
            ->where('status', 'active')
            ->get();

        // Recent grades (last 5)
        $recentGrades = $student->grades()
            ->orderByDesc('id')
            ->take(5)
            ->get();

        // Attendance summary
        $allAttendances = $student->attendances()->get();
        $totalSessions = $allAttendances->count();
        $presentCount = $allAttendances->whereIn('status', ['present', 'late'])->count();
        $attendanceRate = $totalSessions > 0 ? round(($presentCount / $totalSessions) * 100, 1) : null;

        // Finance summary
        $totalInvoiced = (float) $student->invoices()->sum('amount');
        $totalPaid = (float) $student->payments()->where('status', 'approved')->sum('amount');
        $outstandingBalance = max(0, $totalInvoiced - $totalPaid);

        // Next due invoice
        $nextDueInvoice = $student->invoices()
            ->whereIn('status', ['unpaid', 'partial', 'overdue'])
            ->whereNotNull('due_date')
            ->orderBy('due_date')
            ->first();

        // GPA & credit stats
        $completedGrades = $student->grades()->whereNotNull('grade_point')->where('credits', '>', 0)->get();
        $totalCredits = $completedGrades->sum('credits');
        $passedCredits = $completedGrades->where('status', 'passed')->sum('credits');

        return Inertia::render('Student/dashboard', [
            'student' => $student,
            'stats' => [
                'gpa' => $student->gpa,
                'total_credits' => $totalCredits,
                'passed_credits' => $passedCredits,
                'attendance_rate' => $attendanceRate,
                'outstanding_balance' => $outstandingBalance,
                'fee_status' => $student->fee_status->value,
            ],
            'courses' => $courses,
            'recent_grades' => $recentGrades,
            'next_due_invoice' => $nextDueInvoice,
        ]);
    }
}
