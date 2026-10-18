<?php

namespace App\Actions\Academics;

use App\Models\CourseAssignment;
use App\Models\Student;
use Illuminate\Database\Eloquent\Collection;

class GetStudentWeeklyTimetable
{
    /**
     * @return Collection<int, CourseAssignment>
     */
    public function handle(Student $student): Collection
    {
        return CourseAssignment::query()
            ->with(['course', 'lecturer.user'])
            ->whereIn('status', ['assigned', 'active'])
            ->where('semester', 'Semester '.$student->current_semester)
            ->where('section', $student->section)
            ->when(
                $student->academic_year,
                fn ($query, string $academicYear) => $query->where('academic_year', $academicYear),
            )
            ->whereHas('course', fn ($query) => $query->where('program_id', $student->program_id))
            ->whereNotNull('weekday')
            ->whereNotNull('start_time')
            ->whereNotNull('end_time')
            ->get()
            ->sortBy(function (CourseAssignment $assignment): string {
                $weekdayOrder = array_search($assignment->weekday, [
                    'Saturday',
                    'Sunday',
                    'Monday',
                    'Tuesday',
                    'Wednesday',
                    'Thursday',
                    'Friday',
                ], true);

                return sprintf('%02d-%s', $weekdayOrder === false ? 99 : $weekdayOrder, $assignment->start_time);
            })
            ->values();
    }
}
