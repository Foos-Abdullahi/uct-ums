<?php

namespace App\Models;

use Database\Factories\ProgramFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Program extends Model
{
    /** @use HasFactory<ProgramFactory> */
    use HasFactory, SoftDeletes;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'code',
        'degree_level',
        'duration_semesters',
        'total_credits',
        'department',
        'faculty',
        'status',
        'description',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'duration_semesters' => 'integer',
            'total_credits' => 'integer',
        ];
    }

    /**
     * @return HasMany<Student, $this>
     */
    public function students(): HasMany
    {
        return $this->hasMany(Student::class);
    }

    /**
     * @return HasMany<Admission, $this>
     */
    public function admissions(): HasMany
    {
        return $this->hasMany(Admission::class);
    }

    /**
     * @return HasMany<Course, $this>
     */
    public function courses(): HasMany
    {
        return $this->hasMany(Course::class);
    }

    /**
     * Scope a query to search programs.
     *
     * @param  Builder<Program>  $query
     */
    public function scopeSearch(Builder $query, ?string $search): void
    {
        if (! $search) {
            return;
        }

        $query->where(function (Builder $q) use ($search) {
            $q->where('name', 'like', "%{$search}%")
                ->orWhere('code', 'like', "%{$search}%")
                ->orWhere('department', 'like', "%{$search}%")
                ->orWhere('faculty', 'like', "%{$search}%");
        });
    }

    /**
     * Scope a query to filter by faculty.
     *
     * @param  Builder<Program>  $query
     */
    public function scopeFilterFaculty(Builder $query, ?string $faculty): void
    {
        if ($faculty && $faculty !== 'all') {
            $query->where('faculty', $faculty);
        }
    }

    /**
     * Scope a query to filter by degree level.
     *
     * @param  Builder<Program>  $query
     */
    public function scopeFilterLevel(Builder $query, ?string $level): void
    {
        if ($level && $level !== 'all') {
            $query->where('degree_level', $level);
        }
    }

    /**
     * Scope a query to active programs only.
     *
     * @param  Builder<Program>  $query
     */
    public function scopeActive(Builder $query): void
    {
        $query->where('status', 'active');
    }
}
