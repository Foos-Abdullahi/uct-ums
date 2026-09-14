import { Deferred, Head, Link, router } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import {
    FileText,
    DollarSign,
    CheckCircle2,
    AlertCircle,
    Eye,
    Receipt,
} from 'lucide-react';
import React from 'react';
import { MetricCardsSkeleton } from '@/components/tools/metric-cards-skeleton';
import { MetricCard } from '@/components/tools/MetricCard';
import { DataTable } from '@/components/tools/table/main-table';
import type { DataTableServerFilter } from '@/components/tools/table/types';
import { TableSkeleton } from '@/components/tools/table-skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { BreadcrumbItem } from '@/types';

interface InvoiceItem {
    id: number;
    invoice_no: string;
    title: string;
    type: string;
    amount: number;
    paid_amount: number;
    due_date: string | null;
    status: string;
    items_count?: number;
    student?: {
        matric_no: string;
        user?: { name: string };
        program?: { name: string };
    };
}

interface InvoiceStats {
    total_billed: number;
    total_paid: number;
    total_balance: number;
    total_invoices: number;
    overdue_count: number;
}

interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface Props {
    stats?: InvoiceStats;
    invoices?: PaginatedData<InvoiceItem>;
    filters: { search: string; status: string; type: string; per_page: number };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/finance/dashboard' },
    { title: 'Invoices', href: '/finance/invoices' },
];

export default function FinanceInvoicesIndex({
    stats,
    invoices,
    filters,
}: Props) {
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
        router.get('/finance/invoices', cleanQuery, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const columns: ColumnDef<InvoiceItem>[] = [
        {
            accessorKey: 'invoice_no',
            header: 'Invoice No',
            cell: ({ row }) => (
                <Badge
                    variant="outline"
                    className="font-mono text-xs font-semibold"
                >
                    {row.original.invoice_no}
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
            accessorKey: 'title',
            header: 'Fee Description',
            cell: ({ row }) => (
                <div className="max-w-[220px]">
                    <p className="truncate text-xs font-medium text-foreground">
                        {row.original.title}
                    </p>
                    <Badge
                        variant="secondary"
                        className="mt-0.5 text-[10px] capitalize"
                    >
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
                const balance = Math.max(
                    0,
                    row.original.amount - row.original.paid_amount,
                );

                return (
                    <span
                        className={`text-xs font-bold ${balance > 0 ? 'text-destructive' : 'text-muted-foreground'}`}
                    >
                        {balance > 0 ? formatCurrency(balance) : '$0.00'}
                    </span>
                );
            },
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => {
                const s = row.original.status;

                if (s === 'paid') {
                    return (
                        <Badge className="border-emerald-200 bg-emerald-500/10 text-emerald-700">
                            Paid
                        </Badge>
                    );
                }

                if (s === 'partial') {
                    return (
                        <Badge className="border-amber-200 bg-amber-500/10 text-amber-700">
                            Partial
                        </Badge>
                    );
                }

                return <Badge variant="destructive">Unpaid</Badge>;
            },
        },
        {
            accessorKey: 'items_count',
            header: 'Items',
            cell: ({ row }) => (
                <Badge variant="outline" className="font-mono text-[10px]">
                    <Receipt className="mr-1 h-3 w-3" />{' '}
                    {row.original.items_count ?? '—'}
                </Badge>
            ),
        },
        {
            id: 'actions',
            header: () => <span className="sr-only">Actions</span>,
            cell: ({ row }) => (
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    asChild
                >
                    <Link href={`/finance/invoices/${row.original.id}`}>
                        <Eye className="mr-1 h-3.5 w-3.5" /> View
                    </Link>
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
            <Head title="Student Invoices" />
            <div className="space-y-6 p-6">
                <div>
                    <h1 className="text-lg font-semibold tracking-tight text-foreground">
                        Student Invoices & Billing
                    </h1>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                        Review tuition assessments, lab fees, graduation
                        invoices, and outstanding balances.
                    </p>
                </div>

                <Deferred data="stats" fallback={<MetricCardsSkeleton />}>
                    {stats && (
                        <div className="grid animate-in grid-cols-1 gap-2 duration-1000 ease-in-out fade-in slide-in-from-top-6 sm:grid-cols-2 md:gap-4 lg:grid-cols-5">
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

                <Deferred data="invoices" fallback={<TableSkeleton />}>
                    {invoices && (
                        <div className="rounded-md border border-border/60 bg-card p-4">
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
                                        '/finance/invoices',
                                        {},
                                        { preserveState: true },
                                    )
                                }
                                onRowClick={(row) =>
                                    router.visit(
                                        `/finance/invoices/${row.original.id}`,
                                    )
                                }
                            />
                        </div>
                    )}
                </Deferred>
            </div>
        </>
    );
}

FinanceInvoicesIndex.layout = { breadcrumbs };
