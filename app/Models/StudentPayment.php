<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentPayment extends Model
{
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'student_id',
        'invoice_id',
        'transaction_no',
        'amount',
        'payment_method',
        'payment_date',
        'receipt_path',
        'status',
        'notes',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'payment_date' => 'date',
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
     * @return BelongsTo<StudentInvoice, $this>
     */
    public function invoice(): BelongsTo
    {
        return $this->belongsTo(StudentInvoice::class, 'invoice_id');
    }
}
