<?php

namespace App\Http\Controllers\Lecturer;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\CourseAssignment;
use App\Models\Lecturer;
use App\Models\Student;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

abstract class LecturerBaseController extends Controller
{
    /**
     * Get the lecturer's active assignments for an optional course.
     *
     * @return Collection<int, CourseAssignment>
     */
    protected function activeAssignments(Lecturer $lecturer, ?Course $course = null): Collection
    {
        return CourseAssignment::query()
            ->with('course')
            ->where('lecturer_id', $lecturer->id)
            ->where('status', 'active')
            ->when($course, fn (Builder $query) => $query->where('course_id', $course->id))
            ->get();
    }

    /**
     * Scope students to the cohorts covered by the given course assignments.
     *
     * @param  Collection<int, CourseAssignment>  $assignments
     * @return Builder<Student>
     */
    protected function studentsForAssignments(Collection $assignments): Builder
    {
        $assignments = $assignments->filter(fn (CourseAssignment $assignment) => $assignment->course !== null);

        if ($assignments->isEmpty()) {
            return Student::query()->whereRaw('0 = 1');
        }

        return Student::query()
            ->where('enrollment_status', 'enrolled')
            ->where(function (Builder $query) use ($assignments) {
                foreach ($assignments as $assignment) {
                    $query->orWhere(function (Builder $studentQuery) use ($assignment) {
                        $studentQuery->where('program_id', $assignment->course->program_id)
                            ->where('current_semester', $assignment->course->semester);

                        if ($assignment->section) {
                            $studentQuery->where('section', $assignment->section);
                        }

                        if ($assignment->academic_year) {
                            $studentQuery->where('academic_year', $assignment->academic_year);
                        }
                    });
                }
            });
    }

    /**
     * Get or create the lecturer record for the authenticated user.
     */
    protected function getLecturer(Request $request): Lecturer
    {
        $user = $request->user();

        if (! $user) {
            abort(401);
        }

        $lecturer = $user->lecturer;

        if (! $lecturer) {
            $lecturer = Lecturer::query()->firstOrCreate(
                ['user_id' => $user->id],
                [
                    'lecturer_no' => 'LEC-'.str_pad((string) $user->id, 5, '0', STR_PAD_LEFT),
                    'department' => 'Academic Affairs',
                    'designation' => 'Lecturer',
                    'employment_status' => 'active',
                    'contract_type' => 'full_time',
                ]
            );
        }

        return $lecturer;
    }
}
