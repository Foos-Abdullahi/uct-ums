import React, { useState } from 'react';
import { Deferred, Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
    Shield,
    Clock,
    CheckCircle2,
    XCircle,
    DollarSign,
    Check,
    X,
    Eye,
} from 'lucide-react';
import { toast } from 'sonner';

interface ExpenseItem {
    id: number;
    expense_no: string;
    title: string;
    expense_type: string;
    amount: number;
    expense_date: string;
    status: string;
    creator?: { name: string };
    approvals?: Array<{
        level: number;
        action: string;
        approver?: { id: number; name: string };
    }>;
}

interface ApprovalStats {
    my_pending: number;
    my_approved: number;
    my_rejected: number;
    total_pending_amount: number;
}

interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface Props {
    expenses?: PaginatedData<ExpenseItem>;
    expense_types: string[];
    expense_statuses: string[];
    level_roles: Record<number, string>;
    stats?: ApprovalStats;
    filters: { status: string; per_page: number };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/finance/dashboard' },
    { title: 'Approvals', href: '/finance/approvals' },
];

const TYPE_LABELS: Record<string, string> = {
    salary: 'Salary',
    utilities: 'Utilities',
    equipment: 'Equipment',
    maintenance: 'Maintenance',
    supplies: 'Supplies',
    others: 'Others',
};

