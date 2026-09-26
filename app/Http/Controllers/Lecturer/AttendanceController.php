<?php

namespace App\Http\Controllers\Lecturer;

use App\Models\Course;
use App\Models\Student;
use App\Models\StudentAttendance;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AttendanceController extends LecturerBaseController
{
    /**
     * Display the attendance management interface.
     */
    public function index(Request $request): Response
    {
        $lecturer = $this->getLecturer($request);

        $assignedCourses = Course::query()
            ->whereHas('assignments', function ($q) use ($lecturer) {
                $q->where('lecturer_id', $lecturer->id);
            })
            ->with('program')
            ->get();

        $selectedCourseId = (int) $request->query('course_id', $assignedCourses->first()?->id ?? 0);
        $selectedDate = $request->query('date', now()->toDateString());

        $course = $assignedCourses->firstWhere('id', $selectedCourseId);

        $students = collect();
        if ($course) {
            $students = Student::query()
                ->with('user')
                ->where(function ($q) use ($course) {
                    $q->where(function ($sub) use ($course) {
                        $sub->where('program_id', $course->program_id)
                            ->where('current_semester', $course->semester);
                    })->orWhereHas('attendances', function ($aq) use ($course) {
                        $aq->where('course_id', $course->id);
                    });
                })
                ->orderBy('matric_no')
                ->get()
                ->map(function ($student) use ($course, $selectedDate) {
                    $existing = StudentAttendance::query()
                        ->where('student_id', $student->id)
                        ->where(function ($q) use ($course) {
                            $q->where('course_id', $course->id)
                                ->orWhere('course_name', $course->name);
                        })
                        ->where('date', $selectedDate)
                        ->first();

                    return [
                        'student_id' => $student->id,
                        'matric_no' => $student->matric_no,
                        'name' => $student->user->name ?? 'Unknown',
                        'status' => $existing?->status ?? 'present',
                        'notes' => $existing?->notes ?? '',
                        'existing_id' => $existing?->id,
                    ];
                });
        }

        // Attendance history sessions for this course
        $historySessions = collect();
        if ($course) {
            $historySessions = StudentAttendance::query()
                ->select('date')
                ->where(function ($q) use ($course) {
                    $q->where('course_id', $course->id)
                        ->orWhere('course_name', $course->name);
                })
                ->distinct()
                ->orderByDesc('date')
                ->take(15)
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
        }

        return Inertia::render('lecturer/attendance/index', [
            'courses' => $assignedCourses,
            'selected_course_id' => $selectedCourseId,
            'selected_date' => $selectedDate,
            'course' => $course,
            'students' => $students,
            'history_sessions' => $historySessions,
        ]);
    }

    /**
     * Batch save attendance for a class session.
     */
    public function store(Request $request): RedirectResponse
    {
        $lecturer = $this->getLecturer($request);

        $validated = $request->validate([
            'course_id' => ['required', 'exists:courses,id'],
            'date' => ['required', 'date'],
            'records' => ['required', 'array', 'min:1'],
            'records.*.student_id' => ['required', 'exists:students,id'],
            'records.*.status' => ['required', 'string', 'in:present,absent,late,excused'],
            'records.*.notes' => ['nullable', 'string', 'max:255'],
        ]);

        $course = Course::findOrFail($validated['course_id']);

        // Verify assignment
        $isAssigned = $course->assignments()
            ->where('lecturer_id', $lecturer->id)
            ->exists();

        if (! $isAssigned) {
            abort(403, 'You are not assigned to teach this course.');
        }

        foreach ($validated['records'] as $record) {
            StudentAttendance::updateOrCreate(
                [
                    'student_id' => $record['student_id'],
                    'course_id' => $course->id,
                    'date' => $validated['date'],
                ],
                [
                    'course_name' => $course->name,
                    'status' => $record['status'],
                    'notes' => $record['notes'] ?? null,
                ]
            );
        }

        return back()->with('success', 'Attendance records saved successfully for '.count($validated['records']).' students.');
    }

    /**
     * Delete an attendance entry.
     */
    public function destroy(Request $request, StudentAttendance $attendance): RedirectResponse
    {
        $lecturer = $this->getLecturer($request);

        // Verify access through course
        if ($attendance->course_id) {
            $isAssigned = Course::where('id', $attendance->course_id)
                ->whereHas('assignments', fn ($q) => $q->where('lecturer_id', $lecturer->id))
                ->exists();

            if (! $isAssigned) {
                abort(403);
            }
        }

        $attendance->delete();

        return back()->with('success', 'Attendance record deleted successfully.');
    }
}
