<?php

namespace App\Http\Controllers\Student;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class FeesController extends StudentBaseController
{
    /**
     * Display the student's fees, invoices, and payment history.
     */
    public function index(Request $request): Response
    {
        $student = $this->getStudent($request);

        $invoices = $student->invoices()
            ->with('payments')
            ->orderByDesc('created_at')
            ->get()
            ->map(function ($invoice) {
                return [
                    'id' => $invoice->id,
                    'invoice_no' => $invoice->invoice_no,
                    'title' => $invoice->title,
                    'type' => $invoice->type,
                    'amount' => (float) $invoice->amount,
                    'paid_amount' => (float) $invoice->paid_amount,
                    'balance' => $invoice->balance(),
                    'due_date' => $invoice->due_date?->format('Y-m-d'),
                    'issue_date' => $invoice->issue_date?->format('Y-m-d'),
                    'status' => $invoice->status,
                    'payments' => $invoice->payments->map(fn ($p) => [
                        'id' => $p->id,
                        'transaction_no' => $p->transaction_no,
                        'amount' => (float) $p->amount,
                        'payment_method' => $p->payment_method,
                        'payment_date' => $p->payment_date,
                        'status' => $p->status,
                        'notes' => $p->notes,
                    ]),
                ];
            });

        $payments = $student->payments()
            ->with('invoice')
            ->orderByDesc('payment_date')
            ->get();

        $totalInvoiced = (float) $student->invoices()->sum('amount');
        $totalPaid = (float) $student->payments()->where('status', 'approved')->sum('amount');
        $outstandingBalance = max(0, $totalInvoiced - $totalPaid);

        return Inertia::render('Student/fees/index', [
            'student' => $student,
            'invoices' => $invoices,
            'payments' => $payments,
            'summary' => [
                'total_invoiced' => $totalInvoiced,
                'total_paid' => $totalPaid,
                'outstanding_balance' => $outstandingBalance,
                'fee_status' => $student->fee_status->value,
            ],
        ]);
    }
}
