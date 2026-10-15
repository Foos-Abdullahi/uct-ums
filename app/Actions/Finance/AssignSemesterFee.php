<?php

namespace App\Actions\Finance;

use App\Enums\FeeStatus;
use App\Models\Student;
use App\Models\StudentInvoice;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AssignSemesterFee
{
    /**
     * @param  array{academic_year: string, semester: int, program_id?: int|null, title: string, type: string, amount: numeric-string|float|int, due_date?: string|null}  $data
     * @return array{created: int, skipped: int, eligible: int}
     */
    public function handle(array $data): array
    {
        $eligibleStudents = Student::query()
            ->where('enrollment_status', 'enrolled')
            ->where('academic_year', $data['academic_year'])
            ->where('current_semester', $data['semester'])
            ->when(
                $data['program_id'] ?? null,
                fn ($query, $programId) => $query->where('program_id', $programId),
            );

        $eligible = (clone $eligibleStudents)->count();
        $created = 0;

        DB::transaction(function () use ($eligibleStudents, $data, &$created): void {
            $eligibleStudents->chunkById(200, function ($students) use ($data, &$created): void {
                foreach ($students as $student) {
                    $invoice = StudentInvoice::firstOrCreate(
                        [
                            'student_id' => $student->id,
                            'academic_year' => $data['academic_year'],
                            'semester' => $data['semester'],
                            'type' => $data['type'],
                        ],
                        [
                            'invoice_no' => $this->invoiceNumber($student->id),
                            'title' => $data['title'],
                            'description' => "Semester {$data['semester']} fee for {$data['academic_year']}",
                            'amount' => $data['amount'],
                            'tax_amount' => 0,
                            'discount_amount' => 0,
                            'paid_amount' => 0,
                            'due_date' => $data['due_date'] ?? null,
                            'issue_date' => now()->toDateString(),
                            'status' => 'unpaid',
                        ],
                    );

                    if (! $invoice->wasRecentlyCreated) {
                        continue;
                    }

                    $created++;

                    if ($student->fee_status === FeeStatus::Paid) {
                        $student->update(['fee_status' => FeeStatus::Partial]);
                    }
                }
            });
        });

        return [
            'created' => $created,
            'skipped' => $eligible - $created,
            'eligible' => $eligible,
        ];
    }

    private function invoiceNumber(int $studentId): string
    {
        return sprintf(
            'INV-%s-%d-%s',
            now()->format('Y'),
            $studentId,
            Str::upper(Str::random(6)),
        );
    }
}
