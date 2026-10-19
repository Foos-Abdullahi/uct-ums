<?php

namespace App\Actions\Finance;

use App\Enums\FeeStatus;
use App\Models\Student;
use App\Models\StudentInvoice;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class CreateStudentInvoice
{
    /** @param array<string, mixed> $data
     * @return array{invoice: StudentInvoice, created: bool}
     */
    public function handle(Student $student, array $data): array
    {
        $academicYear = $data['academic_year'] ?? $student->academic_year;
        $semester = $data['semester'] ?? $student->current_semester;

        if (! $academicYear || ! $semester) {
            throw ValidationException::withMessages([
                'academic_year' => 'Set the student academic year and semester before recording a fee.',
            ]);
        }
        $attributes = [
            'student_id' => $student->id,
            'invoice_no' => 'INV-'.now()->format('Y').'-'.$student->id.'-'.Str::upper(Str::random(6)),
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'type' => $data['type'],
            'academic_year' => $academicYear,
            'semester' => $semester,
            'amount' => $data['amount'],
            'tax_amount' => $data['tax_amount'] ?? 0,
            'discount_amount' => $data['discount_amount'] ?? 0,
            'paid_amount' => 0,
            'due_date' => $data['due_date'] ?? null,
            'issue_date' => $data['issue_date'] ?? now()->toDateString(),
            'status' => 'unpaid',
        ];

        // Old invoices may have a semester but no academic year. Treat those
        // as a match so nullable year values cannot bypass duplicate checks.
        $existingInvoice = StudentInvoice::query()
            ->where('student_id', $student->id)
            ->where('semester', $semester)
            ->where('type', $data['type'])
            ->where(fn ($query) => $query
                ->where('academic_year', $academicYear)
                ->orWhereNull('academic_year'))
            ->first();

        $invoice = $existingInvoice ?? StudentInvoice::firstOrCreate(
            [
                'student_id' => $student->id,
                'academic_year' => $academicYear,
                'semester' => $semester,
                'type' => $data['type'],
            ],
            $attributes,
        );

        if ($invoice->wasRecentlyCreated && ! empty($data['items'])) {
            $invoice->items()->createMany($data['items']);
        }

        if ($invoice->wasRecentlyCreated && $student->fee_status === FeeStatus::Paid) {
            $student->update(['fee_status' => FeeStatus::Partial]);
        }

        return ['invoice' => $invoice, 'created' => $invoice->wasRecentlyCreated];
    }
}
