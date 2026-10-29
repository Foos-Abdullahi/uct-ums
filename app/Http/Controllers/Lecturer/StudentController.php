<?php

namespace App\Http\Controllers\Lecturer;

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

        $assignments = $this->activeAssignments($lecturer);
        $assignedCourses = $assignments->pluck('course')->filter()->unique('id')->values();
        $rosterAssignments = $courseId && $courseId !== 'all'
            ? $assignments->where('course_id', (int) $courseId)
            : $assignments;

        $courseIds = $assignedCourses->pluck('id')->all();

        // Scope students
        $query = $this->studentsForAssignments($rosterAssignments)
            ->with(['user', 'program'])
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
