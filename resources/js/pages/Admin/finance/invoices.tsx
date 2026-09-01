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
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
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
    FileText,
    Receipt,
    DollarSign,
    CheckCircle2,
    Clock,
    AlertCircle,
    Plus,
    Trash2,
    Eye,
    Save,
} from 'lucide-react';
import { toast } from 'sonner';

export interface InvoiceItem {
    id: number;
    student_id: number;
    invoice_no: string;
    title: string;
    type: string;
    amount: number;
    paid_amount: number;
    due_date: string | null;
    status: string;
    created_at: string;
    student?: {
        id: number;
        matric_no: string;
        user?: { name: string; email: string };
        program?: { name: string; code: string | null };
    };
}

export interface InvoiceStats {
    total_billed: number;
    total_paid: number;
    total_balance: number;
    total_invoices: number;
    overdue_count: number;
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

interface AdminFinanceInvoicesProps {
    stats?: InvoiceStats;
    invoices?: PaginatedData<InvoiceItem>;
    students: Array<{ id: number; matric_no: string; name: string }>;
    filters: {
        search: string;
        status: string;
        type: string;
        per_page: number;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/admin/dashboard' },
    { title: 'Finance', href: '/admin/finance' },
    { title: 'Invoices', href: '/admin/finance/invoices' },
];

export default function AdminFinanceInvoices({
    stats,
    invoices,
    students = [],
    filters,
}: AdminFinanceInvoicesProps) {
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [selectedForDelete, setSelectedForDelete] = useState<InvoiceItem | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleteProcessing, setDeleteProcessing] = useState(false);

