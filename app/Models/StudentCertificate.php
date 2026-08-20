<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentCertificate extends Model
{
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'student_id',
        'certificate_no',
        'title',
        'type',
        'issue_date',
        'status',
        'file_path',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'issue_date' => 'date',
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
