<?php

namespace App\Http\Controllers\Student;

use App\Models\Course;
use App\Models\CourseMaterial;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CoursesController extends StudentBaseController
{
    /**
     * Display the student's enrolled courses for the current semester.
     */
    public function index(Request $request): Response
    {
        $student = $this->getStudent($request);
        $student->load(['program']);

        $courses = Course::query()
            ->with(['assignments' => function ($q) {
                $q->where('status', 'active')->with('lecturer.user');
            }])
            ->where('program_id', $student->program_id)
            ->where('semester', $student->current_semester)
            ->where('status', 'active')
            ->get()
            ->map(function (Course $course) {
                $assignment = $course->assignments->first();

                $materials = CourseMaterial::query()
                    ->where('course_id', $course->id)
                    ->where('is_published', true)
                    ->orderByDesc('id')
                    ->get(['id', 'title', 'category', 'file_name', 'file_type', 'file_size', 'created_at']);

                return [
                    'id' => $course->id,
                    'code' => $course->code,
                    'name' => $course->name,
                    'credit_hours' => $course->credit_hours,
                    'semester' => $course->semester,
                    'description' => $course->description,
                    'lecturer_name' => $assignment?->lecturer?->user?->name,
                    'schedule_day' => $assignment?->schedule_day,
                    'schedule_time' => $assignment?->schedule_time,
                    'room' => $assignment?->room,
                    'section' => $assignment?->section,
                    'materials' => $materials,
                ];
            });

        return Inertia::render('Student/courses/index', [
            'student' => $student,
            'courses' => $courses,
        ]);
    }
}
