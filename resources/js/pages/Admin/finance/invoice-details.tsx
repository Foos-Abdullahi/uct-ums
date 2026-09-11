import React, { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UctPanelCard } from '@/components/tools/uct-panel-card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import type { BreadcrumbItem } from '@/types';
import {
    FileText,
    ArrowLeft,
    Plus,
    Trash2,
    Save,
    CheckCircle2,
    Clock,
    AlertCircle,
    DollarSign,
    CreditCard,
    Receipt,
    Percent,
    Tag,
    Landmark,
    Banknote,
} from 'lucide-react';
import { toast } from 'sonner';

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
    notes: string | null;
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
        id: number;
        matric_no: string;
        user?: { name: string; email: string };
        program?: { name: string; code: string | null };
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/admin/dashboard' },
    { title: 'Finance', href: '/admin/finance' },
    { title: 'Invoices', href: '/admin/finance/invoices' },
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

export default function AdminInvoiceDetails({ invoice }: { invoice: InvoiceDetail }) {
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editProcessing, setEditProcessing] = useState(false);

    const formatCurrency = (val: number) => `$${Number(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const subtotal = invoice.items.reduce(
        (sum, item) => sum + Number(item.amount),
        0
    );
    const total = Number(invoice.amount);
    const totalAfterTaxAndDiscount = subtotal + Number(invoice.tax_amount) - Number(invoice.discount_amount);
    const balance = Math.max(0, total - Number(invoice.paid_amount));
    const isOverdue = invoice.due_date && new Date(invoice.due_date) < new Date() && invoice.status !== 'paid';

    const { data, setData, put, processing, reset, errors } = useForm({
        title: invoice.title,
        description: invoice.description ?? '',
        type: invoice.type,
        amount: String(invoice.amount),
        tax_amount: String(invoice.tax_amount),
        discount_amount: String(invoice.discount_amount),
        due_date: invoice.due_date ?? '',
        issue_date: invoice.issue_date ?? '',
        status: invoice.status,
        items: invoice.items.map((item) => ({
            id: item.id,
            description: item.description,
            quantity: String(item.quantity),
            unit_price: String(item.unit_price),
            amount: String(item.amount),
        })),
    });

    const openEdit = () => {
        setData({
            title: invoice.title,
            description: invoice.description ?? '',
            type: invoice.type,
            amount: String(invoice.amount),
            tax_amount: String(invoice.tax_amount),
            discount_amount: String(invoice.discount_amount),
            due_date: invoice.due_date ?? '',
            issue_date: invoice.issue_date ?? '',
            status: invoice.status,
            items: invoice.items.map((item) => ({
                id: item.id,
                description: item.description,
                quantity: String(item.quantity),
                unit_price: String(item.unit_price),
                amount: String(item.amount),
            })),
        });
        setEditModalOpen(true);
    };

    const addItem = () => {
        setData('items', [
            ...data.items,
            { id: undefined as any, description: '', quantity: '1', unit_price: '0', amount: '0' },
        ]);
    };

    const removeItem = (index: number) => {
        setData('items', data.items.filter((_, i) => i !== index));
    };

    const updateItem = (index: number, field: keyof typeof data.items[0], value: string) => {
        const items = data.items.map((item, i) => {
            if (i !== index) return item;
            const updated = { ...item, [field]: value };
            if (field === 'quantity' || field === 'unit_price') {
                const qty = Number(updated.quantity || 0);
                const price = Number(updated.unit_price || 0);
                updated.amount = String(Number((qty * price).toFixed(2)));
            }
            return updated;
        });
        setData('items', items);

        // Auto-recompute invoice amount from line items
        const computedTotal = items.reduce((sum, it) => sum + Number(it.amount || 0), 0);
        setData('amount', String(computedTotal.toFixed(2)));
    };

    const handleSaveEdit = (e: React.FormEvent) => {
        e.preventDefault();
        setEditProcessing(true);
        put(`/admin/finance/invoices/${invoice.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Invoice updated.');
                setEditModalOpen(false);
                setEditProcessing(false);
            },
            onError: () => {
                toast.error('Failed to update invoice.');
                setEditProcessing(false);
            },
        });
    };

    const statusBadge = () => {
        const overdue = isOverdue;
        if (invoice.status === 'paid') {
            return (
                <Badge className="bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 border-emerald-200 px-2 py-1">
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Paid
                </Badge>
            );
        }
        if (overdue) {
            return (
                <Badge variant="destructive" className="px-2 py-1">
                    <AlertCircle className="h-3 w-3 mr-1" /> Overdue
                </Badge>
            );
        }
        if (invoice.status === 'partial') {
            return (
                <Badge className="bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 border-amber-200 px-2 py-1">
                    <Clock className="h-3 w-3 mr-1" /> Partial
                </Badge>
            );
        }
        return <Badge variant="destructive" className="px-2 py-1">Unpaid</Badge>;
    };

    return (
        <>
            <Head title={`Invoice ${invoice.invoice_no}`} />

            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-3">
                        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                            <Link href="/admin/finance/invoices">
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-lg font-semibold text-foreground tracking-tight">
                                    {invoice.title}
                                </h1>
                                {statusBadge()}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                <span className="font-mono font-semibold">{invoice.invoice_no}</span> · {invoice.type} · {invoice.issue_date || 'No issue date'}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {invoice.student?.user?.name} ({invoice.student?.matric_no}) · {invoice.student?.program?.name || 'No program'}
                            </p>
                        </div>
                    </div>

                    {invoice.paid_amount === 0 && (
                        <Button size="sm" variant="outline" onClick={openEdit}>
                            <Save className="h-4 w-4 mr-1.5" />
                            Edit Invoice
                        </Button>
                    )}
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:gap-4 lg:grid-cols-4 animate-in fade-in slide-in-from-top-6 duration-1000 ease-in-out">
                    <Card>
                        <CardContent className="pt-5">
                            <div className="flex items-center gap-3">
                                <div className="rounded-full bg-primary/10 p-2 text-primary">
                                    <FileText className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Invoice Amount</p>
                                    <p className="text-lg font-bold text-foreground">{formatCurrency(invoice.amount)}</p>
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
                                    <p className="text-xs text-muted-foreground">Total Paid</p>
                                    <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(Number(invoice.paid_amount))}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-5">
                            <div className="flex items-center gap-3">
                                <div className={`rounded-full ${balance > 0 ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'} p-2`}>
                                    <DollarSign className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Balance Due</p>
                                    <p className={`text-lg font-bold ${balance > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>{formatCurrency(balance)}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-5">
                            <div className="flex items-center gap-3">
                                <div className={`rounded-full ${isOverdue ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'} p-2`}>
                                    <AlertCircle className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Due Date</p>
                                    <p className={`text-sm font-semibold ${isOverdue ? 'text-destructive' : 'text-foreground'}`}>
                                        {invoice.due_date || 'No due date'}
                                        {isOverdue && ' (Overdue)'}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left: Line Items */}
                    <div className="lg:col-span-2 space-y-6">
                        <UctPanelCard
                            title="Invoice Line Items"
                            description="Detailed breakdown of charges billed on this invoice."
                            icon={Receipt}
                        >
                            {invoice.description && (
                                <p className="text-xs text-muted-foreground mb-3">{invoice.description}</p>
                            )}
                            <div className="border rounded-md overflow-hidden">
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="border-b bg-muted/40 text-left text-muted-foreground">
                                            <th className="px-3 py-2 font-semibold">Description</th>
                                            <th className="px-3 py-2 text-center font-semibold w-16">Qty</th>
                                            <th className="px-3 py-2 text-right font-semibold w-24">Unit Price</th>
                                            <th className="px-3 py-2 text-right font-semibold w-24">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {invoice.items.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="px-3 py-6 text-center text-muted-foreground italic">
                                                    No line items recorded for this invoice.
                                                </td>
                                            </tr>
                                        ) : (
                                            invoice.items.map((item) => (
                                                <tr key={item.id}>
                                                    <td className="px-3 py-2 font-medium text-foreground">{item.description}</td>
                                                    <td className="px-3 py-2 text-center text-muted-foreground">{item.quantity}</td>
                                                    <td className="px-3 py-2 text-right font-mono text-muted-foreground">{formatCurrency(Number(item.unit_price))}</td>
                                                    <td className="px-3 py-2 text-right font-semibold font-mono text-foreground">{formatCurrency(Number(item.amount))}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Totals Summary */}
                            <div className="mt-4 flex justify-end">
                                <div className="w-full max-w-[260px] space-y-1.5 text-xs">
                                    <div className="flex justify-between text-muted-foreground">
                                        <span>Subtotal</span>
                                        <span className="font-mono">{formatCurrency(subtotal)}</span>
                                    </div>
                                    {Number(invoice.tax_amount) > 0 && (
                                        <div className="flex justify-between text-muted-foreground">
                                            <span className="flex items-center">
                                                <Percent className="h-3 w-3 mr-1" /> Tax
                                            </span>
                                            <span className="font-mono">{formatCurrency(Number(invoice.tax_amount))}</span>
                                        </div>
                                    )}
                                    {Number(invoice.discount_amount) > 0 && (
                                        <div className="flex justify-between text-muted-foreground">
                                            <span className="flex items-center">
                                                <Tag className="h-3 w-3 mr-1" /> Discount
                                            </span>
                                            <span className="font-mono text-emerald-600 dark:text-emerald-400">-{formatCurrency(Number(invoice.discount_amount))}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between font-bold text-foreground border-t border-border/60 pt-2">
                                        <span>Total Due</span>
                                        <span className="font-mono">{formatCurrency(total)}</span>
                                    </div>
                                </div>
                            </div>
                        </UctPanelCard>
                    </div>

                    {/* Right: Payments */}
                    <div className="space-y-6">
                        <UctPanelCard
                            title="Payment History"
                            description="Transactions applied to this invoice."
                            icon={CreditCard}
                        >
                            {invoice.payments.length === 0 ? (
                                <p className="text-xs text-muted-foreground italic py-6 text-center">
                                    No payments recorded for this invoice yet.
                                </p>
                            ) : (
                                <div className="space-y-3 pt-1">
                                    {invoice.payments.map((payment) => (
                                        <div key={payment.id} className={`rounded-md border p-3 ${payment.status === 'paid' ? 'border-emerald-200 bg-emerald-500/5' : payment.status === 'pending' ? 'border-amber-200 bg-amber-500/5' : 'border-destructive/30 bg-destructive/5'}`}>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className={`rounded-full p-1.5 ${payment.status === 'paid' ? 'bg-emerald-500/10 text-emerald-600' : payment.status === 'pending' ? 'bg-amber-500/10 text-amber-600' : 'bg-destructive/10 text-destructive'}`}>
                                                        {payment.status === 'paid' ? (
                                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                                        ) : payment.status === 'pending' ? (
                                                            <Clock className="h-3.5 w-3.5" />
                                                        ) : (
                                                            <AlertCircle className="h-3.5 w-3.5" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-semibold text-foreground font-mono">{payment.transaction_no}</p>
                                                        <p className="text-[10px] text-muted-foreground">
                                                            {PAYMENT_METHODS[payment.payment_method] ?? payment.payment_method} · {payment.payment_date}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                                        {formatCurrency(Number(payment.amount))}
                                                    </p>
                                                    <Badge
                                                        className={
                                                            payment.status === 'paid'
                                                                ? 'bg-emerald-500/10 text-emerald-700 text-[10px]'
                                                                : payment.status === 'pending'
                                                                ? 'bg-amber-500/10 text-amber-700 text-[10px]'
                                                                : 'bg-destructive/10 text-destructive text-[10px]'
                                                        }
                                                    >
                                                        {payment.status}
                                                    </Badge>
                                                </div>
                                            </div>
                                            {payment.notes && (
                                                <p className="text-[10px] text-muted-foreground mt-2">{payment.notes}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </UctPanelCard>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-semibold">Invoice Info</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Invoice No</span>
                                    <span className="font-mono font-semibold">{invoice.invoice_no}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Issue Date</span>
                                    <span className="font-semibold">{invoice.issue_date || '—'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Due Date</span>
                                    <span className="font-semibold">{invoice.due_date || '—'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Fee Type</span>
                                    <span className="font-semibold capitalize">{invoice.type}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Status</span>
                                    <span className="font-semibold capitalize">{invoice.status}</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Edit Invoice Modal */}
                <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
                    <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="text-base font-semibold">Edit Invoice</DialogTitle>
                            <DialogDescription className="text-xs">
                                Update invoice details, line items, tax, and discount. Invoices with collected payments cannot be edited.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleSaveEdit} className="space-y-4 py-2">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label htmlFor="edit_title" className="text-xs font-semibold">
                                        Title <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="edit_title"
                                        value={data.title}
                                        onChange={(e) => setData('title', e.target.value)}
                                        className="text-xs"
                                        required
                                    />
                                    {errors.title && <p className="text-[11px] text-destructive">{errors.title}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="edit_type" className="text-xs font-semibold">
                                        Fee Type
                                    </Label>
                                    <select
                                        id="edit_type"
                                        className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                        value={data.type}
                                        onChange={(e) => setData('type', e.target.value)}
                                    >
                                        <option value="tuition">Tuition</option>
                                        <option value="admission">Admission</option>
                                        <option value="examination">Examination</option>
                                        <option value="laboratory">Laboratory</option>
                                        <option value="library">Library</option>
                                        <option value="graduation">Graduation</option>
                                        <option value="hostel">Hostel</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div className="space-y-1.5">
                                    <Label htmlFor="edit_tax" className="text-xs font-semibold">Tax ($)</Label>
                                    <Input
                                        id="edit_tax"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={data.tax_amount}
                                        onChange={(e) => setData('tax_amount', e.target.value)}
                                        className="text-xs"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="edit_discount" className="text-xs font-semibold">Discount ($)</Label>
                                    <Input
                                        id="edit_discount"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={data.discount_amount}
                                        onChange={(e) => setData('discount_amount', e.target.value)}
                                        className="text-xs"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="edit_status" className="text-xs font-semibold">Status</Label>
                                    <select
                                        id="edit_status"
                                        className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                        value={data.status}
                                        onChange={(e) => setData('status', e.target.value)}
                                    >
                                        <option value="unpaid">Unpaid</option>
                                        <option value="partial">Partial</option>
                                        <option value="paid">Paid</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label htmlFor="edit_due_date" className="text-xs font-semibold">Due Date</Label>
                                    <Input
                                        id="edit_due_date"
                                        type="date"
                                        value={data.due_date}
                                        onChange={(e) => setData('due_date', e.target.value)}
                                        className="text-xs"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="edit_issue_date" className="text-xs font-semibold">Issue Date</Label>
                                    <Input
                                        id="edit_issue_date"
                                        type="date"
                                        value={data.issue_date}
                                        onChange={(e) => setData('issue_date', e.target.value)}
                                        className="text-xs"
                                    />
                                </div>
                            </div>

                            {/* Line Items */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-semibold">Line Items</Label>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="h-7 text-xs"
                                        onClick={addItem}
                                    >
                                        <Plus className="h-3.5 w-3.5 mr-1" />
                                        Add Item
                                    </Button>
                                </div>
                                <div className="space-y-2">
                                    {data.items.map((item, index) => (
                                        <div key={index} className="grid grid-cols-[1fr_60px_80px_80px_32px] gap-2 items-center">
                                            <Input
                                                placeholder="Description"
                                                value={item.description}
                                                onChange={(e) => updateItem(index, 'description', e.target.value)}
                                                className="text-xs"
                                            />
                                            <Input
                                                placeholder="Qty"
                                                type="number"
                                                min="1"
                                                value={item.quantity}
                                                onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                                                className="text-xs"
                                            />
                                            <Input
                                                placeholder="Unit $"
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={item.unit_price}
                                                onChange={(e) => updateItem(index, 'unit_price', e.target.value)}
                                                className="text-xs"
                                            />
                                            <Input
                                                placeholder="Amount"
                                                type="number"
                                                step="0.01"
                                                value={item.amount}
                                                onChange={(e) => updateItem(index, 'amount', e.target.value)}
                                                className="text-xs"
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="h-9 px-2 text-destructive hover:text-destructive"
                                                onClick={() => removeItem(index)}
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <DialogFooter className="pt-2">
                                <Button type="button" variant="outline" size="sm" onClick={() => setEditModalOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" size="sm" disabled={editProcessing}>
                                    <Save className="h-4 w-4 mr-1.5" />
                                    {editProcessing ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}

AdminInvoiceDetails.layout = { breadcrumbs };