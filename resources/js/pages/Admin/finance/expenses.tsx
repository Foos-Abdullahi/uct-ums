import { Deferred, Head, Link, router, useForm } from '@inertiajs/react';
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
import React, { useState } from 'react';
import { toast } from 'sonner';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import { MetricCardsSkeleton } from '@/components/tools/metric-cards-skeleton';
import { MetricCard } from '@/components/tools/MetricCard';
import { DataTable } from '@/components/tools/table/main-table';
import type { DataTableServerFilter } from '@/components/tools/table/types';
import { TableSkeleton } from '@/components/tools/table-skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { formatDate } from '@/lib/utils';
import type { BreadcrumbItem } from '@/types';

export interface ExpenseItem {
    id: number;
    expense_no: string;
    title: string;
    description: string | null;
    expense_type: string;
    account_id: number | null;
    amount: number;
    expense_date: string;
    vendor: string | null;
    budget_line: string | null;
    status: string;
    created_by: number;
    approved_by: number | null;
    approved_at: string | null;
    created_at: string;
    account?: {
        id: number;
        code: number;
        name: string;
        normal_balance: string;
        category?: { type: string; name: string };
    };
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

export interface ExpenseAccountOption {
    id: number;
    code: number;
    name: string;
    normal_balance: string;
    category: string;
}

interface AdminFinanceExpensesProps {
    stats?: ExpenseStats;
    expenses?: PaginatedData<ExpenseItem>;
    expense_accounts: ExpenseAccountOption[];
    filters: {
        search: string;
        status: string;
        account_id: number | 'all';
        per_page: number;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/admin/dashboard' },
    { title: 'Finance', href: '/admin/finance' },
    { title: 'Expenses', href: '/admin/expenses' },
];

export default function AdminFinanceExpenses({
    stats,
    expenses,
    expense_accounts = [],
    filters,
}: AdminFinanceExpensesProps) {
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [selectedForDelete, setSelectedForDelete] =
        useState<ExpenseItem | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleteProcessing, setDeleteProcessing] = useState(false);
    const [rejectTarget, setRejectTarget] = useState<ExpenseItem | null>(null);
    const [rejectComment, setRejectComment] = useState('');
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [rejectProcessing, setRejectProcessing] = useState(false);

