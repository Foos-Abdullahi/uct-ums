<?php

namespace App\Http\Controllers\Lecturer;

use App\Models\Course;
use App\Models\CourseAssignment;
use App\Models\CourseMaterial;
use App\Models\Student;
use App\Models\StudentAttendance;
use App\Models\StudentGrade;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CourseController extends LecturerBaseController
{
    /**
     * Display a listing of courses assigned to the lecturer.
     */
    public function index(Request $request): Response
    {
        $lecturer = $this->getLecturer($request);

        $search = $request->query('search');
        $semester = $request->query('semester');
        $academicYear = $request->query('academic_year');

        $query = CourseAssignment::query()
            ->with(['course.program'])
            ->where('lecturer_id', $lecturer->id)
            ->when($search, function ($q) use ($search) {
                $q->where(function ($sub) use ($search) {
                    $sub->where('section', 'like', "%{$search}%")
                        ->orWhere('room', 'like', "%{$search}%")
                        ->orWhereHas('course', function ($cq) use ($search) {
                            $cq->where('code', 'like', "%{$search}%")
                                ->orWhere('name', 'like', "%{$search}%");
                        });
                });
            })
            ->when($semester && $semester !== 'all', fn ($q) => $q->where('semester', $semester))
            ->when($academicYear && $academicYear !== 'all', fn ($q) => $q->where('academic_year', $academicYear))
            ->latest('id');

        $assignments = $query->get()->map(function ($assignment) {
            $studentCount = 0;
            if ($assignment->course) {
                $studentCount = Student::query()
                    ->where('enrollment_status', 'enrolled')
                    ->where('program_id', $assignment->course->program_id)
                    ->where('current_semester', $assignment->course->semester)
                    ->count();
            }
            $assignment->setAttribute('students_count', $studentCount);

            return $assignment;
        });

        $academicYears = CourseAssignment::query()
            ->where('lecturer_id', $lecturer->id)
            ->distinct()
            ->pluck('academic_year');

        return Inertia::render('lecturer/courses/index', [
            'assignments' => $assignments,
            'academic_years' => $academicYears,
            'filters' => [
                'search' => $search ?? '',
                'semester' => $semester ?? 'all',
                'academic_year' => $academicYear ?? 'all',
            ],
        ]);
    }

    /**
     * Display detailed view of a course assigned to the lecturer.
     */
    public function show(Request $request, Course $course): Response
    {
        $lecturer = $this->getLecturer($request);

        $assignment = CourseAssignment::query()
            ->with(['course.program'])
            ->where('lecturer_id', $lecturer->id)
            ->where('course_id', $course->id)
            ->first();

        if (! $assignment) {
            abort(403, 'You are not assigned to teach this course.');
        }

        // Students in this course (by program & semester, or who have grades/attendances in this course)
        $students = Student::query()
            ->with('user')
            ->where(function ($q) use ($course) {
                $q->where(function ($sub) use ($course) {
                    $sub->where('program_id', $course->program_id)
                        ->where('current_semester', $course->semester);
                })->orWhereHas('grades', function ($gq) use ($course) {
                    $gq->where('course_id', $course->id)
                        ->orWhere('course_code', $course->code);
                });
            })
            ->orderBy('matric_no')
            ->get()
            ->map(function ($student) use ($course) {
                // Get grade if exists
                $grade = StudentGrade::query()
                    ->where('student_id', $student->id)
                    ->where(function ($q) use ($course) {
                        $q->where('course_id', $course->id)
                            ->orWhere('course_code', $course->code);
                    })
                    ->first();

                // Get attendance summary
                $attendances = StudentAttendance::query()
                    ->where('student_id', $student->id)
                    ->where(function ($q) use ($course) {
                        $q->where('course_id', $course->id)
                            ->orWhere('course_name', $course->name);
                    })
                    ->get();

                $totalSessions = $attendances->count();
                $presentCount = $attendances->whereIn('status', ['present', 'late'])->count();
                $attendanceRate = $totalSessions > 0 ? round(($presentCount / $totalSessions) * 100, 1) : null;

                return [
                    'id' => $student->id,
                    'matric_no' => $student->matric_no,
                    'name' => $student->user->name ?? 'Unknown',
                    'email' => $student->user->email ?? '',
                    'gender' => $student->gender,
                    'grade' => $grade?->grade,
                    'grade_point' => $grade?->grade_point,
                    'grade_status' => $grade?->status,
                    'attendance_rate' => $attendanceRate,
                    'total_attendances' => $totalSessions,
                ];
            });

        // Attendance history sessions for this course
        $attendanceSessions = StudentAttendance::query()
            ->select('date')
            ->where(function ($q) use ($course) {
                $q->where('course_id', $course->id)
                    ->orWhere('course_name', $course->name);
            })
            ->distinct()
            ->orderByDesc('date')
            ->take(10)
            ->get()
            ->map(function ($session) use ($course) {
                $records = StudentAttendance::query()
                    ->where('date', $session->date)
                    ->where(function ($q) use ($course) {
                        $q->where('course_id', $course->id)
                            ->orWhere('course_name', $course->name);
                    })
                    ->get();

                return [
                    'date' => $session->date,
                    'total' => $records->count(),
                    'present' => $records->where('status', 'present')->count(),
                    'absent' => $records->where('status', 'absent')->count(),
                    'late' => $records->where('status', 'late')->count(),
                    'excused' => $records->where('status', 'excused')->count(),
                ];
            });

        // Materials uploaded for this course
        $materials = CourseMaterial::query()
            ->where('course_id', $course->id)
            ->latest('id')
            ->get();

        return Inertia::render('lecturer/courses/show', [
            'course' => $course->load('program'),
            'assignment' => $assignment,
            'students' => $students,
            'attendance_sessions' => $attendanceSessions,
            'materials' => $materials,
        ]);
    }
}
