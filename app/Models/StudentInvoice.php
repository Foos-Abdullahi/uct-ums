<?php

namespace App\Models;

use Database\Factories\StudentInvoiceFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class StudentInvoice extends Model
{
    /** @use HasFactory<StudentInvoiceFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'student_id',
        'invoice_no',
        'title',
        'description',
        'type',
        'amount',
        'tax_amount',
        'discount_amount',
        'paid_amount',
        'due_date',
        'issue_date',
        'status',
        'approved_by',
        'approved_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'tax_amount' => 'decimal:2',
            'discount_amount' => 'decimal:2',
            'paid_amount' => 'decimal:2',
            'due_date' => 'date:Y-m-d',
            'issue_date' => 'date:Y-m-d',
            'approved_at' => 'datetime',
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

    /**
     * @return HasMany<StudentInvoiceItem, $this>
     */
    public function items(): HasMany
    {
        return $this->hasMany(StudentInvoiceItem::class, 'invoice_id');
    }

    public function subtotal(): float
    {
        return (float) $this->items()->sum('amount');
    }

    public function total(): float
    {
        return (float) $this->amount;
    }

    public function balance(): float
    {
        return max(0, (float) $this->amount - (float) $this->paid_amount);
    }
}
