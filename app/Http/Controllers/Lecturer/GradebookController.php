<?php

namespace App\Http\Controllers\Lecturer;

use App\Models\Course;
use App\Models\Student;
use App\Models\StudentGrade;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class GradebookController extends LecturerBaseController
{
    /**
     * Display the course gradebook interface.
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
        $course = $assignedCourses->firstWhere('id', $selectedCourseId);

        $students = collect();
        if ($course) {
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
                    $grade = StudentGrade::query()
                        ->where('student_id', $student->id)
                        ->where(function ($q) use ($course) {
                            $q->where('course_id', $course->id)
                                ->orWhere('course_code', $course->code);
                        })
                        ->first();

                    return [
                        'student_id' => $student->id,
                        'matric_no' => $student->matric_no,
                        'name' => $student->user->name ?? 'Unknown',
                        'credits' => $grade?->credits ?? $course->credit_hours,
                        'grade' => $grade?->grade ?? '',
                        'grade_point' => $grade?->grade_point ?? null,
                        'status' => $grade?->status ?? 'in_progress',
                        'grade_id' => $grade?->id,
                    ];
                });
        }

        return Inertia::render('lecturer/gradebook/index', [
            'courses' => $assignedCourses,
            'selected_course_id' => $selectedCourseId,
            'course' => $course,
            'students' => $students,
        ]);
    }

    /**
     * Batch save grades for students in a course.
     */
    public function store(Request $request): RedirectResponse
    {
        $lecturer = $this->getLecturer($request);

        $validated = $request->validate([
            'course_id' => ['required', 'exists:courses,id'],
            'grades' => ['required', 'array', 'min:1'],
            'grades.*.student_id' => ['required', 'exists:students,id'],
            'grades.*.credits' => ['required', 'integer', 'min:1', 'max:10'],
            'grades.*.grade' => ['nullable', 'string', 'max:5'],
            'grades.*.grade_point' => ['nullable', 'numeric', 'min:0', 'max:4.00'],
            'grades.*.status' => ['required', 'string', 'in:passed,failed,in_progress'],
        ]);

        $course = Course::findOrFail($validated['course_id']);

        $isAssigned = $course->assignments()
            ->where('lecturer_id', $lecturer->id)
            ->exists();

        if (! $isAssigned) {
            abort(403, 'You are not assigned to teach this course.');
        }

        $affectedStudents = [];

        foreach ($validated['grades'] as $item) {
            StudentGrade::updateOrCreate(
                [
                    'student_id' => $item['student_id'],
                    'course_id' => $course->id,
                ],
                [
                    'course_code' => $course->code,
                    'course_name' => $course->name,
                    'semester' => $course->semester,
                    'credits' => $item['credits'],
                    'grade' => $item['grade'] ?: null,
                    'grade_point' => $item['grade_point'] !== null ? (float) $item['grade_point'] : null,
                    'status' => $item['status'],
                ]
            );

            $affectedStudents[] = $item['student_id'];
        }

        // Recalculate GPA for all affected students
        $students = Student::whereIn('id', array_unique($affectedStudents))->get();
        foreach ($students as $student) {
            $student->recalculateGpa();
        }

        return back()->with('success', 'Gradebook updated successfully for '.count($validated['grades']).' students.');
    }
}
