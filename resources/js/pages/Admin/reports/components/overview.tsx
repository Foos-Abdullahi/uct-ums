import { Head } from '@inertiajs/react';
import { Deferred } from '@inertiajs/react';
import {
    Users,
    GraduationCap,
    BookOpen,
    DollarSign,
    Calendar,
    BarChart3,
} from 'lucide-react';
import React from 'react';
import { MetricCardsSkeleton } from '@/components/tools/metric-cards-skeleton';
import { MetricCard } from '@/components/tools/MetricCard';
import { DataTable } from '@/components/tools/table/main-table';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface OverviewStats {
    total_students: number;
    total_lecturers: number;
    total_courses: number;
    total_revenue: number;
    total_assignments: number;
}

interface OverviewReportProps {
    stats?: OverviewStats;
    recentActivities?: Array<{ id: number; description: string; date: string }>;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/admin/dashboard' },
    { title: 'Reports', href: '/admin/reports' },
    { title: 'Overview', href: '/admin/reports/overview' },
];

export default function OverviewReport({
    stats,
    recentActivities,
}: OverviewReportProps) {
    const columns = [
        { accessorKey: 'description', header: 'Activity' },
        { accessorKey: 'date', header: 'Date' },
    ];

    return (
        <>
            <Head title="Overview Report" />

            <div className="space-y-6 p-6">
                {/* Header */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h1 className="text-lg font-semibold tracking-tight text-foreground">
                            Overview Report
                        </h1>
                        <p className="text-xs text-muted-foreground">
                            High‑level summary of all university metrics.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                            <Calendar className="mr-1.5 h-3.5 w-3.5" />
                            Date Range
                        </Button>
                        <Button variant="outline" size="sm">
                            Export
                        </Button>
                    </div>
                </div>

                {/* Summary Metrics */}
                <Deferred data="stats" fallback={<MetricCardsSkeleton />}>
                    {stats && (
                        <div className="grid animate-in grid-cols-1 gap-2 duration-1000 ease-in-out fade-in slide-in-from-top-6 sm:grid-cols-2 md:gap-4 lg:grid-cols-5">
                            <MetricCard
                                title="Students"
                                value={stats.total_students}
                                icon={Users}
                                color="primary"
                            />
                            <MetricCard
                                title="Lecturers"
                                value={stats.total_lecturers}
                                icon={GraduationCap}
                                color="info"
                            />
                            <MetricCard
                                title="Courses"
                                value={stats.total_courses}
                                icon={BookOpen}
                                color="success"
                            />
                            <MetricCard
                                title="Revenue"
                                value={`$${(stats.total_revenue ?? 0).toLocaleString()}`}
                                icon={DollarSign}
                                color="warning"
                            />
                            <MetricCard
                                title="Assignments"
                                value={stats.total_assignments}
                                icon={BarChart3}
                                color="info"
                            />
                        </div>
                    )}
                </Deferred>

                {/* Recent Activity Table */}
                <Deferred
                    data="recentActivities"
                    fallback={<div>Loading...</div>}
                >
                    {recentActivities && (
                        <div className="animate-in duration-700 ease-in-out fade-in slide-in-from-bottom-6">
                            <DataTable
                                title="Recent Activity"
                                columns={columns}
                                data={recentActivities}
                                pagination={{
                                    current_page: 1,
                                    last_page: 1,
                                    per_page: 10,
                                    total: recentActivities.length,
                                }}
                            />
                        </div>
                    )}
                </Deferred>
            </div>
        </>
    );
}

OverviewReport.layout = (page: any) => (
    <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>
);
