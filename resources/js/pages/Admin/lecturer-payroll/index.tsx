import { Deferred, Head, Link, router } from '@inertiajs/react';
import {
    CheckCircle2,
    Clock,
    DollarSign,
    Plus,
    Users,
    Wallet,
} from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';
import { MetricCardsSkeleton } from '@/components/tools/metric-cards-skeleton';
import { MetricCard } from '@/components/tools/MetricCard';
import { DataTable } from '@/components/tools/table/main-table';
import type { DataTableServerFilter } from '@/components/tools/table/types';
import { TableSkeleton } from '@/components/tools/table-skeleton';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type { PaginatedData } from '@/types/lecturer';
import {
    formatHours,
    formatMoney,
    type PayrollRow,
    type PayrollStats,
} from '@/types/lecturer-payroll';
import { PayConfirmDialog } from './components/pay-confirm-dialog';
import { getPayrollColumns } from './components/payroll-columns';

interface AdminLecturerPayrollIndexProps {
    stats?: PayrollStats;
    payroll?: PaginatedData<PayrollRow>;
    months: Array<{ label: string; value: string }>;
    default_rate: number;
    filters: {
        search: string;
        month: string;
        status: string;
        per_page: number;
    };
}

export default function AdminLecturerPayrollIndex({
    stats,
    payroll,
    months = [],
    default_rate,
    filters,
}: AdminLecturerPayrollIndexProps) {
    const [payTarget, setPayTarget] = useState<PayrollRow | null>(null);
    const [payProcessing, setPayProcessing] = useState(false);

    const monthLabel =
        months.find((m) => m.value === filters.month)?.label ?? filters.month;

    const handleFilterUpdate = (newFilters: Partial<typeof filters>) => {
        const query = { ...filters, ...newFilters };

        const cleanQuery: Record<string, any> = {};
        Object.entries(query).forEach(([key, val]) => {
            if (val !== undefined && val !== '' && val !== 'all') {
                cleanQuery[key] = val;
            }
        });

        router.get('/admin/lecturer-payroll', cleanQuery, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const confirmPay = () => {
        if (!payTarget) {
            return;
        }

        setPayProcessing(true);
        router.post(
            `/admin/lecturer-payroll/lecturers/${payTarget.lecturer_id}/paid`,
            { month: filters.month },
            {
                preserveScroll: true,
                onFinish: () => {
                    setPayProcessing(false);
                    setPayTarget(null);
                },
            },
        );
    };

    const undoPay = (row: PayrollRow) => {
        router.delete(
            `/admin/lecturer-payroll/lecturers/${row.lecturer_id}/paid`,
            {
                data: { month: filters.month },
                preserveScroll: true,
                onError: () => toast.error('Failed to undo payment.'),
            },
        );
    };

    const columns = getPayrollColumns({
        month: filters.month,
        onMarkPaid: setPayTarget,
        onUndoPaid: undoPay,
    });

    const serverFilters: DataTableServerFilter[] = [
        {
            key: 'month',
            title: 'Month',
            options: months,
            value: filters.month || undefined,
        },
        {
            key: 'status',
            title: 'Payment',
            options: [
                { label: 'Paid', value: 'paid' },
                { label: 'Partly Paid', value: 'partial' },
                { label: 'Not Paid', value: 'unpaid' },
            ],
            value: filters.status !== 'all' ? filters.status : undefined,
        },
    ];

    return (
        <>
            <Head title="Lecturer Payroll" />

            <div className="space-y-6 p-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-lg font-semibold tracking-tight text-foreground">
                            Lecturer Payroll — {monthLabel}
                        </h1>
                        <p className="text-xs text-muted-foreground">
                            Teaching hours per lecturer and course, paid at{' '}
                            {formatMoney(default_rate)} per hour.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button size="sm" asChild>
                            <Link href="/admin/lecturer-payroll/create">
                                <Plus className="mr-1.5 h-4 w-4" />
                                Add Teaching Hours
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Deferred Metric Cards */}
                <Deferred
                    data="stats"
                    fallback={<MetricCardsSkeleton count={5} />}
                >
                    {stats && (
                        <div className="grid animate-in grid-cols-1 gap-2 duration-700 fade-in slide-in-from-top-6 sm:grid-cols-2 md:gap-4 lg:grid-cols-5">
                            <MetricCard
                                title="Lecturers Teaching"
                                value={stats.lecturers}
                                description="With hours this month"
                                icon={Users}
                                variant="primary"
                            />
                            <MetricCard
                                title="Total Hours"
                                value={formatHours(stats.hours)}
                                description="Hours taught"
                                icon={Clock}
                                variant="info"
                            />
                            <MetricCard
                                title="Total Payroll"
                                value={formatMoney(stats.total)}
                                description="Hours × hourly rate"
                                icon={DollarSign}
                                variant="default"
                            />
                            <MetricCard
                                title="Already Paid"
                                value={formatMoney(stats.paid)}
                                description="Marked as paid"
                                icon={CheckCircle2}
                                variant="success"
                            />
                            <MetricCard
                                title="Still To Pay"
                                value={formatMoney(stats.outstanding)}
                                description="Waiting for payment"
                                icon={Wallet}
                                variant="warning"
                            />
                        </div>
                    )}
                </Deferred>

                {/* Deferred Data Table */}
                <Deferred
                    data="payroll"
                    fallback={
                        <TableSkeleton columns={6} rows={6} filterCount={2} />
                    }
                >
                    {payroll && (
                        <div className="animate-in duration-700 fade-in slide-in-from-bottom-6">
                            <DataTable
                                title="Payroll List"
                                searchTitle="Search lecturers..."
                                searchValue={filters.search}
                                onSearchChange={(search) =>
                                    handleFilterUpdate({
                                        search,
                                        page: 1,
                                    } as any)
                                }
                                columns={columns}
                                data={payroll.data}
                                pagination={{
                                    current_page: payroll.current_page,
                                    last_page: payroll.last_page,
                                    per_page: payroll.per_page,
                                    total: payroll.total,
                                }}
                                onPageChange={(page) =>
                                    handleFilterUpdate({ page } as any)
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
                                        page: 1,
                                    } as any);
                                }}
                                onServerFilterClear={() => {
                                    router.get(
                                        '/admin/lecturer-payroll',
                                        {},
                                        { preserveState: true },
                                    );
                                }}
                                onRowClick={(row) =>
                                    router.visit(
                                        `/admin/lecturer-payroll/lecturers/${row.original.lecturer_id}?month=${filters.month}`,
                                    )
                                }
                            />
                        </div>
                    )}
                </Deferred>

                <PayConfirmDialog
                    open={!!payTarget}
                    onOpenChange={(open) => !open && setPayTarget(null)}
                    description={
                        payTarget
                            ? `Confirm that ${payTarget.name} was paid ${formatMoney(payTarget.outstanding)} for ${monthLabel}.`
                            : ''
                    }
                    loading={payProcessing}
                    onConfirm={confirmPay}
                />
            </div>
        </>
    );
}

AdminLecturerPayrollIndex.layout = (page: React.ReactNode) => {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/admin/dashboard' },
        { title: 'Lecturer Payroll', href: '/admin/lecturer-payroll' },
    ];

    return <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>;
};
