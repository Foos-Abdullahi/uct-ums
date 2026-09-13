import { Head } from '@inertiajs/react';
import { Deferred } from '@inertiajs/react';
import { GraduationCap, Award, Calendar, Users } from 'lucide-react';
import React from 'react';
import { MetricCardsSkeleton } from '@/components/tools/metric-cards-skeleton';
import { MetricCard } from '@/components/tools/MetricCard';
import { DataTable } from '@/components/tools/table/main-table';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

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
            <div className="space-y-6 p-6">
                <div>
                    <h1 className="text-lg font-semibold tracking-tight text-foreground">
                        Graduation Report
                    </h1>
                    <p className="text-xs text-muted-foreground">
                        Graduation statistics, certificates issued, and alumni
                        tracking.
                    </p>
                </div>

                <Deferred data="stats" fallback={<MetricCardsSkeleton />}>
                    {stats && (
                        <div className="grid animate-in grid-cols-1 gap-2 duration-1000 ease-in-out fade-in slide-in-from-top-6 sm:grid-cols-2 md:gap-4 lg:grid-cols-4">
                            <MetricCard
                                title="Total Graduated"
                                value={stats.total}
                                icon={GraduationCap}
                                color="primary"
                            />
                            <MetricCard
                                title="This Year"
                                value={stats.this_year}
                                icon={Calendar}
                                color="success"
                            />
                            <MetricCard
                                title="Certificates Issued"
                                value={stats.certificates}
                                icon={Award}
                                color="info"
                            />
                            <MetricCard
                                title="Alumni"
                                value={stats.alumni}
                                icon={Users}
                                color="primary"
                            />
                        </div>
                    )}
                </Deferred>

                <Deferred data="graduates" fallback={<div>Loading...</div>}>
                    {graduates && (
                        <DataTable
                            title="Graduates List"
                            columns={columns}
                            data={graduates.data}
                            pagination={graduates.pagination}
                        />
                    )}
                </Deferred>
            </div>
        </>
    );
}

GraduationReport.layout = (page: any) => (
    <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>
);
