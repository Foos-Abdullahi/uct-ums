import { Deferred, Head, router } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import {
    CreditCard,
    DollarSign,
    CheckCircle2,
    Clock,
    Check,
    X,
} from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';
import { MetricCardsSkeleton } from '@/components/tools/metric-cards-skeleton';
import { MetricCard } from '@/components/tools/MetricCard';
import { DataTable } from '@/components/tools/table/main-table';
import type { DataTableServerFilter } from '@/components/tools/table/types';
import { TableSkeleton } from '@/components/tools/table-skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import type { BreadcrumbItem } from '@/types';

interface PaymentItem {
    id: number;
    student_id: number;
    transaction_no: string;
    amount: number;
    payment_method: string;
    payment_date: string;
    status: string;
    notes: string | null;
    student?: {
        matric_no: string;
        user?: { name: string; email: string };
        program?: { name: string };
    };
    invoice?: { invoice_no: string; title: string };
}

interface PaymentStats {
    total_collected: number;
    pending_verification: number;
    total_transactions: number;
    today_collected: number;
}

interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface Props {
    stats?: PaymentStats;
    payments?: PaginatedData<PaymentItem>;
    filters: {
        search: string;
        status: string;
        payment_method: string;
        per_page: number;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/finance/dashboard' },
    { title: 'Payments', href: '/finance/payments' },
];

const PAYMENT_METHODS: Record<string, string> = {
    bank_transfer: 'Bank Transfer',
    cash: 'Cash',
    evc_plus: 'EVC Plus',
    zaad: 'Zaad',
    sahay: 'Sahay',
    credit_card: 'Credit Card',
};

export default function FinancePaymentsIndex({
    stats,
    payments,
    filters,
}: Props) {
    const [updateTarget, setUpdateTarget] = useState<PaymentItem | null>(null);
    const [updateModalOpen, setUpdateModalOpen] = useState(false);
    const [updateProcessing, setUpdateProcessing] = useState(false);
    const [newStatus, setNewStatus] = useState('paid');

    const formatCurrency = (val: number) =>
        `$${Number(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const handleFilterUpdate = (newFilters: Partial<typeof filters>) => {
        const query = { ...filters, ...newFilters };
        const cleanQuery: Record<string, any> = {};
        Object.entries(query).forEach(([key, val]) => {
            if (val !== undefined && val !== '' && val !== 'all') {
                cleanQuery[key] = val;
            }
        });
        router.get('/finance/payments', cleanQuery, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleUpdateStatus = () => {
        if (!updateTarget) {
            return;
        }

        setUpdateProcessing(true);
        router.patch(
            `/finance/payments/${updateTarget.id}/status`,
            { status: newStatus },
            {
                onSuccess: () => {
                    toast.success(
                        `Payment ${updateTarget.transaction_no} updated.`,
                    );
                    setUpdateModalOpen(false);
                    setUpdateTarget(null);
                    setUpdateProcessing(false);
                },
                onError: () => {
                    toast.error('Failed to update payment.');
                    setUpdateProcessing(false);
                },
            },
        );
    };

    const columns: ColumnDef<PaymentItem>[] = [
        {
            accessorKey: 'transaction_no',
            header: 'Transaction No',
            cell: ({ row }) => (
                <Badge
                    variant="outline"
                    className="font-mono text-xs font-semibold"
                >
                    {row.original.transaction_no}
                </Badge>
            ),
        },
        {
            accessorKey: 'student.user.name',
            header: 'Student',
            cell: ({ row }) => (
                <div className="max-w-[200px]">
                    <p className="truncate text-sm font-medium text-foreground">
                        {row.original.student?.user?.name || 'N/A'}
                    </p>
                    <p className="font-mono text-xs text-muted-foreground">
                        {row.original.student?.matric_no}
                    </p>
                </div>
            ),
        },
        {
            accessorKey: 'invoice',
            header: 'Invoice',
            cell: ({ row }) =>
                row.original.invoice ? (
                    <div>
                        <p className="text-xs font-medium text-foreground">
                            {row.original.invoice.invoice_no}
                        </p>
                        <p className="max-w-[120px] truncate text-[10px] text-muted-foreground">
                            {row.original.invoice.title}
                        </p>
                    </div>
                ) : (
                    <span className="text-xs text-muted-foreground">N/A</span>
                ),
        },
        {
            accessorKey: 'amount',
            header: 'Amount',
            cell: ({ row }) => (
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(row.original.amount)}
                </span>
            ),
        },
        {
            accessorKey: 'payment_method',
            header: 'Method',
            cell: ({ row }) => (
                <span className="text-xs text-muted-foreground capitalize">
                    {PAYMENT_METHODS[row.original.payment_method] ??
                        row.original.payment_method}
                </span>
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
                const s = row.original.status;

                if (s === 'paid') {
                    return (
                        <Badge className="border-emerald-200 bg-emerald-500/10 text-emerald-700">
                            <Check className="mr-1 h-3 w-3" /> Paid
                        </Badge>
                    );
                }

                if (s === 'pending') {
                    return (
                        <Badge className="border-amber-200 bg-amber-500/10 text-amber-700">
                            <Clock className="mr-1 h-3 w-3" /> Pending
                        </Badge>
                    );
                }

                return (
                    <Badge variant="destructive">
                        <X className="mr-1 h-3 w-3" /> Rejected
                    </Badge>
                );
            },
        },
        {
            id: 'actions',
            header: () => <span className="sr-only">Actions</span>,
            cell: ({ row }) => (
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={(e) => {
                        e.stopPropagation();
                        setUpdateTarget(row.original);
                        setNewStatus(row.original.status);
                        setUpdateModalOpen(true);
                    }}
                >
                    Update
                </Button>
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
                { label: 'Pending', value: 'pending' },
                { label: 'Rejected', value: 'rejected' },
            ],
            value: filters.status || undefined,
        },
        {
            key: 'payment_method',
            title: 'Method',
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
            <Head title="Student Payments" />
            <div className="space-y-6 p-6">
                <div>
                    <h1 className="text-lg font-semibold tracking-tight text-foreground">
                        Student Payments
                    </h1>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                        Verify, approve, or reject student payment transactions.
                    </p>
                </div>

                <Deferred data="stats" fallback={<MetricCardsSkeleton />}>
                    {stats && (
                        <div className="grid animate-in grid-cols-1 gap-2 duration-1000 ease-in-out fade-in slide-in-from-top-6 sm:grid-cols-2 md:gap-4 lg:grid-cols-4">
                            <MetricCard
                                title="Total Collected"
                                value={formatCurrency(stats.total_collected)}
                                icon={CheckCircle2}
                                color="success"
                            />
                            <MetricCard
                                title="Pending Verification"
                                value={`${stats.pending_verification} txns`}
                                icon={Clock}
                                color="warning"
                            />
                            <MetricCard
                                title="Total Transactions"
                                value={`${stats.total_transactions} txns`}
                                icon={CreditCard}
                                color="primary"
                            />
                            <MetricCard
                                title="Today Collected"
                                value={formatCurrency(stats.today_collected)}
                                icon={DollarSign}
                                color="success"
                            />
                        </div>
                    )}
                </Deferred>

                <Deferred data="payments" fallback={<TableSkeleton />}>
                    {payments && (
                        <div className="rounded-md border border-border/60 bg-card p-4">
                            <DataTable
                                title="Payment Roster"
                                searchTitle="Search by transaction no, student name, matric no..."
                                columns={columns}
                                data={payments.data}
                                pagination={{
                                    current_page: payments.current_page,
                                    last_page: payments.last_page,
                                    per_page: payments.per_page,
                                    total: payments.total,
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
                                onServerFilterChange={(key, values) =>
                                    handleFilterUpdate({
                                        [key]: values?.[0] ?? 'all',
                                    })
                                }
                                onServerFilterClear={() =>
                                    router.get(
                                        '/finance/payments',
                                        {},
                                        { preserveState: true },
                                    )
                                }
                            />
                        </div>
                    )}
                </Deferred>

                {/* Update Status Modal */}
                <Dialog
                    open={updateModalOpen}
                    onOpenChange={setUpdateModalOpen}
                >
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-base font-semibold">
                                Update Payment Status
                            </DialogTitle>
                            <DialogDescription className="text-xs">
                                Update status for payment{' '}
                                {updateTarget?.transaction_no}.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-3 py-2">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">
                                    New Status
                                </Label>
                                <select
                                    className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:ring-1 focus:ring-ring focus:outline-none"
                                    value={newStatus}
                                    onChange={(e) =>
                                        setNewStatus(e.target.value)
                                    }
                                >
                                    <option value="paid">Paid</option>
                                    <option value="pending">Pending</option>
                                    <option value="rejected">Rejected</option>
                                </select>
                            </div>
                            <DialogFooter className="pt-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setUpdateModalOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    size="sm"
                                    disabled={updateProcessing}
                                    onClick={handleUpdateStatus}
                                >
                                    {updateProcessing
                                        ? 'Saving...'
                                        : 'Save Status'}
                                </Button>
                            </DialogFooter>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}

FinancePaymentsIndex.layout = { breadcrumbs };
