import React, { useState } from 'react';
import { Deferred, Head, Link, router, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MetricCard } from '@/components/tools/MetricCard';
import { MetricCardsSkeleton } from '@/components/tools/metric-cards-skeleton';
import { DataTable } from '@/components/tools/table/main-table';
import { TableSkeleton } from '@/components/tools/table-skeleton';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import type { BreadcrumbItem } from '@/types';
import type { DataTableServerFilter } from '@/components/tools/table/types';
import type { ColumnDef } from '@tanstack/react-table';
import {
    CreditCard,
    DollarSign,
    CheckCircle2,
    Clock,
    AlertCircle,
    Plus,
    Check,
    X,
    Eye,
    Save,
} from 'lucide-react';
import { toast } from 'sonner';

export interface PaymentItem {
    id: number;
    student_id: number;
    invoice_id: number | null;
    transaction_no: string;
    amount: number;
    payment_method: string;
    payment_date: string;
    status: string;
    notes: string | null;
    student?: {
        id: number;
        matric_no: string;
        user?: { name: string; email: string };
        program?: { name: string; code: string | null };
    };
    invoice?: {
        id: number;
        invoice_no: string;
        title: string;
    };
}

export interface PaymentStats {
    total_collected: number;
    pending_verification: number;
    total_transactions: number;
    today_collected: number;
}

export interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
}

