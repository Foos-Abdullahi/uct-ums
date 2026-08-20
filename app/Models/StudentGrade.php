<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentGrade extends Model
{
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'student_id',
        'course_code',
        'course_name',
        'semester',
        'credits',
        'grade',
        'grade_point',
        'status',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'semester' => 'integer',
            'credits' => 'integer',
            'grade_point' => 'decimal:2',
        ];
    }

    /**
     * @return BelongsTo<Student, $this>
     */
    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }
}