    const formatCurrency = (val: number) =>
        `$${Number(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const { data, setData, post, processing, reset, errors } = useForm({
        title: '',
        description: '',
        account_id: '',
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
        if (!selectedForDelete) {
            return;
        }

        setDeleteProcessing(true);

        router.delete(`/admin/expenses/${selectedForDelete.id}`, {
            onSuccess: () => {
                toast.success(
                    `Expense ${selectedForDelete.expense_no} deleted.`,
                );
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
        router.post(
            `/admin/expenses/${expense.id}/approve`,
            {},
            {
                onSuccess: () =>
                    toast.success(`Expense ${expense.expense_no} approved.`),
                onError: (errs) => {
                    const msg = Object.values(errs)[0] ?? 'Approval failed.';
                    toast.error(String(msg));
                },
            },
        );
    };

    const handleMarkPaid = (expense: ExpenseItem) => {
        router.post(
            `/admin/expenses/${expense.id}/mark-paid`,
            {},
            {
                onSuccess: () =>
                    toast.success(
                        `Expense ${expense.expense_no} marked as paid.`,
                    ),
                onError: () => toast.error('Failed to mark expense as paid.'),
            },
        );
    };

    const confirmReject = () => {
        if (!rejectTarget) {
            return;
        }

        setRejectProcessing(true);

        router.post(
            `/admin/expenses/${rejectTarget.id}/reject`,
            { comment: rejectComment },
            {
                onSuccess: () => {
                    toast.success(
                        `Expense ${rejectTarget.expense_no} rejected.`,
                    );
                    setRejectModalOpen(false);
                    setRejectTarget(null);
                    setRejectComment('');
                    setRejectProcessing(false);
                },
                onError: () => {
                    toast.error('Failed to reject expense.');
                    setRejectProcessing(false);
                },
            },
        );
    };

    const getStatusBadge = (status: string) => {
        const map: Record<string, React.ReactNode> = {
            paid: (
                <Badge className="border-emerald-200 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20">
                    <Check className="mr-1 h-3 w-3" /> Paid
                </Badge>
            ),
            approved: (
                <Badge className="border-blue-200 bg-blue-500/10 text-blue-700 hover:bg-blue-500/20">
                    <CheckCircle2 className="mr-1 h-3 w-3" /> Approved
                </Badge>
            ),
            pending_approval: (
                <Badge className="border-amber-200 bg-amber-500/10 text-amber-700 hover:bg-amber-500/20">
                    <Clock className="mr-1 h-3 w-3" /> Pending
                </Badge>
            ),
            rejected: (
                <Badge variant="destructive">
                    <X className="mr-1 h-3 w-3" /> Rejected
                </Badge>
            ),
            draft: <Badge variant="outline">Draft</Badge>,
            cancelled: <Badge variant="secondary">Cancelled</Badge>,
        };

        return map[status] ?? <Badge variant="outline">{status}</Badge>;
    };

    const columns: ColumnDef<ExpenseItem>[] = [
        {
            accessorKey: 'expense_no',
            header: 'Expense No',
            cell: ({ row }) => (
                <Badge
                    variant="outline"
                    className="font-mono text-xs font-semibold uppercase"
                >
                    {row.original.expense_no}
                </Badge>
            ),
        },
        {
            accessorKey: 'title',
            header: 'Expense',
            cell: ({ row }) => (
                <div className="max-w-[240px]">
                    <p className="truncate text-sm font-medium text-foreground">
                        {row.original.title}
                    </p>
                    {row.original.vendor && (
                        <p className="truncate text-xs text-muted-foreground">
                            {row.original.vendor}
                        </p>
                    )}
                </div>
            ),
        },
        {
            accessorKey: 'account',
            header: 'Account',
            cell: ({ row }) => (
                <div className="max-w-[220px]">
                    <div className="flex items-center gap-1.5">
                        <Badge
                            variant="outline"
                            className="font-mono text-[10px] font-semibold"
                        >
                            {row.original.account?.code ?? '—'}
                        </Badge>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-foreground">
                        {row.original.account?.name ||
                            row.original.expense_type}
                    </p>
                    {/* {(row.original.account?.category?.name) && (
                        <p className="text-[10px] text-muted-foreground truncate">
                            {row.original.account.category.name}
                        </p>
                    )} */}
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
            accessorKey: 'expense_date',
            header: 'Date',
            cell: ({ row }) => (
                <span className="text-xs text-muted-foreground">
                    {formatDate(row.original.expense_date)}
                </span>
            ),
        },
        {
            accessorKey: 'budget_line',
            header: 'Budget Line',
            cell: ({ row }) => (
                <span className="text-xs text-muted-foreground">
                    {row.original.budget_line || '—'}
                </span>
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
                            <HandCoins className="mr-1 h-3.5 w-3.5" />
                            Mark Paid
                        </Button>
                    )}
                    {row.original.status === 'pending_approval' && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs text-blue-600 hover:text-blue-600"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleApprove(row.original);
                            }}
                        >
                            <Check className="mr-1 h-3.5 w-3.5" />
                            Approve
                        </Button>
                    )}
                    {row.original.status === 'pending_approval' && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                            onClick={(e) => {
                                e.stopPropagation();
                                setRejectTarget(row.original);
                                setRejectModalOpen(true);
                            }}
                        >
                            <X className="mr-1 h-3.5 w-3.5" />
                            Reject
                        </Button>
                    )}
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        asChild
                    >
                        <Link href={`/admin/expenses/${row.original.id}`}>
                            <Eye className="mr-1 h-3.5 w-3.5" />
                            View
                        </Link>
                    </Button>
                    {[
                        'draft',
                        'rejected',
                        'cancelled',
                        'pending_approval',
                    ].includes(row.original.status) && (
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
            key: 'account_id',
            title: 'Account',
            options: [
                { label: 'All Accounts', value: 'all' },
                ...expense_accounts.map((a) => ({
                    label: `${a.code} · ${a.name}`,
                    value: String(a.id),
                })),
            ],
            value:
                filters.account_id === 'all'
                    ? undefined
                    : String(filters.account_id),
        },
    ];

    return (
        <>
            <Head title="University Expenses" />

            <div className="space-y-6 p-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h1 className="text-lg font-semibold tracking-tight text-foreground">
                            University Expense Management
                        </h1>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            Track operational and academic expenses against the
                            UCT chart of accounts with multi-level approval.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/admin/finance">Finance Overview</Link>
                        </Button>
                        <Button
                            size="sm"
                            onClick={() => setCreateModalOpen(true)}
                        >
                            <Plus className="mr-1.5 h-4 w-4" />
                            Record Expense
                        </Button>
                    </div>
                </div>

                {/* Metric Cards */}
                <Deferred data="stats" fallback={<MetricCardsSkeleton />}>
                    {stats && (
                        <div className="grid animate-in grid-cols-1 gap-2 duration-1000 ease-in-out fade-in slide-in-from-top-6 sm:grid-cols-2 md:gap-4 lg:grid-cols-5">
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
                        <div className="rounded-md border border-border/60 bg-card p-4">
                            <DataTable
                                title="Expense Vouchers"
                                searchTitle="Search by expense no, title, vendor, budget line, or account..."
                                columns={columns}
                                data={expenses.data}
                                pagination={{
                                    current_page: expenses.current_page,
                                    last_page: expenses.last_page,
                                    per_page: expenses.per_page,
                                    total: expenses.total,
                                }}
                                onPageChange={(page) =>
                                    handleFilterUpdate({
                                        ...filters,
                                        page,
                                    } as any)
                                }
                                onPageSizeChange={(per_page) =>
                                    handleFilterUpdate({
                                        per_page,
                                        page: 1,
                                    } as any)
                                }
                                serverFilters={serverFilters}
                                onServerFilterChange={(key, values) => {
                                    handleFilterUpdate({
                                        [key]: values?.[0] ?? 'all',
                                    });
                                }}
                                onServerFilterClear={() => {
                                    router.get(
                                        '/admin/expenses',
                                        {},
                                        { preserveState: true },
                                    );
                                }}
                                onRowClick={(row) =>
                                    router.visit(
                                        `/admin/expenses/${row.original.id}`,
                                    )
                                }
                            />
                        </div>
                    )}
                </Deferred>

                {/* Record Expense Modal */}
                <Dialog
                    open={createModalOpen}
                    onOpenChange={setCreateModalOpen}
                >
                    <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle className="text-base font-semibold">
                                Record University Expense
                            </DialogTitle>
                            <DialogDescription className="text-xs">
                                Submit an expense voucher. Submitted expenses
                                enter the multi-level approval chain.
                            </DialogDescription>
                        </DialogHeader>

                        <form
                            onSubmit={handleCreateExpense}
                            className="space-y-4 py-2"
                        >
                            <div className="space-y-1.5">
                                <Label
                                    htmlFor="title"
                                    className="text-xs font-semibold"
                                >
                                    Expense Title{' '}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="title"
                                    placeholder="e.g. Electricity bill for main campus"
                                    value={data.title}
                                    onChange={(e) =>
                                        setData('title', e.target.value)
                                    }
                                    className="text-xs"
                                    required
                                />
                                {errors.title && (
                                    <p className="text-[11px] text-destructive">
                                        {errors.title}
                                    </p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label
                                        htmlFor="account_id"
                                        className="text-xs font-semibold"
                                    >
                                        Account{' '}
                                        <span className="text-destructive">
                                            *
                                        </span>
                                    </Label>
                                    <Select
                                        value={data.account_id}
                                        onValueChange={(val) =>
                                            setData('account_id', val)
                                        }
                                        required
                                    >
                                        <SelectTrigger
                                            id="account_id"
                                            className="h-9 text-xs"
                                        >
                                            <SelectValue placeholder="Select account..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Array.from(
                                                new Set(
                                                    expense_accounts.map(
                                                        (a) => a.category,
                                                    ),
                                                ),
                                            ).map((category) => (
                                                <SelectGroup key={category}>
                                                    <SelectLabel className="text-[10px] font-semibold tracking-wider uppercase">
                                                        {category}
                                                    </SelectLabel>
                                                    {expense_accounts
                                                        .filter(
                                                            (a) =>
                                                                a.category ===
                                                                category,
                                                        )
                                                        .map((a) => (
                                                            <SelectItem
                                                                key={a.id}
                                                                value={String(
                                                                    a.id,
                                                                )}
                                                                className="text-xs"
                                                            >
                                                                {a.code} ·{' '}
                                                                {a.name}
                                                            </SelectItem>
                                                        ))}
                                                </SelectGroup>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.account_id && (
                                        <p className="text-[11px] text-destructive">
                                            {errors.account_id}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-1.5">
                                    <Label
                                        htmlFor="amount"
                                        className="text-xs font-semibold"
                                    >
                                        Amount ($){' '}
                                        <span className="text-destructive">
                                            *
                                        </span>
                                    </Label>
                                    <Input
                                        id="amount"
                                        type="number"
                                        step="0.01"
                                        placeholder="1500.00"
                                        value={data.amount}
                                        onChange={(e) =>
                                            setData('amount', e.target.value)
                                        }
                                        className="text-xs"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label
                                        htmlFor="expense_date"
                                        className="text-xs font-semibold"
                                    >
                                        Expense Date{' '}
                                        <span className="text-destructive">
                                            *
                                        </span>
                                    </Label>
                                    <DatePicker
                                        id="expense_date"
                                        value={data.expense_date}
                                        onChange={(val) =>
                                            setData('expense_date', val)
                                        }
                                        placeholder="Pick a date"
                                        maxDate={new Date()}
                                    />
                                    {errors.expense_date && (
                                        <p className="text-[11px] text-destructive">
                                            {errors.expense_date}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-1.5">
                                    <Label
                                        htmlFor="vendor"
                                        className="text-xs font-semibold"
                                    >
                                        Vendor / Payee
                                    </Label>
                                    <Input
                                        id="vendor"
                                        placeholder="e.g. Golis Electric"
                                        value={data.vendor}
                                        onChange={(e) =>
                                            setData('vendor', e.target.value)
                                        }
                                        className="text-xs"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label
                                        htmlFor="budget_line"
                                        className="text-xs font-semibold"
                                    >
                                        Budget Line
                                    </Label>
                                    <Input
                                        id="budget_line"
                                        placeholder="e.g. Operations"
                                        value={data.budget_line}
                                        onChange={(e) =>
                                            setData(
                                                'budget_line',
                                                e.target.value,
                                            )
                                        }
                                        className="text-xs"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label
                                        htmlFor="status"
                                        className="text-xs font-semibold"
                                    >
                                        Status
                                    </Label>
                                    <Select
                                        value={data.status}
                                        onValueChange={(val) =>
                                            setData('status', val)
                                        }
                                    >
                                        <SelectTrigger
                                            id="status"
                                            className="h-9 text-xs"
                                        >
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem
                                                value="pending_approval"
                                                className="text-xs"
                                            >
                                                Submit for Approval
                                            </SelectItem>
                                            <SelectItem
                                                value="draft"
                                                className="text-xs"
                                            >
                                                Save as Draft
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label
                                    htmlFor="description"
                                    className="text-xs font-semibold"
                                >
                                    Description
                                </Label>
                                <Textarea
                                    id="description"
                                    className="min-h-[70px] text-xs"
                                    placeholder="Details about this expense..."
                                    value={data.description}
                                    onChange={(e) =>
                                        setData('description', e.target.value)
                                    }
                                />
                            </div>

                            <DialogFooter className="pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCreateModalOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    size="sm"
                                    disabled={processing}
                                >
                                    <Save className="mr-1.5 h-4 w-4" />
                                    {processing
                                        ? 'Saving...'
                                        : 'Record Expense'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Reject Modal */}
                <Dialog
                    open={rejectModalOpen}
                    onOpenChange={setRejectModalOpen}
                >
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-base font-semibold">
                                Reject Expense
                            </DialogTitle>
                            <DialogDescription className="text-xs">
                                Provide a reason for rejecting{' '}
                                {rejectTarget?.expense_no}. Rejection requires a
                                comment.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-3 py-2">
                            <div className="space-y-1.5">
                                <Label
                                    htmlFor="reject_comment"
                                    className="text-xs font-semibold"
                                >
                                    Rejection Reason{' '}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <Textarea
                                    id="reject_comment"
                                    className="min-h-[90px] text-xs"
                                    placeholder="Explain why this expense is being rejected..."
                                    value={rejectComment}
                                    onChange={(e) =>
                                        setRejectComment(e.target.value)
                                    }
                                />
                            </div>

                            <DialogFooter className="pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setRejectModalOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    disabled={
                                        rejectProcessing ||
                                        !rejectComment.trim()
                                    }
                                    onClick={confirmReject}
                                >
                                    <X className="mr-1.5 h-4 w-4" />
                                    {rejectProcessing
                                        ? 'Rejecting...'
                                        : 'Confirm Reject'}
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
                    itemName={
                        selectedForDelete
                            ? `${selectedForDelete.expense_no} (${selectedForDelete.title})`
                            : undefined
                    }
                    loading={deleteProcessing}
                    onConfirm={confirmDelete}
                />
            </div>
        </>
    );
}

AdminFinanceExpenses.layout = { breadcrumbs };
