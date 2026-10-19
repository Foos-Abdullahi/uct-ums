<?php

namespace App\Actions\Finance;

use App\Enums\PaymentStatus;
use App\Models\Student;
use App\Models\StudentInvoice;
use App\Models\StudentPayment;

class GenerateStudentFinanceStatement
{
    /**
     * Generate an ordered chronological finance ledger statement for a student.
     *
     * @return array{
     *     statement: list<array{
     *         reference: string,
     *         date: string,
     *         paid: float,
     *         charged: float,
     *         reason: string,
     *         balance: float,
     *         sort_order: int
     *     }>,
     *     totals: array{
     *         charged: float,
     *         paid: float,
     *         balance: float
     *     },
     *     generatedAt: string
     * }
     */
    public function execute(Student $student): array
    {
        $student->loadMissing(['invoices', 'payments.invoice']);

        $invoiceEntries = $student->invoices->map(function (StudentInvoice $invoice): array {
            $date = $invoice->issue_date?->format('Y-m-d') ?? $invoice->created_at->format('Y-m-d');

            return [
                'reference' => $invoice->invoice_no,
                'date' => $date,
                'paid' => 0.0,
                'charged' => (float) $invoice->amount,
                'reason' => $invoice->title,
                'sort_order' => 0,
                'id' => (int) $invoice->id,
            ];
        });

        $paymentEntries = $student->payments
            ->where('status', PaymentStatus::Paid->value)
            ->map(function (StudentPayment $payment): array {
                $date = $payment->payment_date?->format('Y-m-d') ?? $payment->created_at->format('Y-m-d');

                return [
                    'reference' => $payment->transaction_no,
                    'date' => $date,
                    'paid' => (float) $payment->amount,
                    'charged' => 0.0,
                    'reason' => $payment->invoice?->title ?? ($payment->notes ?: 'Student payment'),
                    'sort_order' => 1,
                    'id' => (int) $payment->id,
                ];
            });

        $entries = $invoiceEntries->concat($paymentEntries)
            ->sort(function (array $a, array $b): int {
                if ($a['date'] !== $b['date']) {
                    return strcmp($a['date'], $b['date']);
                }

                if ($a['sort_order'] !== $b['sort_order']) {
                    return $a['sort_order'] <=> $b['sort_order'];
                }

                return $a['id'] <=> $b['id'];
            })
            ->values();

        $runningBalance = 0.0;
        $statement = $entries->map(function (array $entry) use (&$runningBalance): array {
            $runningBalance += $entry['paid'] - $entry['charged'];

            return [
                'reference' => $entry['reference'],
                'date' => $entry['date'],
                'paid' => $entry['paid'],
                'charged' => $entry['charged'],
                'reason' => $entry['reason'],
                'balance' => round($runningBalance, 2),
                'sort_order' => $entry['sort_order'],
            ];
        })->values()->all();

        $totalCharged = round((float) $student->invoices->sum('amount'), 2);
        $totalPaid = round((float) $student->payments
            ->where('status', PaymentStatus::Paid->value)
            ->sum('amount'), 2);
        $totalBalance = round($totalPaid - $totalCharged, 2);

        return [
            'statement' => $statement,
            'totals' => [
                'charged' => $totalCharged,
                'paid' => $totalPaid,
                'balance' => $totalBalance,
            ],
            'generatedAt' => now()->format('d M Y'),
        ];
    }
}
