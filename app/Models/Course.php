<?php

namespace App\Models;

use Database\Factories\CourseFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Course extends Model
{
    /** @use HasFactory<CourseFactory> */
    use HasFactory, SoftDeletes;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'program_id',
        'code',
        'name',
        'credit_hours',
        'semester',
        'level',
        'description',
        'status',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'credit_hours' => 'integer',
            'semester' => 'integer',
        ];
    }

    /**
     * @return BelongsTo<Program, $this>
     */
    public function program(): BelongsTo
    {
        return $this->belongsTo(Program::class);
    }

    /**
     * @return HasMany<CourseAssignment, $this>
     */
    public function assignments(): HasMany
    {
        return $this->hasMany(CourseAssignment::class);
    }

    /**
     * Scope a query to search by course code, name, or description.
     *
     * @param  Builder<Course>  $query
     */
    public function scopeSearch(Builder $query, ?string $search): void
    {
        if (! $search) {
            return;
        }

        $query->where(function (Builder $q) use ($search) {
            $q->where('code', 'like', "%{$search}%")
                ->orWhere('name', 'like', "%{$search}%")
                ->orWhere('description', 'like', "%{$search}%");
        });
    }

    /**
     * Scope a query to filter by program.
     *
     * @param  Builder<Course>  $query
     */
    public function scopeFilterProgram(Builder $query, ?string $programId): void
    {
        if ($programId && $programId !== 'all') {
            $query->where('program_id', $programId);
        }
    }

    /**
     * Scope a query to filter by semester.
     *
     * @param  Builder<Course>  $query
     */
    public function scopeFilterSemester(Builder $query, ?string $semester): void
    {
        if ($semester && $semester !== 'all') {
            $query->where('semester', (int) $semester);
        }
    }

    /**
     * Scope a query to active courses only.
     *
     * @param  Builder<Course>  $query
     */
    public function scopeActive(Builder $query): void
    {
        $query->where('status', 'active');
    }
}
