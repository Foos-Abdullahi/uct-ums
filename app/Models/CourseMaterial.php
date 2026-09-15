<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class CourseMaterial extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'course_id',
        'lecturer_id',
        'title',
        'description',
        'category',
        'file_path',
        'file_name',
        'file_size',
        'file_type',
        'academic_year',
        'semester',
        'is_published',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'file_size' => 'integer',
            'is_published' => 'boolean',
        ];
    }

    /**
     * @return BelongsTo<Course, $this>
     */
    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    /**
     * @return BelongsTo<Lecturer, $this>
     */
    public function lecturer(): BelongsTo
    {
        return $this->belongsTo(Lecturer::class);
    }

    /**
     * Scope query to search title and description.
     *
     * @param  Builder<CourseMaterial>  $query
     */
    public function scopeSearch(Builder $query, ?string $search): void
    {
        if (! $search) {
            return;
        }

        $query->where(function (Builder $q) use ($search) {
            $q->where('title', 'like', "%{$search}%")
                ->orWhere('description', 'like', "%{$search}%")
                ->orWhere('file_name', 'like', "%{$search}%");
        });
    }

    /**
     * Scope query to filter by category.
     *
     * @param  Builder<CourseMaterial>  $query
     */
    public function scopeFilterCategory(Builder $query, ?string $category): void
    {
        if ($category && $category !== 'all') {
            $query->where('category', $category);
        }
    }

    /**
     * Scope query to filter by course.
     *
     * @param  Builder<CourseMaterial>  $query
     */
    public function scopeFilterCourse(Builder $query, int|string|null $courseId): void
    {
        if ($courseId && $courseId !== 'all') {
            $query->where('course_id', $courseId);
        }
    }
}
