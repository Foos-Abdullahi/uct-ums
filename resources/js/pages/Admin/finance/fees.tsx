import React from 'react';
import { Deferred, Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MetricCard } from '@/components/tools/MetricCard';
import { MetricCardsSkeleton } from '@/components/tools/metric-cards-skeleton';
import { DataTable } from '@/components/tools/table/main-table';
import { TableSkeleton } from '@/components/tools/table-skeleton';
import { UctPanelCard } from '@/components/tools/uct-panel-card';
import type { BreadcrumbItem } from '@/types';
import type { DataTableServerFilter } from '@/components/tools/table/types';
import type { ColumnDef } from '@tanstack/react-table';
import {
    Receipt,
    CheckCircle2,
    Clock,
    AlertCircle,
    DollarSign,
    Users,
    Layers,
    BookOpen,
    Eye,
    Plus,
} from 'lucide-react';

export interface StudentFeeRecord {
    id: number;
    matric_no: string;
    fee_status: string;
    total_billed?: number;
    total_paid?: number;
    user?: {
        name: string;
        email: string;
    };
    program?: {
        id: number;
        name: string;
        code: string | null;
        degree_level: string;
    };
}

export interface FeeStats {
    total_students: number;
    fully_paid_students: number;
    partial_students: number;
    unpaid_students: number;
    total_receivables: number;
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

interface AdminFinanceFeesProps {
    stats?: FeeStats;
    students?: PaginatedData<StudentFeeRecord>;
    programs: Array<{ id: number; name: string; code: string | null; degree_level: string }>;
    filters: {
        search: string;
        program_id: string;
        fee_status: string;
        per_page: number;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/admin/dashboard' },
    { title: 'Finance', href: '/admin/finance' },
    { title: 'Fee Schedules', href: '/admin/finance/fees' },
];

export default function AdminFinanceFees({
    stats,
    students,
    programs = [],
    filters,
}: AdminFinanceFeesProps) {
    const formatCurrency = (val: number) => `$${Number(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

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

        router.get('/admin/finance/fees', cleanQuery, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const columns: ColumnDef<StudentFeeRecord>[] = [
        {
            accessorKey: 'matric_no',
            header: 'Matric No',
            cell: ({ row }) => (
                <Badge variant="outline" className="font-mono text-xs font-semibold uppercase">
                    {row.original.matric_no}
                </Badge>
            ),
        },
        {
            accessorKey: 'user.name',
            header: 'Student Name',
            cell: ({ row }) => (
                <div className="max-w-[220px]">
                    <p className="font-medium text-foreground truncate text-sm">{row.original.user?.name || 'N/A'}</p>
                    <p className="text-xs text-muted-foreground truncate">{row.original.user?.email || '—'}</p>
                </div>
            ),
        },
        {
            accessorKey: 'program.name',
            header: 'Program & Level',
            cell: ({ row }) => (
                <div className="max-w-[200px]">
                    <span className="text-xs font-medium text-foreground truncate block">
                        {row.original.program?.name || 'Unassigned'}
                    </span>
                    <Badge variant="secondary" className="text-[10px] uppercase capitalize mt-0.5">
                        {row.original.program?.degree_level || 'Undergraduate'}
                    </Badge>
                </div>
            ),
        },
        {
            accessorKey: 'total_billed',
            header: 'Total Billed',
            cell: ({ row }) => (
                <span className="text-xs font-semibold text-foreground">
                    {formatCurrency(row.original.total_billed ?? 0)}
                </span>
            ),
        },
        {
            accessorKey: 'total_paid',
            header: 'Total Paid',
            cell: ({ row }) => (
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(row.original.total_paid ?? 0)}
                </span>
            ),
        },
        {
            id: 'balance',
            header: 'Outstanding Due',
            cell: ({ row }) => {
                const billed = Number(row.original.total_billed ?? 0);
                const paid = Number(row.original.total_paid ?? 0);
                const balance = Math.max(0, billed - paid);

                return (
                    <span className={`text-xs font-bold ${balance > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                        {balance > 0 ? formatCurrency(balance) : '$0.00'}
                    </span>
                );
            },
        },
        {
            accessorKey: 'fee_status',
            header: 'Status',
            cell: ({ row }) => {
                const status = String(row.original.fee_status);
                if (status === 'paid') {
                    return (
                        <Badge className="bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 border-emerald-200">
                            Fully Paid
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
                <div className="flex items-center justify-end">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        asChild
                    >
                        <Link href={`/admin/students/${row.original.id}?tab=finance`}>
                            <Eye className="h-3.5 w-3.5 mr-1" />
                            Account
                        </Link>
                    </Button>
                </div>
            ),
        },
    ];

    const serverFilters: DataTableServerFilter[] = [
        {
            key: 'fee_status',
            title: 'Fee Status',
            options: [
                { label: 'All Statuses', value: 'all' },
                { label: 'Fully Paid', value: 'paid' },
                { label: 'Partial', value: 'partial' },
                { label: 'Unpaid', value: 'unpaid' },
            ],
            value: filters.fee_status || undefined,
        },
        {
            key: 'program_id',
            title: 'Program',
            options: [
                { label: 'All Programs', value: 'all' },
                ...programs.map((p) => ({
                    label: p.name,
                    value: String(p.id),
                })),
            ],
            value: filters.program_id || undefined,
        },
    ];

    return (
        <>
            <Head title="Tuition & Fee Schedules" />

            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h1 className="text-lg font-semibold text-foreground tracking-tight">
                            Tuition & Fee Schedules
                        </h1>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Tuition fee matrix by degree level, student ledger balance reconciliation, and debtor audit.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/admin/finance/invoices">
                                <Receipt className="h-4 w-4 mr-1.5" />
                                Invoices
                            </Link>
                        </Button>
                        <Button size="sm" asChild>
                            <Link href="/admin/finance/payments">
                                <DollarSign className="h-4 w-4 mr-1.5" />
                                Record Payment
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Metric Cards */}
                <Deferred data="stats" fallback={<MetricCardsSkeleton />}>
                    {stats && (
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:gap-4 lg:grid-cols-5 animate-in fade-in slide-in-from-top-6 duration-1000 ease-in-out">
                            <MetricCard
                                title="Total Receivables"
                                value={formatCurrency(stats.total_receivables)}
                                icon={DollarSign}
                                color="destructive"
                            />
                            <MetricCard
                                title="Fully Paid"
                                value={`${stats.fully_paid_students} students`}
                                icon={CheckCircle2}
                                color="success"
                            />
                            <MetricCard
                                title="Partial Paid"
                                value={`${stats.partial_students} students`}
                                icon={Clock}
                                color="warning"
                            />
                            <MetricCard
                                title="Unpaid Students"
                                value={`${stats.unpaid_students} students`}
                                icon={AlertCircle}
                                color="destructive"
                            />
                            <MetricCard
                                title="Total Enrolled"
                                value={`${stats.total_students} students`}
                                icon={Users}
                                color="primary"
                            />
                        </div>
                    )}
                </Deferred>

                {/* Fee Structure Reference Matrix */}
                <UctPanelCard
                    title="Institutional Tuition Schedule (Standard Academic Year 2026/2027)"
                    description="Approved standard fee schedule by faculty degree program."
                    icon={Receipt}
                >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                        <div className="p-3.5 rounded border border-border/60 bg-muted/20 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="font-semibold text-xs text-foreground">Undergraduate Tuition</span>
                                <Badge variant="outline" className="text-[10px]">Bachelor</Badge>
                            </div>
                            <p className="text-xl font-bold text-foreground">$450.00 <span className="text-xs font-normal text-muted-foreground">/ semester</span></p>
                            <p className="text-[11px] text-muted-foreground">Includes course registration, lab access, campus library, and examination fees.</p>
                        </div>

                        <div className="p-3.5 rounded border border-border/60 bg-muted/20 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="font-semibold text-xs text-foreground">Postgraduate Tuition</span>
                                <Badge variant="outline" className="text-[10px]">Master / Ph.D.</Badge>
                            </div>
                            <p className="text-xl font-bold text-foreground">$750.00 <span className="text-xs font-normal text-muted-foreground">/ semester</span></p>
                            <p className="text-[11px] text-muted-foreground">Includes advanced thesis supervision, journal repository, and laboratory facilities.</p>
                        </div>

                        <div className="p-3.5 rounded border border-border/60 bg-muted/20 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="font-semibold text-xs text-foreground">One-Time Institutional Fees</span>
                                <Badge variant="outline" className="text-[10px]">Ancillary</Badge>
                            </div>
                            <div className="text-xs space-y-1 text-muted-foreground pt-1">
                                <div className="flex justify-between"><span>Admission & Matriculation:</span> <span className="font-semibold text-foreground">$50.00</span></div>
                                <div className="flex justify-between"><span>Graduation & Transcript:</span> <span className="font-semibold text-foreground">$100.00</span></div>
                            </div>
                        </div>
                    </div>
                </UctPanelCard>

                {/* Student Fee Ledger Data Table */}
                <Deferred data="students" fallback={<TableSkeleton />}>
                    {students && (
                        <div className="border border-border/60 rounded-md bg-card p-4">
                            <DataTable
                                title="Student Fee Accounts Roster"
                                searchTitle="Search by matric no, student name, email..."
                                columns={columns}
                                data={students.data}
                                pagination={{
                                    current_page: students.current_page,
                                    last_page: students.last_page,
                                    per_page: students.per_page,
                                    total: students.total,
                                }}
                                onPageChange={(page) => handleFilterUpdate({ ...filters, page } as any)}
                                onPageSizeChange={(per_page) => handleFilterUpdate({ per_page, page: 1 } as any)}
                                serverFilters={serverFilters}
                                onServerFilterChange={(key, values) => {
                                    handleFilterUpdate({ [key]: values?.[0] ?? 'all' });
                                }}
                                onServerFilterClear={() => {
                                    router.get('/admin/finance/fees', {}, { preserveState: true });
                                }}
                                onRowClick={(row) => router.visit(`/admin/students/${row.original.id}?tab=finance`)}
                            />
                        </div>
                    )}
                </Deferred>
            </div>
        </>
    );
}

AdminFinanceFees.layout = { breadcrumbs };
