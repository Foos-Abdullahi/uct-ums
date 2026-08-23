import React from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Deferred } from '@inertiajs/react';
import { MetricCard } from '@/components/tools/MetricCard';
import { MetricCardsSkeleton } from '@/components/tools/metric-cards-skeleton';
import { DataTable } from '@/components/tools/table/main-table';
import type { BreadcrumbItem } from '@/types';
import { BookOpen, Award, BarChart3, CheckCircle2, XCircle } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/admin/dashboard' },
    { title: 'Reports', href: '/admin/reports' },
    { title: 'Academic', href: '/admin/reports/academic' },
];

export default function AcademicReport({ stats, coursePerformance }) {
    const columns = [
        { accessorKey: 'course_code', header: 'Code' },
        { accessorKey: 'course_name', header: 'Course' },
        { accessorKey: 'enrolled', header: 'Enrolled' },
        { accessorKey: 'avg_grade', header: 'Avg Grade' },
        { accessorKey: 'pass_rate', header: 'Pass Rate' },
    ];

    return (
        <>
            <Head title="Academic Report" />
            <div className="p-6 space-y-6">
                <div>
                    <h1 className="text-lg font-semibold text-foreground tracking-tight">Academic Report</h1>
                    <p className="text-xs text-muted-foreground">Course performance, GPA trends, and grade distribution.</p>
                </div>

                <Deferred data="stats" fallback={<MetricCardsSkeleton />}>
                    {stats && (
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:gap-4 lg:grid-cols-4 animate-in fade-in slide-in-from-top-6 duration-1000 ease-in-out">
                            <MetricCard title="Total Courses" value={stats.total_courses} icon={BookOpen} color="primary" />
                            <MetricCard title="Avg GPA" value={stats.avg_gpa} icon={Award} color="info" />
                            <MetricCard title="Pass Rate" value={`${stats.pass_rate}%`} icon={CheckCircle2} color="success" />
                            <MetricCard title="Fail Rate" value={`${stats.fail_rate}%`} icon={XCircle} color="destructive" />
                        </div>
                    )}
                </Deferred>

                <Deferred data="coursePerformance" fallback={<div>Loading...</div>}>
                    {coursePerformance && (
                        <DataTable title="Course Performance" columns={columns} data={coursePerformance.data} pagination={coursePerformance.pagination} />
                    )}
                </Deferred>
            </div>
        </>
    );
}

AcademicReport.layout = (page: any) => <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>;