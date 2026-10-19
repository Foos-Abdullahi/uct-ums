<?php

namespace App\Actions\Academics;

use App\Models\Course;
use App\Models\CourseAssignment;
use Illuminate\Validation\ValidationException;

class EnsureTimetableHasNoConflicts
{
    /**
     * @param  array<string, mixed>  $schedule
     */
    public function handle(array $schedule, ?CourseAssignment $currentAssignment = null): void
    {
        if (! in_array($schedule['status'], ['assigned', 'active'], true)) {
            return;
        }

        $course = Course::query()->findOrFail($schedule['course_id']);
        $overlapping = CourseAssignment::query()
            ->whereIn('status', ['assigned', 'active'])
            ->where('academic_year', $schedule['academic_year'])
            ->where('semester', $schedule['semester'])
            ->where('weekday', $schedule['weekday'])
            ->where('start_time', '<', $schedule['end_time'])
            ->where('end_time', '>', $schedule['start_time'])
            ->when($currentAssignment, fn ($query) => $query->where('id', '!=', $currentAssignment->getKey()));

        $errors = [];

        if ((clone $overlapping)->where('lecturer_id', $schedule['lecturer_id'])->exists()) {
            $errors['lecturer_id'] = 'This lecturer already has an overlapping session.';
        }

        if ((clone $overlapping)->where('room', $schedule['room'])->exists()) {
            $errors['room'] = 'This room is already booked during the selected time.';
        }

        if ((clone $overlapping)
            ->where('section', $schedule['section'])
            ->whereHas('course', fn ($query) => $query->where('program_id', $course->program_id))
            ->exists()) {
            $errors['section'] = 'This program and section already has an overlapping session.';
        }

        if ($errors !== []) {
            throw ValidationException::withMessages($errors);
        }
    }
}
