import React from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Deferred } from '@inertiajs/react';
import { MetricCard } from '@/components/tools/MetricCard';
import { MetricCardsSkeleton } from '@/components/tools/metric-cards-skeleton';
import { DataTable } from '@/components/tools/table/main-table';
import type { BreadcrumbItem } from '@/types';
import { Users, Calendar, CheckCircle2, Clock, XCircle } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/admin/dashboard' },
    { title: 'Reports', href: '/admin/reports' },
    { title: 'Attendance', href: '/admin/reports/attendance' },
];

export default function AttendanceReport({ stats, attendanceRecords }) {
    const columns = [
        { accessorKey: 'student_name', header: 'Student' },
        { accessorKey: 'course_name', header: 'Course' },
        { accessorKey: 'total_classes', header: 'Total' },
        { accessorKey: 'present', header: 'Present' },
        { accessorKey: 'absent', header: 'Absent' },
        { accessorKey: 'attendance_rate', header: 'Rate' },
    ];

    return (
        <>
            <Head title="Attendance Report" />
            <div className="p-6 space-y-6">
                <div>
                    <h1 className="text-lg font-semibold text-foreground tracking-tight">Attendance Report</h1>
                    <p className="text-xs text-muted-foreground">Overall attendance rates by course and student.</p>
                </div>

                <Deferred data="stats" fallback={<MetricCardsSkeleton />}>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:gap-4 lg:grid-cols-4 animate-in fade-in slide-in-from-top-6 duration-1000 ease-in-out">
                        <MetricCard title="Total Classes" value={stats.total_classes} icon={Calendar} color="primary" />
                        <MetricCard title="Present" value={stats.present} icon={CheckCircle2} color="success" />
                        <MetricCard title="Absent" value={stats.absent} icon={XCircle} color="destructive" />
                        <MetricCard title="Overall Rate" value={`${stats.rate}%`} icon={Clock} color="info" />
                    </div>
                </Deferred>

                <Deferred data="attendanceRecords" fallback={<div>Loading...</div>}>
                    <DataTable title="Attendance Records" columns={columns} data={attendanceRecords.data} pagination={attendanceRecords.pagination} />
                </Deferred>
            </div>
        </>
    );
}

AttendanceReport.layout = (page: any) => <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>;