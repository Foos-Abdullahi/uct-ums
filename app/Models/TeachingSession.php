<?php

namespace App\Models;

use Database\Factories\TeachingSessionFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TeachingSession extends Model
{
    /** @use HasFactory<TeachingSessionFactory> */
    use HasFactory;

    /** Standard pay per teaching hour, per lecturer, per course (USD). */
    public const DEFAULT_HOURLY_RATE = 8;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'lecturer_id',
        'course_id',
        'session_date',
        'hours',
        'hourly_rate',
        'notes',
        'paid_at',
        'paid_by',
        'created_by',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'session_date' => 'date:Y-m-d',
            'hours' => 'float',
            'hourly_rate' => 'float',
            'paid_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<Lecturer, $this>
     */
    public function lecturer(): BelongsTo
    {
        return $this->belongsTo(Lecturer::class);
    }

    /**
     * @return BelongsTo<Course, $this>
     */
    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function getAmountAttribute(): float
    {
        return round($this->hours * $this->hourly_rate, 2);
    }
}
