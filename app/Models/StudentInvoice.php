<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class StudentInvoice extends Model
{
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'student_id',
        'invoice_no',
        'title',
        'type',
        'amount',
        'paid_amount',
        'due_date',
        'status',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'paid_amount' => 'decimal:2',
            'due_date' => 'date',
        ];
    }

    /**
     * @return BelongsTo<Student, $this>
     */
    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    /**
     * @return HasMany<StudentPayment, $this>
     */
    public function payments(): HasMany
    {
        return $this->hasMany(StudentPayment::class, 'invoice_id');
    }
}
