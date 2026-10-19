<?php

namespace App\Actions\Finance;

use App\Enums\PaymentStatus;
use App\Models\Student;
use App\Models\StudentInvoice;
use App\Models\StudentPayment;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class ManageStudentPayment
{
    /**
     * @param  array{invoice_id: int, amount: numeric-string|float|int, payment_method: string, payment_date: string, status: string, payment_account_id?: int|null, notes?: string|null, receipt_path?: string|null}  $data
     */
    public function record(Student $student, array $data): StudentPayment
    {
        return DB::transaction(function () use ($student, $data): StudentPayment {
            $invoice = StudentInvoice::query()
                ->where('student_id', $student->id)
                ->lockForUpdate()
                ->findOrFail($data['invoice_id']);

            $status = PaymentStatus::from($data['status']);
            $untrackedPaidAmount = $this->untrackedPaidAmount($invoice);

            if ($status === PaymentStatus::Paid) {
                $this->ensurePaymentFitsInvoice(
                    $invoice,
                    (float) $data['amount'],
                    (float) $invoice->paid_amount,
                );
            }

            $payment = StudentPayment::create([
                'student_id' => $student->id,
                'invoice_id' => $invoice->id,
                'transaction_no' => $this->transactionNumber(),
                'amount' => $data['amount'],
                'payment_method' => $data['payment_method'],
                'payment_account_id' => $data['payment_account_id'] ?? null,
                'payment_date' => $data['payment_date'],
                'receipt_path' => $data['receipt_path'] ?? null,
                'status' => $status->value,
                'notes' => $data['notes'] ?? null,
            ]);

            $this->reconcileInvoice($invoice, $untrackedPaidAmount);
            $student->recalculateFinancials();

            return $payment;
        });
    }

    public function changeStatus(StudentPayment $payment, PaymentStatus $status): StudentPayment
    {
        return DB::transaction(function () use ($payment, $status): StudentPayment {
            $lockedPayment = StudentPayment::query()
                ->lockForUpdate()
                ->findOrFail($payment->id);

            $invoice = $lockedPayment->invoice_id
                ? StudentInvoice::query()->lockForUpdate()->find($lockedPayment->invoice_id)
                : null;
            $untrackedPaidAmount = $invoice ? $this->untrackedPaidAmount($invoice) : 0.0;

            if ($invoice && $status === PaymentStatus::Paid && $lockedPayment->status !== PaymentStatus::Paid->value) {
                $this->ensurePaymentFitsInvoice(
                    $invoice,
                    (float) $lockedPayment->amount,
                    (float) $invoice->paid_amount,
                    'status',
                );
            }

            $lockedPayment->update(['status' => $status->value]);

            if ($invoice) {
                $this->reconcileInvoice($invoice, $untrackedPaidAmount);
            }

            $lockedPayment->student?->recalculateFinancials();

            return $lockedPayment->refresh();
        });
    }

    private function reconcileInvoice(StudentInvoice $invoice, float $untrackedPaidAmount = 0.0): void
    {
        $paidAmount = $untrackedPaidAmount + (float) $invoice->payments()
            ->where('status', PaymentStatus::Paid->value)
            ->sum('amount');

        $invoice->update([
            'paid_amount' => $paidAmount,
            'status' => match (true) {
                $paidAmount >= (float) $invoice->amount => 'paid',
                $paidAmount > 0 => 'partial',
                default => 'unpaid',
            },
        ]);
    }

    private function ensurePaymentFitsInvoice(
        StudentInvoice $invoice,
        float $paymentAmount,
        float $alreadyPaid,
        string $errorKey = 'amount',
    ): void {
        $remainingBalance = max(0, (float) $invoice->amount - $alreadyPaid);

        if ($paymentAmount > $remainingBalance) {
            throw ValidationException::withMessages([
                $errorKey => 'The payment cannot exceed the selected invoice balance of $'.number_format($remainingBalance, 2).'.',
            ]);
        }
    }

    private function untrackedPaidAmount(StudentInvoice $invoice): float
    {
        $trackedPaidAmount = (float) $invoice->payments()
            ->where('status', PaymentStatus::Paid->value)
            ->sum('amount');

        return max(0, (float) $invoice->paid_amount - $trackedPaidAmount);
    }

    private function transactionNumber(): string
    {
        do {
            $transactionNumber = 'TXN-'.now()->format('Ymd').'-'.Str::upper(Str::random(8));
        } while (StudentPayment::where('transaction_no', $transactionNumber)->exists());

        return $transactionNumber;
    }
}
