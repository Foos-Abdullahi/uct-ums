import React from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Deferred } from '@inertiajs/react';
import { MetricCard } from '@/components/tools/MetricCard';
import { MetricCardsSkeleton } from '@/components/tools/metric-cards-skeleton';
import { DataTable } from '@/components/tools/table/main-table';
import type { BreadcrumbItem } from '@/types';
import { GraduationCap, Award, Calendar, Users } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/admin/dashboard' },
    { title: 'Reports', href: '/admin/reports' },
    { title: 'Graduation', href: '/admin/reports/graduation' },
];

export default function GraduationReport({ stats, graduates }) {
    const columns = [
        { accessorKey: 'name', header: 'Name' },
        { accessorKey: 'matric_no', header: 'Matric No' },
        { accessorKey: 'program', header: 'Program' },
        { accessorKey: 'graduation_date', header: 'Graduation Date' },
        { accessorKey: 'certificate_no', header: 'Certificate No' },
    ];

    return (
        <>
            <Head title="Graduation Report" />
            <div className="p-6 space-y-6">
                <div>
                    <h1 className="text-lg font-semibold text-foreground tracking-tight">Graduation Report</h1>
                    <p className="text-xs text-muted-foreground">Graduation statistics, certificates issued, and alumni tracking.</p>
                </div>

                <Deferred data="stats" fallback={<MetricCardsSkeleton />}>
                    {stats && (
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:gap-4 lg:grid-cols-4 animate-in fade-in slide-in-from-top-6 duration-1000 ease-in-out">
                            <MetricCard title="Total Graduated" value={stats.total} icon={GraduationCap} color="primary" />
                            <MetricCard title="This Year" value={stats.this_year} icon={Calendar} color="success" />
                            <MetricCard title="Certificates Issued" value={stats.certificates} icon={Award} color="info" />
                            <MetricCard title="Alumni" value={stats.alumni} icon={Users} color="primary" />
                        </div>
                    )}
                </Deferred>

                <Deferred data="graduates" fallback={<div>Loading...</div>}>
                    {graduates && (
                        <DataTable title="Graduates List" columns={columns} data={graduates.data} pagination={graduates.pagination} />
                    )}
                </Deferred>
            </div>
        </>
    );
}

GraduationReport.layout = (page: any) => <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>;