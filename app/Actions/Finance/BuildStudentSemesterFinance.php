<?php

namespace App\Actions\Finance;

use App\Models\Student;
use App\Models\StudentInvoice;
use App\Models\StudentPayment;
use Illuminate\Support\Collection;

class BuildStudentSemesterFinance
{
    /**
     * Group a student's invoices and payments by academic year and semester.
     *
     * Invoices that were issued without a semester are collected into a single
     * trailing "other charges" group, and payments that are not linked to an
     * invoice are returned separately so no money is ever hidden.
     *
     * @return array{
     *     semesters: list<array{
     *         key: string,
     *         label: string,
     *         academic_year: string|null,
     *         semester: int|null,
     *         is_current: bool,
     *         charged: float,
     *         paid: float,
     *         balance: float,
     *         status: string,
     *         overdue_count: int,
     *         invoices: list<array<string, mixed>>,
     *         payments: list<array<string, mixed>>
     *     }>,
     *     unallocated_payments: list<array<string, mixed>>,
     *     current: array{academic_year: string|null, semester: int}
     * }
     */
    public function execute(Student $student): array
    {
        $student->loadMissing(['invoices', 'payments.invoice']);

        $today = now()->toDateString();

        /** @var Collection<string, Collection<int, StudentInvoice>> $groups */
        $groups = $student->invoices->groupBy(
            fn (StudentInvoice $invoice): string => $this->groupKey($invoice->academic_year, $invoice->semester)
        );

        $currentKey = $this->groupKey($student->academic_year, $student->current_semester);

        if (! $groups->has($currentKey)) {
            $groups->put($currentKey, collect());
        }

        $semesters = $groups->map(function (Collection $invoices, string $key) use ($student, $currentKey, $today): array {
            $first = $invoices->first();
            $academicYear = $first?->academic_year ?? ($key === $currentKey ? $student->academic_year : null);
            $semester = $first?->semester ?? ($key === $currentKey ? $student->current_semester : null);

            $charged = round((float) $invoices->sum('amount'), 2);
            $paid = round((float) $invoices->sum('paid_amount'), 2);
            $balance = round(max(0, $charged - $paid), 2);

            $invoiceIds = $invoices->pluck('id');

            return [
                'key' => $key,
                'label' => $semester === null ? 'Other charges' : "Semester {$semester}",
                'academic_year' => $academicYear,
                'semester' => $semester,
                'is_current' => $key === $currentKey,
                'charged' => $charged,
                'paid' => $paid,
                'balance' => $balance,
                'status' => match (true) {
                    $invoices->isEmpty() => 'none',
                    $balance <= 0 => 'paid',
                    $paid > 0 => 'partial',
                    default => 'unpaid',
                },
                'overdue_count' => $invoices
                    ->filter(fn (StudentInvoice $invoice): bool => $invoice->status !== 'paid'
                        && $invoice->due_date !== null
                        && $invoice->due_date->toDateString() < $today)
                    ->count(),
                'invoices' => $invoices
                    ->sortBy('id')
                    ->map(fn (StudentInvoice $invoice): array => [
                        'id' => $invoice->id,
                        'invoice_no' => $invoice->invoice_no,
                        'title' => $invoice->title,
                        'type' => $invoice->type,
                        'amount' => (float) $invoice->amount,
                        'paid_amount' => (float) $invoice->paid_amount,
                        'due_date' => $invoice->due_date?->toDateString(),
                        'status' => $invoice->status,
                    ])
                    ->values()
                    ->all(),
                'payments' => $student->payments
                    ->whereIn('invoice_id', $invoiceIds)
                    ->sortByDesc('payment_date')
                    ->map(fn (StudentPayment $payment): array => $this->paymentRow($payment))
                    ->values()
                    ->all(),
            ];
        });

        $sorted = $semesters
            ->sort(function (array $a, array $b): int {
                if ($a['semester'] === null || $b['semester'] === null) {
                    return ($a['semester'] === null) <=> ($b['semester'] === null);
                }

                return [$b['academic_year'], $b['semester']] <=> [$a['academic_year'], $a['semester']];
            })
            ->values()
            ->all();

        $invoiceIds = $student->invoices->pluck('id');

        return [
            'semesters' => $sorted,
            'unallocated_payments' => $student->payments
                ->filter(fn (StudentPayment $payment): bool => $payment->invoice_id === null
                    || ! $invoiceIds->contains($payment->invoice_id))
                ->sortByDesc('payment_date')
                ->map(fn (StudentPayment $payment): array => $this->paymentRow($payment))
                ->values()
                ->all(),
            'current' => [
                'academic_year' => $student->academic_year,
                'semester' => (int) $student->current_semester,
            ],
        ];
    }

    private function groupKey(?string $academicYear, ?int $semester): string
    {
        return $semester === null ? 'other' : ($academicYear ?? 'unknown').'|'.$semester;
    }

    /**
     * @return array<string, mixed>
     */
    private function paymentRow(StudentPayment $payment): array
    {
        return [
            'id' => $payment->id,
            'transaction_no' => $payment->transaction_no,
            'amount' => (float) $payment->amount,
            'payment_method' => $payment->payment_method instanceof \BackedEnum
                ? $payment->payment_method->value
                : $payment->payment_method,
            'payment_date' => $payment->payment_date?->toDateString(),
            'status' => $payment->status instanceof \BackedEnum
                ? $payment->status->value
                : $payment->status,
            'notes' => $payment->notes,
            'invoice_no' => $payment->invoice?->invoice_no,
        ];
    }
}
