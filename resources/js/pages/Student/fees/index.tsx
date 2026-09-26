import { Head } from '@inertiajs/react';
import {
    CreditCard,
    FileText,
    Wallet,
} from 'lucide-react';
import { useState } from 'react';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import type { Student, StudentPayment } from '@/types/student';

interface InvoicePayment {
    id: number;
    transaction_no: string;
    amount: number;
    payment_method: string;
    payment_date: string;
    status: string;
    notes: string | null;
}

interface Invoice {
    id: number;
    invoice_no: string;
    title: string;
    type: string;
    amount: number;
    paid_amount: number;
    balance: number;
    due_date: string | null;
    issue_date: string | null;
    status: string;
    payments: InvoicePayment[];
}

interface Summary {
    total_invoiced: number;
    total_paid: number;
    outstanding_balance: number;
    fee_status: string;
}

interface Props {
    student: Student;
    invoices: Invoice[];
    payments: StudentPayment[];
    summary: Summary;
}

const invoiceStatusVariant = (status: string) => {
    if (status === 'paid') return 'default';
    if (status === 'partial') return 'secondary';
    if (status === 'overdue') return 'destructive';
    return 'outline';
};

const paymentStatusVariant = (status: string) => {
    if (status === 'approved') return 'default';
    if (status === 'rejected') return 'destructive';
    return 'secondary';
};

const feeStatusVariant = (status: string) => {
    if (status === 'paid') return 'default';
    if (status === 'partial') return 'secondary';
    return 'destructive';
};