interface AdminFinancePaymentsProps {
    stats?: PaymentStats;
    payments?: PaginatedData<PaymentItem>;
    students: Array<{ id: number; matric_no: string; name: string }>;
    filters: {
        search: string;
        status: string;
        payment_method: string;
        per_page: number;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/admin/dashboard' },
    { title: 'Finance', href: '/admin/finance' },
    { title: 'Payments', href: '/admin/finance/payments' },
];

export default function AdminFinancePayments({
    stats,
    payments,
    students = [],
    filters,
}: AdminFinancePaymentsProps) {
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const formatCurrency = (val: number) => `$${Number(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const { data, setData, post, processing, reset, errors } = useForm({
        student_id: '',
        amount: '',
        payment_method: 'bank_transfer',
        payment_date: new Date().toISOString().split('T')[0],
        status: 'paid',
        notes: '',
    });

    const handleFilterUpdate = (newFilters: Partial<typeof filters>) => {
        const query = {
            ...filters,
            ...newFilters,
        };

        const cleanQuery: Record<string, any> = {};
        Object.entries(query).forEach(([key, val]) => {
            if (val !== undefined && val !== '' && val !== 'all') {
                cleanQuery[key] = val;
            }
        });

        router.get('/admin/finance/payments', cleanQuery, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleRecordPayment = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/finance/payments', {
            onSuccess: () => {
                setCreateModalOpen(false);
                reset();
            },
        });
    };

    const handleStatusChange = (paymentId: number, newStatus: 'paid' | 'rejected') => {
        router.patch(`/admin/finance/payments/${paymentId}/status`, { status: newStatus }, {
            preserveScroll: true,
            onSuccess: () => toast.success(`Payment marked as ${newStatus}.`),
        });
    };

    const columns: ColumnDef<PaymentItem>[] = [
        {
            accessorKey: 'transaction_no',
            header: 'Transaction ID',
            cell: ({ row }) => (
                <Badge variant="outline" className="font-mono text-xs font-semibold uppercase">
                    {row.original.transaction_no}
                </Badge>
            ),
        },
        {
            accessorKey: 'student.user.name',
            header: 'Student',
            cell: ({ row }) => (
                <div className="max-w-[200px]">
                    <p className="font-medium text-foreground truncate text-sm">{row.original.student?.user?.name || 'N/A'}</p>
                    <p className="text-xs text-muted-foreground font-mono">{row.original.student?.matric_no}</p>
                </div>
            ),
        },
        {
            accessorKey: 'amount',
            header: 'Amount Paid',
            cell: ({ row }) => (
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(row.original.amount)}
                </span>
            ),
        },
        {
            accessorKey: 'payment_method',
            header: 'Method',
            cell: ({ row }) => (
                <Badge variant="secondary" className="capitalize text-[11px]">
                    {row.original.payment_method.replace('_', ' ')}
                </Badge>
            ),
        },
        {
            accessorKey: 'payment_date',
            header: 'Date',
            cell: ({ row }) => (
                <span className="text-xs text-muted-foreground">
                    {row.original.payment_date}
                </span>
            ),
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => {
                const status = row.original.status;
                if (status === 'paid') {
                    return (
                        <Badge className="bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 border-emerald-200">
                            Verified / Paid
                        </Badge>
                    );
                }
                if (status === 'pending') {
                    return (
                        <Badge className="bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 border-amber-200">
                            Pending Review
                        </Badge>
                    );
                }
                return (
                    <Badge variant="destructive">
                        Rejected
                    </Badge>
                );
            },
        },
        {
            id: 'actions',
            header: () => <span className="sr-only">Actions</span>,
            cell: ({ row }) => {
                const pmt = row.original;
                return (
                    <div className="flex items-center justify-end gap-1">
                        {pmt.status === 'pending' && (
                            <>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                    onClick={() => handleStatusChange(pmt.id, 'paid')}
                                >
                                    <Check className="h-3.5 w-3.5 mr-1" />
                                    Approve
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                                    onClick={() => handleStatusChange(pmt.id, 'rejected')}
                                >
                                    <X className="h-3.5 w-3.5 mr-1" />
                                    Reject
                                </Button>
                            </>
                        )}
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            asChild
                        >
                            <Link href={`/admin/students/${pmt.student_id}?tab=finance`}>
                                <Eye className="h-3.5 w-3.5 mr-1" />
                                Details
                            </Link>
                        </Button>
                    </div>
                );
            },
        },
    ];

    const serverFilters: DataTableServerFilter[] = [
        {
            key: 'status',
            title: 'Status',
            options: [
                { label: 'All Statuses', value: 'all' },
                { label: 'Paid', value: 'paid' },
                { label: 'Pending', value: 'pending' },
                { label: 'Rejected', value: 'rejected' },
            ],
            value: filters.status || undefined,
        },
        {
            key: 'payment_method',
            title: 'Payment Method',
            options: [
                { label: 'All Methods', value: 'all' },
                { label: 'Bank Transfer', value: 'bank_transfer' },
                { label: 'Cash', value: 'cash' },
                { label: 'EVC Plus', value: 'evc_plus' },
                { label: 'Zaad', value: 'zaad' },
                { label: 'Sahay', value: 'sahay' },
                { label: 'Credit Card', value: 'credit_card' },
            ],
            value: filters.payment_method || undefined,
        },
    ];

    return (
        <>
            <Head title="Student Payments & Transactions" />

            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h1 className="text-lg font-semibold text-foreground tracking-tight">
                            Student Payments & Transactions
                        </h1>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Audit incoming tuition receipts, mobile money payments (EVC/Zaad), bank slips, and verification queue.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/admin/finance/invoices">
                                Invoices
                            </Link>
                        </Button>
                        <Button size="sm" onClick={() => setCreateModalOpen(true)}>
                            <Plus className="h-4 w-4 mr-1.5" />
                            Record Payment
                        </Button>
                    </div>
                </div>

                {/* Metric Cards */}
                <Deferred data="stats" fallback={<MetricCardsSkeleton />}>
                    {stats && (
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:gap-4 lg:grid-cols-4 animate-in fade-in slide-in-from-top-6 duration-1000 ease-in-out">
                            <MetricCard
                                title="Total Collected"
                                value={formatCurrency(stats.total_collected)}
                                icon={CheckCircle2}
                                color="success"
                            />
                            <MetricCard
                                title="Pending Review"
                                value={`${stats.pending_verification} txns`}
                                icon={Clock}
                                color="warning"
                            />
                            <MetricCard
                                title="Today's Collections"
                                value={formatCurrency(stats.today_collected)}
                                icon={DollarSign}
                                color="primary"
                            />
                            <MetricCard
                                title="Total Transactions"
                                value={`${stats.total_transactions} txns`}
                                icon={CreditCard}
                                color="accent"
                            />
                        </div>
                    )}
                </Deferred>

                {/* Payments Data Table */}
                <Deferred data="payments" fallback={<TableSkeleton />}>
                    {payments && (
                        <div className="border border-border/60 rounded-md bg-card p-4">
                            <DataTable
                                title="Payment Transactions Roster"
                                searchTitle="Search by transaction no, matric no, student name..."
                                columns={columns}
                                data={payments.data}
                                pagination={{
                                    current_page: payments.current_page,
                                    last_page: payments.last_page,
                                    per_page: payments.per_page,
                                    total: payments.total,
                                }}
                                onPageChange={(page) => handleFilterUpdate({ ...filters, page } as any)}
                                onPageSizeChange={(per_page) => handleFilterUpdate({ per_page, page: 1 } as any)}
                                serverFilters={serverFilters}
                                onServerFilterChange={(key, values) => {
                                    handleFilterUpdate({ [key]: values?.[0] ?? 'all' });
                                }}
                                onServerFilterClear={() => {
                                    router.get('/admin/finance/payments', {}, { preserveState: true });
                                }}
                                onRowClick={(row) => router.visit(`/admin/students/${row.original.student_id}?tab=finance`)}
                            />
                        </div>
                    )}
                </Deferred>

                {/* Record Payment Modal */}
                <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-base font-semibold">Record Student Payment</DialogTitle>
                            <DialogDescription className="text-xs">
                                Enter payment transaction details received from student.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleRecordPayment} className="space-y-4 py-2">
                            <div className="space-y-1.5">
                                <Label htmlFor="student_id" className="text-xs font-semibold">
                                    Student <span className="text-destructive">*</span>
                                </Label>
                                <select
                                    id="student_id"
                                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                    value={data.student_id}
                                    onChange={(e) => setData('student_id', e.target.value)}
                                    required
                                >
                                    <option value="">Select Student</option>
                                    {students.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.name} ({s.matric_no})
                                        </option>
                                    ))}
                                </select>
                                {errors.student_id && <p className="text-[11px] text-destructive">{errors.student_id}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="amount" className="text-xs font-semibold">
                                    Payment Amount ($) <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="amount"
                                    type="number"
                                    step="0.01"
                                    placeholder="e.g. 450.00"
                                    value={data.amount}
                                    onChange={(e) => setData('amount', e.target.value)}
                                    className="text-xs"
                                    required
                                />
                                {errors.amount && <p className="text-[11px] text-destructive">{errors.amount}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label htmlFor="payment_method" className="text-xs font-semibold">
                                        Method <span className="text-destructive">*</span>
                                    </Label>
                                    <select
                                        id="payment_method"
                                        className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                        value={data.payment_method}
                                        onChange={(e) => setData('payment_method', e.target.value)}
                                        required
                                    >
                                        <option value="bank_transfer">Bank Transfer</option>
                                        <option value="cash">Cash</option>
                                        <option value="evc_plus">EVC Plus</option>
                                        <option value="zaad">Zaad Service</option>
                                        <option value="sahay">Sahay</option>
                                        <option value="credit_card">Credit / Debit Card</option>
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="payment_date" className="text-xs font-semibold">
                                        Payment Date <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="payment_date"
                                        type="date"
                                        value={data.payment_date}
                                        onChange={(e) => setData('payment_date', e.target.value)}
                                        className="text-xs"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="notes" className="text-xs font-semibold">
                                    Receipt / Reference Note
                                </Label>
                                <Input
                                    id="notes"
                                    placeholder="e.g. Bank slip #98234, Semester 1 tuition fee"
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    className="text-xs"
                                />
                            </div>

                            <DialogFooter className="pt-2">
                                <Button type="button" variant="outline" size="sm" onClick={() => setCreateModalOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" size="sm" disabled={processing}>
                                    <Save className="h-4 w-4 mr-1.5" />
                                    {processing ? 'Saving...' : 'Record Payment'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}

AdminFinancePayments.layout = { breadcrumbs };
