<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Admission extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'application_no',
        'first_name',
        'last_name',
        'email',
        'phone',
        'gender',
        'date_of_birth',
        'address',
        'program_id',
        'entry_semester',
        'previous_qualification',
        'previous_gpa',
        'status',
        'application_date',
        'notes',
        'review_notes',
        'student_id',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'date_of_birth' => 'date',
            'application_date' => 'date',
            'previous_gpa' => 'decimal:2',
        ];
    }

    /**
     * @var list<string>
     */
    protected $appends = [
        'full_name',
    ];

    public function getFullNameAttribute(): string
    {
        return trim("{$this->first_name} {$this->last_name}");
    }

    /**
     * @return BelongsTo<Program, $this>
     */
    public function program(): BelongsTo
    {
        return $this->belongsTo(Program::class);
    }

    /**
     * @return BelongsTo<Student, $this>
     */
    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    /**
     * @param  Builder<self>  $query
     * @return Builder<self>
     */
    public function scopeSearch(Builder $query, ?string $search): Builder
    {
        if (! $search) {
            return $query;
        }

        return $query->where(function (Builder $q) use ($search) {
            $q->where('application_no', 'like', "%{$search}%")
                ->orWhere('first_name', 'like', "%{$search}%")
                ->orWhere('last_name', 'like', "%{$search}%")
                ->orWhere('email', 'like', "%{$search}%")
                ->orWhere('phone', 'like', "%{$search}%");
        });
    }

    /**
     * @param  Builder<self>  $query
     * @return Builder<self>
     */
    public function scopeFilterStatus(Builder $query, ?string $status): Builder
    {
        if (! $status || $status === 'all') {
            return $query;
        }

        return $query->where('status', $status);
    }

    /**
     * @param  Builder<self>  $query
     * @return Builder<self>
     */
    public function scopeFilterProgram(Builder $query, $programId): Builder
    {
        if (! $programId || $programId === 'all') {
            return $query;
        }

        return $query->where('program_id', $programId);
    }
}