export default function StudentFeesIndex({ student, invoices, payments, summary }: Props) {
    const [expandedInvoice, setExpandedInvoice] = useState<number | null>(null);

    return (
        <>
            <Head title="Fees & Payments" />

            <div className="flex flex-col gap-6 p-4 md:p-6">
                <Heading
                    title="Fees & Payments"
                    description="View your outstanding balance, invoices, and payment history."
                />

                {/* Balance Summary */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <Card className="sm:col-span-1">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Invoiced</CardTitle>
                            <FileText className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                ${Number(summary.total_invoiced).toLocaleString()}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="sm:col-span-1">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
                            <CreditCard className="h-4 w-4 text-emerald-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-emerald-600">
                                ${Number(summary.total_paid).toLocaleString()}
                            </div>
                        </CardContent>
                    </Card>

                    <Card
                        className={`sm:col-span-1 ${summary.outstanding_balance > 0 ? 'border-destructive/40' : 'border-emerald-500/40'}`}
                    >
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle>
                            <Wallet className="h-4 w-4 text-amber-600" />
                        </CardHeader>
                        <CardContent>
                            <div
                                className={`text-2xl font-bold ${summary.outstanding_balance > 0 ? 'text-destructive' : 'text-emerald-600'}`}
                            >
                                ${Number(summary.outstanding_balance).toLocaleString()}
                            </div>
                            <div className="mt-1">
                                <Badge
                                    variant={feeStatusVariant(summary.fee_status)}
                                    className="capitalize text-[10px]"
                                >
                                    {summary.fee_status}
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Invoices */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Invoices</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {invoices.length === 0 ? (
                            <div className="p-12 text-center text-sm text-muted-foreground">
                                No invoices issued yet.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Invoice #</TableHead>
                                            <TableHead>Title</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead className="text-right">Amount</TableHead>
                                            <TableHead className="text-right">Paid</TableHead>
                                            <TableHead className="text-right">Balance</TableHead>
                                            <TableHead>Due Date</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="w-[80px]" />
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {invoices.map((invoice) => (
                                            <>
                                                <TableRow
                                                    key={invoice.id}
                                                    className="cursor-pointer hover:bg-muted/50"
                                                    onClick={() =>
                                                        setExpandedInvoice(
                                                            expandedInvoice === invoice.id
                                                                ? null
                                                                : invoice.id,
                                                        )
                                                    }
                                                >
                                                    <TableCell className="font-mono text-xs font-semibold">
                                                        {invoice.invoice_no}
                                                    </TableCell>
                                                    <TableCell className="text-xs">
                                                        {invoice.title}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className="capitalize text-[10px]">
                                                            {invoice.type}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right text-xs font-medium">
                                                        ${Number(invoice.amount).toLocaleString()}
                                                    </TableCell>
                                                    <TableCell className="text-right text-xs text-emerald-600">
                                                        ${Number(invoice.paid_amount).toLocaleString()}
                                                    </TableCell>
                                                    <TableCell
                                                        className={`text-right text-xs font-semibold ${invoice.balance > 0 ? 'text-destructive' : 'text-emerald-600'}`}
                                                    >
                                                        ${Number(invoice.balance).toLocaleString()}
                                                    </TableCell>
                                                    <TableCell className="text-xs">
                                                        {invoice.due_date ?? '—'}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            variant={invoiceStatusVariant(invoice.status)}
                                                            className="capitalize text-[10px]"
                                                        >
                                                            {invoice.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-xs text-muted-foreground">
                                                        {invoice.payments.length > 0
                                                            ? `${invoice.payments.length} pmt${invoice.payments.length !== 1 ? 's' : ''}`
                                                            : ''}
                                                    </TableCell>
                                                </TableRow>
                                                {expandedInvoice === invoice.id &&
                                                    invoice.payments.length > 0 && (
                                                        <TableRow key={`${invoice.id}-payments`}>
                                                            <TableCell colSpan={9} className="bg-muted/30 p-4">
                                                                <div className="text-xs font-semibold mb-2">
                                                                    Payments for {invoice.invoice_no}
                                                                </div>
                                                                <table className="w-full text-xs">
                                                                    <thead>
                                                                        <tr className="text-muted-foreground">
                                                                            <th className="text-left pb-1">Txn #</th>
                                                                            <th className="text-left pb-1">Date</th>
                                                                            <th className="text-left pb-1">Method</th>
                                                                            <th className="text-right pb-1">Amount</th>
                                                                            <th className="text-left pb-1 pl-3">Status</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {invoice.payments.map((pmt) => (
                                                                            <tr key={pmt.id} className="border-t border-border/30">
                                                                                <td className="font-mono py-1">{pmt.transaction_no}</td>
                                                                                <td className="py-1">{pmt.payment_date}</td>
                                                                                <td className="capitalize py-1">
                                                                                    {pmt.payment_method.replace('_', ' ')}
                                                                                </td>
                                                                                <td className="text-right py-1 font-medium">
                                                                                    ${Number(pmt.amount).toLocaleString()}
                                                                                </td>
                                                                                <td className="py-1 pl-3">
                                                                                    <Badge
                                                                                        variant={paymentStatusVariant(pmt.status)}
                                                                                        className="capitalize text-[10px]"
                                                                                    >
                                                                                        {pmt.status}
                                                                                    </Badge>
                                                                                </td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            </TableCell>
                                                        </TableRow>
                                                    )}
                                            </>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* All Payments History */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Payment History</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {payments.length === 0 ? (
                            <div className="p-8 text-center text-sm text-muted-foreground">
                                No payments recorded yet.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Transaction #</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Method</TableHead>
                                            <TableHead className="text-right">Amount</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Notes</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {payments.map((pmt) => (
                                            <TableRow key={pmt.id}>
                                                <TableCell className="font-mono text-xs font-semibold">
                                                    {pmt.transaction_no}
                                                </TableCell>
                                                <TableCell className="text-xs">
                                                    {pmt.payment_date}
                                                </TableCell>
                                                <TableCell className="text-xs capitalize">
                                                    {String(pmt.payment_method).replace('_', ' ')}
                                                </TableCell>
                                                <TableCell className="text-right text-xs font-medium">
                                                    ${Number(pmt.amount).toLocaleString()}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={paymentStatusVariant(pmt.status)}
                                                        className="capitalize text-[10px]"
                                                    >
                                                        {pmt.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                                                    {pmt.notes ?? '—'}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

StudentFeesIndex.layout = {
    breadcrumbs: [{ title: 'Fees & Payments', href: '/student/fees' }],
};
