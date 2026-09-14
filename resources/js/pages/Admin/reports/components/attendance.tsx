import { Head } from '@inertiajs/react';
import { Deferred } from '@inertiajs/react';
import { Calendar, CheckCircle2, Clock, XCircle } from 'lucide-react';
import React from 'react';
import { MetricCardsSkeleton } from '@/components/tools/metric-cards-skeleton';
import { MetricCard } from '@/components/tools/MetricCard';
import { DataTable } from '@/components/tools/table/main-table';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/admin/dashboard' },
    { title: 'Reports', href: '/admin/reports' },
    { title: 'Attendance', href: '/admin/reports/attendance' },
];

interface AttendanceStats {
    total_classes: number;
    present: number;
    absent: number;
    rate: number;
}

interface AttendanceReportProps {
    stats?: AttendanceStats;
    attendanceRecords?: {
        data: Array<{
            student_name: string;
            course_name: string;
            total_classes: number;
            present: number;
            absent: number;
            attendance_rate: number;
        }>;
        pagination: {
            current_page: number;
            last_page: number;
            per_page: number;
            total: number;
        };
    };
}

export default function AttendanceReport({
    stats,
    attendanceRecords,
}: AttendanceReportProps) {
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
            <div className="space-y-6 p-6">
                <div>
                    <h1 className="text-lg font-semibold tracking-tight text-foreground">
                        Attendance Report
                    </h1>
                    <p className="text-xs text-muted-foreground">
                        Overall attendance rates by course and student.
                    </p>
                </div>

                <Deferred data="stats" fallback={<MetricCardsSkeleton />}>
                    {stats && (
                        <div className="grid animate-in grid-cols-1 gap-2 duration-1000 ease-in-out fade-in slide-in-from-top-6 sm:grid-cols-2 md:gap-4 lg:grid-cols-4">
                            <MetricCard
                                title="Total Classes"
                                value={stats.total_classes}
                                icon={Calendar}
                                color="primary"
                            />
                            <MetricCard
                                title="Present"
                                value={stats.present}
                                icon={CheckCircle2}
                                color="success"
                            />
                            <MetricCard
                                title="Absent"
                                value={stats.absent}
                                icon={XCircle}
                                color="destructive"
                            />
                            <MetricCard
                                title="Overall Rate"
                                value={`${stats.rate}%`}
                                icon={Clock}
                                color="info"
                            />
                        </div>
                    )}
                </Deferred>

                <Deferred
                    data="attendanceRecords"
                    fallback={<div>Loading...</div>}
                >
                    {attendanceRecords && (
                        <DataTable
                            title="Attendance Records"
                            searchTitle="Search by student name or course..."
                            columns={columns}
                            data={attendanceRecords.data}
                            pagination={attendanceRecords.pagination}
                        />
                    )}
                </Deferred>
            </div>
        </>
    );
}

AttendanceReport.layout = (page: any) => (
    <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>
);
