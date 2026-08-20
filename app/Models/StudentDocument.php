<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentDocument extends Model
{
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'student_id',
        'title',
        'category',
        'file_path',
        'file_type',
        'file_size',
    ];

    /**
     * @return BelongsTo<Student, $this>
     */
    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }
}
