<?php

namespace App\Models;

use Database\Factories\LecturerFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Lecturer extends Model
{
    /** @use HasFactory<LecturerFactory> */
    use HasFactory, SoftDeletes;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'lecturer_no',
        'department',
        'faculty',
        'designation',
        'qualification',
        'specialization',
        'phone',
        'gender',
        'date_of_birth',
        'address',
        'hire_date',
        'employment_status',
        'contract_type',
        'office_location',
        'bio',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'hire_date' => 'date',
            'date_of_birth' => 'date',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return HasMany<CourseAssignment, $this>
     */
    public function courseAssignments(): HasMany
    {
        return $this->hasMany(CourseAssignment::class, 'lecturer_id');
    }

    /**
     * Scope a query to search by name, email, lecturer_no, or specialization.
     *
     * @param  Builder<Lecturer>  $query
     */
    public function scopeSearch(Builder $query, ?string $search): void
    {
        if (! $search) {
            return;
        }

        $query->where(function (Builder $q) use ($search) {
            $q->where('lecturer_no', 'like', "%{$search}%")
                ->orWhere('department', 'like', "%{$search}%")
                ->orWhere('faculty', 'like', "%{$search}%")
                ->orWhere('specialization', 'like', "%{$search}%")
                ->orWhere('qualification', 'like', "%{$search}%")
                ->orWhere('designation', 'like', "%{$search}%")
                ->orWhereHas('user', function (Builder $userQuery) use ($search) {
                    $userQuery->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
        });
    }

    /**
     * Scope a query to filter by department.
     *
     * @param  Builder<Lecturer>  $query
     */
    public function scopeFilterDepartment(Builder $query, ?string $department): void
    {
        if ($department && $department !== 'all') {
            $query->where('department', $department);
        }
    }

    /**
     * Scope a query to filter by faculty.
     *
     * @param  Builder<Lecturer>  $query
     */
    public function scopeFilterFaculty(Builder $query, ?string $faculty): void
    {
        if ($faculty && $faculty !== 'all') {
            $query->where('faculty', $faculty);
        }
    }

    /**
     * Scope a query to filter by employment status.
     *
     * @param  Builder<Lecturer>  $query
     */
    public function scopeFilterEmploymentStatus(Builder $query, ?string $status): void
    {
        if ($status && $status !== 'all') {
            $query->where('employment_status', $status);
        }
    }

    /**
     * Scope a query to filter by contract type.
     *
     * @param  Builder<Lecturer>  $query
     */
    public function scopeFilterContractType(Builder $query, ?string $contractType): void
    {
        if ($contractType && $contractType !== 'all') {
            $query->where('contract_type', $contractType);
        }
    }
}