export default function FinanceApprovalsIndex({ expenses, level_roles = {}, stats, filters }: Props) {
    const [rejectTarget, setRejectTarget] = useState<ExpenseItem | null>(null);
    const [rejectComment, setRejectComment] = useState('');
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [rejectProcessing, setRejectProcessing] = useState(false);

    const formatCurrency = (val: number) => `$${Number(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const handleFilterUpdate = (newFilters: Partial<typeof filters>) => {
        const query = { ...filters, ...newFilters };
        const cleanQuery: Record<string, any> = {};
        Object.entries(query).forEach(([key, val]) => {
            if (val !== undefined && val !== '' && val !== 'all') cleanQuery[key] = val;
        });
        router.get('/finance/approvals', cleanQuery, { preserveState: true, preserveScroll: true });
    };

    const handleApprove = (expense: ExpenseItem) => {
        router.post(`/finance/expenses/${expense.id}/approve`, {}, {
            onSuccess: () => toast.success(`${expense.expense_no} approved.`),
            onError: () => toast.error('Failed to approve.'),
        });
    };

    const handleMarkPaid = (expense: ExpenseItem) => {
        router.post(`/finance/expenses/${expense.id}/mark-paid`, {}, {
            onSuccess: () => toast.success(`${expense.expense_no} marked as paid.`),
            onError: () => toast.error('Failed.'),
        });
    };

    const confirmReject = () => {
        if (!rejectTarget) return;
        setRejectProcessing(true);
        router.post(`/finance/expenses/${rejectTarget.id}/reject`, { comment: rejectComment }, {
            onSuccess: () => {
                toast.success(`${rejectTarget.expense_no} rejected.`);
                setRejectModalOpen(false);
                setRejectTarget(null);
                setRejectComment('');
                setRejectProcessing(false);
            },
            onError: () => { toast.error('Failed.'); setRejectProcessing(false); },
        });
    };

    const getStatusBadge = (status: string) => {
        const map: Record<string, React.ReactNode> = {
            pending_approval: <Badge className="bg-amber-500/10 text-amber-700 border-amber-200"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>,
            approved: <Badge className="bg-blue-500/10 text-blue-700 border-blue-200"><CheckCircle2 className="h-3 w-3 mr-1" /> Approved</Badge>,
            paid: <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-200"><Check className="h-3 w-3 mr-1" /> Paid</Badge>,
            rejected: <Badge variant="destructive"><X className="h-3 w-3 mr-1" /> Rejected</Badge>,
        };
        return map[status] ?? <Badge variant="outline">{status}</Badge>;
    };

    const columns: ColumnDef<ExpenseItem>[] = [
        {
            accessorKey: 'expense_no',
            header: 'Expense No',
            cell: ({ row }) => <Badge variant="outline" className="font-mono text-xs font-semibold">{row.original.expense_no}</Badge>,
        },
        {
            accessorKey: 'title',
            header: 'Expense',
            cell: ({ row }) => (
                <div className="max-w-[240px]">
                    <p className="font-medium text-foreground truncate text-sm">{row.original.title}</p>
                    {row.original.creator && <p className="text-[10px] text-muted-foreground">Submitted by {row.original.creator.name}</p>}
                </div>
            ),
        },
        {
            accessorKey: 'expense_type',
            header: 'Type',
            cell: ({ row }) => <Badge variant="secondary" className="capitalize text-[10px]">{TYPE_LABELS[row.original.expense_type] ?? row.original.expense_type}</Badge>,
        },
        {
            accessorKey: 'amount',
            header: 'Amount',
            cell: ({ row }) => <span className="text-xs font-semibold text-foreground">{formatCurrency(row.original.amount)}</span>,
        },
        {
            accessorKey: 'expense_date',
            header: 'Date',
            cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.original.expense_date}</span>,
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
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-emerald-600" onClick={(e) => { e.stopPropagation(); handleMarkPaid(row.original); }}>
                            <Check className="h-3.5 w-3.5 mr-1" /> Pay
                        </Button>
                    )}
                    {row.original.status === 'pending_approval' && (
                        <>
                            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={(e) => { e.stopPropagation(); handleApprove(row.original); }}>
                                <Check className="h-3.5 w-3.5 mr-1" /> Approve
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-destructive" onClick={(e) => { e.stopPropagation(); setRejectTarget(row.original); setRejectModalOpen(true); }}>
                                <X className="h-3.5 w-3.5 mr-1" /> Reject
                            </Button>
                        </>
                    )}
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" asChild>
                        <Link href={`/finance/expenses/${row.original.id}`}>
                            <Eye className="h-3.5 w-3.5 mr-1" /> View
                        </Link>
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <>
            <Head title="My Approval Queue" />
            <div className="p-6 space-y-6">
                <div>
                    <h1 className="text-lg font-semibold text-foreground tracking-tight">My Approval Queue</h1>
                    <p className="text-xs text-muted-foreground mt-0.5">Expenses awaiting your approval action. Approve at your assigned level to move forward.</p>
                </div>

                <Deferred data="stats" fallback={<MetricCardsSkeleton />}>
                    {stats && (
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:gap-4 lg:grid-cols-4 animate-in fade-in slide-in-from-top-6 duration-1000 ease-in-out">
                            <MetricCard title="Awaiting My Approval" value={`${stats.my_pending} items`} icon={Clock} color="warning" />
                            <MetricCard title="My Approvals Given" value={`${stats.my_approved} items`} icon={CheckCircle2} color="success" />
                            <MetricCard title="My Rejections" value={`${stats.my_rejected} items`} icon={XCircle} color="destructive" />
                            <MetricCard title="Pending Amount" value={formatCurrency(stats.total_pending_amount)} icon={DollarSign} color="destructive" />
                        </div>
                    )}
                </Deferred>

                <Deferred data="expenses" fallback={<TableSkeleton />}>
                    {expenses && (
                        <div className="border border-border/60 rounded-md bg-card p-4">
                            <DataTable
                                title="Expenses For Approval"
                                searchTitle="Filter by expense..."
                                columns={columns}
                                data={expenses.data}
                                pagination={{ current_page: expenses.current_page, last_page: expenses.last_page, per_page: expenses.per_page, total: expenses.total }}
                                onPageChange={(page) => handleFilterUpdate({ ...filters, page } as any)}
                                onPageSizeChange={(per_page) => handleFilterUpdate({ per_page, page: 1 } as any)}
                                serverFilters={[
                                    {
                                        key: 'status',
                                        title: 'Status',
                                        options: [
                                            { label: 'All Statuses', value: 'all' },
                                            { label: 'Pending Approval', value: 'pending_approval' },
                                            { label: 'Approved', value: 'approved' },
                                            { label: 'Paid', value: 'paid' },
                                            { label: 'Rejected', value: 'rejected' },
                                        ],
                                        value: filters.status || undefined,
                                    },
                                ]}
                                onServerFilterChange={(key, values) => handleFilterUpdate({ [key]: values?.[0] ?? 'all' })}
                                onServerFilterClear={() => router.get('/finance/approvals', {}, { preserveState: true })}
                                onRowClick={(row) => router.visit(`/finance/expenses/${row.original.id}`)}
                            />
                        </div>
                    )}
                </Deferred>

                {/* Reject Modal */}
                <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-base font-semibold">Reject Expense</DialogTitle>
                            <DialogDescription className="text-xs">
                                Provide a reason for rejecting {rejectTarget?.expense_no}.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-3 py-2">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">Rejection Reason <span className="text-destructive">*</span></Label>
                                <textarea
                                    className="w-full min-h-[90px] rounded-md border border-input bg-background px-3 py-2 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                    placeholder="Explain why this expense is being rejected..."
                                    value={rejectComment}
                                    onChange={(e) => setRejectComment(e.target.value)}
                                    required
                                />
                            </div>
                            <DialogFooter className="pt-2">
                                <Button variant="outline" size="sm" onClick={() => setRejectModalOpen(false)}>Cancel</Button>
                                <Button variant="destructive" size="sm" disabled={rejectProcessing || !rejectComment.trim()} onClick={confirmReject}>
                                    <X className="h-4 w-4 mr-1.5" /> {rejectProcessing ? 'Rejecting...' : 'Confirm Reject'}
                                </Button>
                            </DialogFooter>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}

FinanceApprovalsIndex.layout = { breadcrumbs };