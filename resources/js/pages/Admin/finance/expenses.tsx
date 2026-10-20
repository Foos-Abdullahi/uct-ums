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
import { useTranslation } from 'react-i18next';
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
    total_recorded: number;
    paid_expenses: number;
    draft_expenses: number;
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
    payment_accounts: Array<{ id: number; code: number; name: string }>;
    filters: {
        search: string;
        status: string;
        account_id: number | 'all';
        per_page: number;
    };
}

export default function AdminFinanceExpenses({
    stats,
    expenses,
    expense_accounts = [],
    payment_accounts = [],
    filters,
}: AdminFinanceExpensesProps) {
    const { t } = useTranslation();
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [selectedForDelete, setSelectedForDelete] =
        useState<ExpenseItem | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleteProcessing, setDeleteProcessing] = useState(false);
    const [approveTarget, setApproveTarget] = useState<ExpenseItem | null>(null);
    const [approveComment, setApproveComment] = useState('');
    const [approveProcessing, setApproveProcessing] = useState(false);
    const [rejectTarget, setRejectTarget] = useState<ExpenseItem | null>(null);
    const [rejectComment, setRejectComment] = useState('');
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [rejectProcessing, setRejectProcessing] = useState(false);
    const [markPaidTarget, setMarkPaidTarget] = useState<ExpenseItem | null>(null);
    const markPaidForm = useForm({
        payment_method: 'cash',
        payment_account_id: '',
        reference_no: '',
        paid_at: new Date().toISOString().split('T')[0],
    });

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
        status: 'paid',
        payment_method: 'cash',
        payment_account_id: '',
        reference_no: '',
        paid_at: new Date().toISOString().split('T')[0],
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
                    t('expense_deleted', { expense_no: selectedForDelete.expense_no }),
                );
                setDeleteModalOpen(false);
                setSelectedForDelete(null);
                setDeleteProcessing(false);
            },
            onError: () => {
                toast.error(t('failed_delete_expense'));
                setDeleteProcessing(false);
            },
        });
    };

    const handleApprove = (expense: ExpenseItem) => {
        setApproveTarget(expense);
        setApproveComment('');
    };

    const confirmApprove = () => {
        if (!approveTarget) {
            return;
        }

        setApproveProcessing(true);
        router.post(
            `/admin/expenses/${approveTarget.id}/approve`,
            { comment: approveComment.trim() || null },
            {
                onSuccess: () => {
                    toast.success(t('expense_approved', { expense_no: approveTarget.expense_no }));
                    setApproveTarget(null);
                    setApproveComment('');
                },
                onError: (errs) => {
                    const msg = Object.values(errs)[0] ?? t('approval_failed');
                    toast.error(String(msg));
                },
                onFinish: () => setApproveProcessing(false),
            },
        );
    };

    const handleMarkPaid = (expense: ExpenseItem) => {
        markPaidForm.reset();
        markPaidForm.setData('payment_account_id', '');
        setMarkPaidTarget(expense);
    };

    const confirmMarkPaid = (event: React.FormEvent) => {
        event.preventDefault();

        if (!markPaidTarget) {
            return;
        }

        markPaidForm.post(`/admin/expenses/${markPaidTarget.id}/mark-paid`, {
            onSuccess: () => {
                toast.success(t('expense_marked_paid', { expense_no: markPaidTarget.expense_no }));
                setMarkPaidTarget(null);
            },
            onError: () => toast.error(t('failed_mark_paid')),
        });
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
                        t('expense_rejected', { expense_no: rejectTarget.expense_no }),
                    );
                    setRejectModalOpen(false);
                    setRejectTarget(null);
                    setRejectComment('');
                    setRejectProcessing(false);
                },
                onError: () => {
                    toast.error(t('failed_reject_expense'));
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
            header: t('expense_no_column'),
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
            header: t('expense_column'),
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
            header: t('account_column'),
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
            header: t('amount_column'),
            cell: ({ row }) => (
                <span className="text-xs font-semibold text-foreground">
                    {formatCurrency(row.original.amount)}
                </span>
            ),
        },
        {
            accessorKey: 'expense_date',
            header: t('date_column'),
            cell: ({ row }) => (
                <span className="text-xs text-muted-foreground">
                    {formatDate(row.original.expense_date)}
                </span>
            ),
        },
        {
            accessorKey: 'budget_line',
            header: t('budget_line_column'),
            cell: ({ row }) => (
                <span className="text-xs text-muted-foreground">
                    {row.original.budget_line || '—'}
                </span>
            ),
        },
        {
            accessorKey: 'status',
            header: t('status_column'),
            cell: ({ row }) => getStatusBadge(row.original.status),
        },
        {
            id: 'actions',
            header: () => <span className="sr-only">{t('actions_column')}</span>,
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
                            {t('mark_paid')}
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
                            {t('approve_expense')}
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
                            {t('reject_expense')}
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
                            {t('view_expense')}
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
            title: t('status_column'),
            options: [
                { label: t('all_statuses_filter'), value: 'all' },
                { label: t('draft_status'), value: 'draft' },
                { label: t('pending_approval_status'), value: 'pending_approval' },
                { label: t('approved_status'), value: 'approved' },
                { label: t('paid_status'), value: 'paid' },
                { label: t('rejected_status'), value: 'rejected' },
                { label: t('cancelled_status'), value: 'cancelled' },
            ],
            value: filters.status || undefined,
        },
        {
            key: 'account_id',
            title: t('account_column'),
            options: [
                { label: t('all_accounts_filter'), value: 'all' },
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
            <Head title={t('university_expense_management')} />

            <div className="space-y-6 p-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h1 className="text-lg font-semibold tracking-tight text-foreground">
                            {t('university_expense_management')}
                        </h1>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            {t('university_expense_description')}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/admin/finance">{t('finance_overview')}</Link>
                        </Button>
                        <Button
                            size="sm"
                            onClick={() => setCreateModalOpen(true)}
                        >
                            <Plus className="mr-1.5 h-4 w-4" />
                            {t('record_expense')}
                        </Button>
                    </div>
                </div>

                {/* Metric Cards */}
                <Deferred data="stats" fallback={<MetricCardsSkeleton />}>
                    {stats && (
                        <div className="grid animate-in grid-cols-1 gap-2 duration-1000 ease-in-out fade-in slide-in-from-top-6 sm:grid-cols-2 md:gap-4 lg:grid-cols-7">
                            <MetricCard
                                title="Total recorded"
                                value={formatCurrency(stats.total_recorded)}
                                icon={HandCoins}
                                color="accent"
                            />
                            <MetricCard
                                title="Paid expenses"
                                value={formatCurrency(stats.paid_expenses)}
                                icon={DollarSign}
                                color="destructive"
                            />
                            <MetricCard
                                title={t('pending_approval_expenses')}
                                value={`${stats.pending_approval} items`}
                                icon={Clock}
                                color="warning"
                            />
                            <MetricCard
                                title={t('this_month_expenses')}
                                value={formatCurrency(stats.month_expenses)}
                                icon={Wallet}
                                color="primary"
                            />
                            <MetricCard
                                title={t('total_vouchers')}
                                value={`${stats.total_expenses} items`}
                                icon={Receipt}
                                color="accent"
                            />
                            <MetricCard
                                title="Draft expenses"
                                value={formatCurrency(stats.draft_expenses)}
                                icon={Save}
                                color="primary"
                            />
                            <MetricCard
                                title={t('rejected_expenses')}
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
                                title={t('expense_vouchers')}
                                searchTitle={t('search_expenses_description')}
                                searchValue={filters.search}
                                onSearchChange={(search) =>
                                    handleFilterUpdate({
                                        search,
                                        page: 1,
                                    } as any)
                                }
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
                                {t('record_university_expense')}
                            </DialogTitle>
                            <DialogDescription className="text-xs">
                                {t('record_expense_description')}
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
                                    {t('expense_title')}{' '}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="title"
                                    placeholder={t('expense_title_placeholder')}
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
                                        {t('account_select')}{' '}
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
                                            <SelectValue placeholder={t('select_account')} />
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
                                        {t('amount_dollar')}{' '}
                                        <span className="text-destructive">
                                            *
                                        </span>
                                    </Label>
                                    <Input
                                        id="amount"
                                        type="number"
                                        step="0.01"
                                        placeholder={t('amount_placeholder')}
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
                                        {t('expense_date_label')}{' '}
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
                                        placeholder={t('pick_date')}
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
                                        {t('vendor_payee')}
                                    </Label>
                                    <Input
                                        id="vendor"
                                        placeholder={t('vendor_placeholder')}
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
                                        {t('budget_line_label')}
                                    </Label>
                                    <Input
                                        id="budget_line"
                                        placeholder={t('budget_line_placeholder')}
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
                                        {t('expense_status_label')}
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
                                                {t('pending_approval_status')}
                                            </SelectItem>
                                            <SelectItem
                                                value="paid"
                                                className="text-xs"
                                            >
                                                {t('paid_status')}
                                            </SelectItem>
                                            <SelectItem
                                                value="draft"
                                                className="text-xs"
                                            >
                                                {t('save_as_draft')}
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.status && (
                                        <p className="text-[11px] text-destructive">{errors.status}</p>
                                    )}
                                </div>
                            </div>

                            {data.status === 'paid' && (
                                <div className="space-y-3 rounded-md border border-border/60 p-3">
                                    <p className="text-xs font-semibold">Payment details</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="expense_payment_method" className="text-xs">Payment method *</Label>
                                            <Select value={data.payment_method} onValueChange={(value) => setData('payment_method', value)}>
                                                <SelectTrigger id="expense_payment_method" className="h-9 text-xs"><SelectValue placeholder="Select method" /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="cash">Cash</SelectItem>
                                                    <SelectItem value="bank_transfer">Bank transfer</SelectItem>
                                                    <SelectItem value="mobile_money">Mobile money</SelectItem>
                                                    <SelectItem value="card">Card</SelectItem>
                                                    <SelectItem value="cheque">Cheque</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {errors.payment_method && <p className="text-[11px] text-destructive">{errors.payment_method}</p>}
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="expense_payment_account" className="text-xs">Paid from account *</Label>
                                            <Select value={data.payment_account_id} onValueChange={(value) => setData('payment_account_id', value)}>
                                                <SelectTrigger id="expense_payment_account" className="h-9 text-xs"><SelectValue placeholder="Select cash/bank account" /></SelectTrigger>
                                                <SelectContent>
                                                    {payment_accounts.map((account) => (
                                                        <SelectItem key={account.id} value={String(account.id)}>{account.code} · {account.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {errors.payment_account_id && <p className="text-[11px] text-destructive">{errors.payment_account_id}</p>}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="expense_paid_at" className="text-xs">Paid date *</Label>
                                            <Input id="expense_paid_at" type="date" value={data.paid_at} onChange={(event) => setData('paid_at', event.target.value)} required />
                                            {errors.paid_at && <p className="text-[11px] text-destructive">{errors.paid_at}</p>}
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="expense_reference" className="text-xs">Reference number</Label>
                                            <Input id="expense_reference" value={data.reference_no} onChange={(event) => setData('reference_no', event.target.value)} />
                                            {errors.reference_no && <p className="text-[11px] text-destructive">{errors.reference_no}</p>}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <Label
                                    htmlFor="description"
                                    className="text-xs font-semibold"
                                >
                                    {t('description_label')}
                                </Label>
                                <Textarea
                                    id="description"
                                    className="min-h-[70px] text-xs"
                                    placeholder={t('description_placeholder')}
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
                                    {t('cancel_button')}
                                </Button>
                                <Button
                                    type="submit"
                                    size="sm"
                                    disabled={processing}
                                >
                                    <Save className="mr-1.5 h-4 w-4" />
                                    {processing
                                        ? t('saving')
                                        : data.status === 'pending_approval'
                                          ? t('submit_for_approval')
                                          : t('record_expense_button')}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Approve Modal */}
                <Dialog
                    open={Boolean(approveTarget)}
                    onOpenChange={(open) => {
                        if (!open && !approveProcessing) {
                            setApproveTarget(null);
                            setApproveComment('');
                        }
                    }}
                >
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-base font-semibold">
                                {t('approve_expense_title')}
                            </DialogTitle>
                            <DialogDescription className="text-xs">
                                {t('approve_expense_description', {
                                    expense_no: approveTarget?.expense_no,
                                })}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-3 py-2">
                            <div className="space-y-1.5">
                                <Label htmlFor="approval_comment" className="text-xs font-semibold">
                                    {t('approval_comment_label')}
                                </Label>
                                <Textarea
                                    id="approval_comment"
                                    className="min-h-[90px] text-xs"
                                    placeholder={t('approval_comment_placeholder')}
                                    value={approveComment}
                                    maxLength={1000}
                                    onChange={(event) => setApproveComment(event.target.value)}
                                />
                            </div>

                            <DialogFooter className="pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    disabled={approveProcessing}
                                    onClick={() => {
                                        setApproveTarget(null);
                                        setApproveComment('');
                                    }}
                                >
                                    {t('cancel_button')}
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    disabled={approveProcessing}
                                    onClick={confirmApprove}
                                >
                                    <Check className="mr-1.5 h-4 w-4" />
                                    {approveProcessing ? t('saving') : t('approve_expense')}
                                </Button>
                            </DialogFooter>
                        </div>
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
                                {t('reject_expense_title')}
                            </DialogTitle>
                            <DialogDescription className="text-xs">
                                {t('reject_expense_description', { expense_no: rejectTarget?.expense_no })}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-3 py-2">
                            <div className="space-y-1.5">
                                <Label
                                    htmlFor="reject_comment"
                                    className="text-xs font-semibold"
                                >
                                    {t('rejection_reason')}{' '}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <Textarea
                                    id="reject_comment"
                                    className="min-h-[90px] text-xs"
                                    placeholder={t('rejection_reason_placeholder')}
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
                                    {t('cancel_button')}
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
                                        ? t('saving')
                                        : t('confirm_reject')}
                                </Button>
                            </DialogFooter>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Delete Confirmation Modal */}
                <Dialog open={Boolean(markPaidTarget)} onOpenChange={(open) => !open && setMarkPaidTarget(null)}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Record expense payment</DialogTitle>
                            <DialogDescription>{markPaidTarget?.expense_no} · {markPaidTarget?.title}</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={confirmMarkPaid} className="space-y-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="paid_method">Payment method</Label>
                                <Select value={markPaidForm.data.payment_method} onValueChange={(value) => markPaidForm.setData('payment_method', value)}>
                                    <SelectTrigger id="paid_method"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="cash">Cash</SelectItem>
                                        <SelectItem value="bank_transfer">Bank transfer</SelectItem>
                                        <SelectItem value="mobile_money">Mobile money</SelectItem>
                                        <SelectItem value="card">Card</SelectItem>
                                        <SelectItem value="cheque">Cheque</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="paid_account">Payment account</Label>
                                <Select value={markPaidForm.data.payment_account_id} onValueChange={(value) => markPaidForm.setData('payment_account_id', value)}>
                                    <SelectTrigger id="paid_account"><SelectValue placeholder="Select account" /></SelectTrigger>
                                    <SelectContent>{payment_accounts.map((account) => <SelectItem key={account.id} value={String(account.id)}>{account.code} · {account.name}</SelectItem>)}</SelectContent>
                                </Select>
                                {markPaidForm.errors.payment_account_id && <p className="text-xs text-destructive">{markPaidForm.errors.payment_account_id}</p>}
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5"><Label htmlFor="paid_date">Paid date</Label><Input id="paid_date" type="date" value={markPaidForm.data.paid_at} onChange={(event) => markPaidForm.setData('paid_at', event.target.value)} /></div>
                                <div className="space-y-1.5"><Label htmlFor="paid_reference">Reference number</Label><Input id="paid_reference" value={markPaidForm.data.reference_no} onChange={(event) => markPaidForm.setData('reference_no', event.target.value)} /></div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setMarkPaidTarget(null)}>Cancel</Button>
                                <Button type="submit" disabled={markPaidForm.processing || !markPaidForm.data.payment_account_id}>Confirm paid</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                <ConfirmDeleteDialog
                    open={deleteModalOpen}
                    onOpenChange={setDeleteModalOpen}
                    title={t('delete_expense')}
                    description={t('delete_expense_description')}
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

AdminFinanceExpenses.layout = { breadcrumbs: [{ title: 'Dashboard', href: '/admin/dashboard' }, { title: 'Finance', href: '/admin/finance' }, { title: 'Expenses', href: '/admin/expenses' }] };
