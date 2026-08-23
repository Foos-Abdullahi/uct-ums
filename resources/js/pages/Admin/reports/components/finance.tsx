import React from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Deferred } from '@inertiajs/react';
import { MetricCard } from '@/components/tools/MetricCard';
import { MetricCardsSkeleton } from '@/components/tools/metric-cards-skeleton';
import { DataTable } from '@/components/tools/table/main-table';
import type { BreadcrumbItem } from '@/types';
import { DollarSign, CreditCard, Receipt, AlertCircle } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/admin/dashboard' },
    { title: 'Reports', href: '/admin/reports' },
    { title: 'Finance', href: '/admin/reports/finance' },
];

export default function FinanceReport({ stats, transactions }) {
    const columns = [
        { accessorKey: 'invoice_no', header: 'Invoice' },
        { accessorKey: 'student_name', header: 'Student' },
        { accessorKey: 'amount', header: 'Amount' },
        { accessorKey: 'paid', header: 'Paid' },
        { accessorKey: 'balance', header: 'Balance' },
        { accessorKey: 'status', header: 'Status' },
    ];

    return (
        <>
            <Head title="Finance Report" />
            <div className="p-6 space-y-6">
                <div>
                    <h1 className="text-lg font-semibold text-foreground tracking-tight">Finance Report</h1>
                    <p className="text-xs text-muted-foreground">Revenue, outstanding balances, and payment trends.</p>
                </div>

                <Deferred data="stats" fallback={<MetricCardsSkeleton />}>
                    {stats && (
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:gap-4 lg:grid-cols-4 animate-in fade-in slide-in-from-top-6 duration-1000 ease-in-out">
                            <MetricCard title="Total Revenue" value={`$${stats.total_revenue}`} icon={DollarSign} color="primary" />
                            <MetricCard title="Paid" value={`$${stats.paid}`} icon={CreditCard} color="success" />
                            <MetricCard title="Outstanding" value={`$${stats.outstanding}`} icon={AlertCircle} color="destructive" />
                            <MetricCard title="Overdue" value={`$${stats.overdue}`} icon={Receipt} color="warning" />
                        </div>
                    )}
                </Deferred>

                <Deferred data="transactions" fallback={<div>Loading...</div>}>
                    {transactions && (
                        <DataTable title="Transaction History" columns={columns} data={transactions.data} pagination={transactions.pagination} searchTitle={''} />
                    )}
                </Deferred>
            </div>
        </>
    );
}

FinanceReport.layout = (page: any) => <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>;