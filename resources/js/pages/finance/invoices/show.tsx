import { Head, Link } from '@inertiajs/react';
import {
    FileText,
    ArrowLeft,
    DollarSign,
    CheckCircle2,
    Clock,
    AlertCircle,
    Percent,
    Tag,
    Banknote,
    Receipt,
    CreditCard,
} from 'lucide-react';
import React from 'react';
import { UctPanelCard } from '@/components/tools/uct-panel-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { BreadcrumbItem } from '@/types';

interface InvoiceItem {
    id: number;
    description: string;
    quantity: number;
    unit_price: string;
    amount: string;
}

interface Payment {
    id: number;
    transaction_no: string;
    amount: number;
    payment_method: string;
    payment_date: string;
    status: string;
}

interface InvoiceDetail {
    id: number;
    invoice_no: string;
    title: string;
    description: string | null;
    type: string;
    amount: number;
    tax_amount: number;
    discount_amount: number;
    paid_amount: number;
    due_date: string | null;
    issue_date: string | null;
    status: string;
    items: InvoiceItem[];
    payments: Payment[];
    student?: {
        matric_no: string;
        user?: { name: string; email: string };
        program?: { name: string; code: string | null };
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/finance/dashboard' },
    { title: 'Invoices', href: '/finance/invoices' },
    { title: 'Invoice Details', href: '#' },
];

const PAYMENT_METHODS: Record<string, string> = {
    bank_transfer: 'Bank Transfer',
    cash: 'Cash',
    evc_plus: 'EVC Plus',
    zaad: 'Zaad',
    sahay: 'Sahay',
    credit_card: 'Credit Card',
};

export default function FinanceInvoiceShow({
    invoice,
}: {
    invoice: InvoiceDetail;
}) {
    const formatCurrency = (val: number) =>
        `$${Number(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const subtotal = invoice.items.reduce(
        (sum, item) => sum + Number(item.amount),
        0,
    );
    const balance = Math.max(
        0,
        Number(invoice.amount) - Number(invoice.paid_amount),
    );
    const isOverdue =
        invoice.due_date &&
        new Date(invoice.due_date) < new Date() &&
        invoice.status !== 'paid';

    const statusBadge = () => {
        if (invoice.status === 'paid') {
            return (
                <Badge className="border-emerald-200 bg-emerald-500/10 px-2 py-1 text-emerald-700">
                    <CheckCircle2 className="mr-1 h-3 w-3" /> Paid
                </Badge>
            );
        }

        if (isOverdue) {
            return (
                <Badge variant="destructive" className="px-2 py-1">
                    <AlertCircle className="mr-1 h-3 w-3" /> Overdue
                </Badge>
            );
        }

        if (invoice.status === 'partial') {
            return (
                <Badge className="border-amber-200 bg-amber-500/10 px-2 py-1 text-amber-700">
                    <Clock className="mr-1 h-3 w-3" /> Partial
                </Badge>
            );
        }

        return (
            <Badge variant="destructive" className="px-2 py-1">
                Unpaid
            </Badge>
        );
    };

    return (
        <>
            <Head title={`Invoice ${invoice.invoice_no}`} />
            <div className="space-y-6 p-6">
                <div className="flex items-start gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        asChild
                    >
                        <Link href="/finance/invoices">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-lg font-semibold tracking-tight text-foreground">
                                {invoice.title}
                            </h1>
                            {statusBadge()}
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            <span className="font-mono font-semibold">
                                {invoice.invoice_no}
                            </span>{' '}
                            · {invoice.type} ·{' '}
                            {invoice.issue_date || 'No issue date'}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            {invoice.student?.user?.name} (
                            {invoice.student?.matric_no}) ·{' '}
                            {invoice.student?.program?.name || 'No program'}
                        </p>
                    </div>
                </div>

                <div className="grid animate-in grid-cols-1 gap-2 duration-1000 ease-in-out fade-in slide-in-from-top-6 sm:grid-cols-2 md:gap-4 lg:grid-cols-4">
                    <Card>
                        <CardContent className="pt-5">
                            <div className="flex items-center gap-3">
                                <div className="rounded-full bg-primary/10 p-2 text-primary">
                                    <FileText className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">
                                        Amount
                                    </p>
                                    <p className="text-lg font-bold text-foreground">
                                        {formatCurrency(invoice.amount)}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-5">
                            <div className="flex items-center gap-3">
                                <div className="rounded-full bg-emerald-500/10 p-2 text-emerald-600">
                                    <Banknote className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">
                                        Paid
                                    </p>
                                    <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                                        {formatCurrency(
                                            Number(invoice.paid_amount),
                                        )}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-5">
                            <div className="flex items-center gap-3">
                                <div
                                    className={`rounded-full ${balance > 0 ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'} p-2`}
                                >
                                    <DollarSign className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">
                                        Balance
                                    </p>
                                    <p
                                        className={`text-lg font-bold ${balance > 0 ? 'text-destructive' : 'text-muted-foreground'}`}
                                    >
                                        {formatCurrency(balance)}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-5">
                            <div className="flex items-center gap-3">
                                <div
                                    className={`rounded-full ${isOverdue ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'} p-2`}
                                >
                                    <AlertCircle className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">
                                        Due
                                    </p>
                                    <p
                                        className={`text-sm font-semibold ${isOverdue ? 'text-destructive' : 'text-foreground'}`}
                                    >
                                        {invoice.due_date || '—'}
                                        {isOverdue && ' (Overdue)'}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                        <UctPanelCard
                            title="Line Items"
                            description="Detailed breakdown of charges."
                            icon={Receipt}
                        >
                            {invoice.description && (
                                <p className="mb-3 text-xs text-muted-foreground">
                                    {invoice.description}
                                </p>
                            )}
                            <div className="overflow-hidden rounded-md border">
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="border-b bg-muted/40 text-left text-muted-foreground">
                                            <th className="px-3 py-2 font-semibold">
                                                Description
                                            </th>
                                            <th className="w-16 px-3 py-2 text-center font-semibold">
                                                Qty
                                            </th>
                                            <th className="w-24 px-3 py-2 text-right font-semibold">
                                                Unit Price
                                            </th>
                                            <th className="w-24 px-3 py-2 text-right font-semibold">
                                                Amount
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {invoice.items.length === 0 ? (
                                            <tr>
                                                <td
                                                    colSpan={4}
                                                    className="px-3 py-6 text-center text-muted-foreground italic"
                                                >
                                                    No line items.
                                                </td>
                                            </tr>
                                        ) : (
                                            invoice.items.map((item) => (
                                                <tr key={item.id}>
                                                    <td className="px-3 py-2 font-medium text-foreground">
                                                        {item.description}
                                                    </td>
                                                    <td className="px-3 py-2 text-center text-muted-foreground">
                                                        {item.quantity}
                                                    </td>
                                                    <td className="px-3 py-2 text-right font-mono text-muted-foreground">
                                                        {formatCurrency(
                                                            Number(
                                                                item.unit_price,
                                                            ),
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-2 text-right font-mono font-semibold text-foreground">
                                                        {formatCurrency(
                                                            Number(item.amount),
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <div className="mt-4 flex justify-end">
                                <div className="w-full max-w-[260px] space-y-1.5 text-xs">
                                    <div className="flex justify-between text-muted-foreground">
                                        <span>Subtotal</span>
                                        <span className="font-mono">
                                            {formatCurrency(subtotal)}
                                        </span>
                                    </div>
                                    {Number(invoice.tax_amount) > 0 && (
                                        <div className="flex justify-between text-muted-foreground">
                                            <span>
                                                <Percent className="mr-1 inline h-3 w-3" />{' '}
                                                Tax
                                            </span>
                                            <span className="font-mono">
                                                {formatCurrency(
                                                    Number(invoice.tax_amount),
                                                )}
                                            </span>
                                        </div>
                                    )}
                                    {Number(invoice.discount_amount) > 0 && (
                                        <div className="flex justify-between text-muted-foreground">
                                            <span>
                                                <Tag className="mr-1 inline h-3 w-3" />{' '}
                                                Discount
                                            </span>
                                            <span className="font-mono text-emerald-600 dark:text-emerald-400">
                                                -
                                                {formatCurrency(
                                                    Number(
                                                        invoice.discount_amount,
                                                    ),
                                                )}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex justify-between border-t border-border/60 pt-2 font-bold text-foreground">
                                        <span>Total Due</span>
                                        <span className="font-mono">
                                            {formatCurrency(invoice.amount)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </UctPanelCard>
                    </div>

                    <div className="space-y-6">
                        <UctPanelCard
                            title="Payments"
                            description="Transactions applied to this invoice."
                            icon={CreditCard}
                        >
                            {invoice.payments.length === 0 ? (
                                <p className="py-6 text-center text-xs text-muted-foreground italic">
                                    No payments yet.
                                </p>
                            ) : (
                                <div className="space-y-3 pt-1">
                                    {invoice.payments.map((payment) => (
                                        <div
                                            key={payment.id}
                                            className={`rounded-md border p-3 ${payment.status === 'paid' ? 'border-emerald-200 bg-emerald-500/5' : payment.status === 'pending' ? 'border-amber-200 bg-amber-500/5' : 'border-destructive/30 bg-destructive/5'}`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="font-mono text-xs font-semibold text-foreground">
                                                        {payment.transaction_no}
                                                    </p>
                                                    <p className="text-[10px] text-muted-foreground">
                                                        {PAYMENT_METHODS[
                                                            payment
                                                                .payment_method
                                                        ] ??
                                                            payment.payment_method}{' '}
                                                        · {payment.payment_date}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                                        {formatCurrency(
                                                            Number(
                                                                payment.amount,
                                                            ),
                                                        )}
                                                    </p>
                                                    <Badge
                                                        className={
                                                            payment.status ===
                                                            'paid'
                                                                ? 'bg-emerald-500/10 text-[10px] text-emerald-700'
                                                                : payment.status ===
                                                                    'pending'
                                                                  ? 'bg-amber-500/10 text-[10px] text-amber-700'
                                                                  : 'bg-destructive/10 text-[10px] text-destructive'
                                                        }
                                                    >
                                                        {payment.status}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </UctPanelCard>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-semibold">
                                    Invoice Info
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                        Invoice No
                                    </span>
                                    <span className="font-mono font-semibold">
                                        {invoice.invoice_no}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                        Issue Date
                                    </span>
                                    <span className="font-semibold">
                                        {invoice.issue_date || '—'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                        Due Date
                                    </span>
                                    <span className="font-semibold">
                                        {invoice.due_date || '—'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                        Fee Type
                                    </span>
                                    <span className="font-semibold capitalize">
                                        {invoice.type}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                        Status
                                    </span>
                                    <span className="font-semibold capitalize">
                                        {invoice.status}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
}

FinanceInvoiceShow.layout = { breadcrumbs };