    const formatCurrency = (val: number) => `$${Number(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const { data, setData, post, processing, reset, errors } = useForm({
        student_id: '',
        title: 'Tuition Fee - Semester 1',
        type: 'tuition',
        amount: '450.00',
        due_date: '',
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

        router.get('/admin/finance/invoices', cleanQuery, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleCreateInvoice = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/finance/invoices', {
            onSuccess: () => {
                setCreateModalOpen(false);
                reset();
            },
        });
    };

    const confirmDelete = () => {
        if (!selectedForDelete) return;
        setDeleteProcessing(true);

        router.delete(`/admin/finance/invoices/${selectedForDelete.id}`, {
            onSuccess: () => {
                toast.success(`Invoice ${selectedForDelete.invoice_no} deleted.`);
                setDeleteModalOpen(false);
                setSelectedForDelete(null);
                setDeleteProcessing(false);
            },
            onError: () => {
                toast.error('Failed to delete invoice.');
                setDeleteProcessing(false);
            },
        });
    };

    const columns: ColumnDef<InvoiceItem>[] = [
        {
            accessorKey: 'invoice_no',
            header: 'Invoice No',
            cell: ({ row }) => (
                <Badge variant="outline" className="font-mono text-xs font-semibold uppercase">
                    {row.original.invoice_no}
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
            accessorKey: 'title',
            header: 'Fee Description',
            cell: ({ row }) => (
                <div className="max-w-[220px]">
                    <p className="font-medium text-foreground truncate text-xs">{row.original.title}</p>
                    <Badge variant="secondary" className="capitalize text-[10px] mt-0.5">
                        {row.original.type}
                    </Badge>
                </div>
            ),
        },
        {
            accessorKey: 'amount',
            header: 'Amount',
            cell: ({ row }) => (
                <span className="text-xs font-semibold text-foreground">
                    {formatCurrency(row.original.amount)}
                </span>
            ),
        },
        {
            accessorKey: 'paid_amount',
            header: 'Paid',
            cell: ({ row }) => (
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(row.original.paid_amount)}
                </span>
            ),
        },
        {
            id: 'balance',
            header: 'Balance Due',
            cell: ({ row }) => {
                const balance = Math.max(0, row.original.amount - row.original.paid_amount);
                return (
                    <span className={`text-xs font-bold ${balance > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                        {balance > 0 ? formatCurrency(balance) : '$0.00'}
                    </span>
                );
            },
        },
        {
            accessorKey: 'due_date',
            header: 'Due Date',
            cell: ({ row }) => {
                const dueDate = row.original.due_date;
                const isOverdue = dueDate && new Date(dueDate) < new Date() && row.original.status !== 'paid';

                return (
                    <span className={`text-xs ${isOverdue ? 'text-destructive font-semibold' : 'text-muted-foreground'}`}>
                        {dueDate || 'No Due Date'}
                        {isOverdue && ' (Overdue)'}
                    </span>
                );
            },
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => {
                const status = row.original.status;
                if (status === 'paid') {
                    return (
                        <Badge className="bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 border-emerald-200">
                            Paid
                        </Badge>
                    );
                }
                if (status === 'partial') {
                    return (
                        <Badge className="bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 border-amber-200">
                            Partial
                        </Badge>
                    );
                }
                return (
                    <Badge variant="destructive">
                        Unpaid
                    </Badge>
                );
            },
        },
        {
            id: 'actions',
            header: () => <span className="sr-only">Actions</span>,
            cell: ({ row }) => (
                <div className="flex items-center justify-end gap-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        asChild
                    >
                        <Link href={`/admin/students/${row.original.student_id}?tab=finance`}>
                            <Eye className="h-3.5 w-3.5 mr-1" />
                            Ledger
                        </Link>
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                        onClick={(e) => {
                            e.stopPropagation();
                            setSelectedForDelete(row.original);
                            setDeleteModalOpen(true);
                        }}
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                </div>
            ),
        },
    ];

    const serverFilters: DataTableServerFilter[] = [
        {
            key: 'status',
            title: 'Status',
            options: [
                { label: 'All Statuses', value: 'all' },
                { label: 'Paid', value: 'paid' },
                { label: 'Partial', value: 'partial' },
                { label: 'Unpaid', value: 'unpaid' },
                { label: 'Overdue', value: 'overdue' },
            ],
            value: filters.status || undefined,
        },
        {
            key: 'type',
            title: 'Fee Type',
            options: [
                { label: 'All Types', value: 'all' },
                { label: 'Tuition', value: 'tuition' },
                { label: 'Admission', value: 'admission' },
                { label: 'Examination', value: 'examination' },
                { label: 'Laboratory', value: 'laboratory' },
                { label: 'Library', value: 'library' },
                { label: 'Graduation', value: 'graduation' },
            ],
            value: filters.type || undefined,
        },
    ];

    return (
        <>
            <Head title="Student Invoices & Billing" />

            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h1 className="text-lg font-semibold text-foreground tracking-tight">
                            Student Invoices & Billing
                        </h1>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Issue semester tuition assessments, lab fees, graduation invoices, and reconcile debtor balances.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/admin/finance/payments">
                                Payments
                            </Link>
                        </Button>
                        <Button size="sm" onClick={() => setCreateModalOpen(true)}>
                            <Plus className="h-4 w-4 mr-1.5" />
                            Issue Invoice
                        </Button>
                    </div>
                </div>

                {/* Metric Cards */}
                <Deferred data="stats" fallback={<MetricCardsSkeleton />}>
                    {stats && (
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:gap-4 lg:grid-cols-5 animate-in fade-in slide-in-from-top-6 duration-1000 ease-in-out">
                            <MetricCard
                                title="Total Invoiced"
                                value={formatCurrency(stats.total_billed)}
                                icon={FileText}
                                color="primary"
                            />
                            <MetricCard
                                title="Total Paid"
                                value={formatCurrency(stats.total_paid)}
                                icon={CheckCircle2}
                                color="success"
                            />
                            <MetricCard
                                title="Outstanding Due"
                                value={formatCurrency(stats.total_balance)}
                                icon={DollarSign}
                                color="destructive"
                            />
                            <MetricCard
                                title="Total Invoices"
                                value={`${stats.total_invoices} bills`}
                                icon={Receipt}
                                color="accent"
                            />
                            <MetricCard
                                title="Overdue Invoices"
                                value={`${stats.overdue_count} bills`}
                                icon={AlertCircle}
                                color="destructive"
                            />
                        </div>
                    )}
                </Deferred>

                {/* Invoices Data Table */}
                <Deferred data="invoices" fallback={<TableSkeleton />}>
                    {invoices && (
                        <div className="border border-border/60 rounded-md bg-card p-4">
                            <DataTable
                                title="Invoices Directory"
                                searchTitle="Search by invoice no, student name, matric no..."
                                columns={columns}
                                data={invoices.data}
                                pagination={{
                                    current_page: invoices.current_page,
                                    last_page: invoices.last_page,
                                    per_page: invoices.per_page,
                                    total: invoices.total,
                                }}
                                onPageChange={(page) => handleFilterUpdate({ ...filters, page } as any)}
                                onPageSizeChange={(per_page) => handleFilterUpdate({ per_page, page: 1 } as any)}
                                serverFilters={serverFilters}
                                onServerFilterChange={(key, values) => {
                                    handleFilterUpdate({ [key]: values?.[0] ?? 'all' });
                                }}
                                onServerFilterClear={() => {
                                    router.get('/admin/finance/invoices', {}, { preserveState: true });
                                }}
                                onRowClick={(row) => router.visit(`/admin/students/${row.original.student_id}?tab=finance`)}
                            />
                        </div>
                    )}
                </Deferred>

                {/* Issue Invoice Modal */}
                <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-base font-semibold">Issue Student Invoice</DialogTitle>
                            <DialogDescription className="text-xs">
                                Create an official invoice bill assigned to student fee ledger.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleCreateInvoice} className="space-y-4 py-2">
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
                                <Label htmlFor="title" className="text-xs font-semibold">
                                    Invoice Title <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="title"
                                    placeholder="e.g. Tuition Fee - Fall 2026 Semester 1"
                                    value={data.title}
                                    onChange={(e) => setData('title', e.target.value)}
                                    className="text-xs"
                                    required
                                />
                                {errors.title && <p className="text-[11px] text-destructive">{errors.title}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label htmlFor="type" className="text-xs font-semibold">
                                        Fee Category <span className="text-destructive">*</span>
                                    </Label>
                                    <select
                                        id="type"
                                        className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                        value={data.type}
                                        onChange={(e) => setData('type', e.target.value)}
                                        required
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

                                <div className="space-y-1.5">
                                    <Label htmlFor="amount" className="text-xs font-semibold">
                                        Amount ($) <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="amount"
                                        type="number"
                                        step="0.01"
                                        placeholder="450.00"
                                        value={data.amount}
                                        onChange={(e) => setData('amount', e.target.value)}
                                        className="text-xs"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="due_date" className="text-xs font-semibold">
                                    Due Date
                                </Label>
                                <Input
                                    id="due_date"
                                    type="date"
                                    value={data.due_date}
                                    onChange={(e) => setData('due_date', e.target.value)}
                                    className="text-xs"
                                />
                            </div>

                            <DialogFooter className="pt-2">
                                <Button type="button" variant="outline" size="sm" onClick={() => setCreateModalOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" size="sm" disabled={processing}>
                                    <Save className="h-4 w-4 mr-1.5" />
                                    {processing ? 'Saving...' : 'Issue Invoice'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Delete Confirmation Modal */}
                <ConfirmDeleteDialog
                    open={deleteModalOpen}
                    onOpenChange={setDeleteModalOpen}
                    title="Delete Invoice"
                    description="Are you sure you want to delete this invoice? Invoices with collected payments cannot be deleted."
                    itemName={selectedForDelete ? `${selectedForDelete.invoice_no} (${selectedForDelete.title})` : undefined}
                    loading={deleteProcessing}
                    onConfirm={confirmDelete}
                />
            </div>
        </>
    );
}

AdminFinanceInvoices.layout = { breadcrumbs };
