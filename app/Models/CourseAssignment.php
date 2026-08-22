<?php

namespace App\Models;

use Database\Factories\CourseAssignmentFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class CourseAssignment extends Model
{
    /** @use HasFactory<CourseAssignmentFactory> */
    use HasFactory, SoftDeletes;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'lecturer_id',
        'course_id',
        'academic_year',
        'semester',
        'section',
        'role',
        'status',
        'workload_hours',
        'room',
        'schedule_day',
        'schedule_time',
        'notes',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'workload_hours' => 'integer',
        ];
    }

    /**
     * @return BelongsTo<Lecturer, $this>
     */
    public function lecturer(): BelongsTo
    {
        return $this->belongsTo(Lecturer::class, 'lecturer_id');
    }

    /**
     * @return BelongsTo<Course, $this>
     */
    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class, 'course_id');
    }

    /**
     * Scope a query to search by course code, name, lecturer name, or section.
     *
     * @param  Builder<CourseAssignment>  $query
     */
    public function scopeSearch(Builder $query, ?string $search): void
    {
        if (! $search) {
            return;
        }

        $query->where(function (Builder $q) use ($search) {
            $q->where('section', 'like', "%{$search}%")
                ->orWhere('academic_year', 'like', "%{$search}%")
                ->orWhere('room', 'like', "%{$search}%")
                ->orWhereHas('course', function (Builder $courseQuery) use ($search) {
                    $courseQuery->where('code', 'like', "%{$search}%")
                        ->orWhere('name', 'like', "%{$search}%");
                })
                ->orWhereHas('lecturer.user', function (Builder $userQuery) use ($search) {
                    $userQuery->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                })
                ->orWhereHas('lecturer', function (Builder $lecQuery) use ($search) {
                    $lecQuery->where('lecturer_no', 'like', "%{$search}%")
                        ->orWhere('department', 'like', "%{$search}%");
                });
        });
    }

    /**
     * Scope a query to filter by semester.
     *
     * @param  Builder<CourseAssignment>  $query
     */
    public function scopeFilterSemester(Builder $query, ?string $semester): void
    {
        if ($semester && $semester !== 'all') {
            $query->where('semester', $semester);
        }
    }

    /**
     * Scope a query to filter by academic year.
     *
     * @param  Builder<CourseAssignment>  $query
     */
    public function scopeFilterAcademicYear(Builder $query, ?string $academicYear): void
    {
        if ($academicYear && $academicYear !== 'all') {
            $query->where('academic_year', $academicYear);
        }
    }

    /**
     * Scope a query to filter by status.
     *
     * @param  Builder<CourseAssignment>  $query
     */
    public function scopeFilterStatus(Builder $query, ?string $status): void
    {
        if ($status && $status !== 'all') {
            $query->where('status', $status);
        }
    }

    /**
     * Scope a query to filter by role.
     *
     * @param  Builder<CourseAssignment>  $query
     */
    public function scopeFilterRole(Builder $query, ?string $role): void
    {
        if ($role && $role !== 'all') {
            $query->where('role', $role);
        }
    }

    /**
     * Scope a query to filter by department.
     *
     * @param  Builder<CourseAssignment>  $query
     */
    public function scopeFilterDepartment(Builder $query, ?string $department): void
    {
        if ($department && $department !== 'all') {
            $query->whereHas('lecturer', function (Builder $q) use ($department) {
                $q->where('department', $department);
            });
        }
    }
}
