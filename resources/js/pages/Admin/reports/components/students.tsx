import { Head } from '@inertiajs/react';
import { Deferred } from '@inertiajs/react';
import { Users, UserCheck, UserX, Clock, GraduationCap } from 'lucide-react';
import React from 'react';
import { MetricCardsSkeleton } from '@/components/tools/metric-cards-skeleton';
import { MetricCard } from '@/components/tools/MetricCard';
import { DataTable } from '@/components/tools/table/main-table';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

// ... similar to overview, with student-specific stats and columns
// I'll provide a concise version; you can expand as needed.

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/admin/dashboard' },
    { title: 'Reports', href: '/admin/reports' },
    { title: 'Students', href: '/admin/reports/students' },
];

interface StudentsStats {
    total: number;
    active: number;
    pending: number;
    suspended: number;
    graduated: number;
}

interface StudentsReportProps {
    stats?: StudentsStats;
    students?: {
        data: Array<{
            name: string;
            matric_no: string;
            program: string;
            enrollment_status: string;
        }>;
        pagination: {
            current_page: number;
            last_page: number;
            per_page: number;
            total: number;
        };
    };
}

export default function StudentsReport({
    stats,
    students,
}: StudentsReportProps) {
    // Define student columns
    const columns = [
        { accessorKey: 'name', header: 'Name' },
        { accessorKey: 'matric_no', header: 'Matric No' },
        { accessorKey: 'program', header: 'Program' },
        { accessorKey: 'enrollment_status', header: 'Status' },
        // ...
    ];

    return (
        <>
            <Head title="Students Report" />
            <div className="space-y-6 p-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h1 className="text-lg font-semibold tracking-tight text-foreground">
                            Students Report
                        </h1>
                        <p className="text-xs text-muted-foreground">
                            Detailed breakdown of student enrolment,
                            demographics, and status.
                        </p>
                    </div>
                    {/* Filters and actions */}
                </div>

                <Deferred data="stats" fallback={<MetricCardsSkeleton />}>
                    {stats && (
                        <div className="grid animate-in grid-cols-1 gap-2 duration-1000 ease-in-out fade-in slide-in-from-top-6 sm:grid-cols-2 md:gap-4 lg:grid-cols-5">
                            <MetricCard
                                title="Total Students"
                                value={stats.total}
                                icon={Users}
                                color="primary"
                            />
                            <MetricCard
                                title="Active"
                                value={stats.active}
                                icon={UserCheck}
                                color="success"
                            />
                            <MetricCard
                                title="Pending"
                                value={stats.pending}
                                icon={Clock}
                                color="warning"
                            />
                            <MetricCard
                                title="Suspended"
                                value={stats.suspended}
                                icon={UserX}
                                color="destructive"
                            />
                            <MetricCard
                                title="Graduated"
                                value={stats.graduated}
                                icon={GraduationCap}
                                color="info"
                            />
                        </div>
                    )}
                </Deferred>

                <Deferred
                    data="students"
                    fallback={<div>Loading table...</div>}
                >
                    {students && (
                        <DataTable
                            title="Student List"
                            searchTitle="Search by name, matric number, or program..."
                            columns={columns}
                            data={students.data}
                            pagination={students.pagination}
                            // serverFilters...
                        />
                    )}
                </Deferred>
            </div>
        </>
    );
}

StudentsReport.layout = (page: any) => (
    <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>
);
