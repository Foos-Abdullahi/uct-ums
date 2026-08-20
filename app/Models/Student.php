<?php

namespace App\Models;

use App\Enums\FeeStatus;
use Database\Factories\StudentFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Student extends Model
{
    /** @use HasFactory<StudentFactory> */
    use HasFactory, SoftDeletes;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'matric_no',
        'program_id',
        'current_semester',
        'phone',
        'gender',
        'date_of_birth',
        'address',
        'fee_status',
        'enrollment_status',
        'gpa',
        'enrollment_date',
        'graduation_date',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'fee_status' => FeeStatus::class,
            'enrollment_date' => 'date',
            'date_of_birth' => 'date',
            'graduation_date' => 'date',
            'gpa' => 'decimal:2',
            'current_semester' => 'integer',
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
     * @return BelongsTo<Program, $this>
     */
    public function program(): BelongsTo
    {
        return $this->belongsTo(Program::class);
    }

    /**
     * @return HasOne<Admission, $this>
     */
    public function admission(): HasOne
    {
        return $this->hasOne(Admission::class);
    }

    /**
     * @return HasMany<StudentDocument, $this>
     */
    public function documents(): HasMany
    {
        return $this->hasMany(StudentDocument::class);
    }

    /**
     * @return HasMany<StudentInvoice, $this>
     */
    public function invoices(): HasMany
    {
        return $this->hasMany(StudentInvoice::class);
    }

    /**
     * @return HasMany<StudentPayment, $this>
     */
    public function payments(): HasMany
    {
        return $this->hasMany(StudentPayment::class);
    }

    /**
     * @return HasMany<StudentGrade, $this>
     */
    public function grades(): HasMany
    {
        return $this->hasMany(StudentGrade::class);
    }

    /**
     * @return HasMany<StudentCertificate, $this>
     */
    public function certificates(): HasMany
    {
        return $this->hasMany(StudentCertificate::class);
    }

    /**
     * @return HasMany<StudentAttendance, $this>
     */
    public function attendances(): HasMany
    {
        return $this->hasMany(StudentAttendance::class);
    }

    /**
     * Scope search for student list.
     *
     * @param  Builder<self>  $query
     * @return Builder<self>
     */
    public function scopeSearch(Builder $query, ?string $search): Builder
    {
        if (! $search) {
            return $query;
        }

        return $query->where(function (Builder $q) use ($search) {
            $q->where('matric_no', 'like', "%{$search}%")
                ->orWhere('phone', 'like', "%{$search}%")
                ->orWhereHas('user', function (Builder $userQuery) use ($search) {
                    $userQuery->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                })
                ->orWhereHas('program', function (Builder $progQuery) use ($search) {
                    $progQuery->where('name', 'like', "%{$search}%");
                });
        });
    }

    /**
     * @param  Builder<self>  $query
     * @return Builder<self>
     */
    public function scopeFilterEnrollmentStatus(Builder $query, ?string $status): Builder
    {
        if (! $status || $status === 'all') {
            return $query;
        }

        return $query->where('enrollment_status', $status);
    }

    /**
     * @param  Builder<self>  $query
     * @return Builder<self>
     */
    public function scopeFilterFeeStatus(Builder $query, ?string $status): Builder
    {
        if (! $status || $status === 'all') {
            return $query;
        }

        return $query->where('fee_status', $status);
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

    /**
     * @param  Builder<self>  $query
     * @return Builder<self>
     */
    public function scopeFilterSemester(Builder $query, $semester): Builder
    {
        if (! $semester || $semester === 'all') {
            return $query;
        }

        return $query->where('current_semester', $semester);
    }

    /**
     * @param  Builder<self>  $query
     * @return Builder<self>
     */
    public function scopeFilterGender(Builder $query, ?string $gender): Builder
    {
        if (! $gender || $gender === 'all') {
            return $query;
        }

        return $query->where('gender', $gender);
    }

    /**
     * Calculate and sync fee status according to invoices and approved payments.
     */
    public function recalculateFinancials(): void
    {
        $totalInvoiced = (float) $this->invoices()->sum('amount');
        $totalPaid = (float) $this->payments()->where('status', 'approved')->sum('amount');

        if ($totalInvoiced <= 0) {
            $this->update(['fee_status' => FeeStatus::Paid]);
            return;
        }

        if ($totalPaid >= $totalInvoiced) {
            $this->update(['fee_status' => FeeStatus::Paid]);
        } elseif ($totalPaid > 0) {
            $this->update(['fee_status' => FeeStatus::Partial]);
        } else {
            $this->update(['fee_status' => FeeStatus::Unpaid]);
        }
    }

    /**
     * Recalculate student GPA from completed grades.
     */
    public function recalculateGpa(): void
    {
        $completedGrades = $this->grades()->whereNotNull('grade_point')->where('credits', '>', 0)->get();

        if ($completedGrades->isEmpty()) {
            return;
        }

        $totalCredits = $completedGrades->sum('credits');
        $totalPoints = $completedGrades->sum(function ($grade) {
            return (float) $grade->grade_point * (int) $grade->credits;
        });

        if ($totalCredits > 0) {
            $gpa = round($totalPoints / $totalCredits, 2);
            $this->update(['gpa' => $gpa]);
        }
    }
}
