<?php

namespace App\Http\Controllers\Lecturer;

use App\Models\Course;
use App\Models\Student;
use App\Models\StudentAttendance;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StudentController extends LecturerBaseController
{
    /**
     * Display a listing of students enrolled in lecturer's courses.
     */
    public function index(Request $request): Response
    {
        $lecturer = $this->getLecturer($request);

        $courseId = $request->query('course_id');
        $search = $request->query('search');
        $perPage = (int) $request->query('per_page', 15);
        if ($perPage <= 0 || $perPage > 100) {
            $perPage = 15;
        }

        $assignedCourses = Course::query()
            ->whereHas('assignments', function ($q) use ($lecturer) {
                $q->where('lecturer_id', $lecturer->id);
            })
            ->with('program')
            ->get();

        $courseIds = $assignedCourses->pluck('id')->all();

        // Scope students
        $query = Student::query()
            ->with(['user', 'program'])
            ->where(function ($q) use ($assignedCourses, $courseIds) {
                foreach ($assignedCourses as $c) {
                    $q->orWhere(function ($sub) use ($c) {
                        $sub->where('program_id', $c->program_id)
                            ->where('current_semester', $c->semester);
                    });
                }
                $q->orWhereHas('grades', function ($gq) use ($courseIds) {
                    $gq->whereIn('course_id', $courseIds);
                });
            })
            ->when($courseId && $courseId !== 'all', function ($q) use ($courseId) {
                $targetCourse = Course::find($courseId);
                if ($targetCourse) {
                    $q->where(function ($sub) use ($targetCourse) {
                        $sub->where(function ($inner) use ($targetCourse) {
                            $inner->where('program_id', $targetCourse->program_id)
                                ->where('current_semester', $targetCourse->semester);
                        })->orWhereHas('grades', function ($gq) use ($targetCourse) {
                            $gq->where('course_id', $targetCourse->id)
                                ->orWhere('course_code', $targetCourse->code);
                        });
                    });
                }
            })
            ->when($search, function ($q) use ($search) {
                $q->where(function ($sub) use ($search) {
                    $sub->where('matric_no', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%")
                        ->orWhereHas('user', function ($uq) use ($search) {
                            $uq->where('name', 'like', "%{$search}%")
                                ->orWhere('email', 'like', "%{$search}%");
                        });
                });
            })
            ->orderBy('matric_no');

        $paginated = $query->paginate($perPage)->withQueryString();

        // Transform collection to attach attendance stats
        $paginated->getCollection()->transform(function ($student) use ($courseIds) {
            $attendances = StudentAttendance::query()
                ->where('student_id', $student->id)
                ->whereIn('course_id', $courseIds)
                ->get();

            $total = $attendances->count();
            $present = $attendances->whereIn('status', ['present', 'late'])->count();
            $student->attendance_rate = $total > 0 ? round(($present / $total) * 100, 1) : null;
            $student->total_sessions = $total;

            return $student;
        });

        return Inertia::render('lecturer/students/index', [
            'students' => $paginated,
            'courses' => $assignedCourses,
            'filters' => [
                'course_id' => $courseId ?? 'all',
                'search' => $search ?? '',
                'per_page' => $perPage,
            ],
        ]);
    }
}
