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
    Wallet,
    DollarSign,
    CheckCircle2,
    Clock,
    AlertCircle,
    Plus,
    Trash2,
    Eye,
    Save,
    Receipt,
    Check,
    X,
    HandCoins,
} from 'lucide-react';
import { toast } from 'sonner';

export interface ExpenseItem {
    id: number;
    expense_no: string;
    title: string;
    description: string | null;
    expense_type: string;
    amount: number;
    expense_date: string;
    vendor: string | null;
    budget_line: string | null;
    status: string;
    created_by: number;
    approved_by: number | null;
    approved_at: string | null;
    created_at: string;
    creator?: { id: number; name: string };
    approver?: { id: number; name: string };
    approvals?: Array<{
        id: number;
        level: number;
        action: string;
        comment: string | null;
        acted_at: string | null;
        approver?: { id: number; name: string };
    }>;
}

export interface ExpenseStats {
    total_spent: number;
    pending_approval: number;
    total_expenses: number;
    month_expenses: number;
    rejected_count: number;
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

interface AdminFinanceExpensesProps {
    stats?: ExpenseStats;
    expenses?: PaginatedData<ExpenseItem>;
    expense_types: string[];
    expense_statuses: string[];
    level_roles: Record<number, string>;
    filters: {
        search: string;
        status: string;
        expense_type: string;
        per_page: number;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/admin/dashboard' },
    { title: 'Finance', href: '/admin/finance' },
    { title: 'Expenses', href: '/admin/expenses' },
];

const TYPE_LABELS: Record<string, string> = {
    salary: 'Salary',
    utilities: 'Utilities',
    equipment: 'Equipment',
    maintenance: 'Maintenance',
    supplies: 'Supplies',
    others: 'Others',
};

export default function AdminFinanceExpenses({
    stats,
    expenses,
    expense_types = [],
    expense_statuses = [],
    level_roles = {},
    filters,
}: AdminFinanceExpensesProps) {
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [selectedForDelete, setSelectedForDelete] = useState<ExpenseItem | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleteProcessing, setDeleteProcessing] = useState(false);
    const [rejectTarget, setRejectTarget] = useState<ExpenseItem | null>(null);
    const [rejectComment, setRejectComment] = useState('');
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [rejectProcessing, setRejectProcessing] = useState(false);

