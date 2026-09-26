<?php

namespace App\Http\Controllers\Lecturer;

use App\Models\CourseAssignment;
use App\Models\CourseMaterial;
use App\Models\Student;
use App\Models\StudentAttendance;
use App\Models\StudentGrade;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends LecturerBaseController
{
    /**
     * Display the lecturer's main dashboard.
     */
    public function index(Request $request): Response
    {
        $lecturer = $this->getLecturer($request);

        $assignments = CourseAssignment::query()
            ->with(['course.program'])
            ->where('lecturer_id', $lecturer->id)
            ->where('status', 'active')
            ->orderBy('schedule_day')
            ->get();

        $courseIds = $assignments->pluck('course_id')->filter()->unique()->values();

        // Calculate students enrolled in the assigned courses
        // Students in the program taking that course's semester
        $studentsCount = 0;
        foreach ($assignments as $assignment) {
            if ($assignment->course) {
                $enrolledCount = Student::query()
                    ->where('enrollment_status', 'enrolled')
                    ->where('program_id', $assignment->course->program_id)
                    ->where('current_semester', $assignment->course->semester)
                    ->count();
                $assignment->setAttribute('students_count', $enrolledCount);
                $studentsCount += $enrolledCount;
            } else {
                $assignment->setAttribute('students_count', 0);
            }
        }

        $totalWorkload = (int) $assignments->sum('workload_hours');

        $totalAttendanceSessions = StudentAttendance::query()
            ->whereIn('course_id', $courseIds)
            ->distinct('date')
            ->count('date');

        // Recent attendance entries
        $recentAttendances = StudentAttendance::query()
            ->with(['student.user', 'course'])
            ->whereIn('course_id', $courseIds)
            ->latest('date')
            ->take(6)
            ->get();

        // Recent grades entered
        $recentGrades = StudentGrade::query()
            ->with(['student.user', 'course'])
            ->whereIn('course_id', $courseIds)
            ->latest('id')
            ->take(6)
            ->get();

        // Recent materials
        $recentMaterials = CourseMaterial::query()
            ->with(['course'])
            ->where('lecturer_id', $lecturer->id)
            ->latest('id')
            ->take(5)
            ->get();

        return Inertia::render('lecturer/dashboard', [
            'lecturer' => $lecturer->load('user'),
            'stats' => [
                'total_courses' => $assignments->count(),
                'total_workload_hours' => $totalWorkload,
                'total_students' => $studentsCount,
                'attendance_sessions' => $totalAttendanceSessions,
            ],
            'assignments' => $assignments,
            'recent_attendances' => $recentAttendances,
            'recent_grades' => $recentGrades,
            'recent_materials' => $recentMaterials,
        ]);
    }
}