    const formatCurrency = (val: number) => `$${Number(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const { data, setData, post, processing, reset, errors } = useForm({
        title: '',
        description: '',
        expense_type: 'others',
        amount: '',
        expense_date: new Date().toISOString().split('T')[0],
        vendor: '',
        budget_line: '',
        status: 'pending_approval',
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

        router.get('/admin/expenses', cleanQuery, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleCreateExpense = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/expenses', {
            onSuccess: () => {
                setCreateModalOpen(false);
                reset();
            },
        });
    };

    const confirmDelete = () => {
        if (!selectedForDelete) return;
        setDeleteProcessing(true);

        router.delete(`/admin/expenses/${selectedForDelete.id}`, {
            onSuccess: () => {
                toast.success(`Expense ${selectedForDelete.expense_no} deleted.`);
                setDeleteModalOpen(false);
                setSelectedForDelete(null);
                setDeleteProcessing(false);
            },
            onError: () => {
                toast.error('Failed to delete expense.');
                setDeleteProcessing(false);
            },
        });
    };

    const handleApprove = (expense: ExpenseItem) => {
        router.post(`/admin/expenses/${expense.id}/approve`, {}, {
            onSuccess: () => toast.success(`Expense ${expense.expense_no} approved at this level.`),
            onError: () => toast.error('Approval failed.'),
        });
    };

    const handleMarkPaid = (expense: ExpenseItem) => {
        router.post(`/admin/expenses/${expense.id}/mark-paid`, {}, {
            onSuccess: () => toast.success(`Expense ${expense.expense_no} marked as paid.`),
            onError: () => toast.error('Failed to mark expense as paid.'),
        });
    };

    const confirmReject = () => {
        if (!rejectTarget) return;
        setRejectProcessing(true);

        router.post(
            `/admin/expenses/${rejectTarget.id}/reject`,
            { comment: rejectComment },
            {
                onSuccess: () => {
                    toast.success(`Expense ${rejectTarget.expense_no} rejected.`);
                    setRejectModalOpen(false);
                    setRejectTarget(null);
                    setRejectComment('');
                    setRejectProcessing(false);
                },
                onError: () => {
                    toast.error('Failed to reject expense.');
                    setRejectProcessing(false);
                },
            }
        );
    };

    const getStatusBadge = (status: string) => {
        const map: Record<string, React.ReactNode> = {
            paid: (
                <Badge className="bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 border-emerald-200">
                    <Check className="h-3 w-3 mr-1" /> Paid
                </Badge>
            ),
            approved: (
                <Badge className="bg-blue-500/10 text-blue-700 hover:bg-blue-500/20 border-blue-200">
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Approved
                </Badge>
            ),
            pending_approval: (
                <Badge className="bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 border-amber-200">
                    <Clock className="h-3 w-3 mr-1" /> Pending
                </Badge>
            ),
            rejected: (
                <Badge variant="destructive">
                    <X className="h-3 w-3 mr-1" /> Rejected
                </Badge>
            ),
            draft: (
                <Badge variant="outline">
                    Draft
                </Badge>
            ),
            cancelled: (
                <Badge variant="secondary">
                    Cancelled
                </Badge>
            ),
        };
        return map[status] ?? <Badge variant="outline">{status}</Badge>;
    };

    const columns: ColumnDef<ExpenseItem>[] = [
        {
            accessorKey: 'expense_no',
            header: 'Expense No',
            cell: ({ row }) => (
                <Badge variant="outline" className="font-mono text-xs font-semibold uppercase">
                    {row.original.expense_no}
                </Badge>
            ),
        },
        {
            accessorKey: 'title',
            header: 'Expense',
            cell: ({ row }) => (
                <div className="max-w-[240px]">
                    <p className="font-medium text-foreground truncate text-sm">{row.original.title}</p>
                    {row.original.vendor && (
                        <p className="text-xs text-muted-foreground truncate">{row.original.vendor}</p>
                    )}
                </div>
            ),
        },
        {
            accessorKey: 'expense_type',
            header: 'Type',
            cell: ({ row }) => (
                <Badge variant="secondary" className="capitalize text-[10px]">
                    {TYPE_LABELS[row.original.expense_type] ?? row.original.expense_type}
                </Badge>
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
            accessorKey: 'expense_date',
            header: 'Date',
            cell: ({ row }) => (
                <span className="text-xs text-muted-foreground">{row.original.expense_date}</span>
            ),
        },
        {
            accessorKey: 'budget_line',
            header: 'Budget Line',
            cell: ({ row }) => (
                <span className="text-xs text-muted-foreground">{row.original.budget_line || '—'}</span>
            ),
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => getStatusBadge(row.original.status),
        },
        {
            id: 'actions',
            header: () => <span className="sr-only">Actions</span>,
            cell: ({ row }) => (
                <div className="flex items-center justify-end gap-1">
                    {row.original.status === 'approved' && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs text-emerald-600 hover:text-emerald-600"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleMarkPaid(row.original);
                            }}
                        >
                            <HandCoins className="h-3.5 w-3.5 mr-1" />
                            Mark Paid
                        </Button>
                    )}
                    {row.original.status === 'pending_approval' && row.original.approvals?.some(
                        (a) => a.action === 'pending'
                    ) && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleApprove(row.original);
                            }}
                        >
                            <Check className="h-3.5 w-3.5 mr-1" />
                            Approve
                        </Button>
                    )}
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        asChild
                    >
                        <Link href={`/admin/expenses/${row.original.id}`}>
                            <Eye className="h-3.5 w-3.5 mr-1" />
                            View
                        </Link>
                    </Button>
                    {['draft', 'rejected', 'cancelled', 'pending_approval'].includes(row.original.status) && (
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
                    )}
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
                { label: 'Draft', value: 'draft' },
                { label: 'Pending Approval', value: 'pending_approval' },
                { label: 'Approved', value: 'approved' },
                { label: 'Paid', value: 'paid' },
                { label: 'Rejected', value: 'rejected' },
                { label: 'Cancelled', value: 'cancelled' },
            ],
            value: filters.status || undefined,
        },
        {
            key: 'expense_type',
            title: 'Expense Type',
            options: [
                { label: 'All Types', value: 'all' },
                ...expense_types.map((t) => ({
                    label: TYPE_LABELS[t] ?? t,
                    value: t,
                })),
            ],
            value: filters.expense_type || undefined,
        },
    ];

    return (
        <>
            <Head title="University Expenses" />

            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h1 className="text-lg font-semibold text-foreground tracking-tight">
                            University Expense Management
                        </h1>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Track operational expenses across salary, utilities, equipment, maintenance, and supplies with multi-level approval.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/admin/finance">
                                Finance Overview
                            </Link>
                        </Button>
                        <Button size="sm" onClick={() => setCreateModalOpen(true)}>
                            <Plus className="h-4 w-4 mr-1.5" />
                            Record Expense
                        </Button>
                    </div>
                </div>

                {/* Metric Cards */}
                <Deferred data="stats" fallback={<MetricCardsSkeleton />}>
                    {stats && (
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:gap-4 lg:grid-cols-5 animate-in fade-in slide-in-from-top-6 duration-1000 ease-in-out">
                            <MetricCard
                                title="Total Expense"
                                value={formatCurrency(stats.total_spent)}
                                icon={DollarSign}
                                color="destructive"
                            />
                            <MetricCard
                                title="Pending Approval"
                                value={`${stats.pending_approval} items`}
                                icon={Clock}
                                color="warning"
                            />
                            <MetricCard
                                title="This Month"
                                value={formatCurrency(stats.month_expenses)}
                                icon={Wallet}
                                color="primary"
                            />
                            <MetricCard
                                title="Total Vouchers"
                                value={`${stats.total_expenses} items`}
                                icon={Receipt}
                                color="accent"
                            />
                            <MetricCard
                                title="Rejected"
                                value={`${stats.rejected_count} items`}
                                icon={AlertCircle}
                                color="destructive"
                            />
                        </div>
                    )}
                </Deferred>

                {/* Expenses Data Table */}
                <Deferred data="expenses" fallback={<TableSkeleton />}>
                    {expenses && (
                        <div className="border border-border/60 rounded-md bg-card p-4">
                            <DataTable
                                title="Expense Vouchers"
                                searchTitle="Search by expense no, title, vendor, budget line..."
                                columns={columns}
                                data={expenses.data}
                                pagination={{
                                    current_page: expenses.current_page,
                                    last_page: expenses.last_page,
                                    per_page: expenses.per_page,
                                    total: expenses.total,
                                }}
                                onPageChange={(page) => handleFilterUpdate({ ...filters, page } as any)}
                                onPageSizeChange={(per_page) => handleFilterUpdate({ per_page, page: 1 } as any)}
                                serverFilters={serverFilters}
                                onServerFilterChange={(key, values) => {
                                    handleFilterUpdate({ [key]: values?.[0] ?? 'all' });
                                }}
                                onServerFilterClear={() => {
                                    router.get('/admin/expenses', {}, { preserveState: true });
                                }}
                                onRowClick={(row) => router.visit(`/admin/expenses/${row.original.id}`)}
                            />
                        </div>
                    )}
                </Deferred>

                {/* Record Expense Modal */}
                <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
                    <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle className="text-base font-semibold">Record University Expense</DialogTitle>
                            <DialogDescription className="text-xs">
                                Submit an expense voucher. Submitted expenses enter the multi-level approval chain.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleCreateExpense} className="space-y-4 py-2">
                            <div className="space-y-1.5">
                                <Label htmlFor="title" className="text-xs font-semibold">
                                    Expense Title <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="title"
                                    placeholder="e.g. Electricity bill for main campus"
                                    value={data.title}
                                    onChange={(e) => setData('title', e.target.value)}
                                    className="text-xs"
                                    required
                                />
                                {errors.title && <p className="text-[11px] text-destructive">{errors.title}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label htmlFor="expense_type" className="text-xs font-semibold">
                                        Expense Type <span className="text-destructive">*</span>
                                    </Label>
                                    <select
                                        id="expense_type"
                                        className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                        value={data.expense_type}
                                        onChange={(e) => setData('expense_type', e.target.value)}
                                        required
                                    >
                                        {expense_types.map((t) => (
                                            <option key={t} value={t}>
                                                {TYPE_LABELS[t] ?? t}
                                            </option>
                                        ))}
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
                                        placeholder="1500.00"
                                        value={data.amount}
                                        onChange={(e) => setData('amount', e.target.value)}
                                        className="text-xs"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label htmlFor="expense_date" className="text-xs font-semibold">
                                        Expense Date <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="expense_date"
                                        type="date"
                                        value={data.expense_date}
                                        onChange={(e) => setData('expense_date', e.target.value)}
                                        className="text-xs"
                                        required
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="vendor" className="text-xs font-semibold">
                                        Vendor / Payee
                                    </Label>
                                    <Input
                                        id="vendor"
                                        placeholder="e.g. Golis Electric"
                                        value={data.vendor}
                                        onChange={(e) => setData('vendor', e.target.value)}
                                        className="text-xs"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label htmlFor="budget_line" className="text-xs font-semibold">
                                        Budget Line
                                    </Label>
                                    <Input
                                        id="budget_line"
                                        placeholder="e.g. Operations"
                                        value={data.budget_line}
                                        onChange={(e) => setData('budget_line', e.target.value)}
                                        className="text-xs"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="status" className="text-xs font-semibold">
                                        Status
                                    </Label>
                                    <select
                                        id="status"
                                        className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                        value={data.status}
                                        onChange={(e) => setData('status', e.target.value)}
                                    >
                                        <option value="pending_approval">Submit for Approval</option>
                                        <option value="draft">Save as Draft</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="description" className="text-xs font-semibold">
                                    Description
                                </Label>
                                <textarea
                                    id="description"
                                    className="w-full min-h-[70px] rounded-md border border-input bg-background px-3 py-2 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                    placeholder="Details about this expense..."
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                />
                            </div>

                            <DialogFooter className="pt-2">
                                <Button type="button" variant="outline" size="sm" onClick={() => setCreateModalOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" size="sm" disabled={processing}>
                                    <Save className="h-4 w-4 mr-1.5" />
                                    {processing ? 'Saving...' : 'Record Expense'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Reject Modal */}
                <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-base font-semibold">Reject Expense</DialogTitle>
                            <DialogDescription className="text-xs">
                                Provide a reason for rejecting {rejectTarget?.expense_no}. Rejection requires a comment.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-3 py-2">
                            <div className="space-y-1.5">
                                <Label htmlFor="reject_comment" className="text-xs font-semibold">
                                    Rejection Reason <span className="text-destructive">*</span>
                                </Label>
                                <textarea
                                    id="reject_comment"
                                    className="w-full min-h-[90px] rounded-md border border-input bg-background px-3 py-2 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                    placeholder="Explain why this expense is being rejected..."
                                    value={rejectComment}
                                    onChange={(e) => setRejectComment(e.target.value)}
                                    required
                                />
                            </div>

                            <DialogFooter className="pt-2">
                                <Button type="button" variant="outline" size="sm" onClick={() => setRejectModalOpen(false)}>
                                    Cancel
                                </Button>
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    disabled={rejectProcessing || !rejectComment.trim()}
                                    onClick={confirmReject}
                                >
                                    <X className="h-4 w-4 mr-1.5" />
                                    {rejectProcessing ? 'Rejecting...' : 'Confirm Reject'}
                                </Button>
                            </DialogFooter>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Delete Confirmation Modal */}
                <ConfirmDeleteDialog
                    open={deleteModalOpen}
                    onOpenChange={setDeleteModalOpen}
                    title="Delete Expense"
                    description="Are you sure you want to delete this expense voucher? Only draft, rejected, cancelled or pending expenses can be deleted."
                    itemName={selectedForDelete ? `${selectedForDelete.expense_no} (${selectedForDelete.title})` : undefined}
                    loading={deleteProcessing}
                    onConfirm={confirmDelete}
                />
            </div>
        </>
    );
}

AdminFinanceExpenses.layout = { breadcrumbs };