import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Deferred } from '@inertiajs/react';
import { MetricCard } from '@/components/tools/MetricCard';
import { MetricCardsSkeleton } from '@/components/tools/metric-cards-skeleton';
import { DataTable } from '@/components/tools/table/main-table';
import type { BreadcrumbItem } from '@/types';
import { Users, UserCheck, UserX, Clock, GraduationCap } from 'lucide-react';

// ... similar to overview, with student-specific stats and columns
// I'll provide a concise version; you can expand as needed.

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/admin/dashboard' },
    { title: 'Reports', href: '/admin/reports' },
    { title: 'Students', href: '/admin/reports/students' },
];

export default function StudentsReport({ stats, students }) {
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
            <div className="p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div>
                        <h1 className="text-lg font-semibold text-foreground tracking-tight">
                            Students Report
                        </h1>
                        <p className="text-xs text-muted-foreground">
                            Detailed breakdown of student enrolment, demographics, and status.
                        </p>
                    </div>
                    {/* Filters and actions */}
                </div>

                <Deferred data="stats" fallback={<MetricCardsSkeleton />}>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:gap-4 lg:grid-cols-5 animate-in fade-in slide-in-from-top-6 duration-1000 ease-in-out">
                        <MetricCard title="Total Students" value={stats.total} icon={Users} color="primary" />
                        <MetricCard title="Active" value={stats.active} icon={UserCheck} color="success" />
                        <MetricCard title="Pending" value={stats.pending} icon={Clock} color="warning" />
                        <MetricCard title="Suspended" value={stats.suspended} icon={UserX} color="destructive" />
                        <MetricCard title="Graduated" value={stats.graduated} icon={GraduationCap} color="info" />
                    </div>
                </Deferred>

                <Deferred data="students" fallback={<div>Loading table...</div>}>
                    <DataTable
                        title="Student List"
                        columns={columns}
                        data={students.data}
                        pagination={students.pagination}
                        // serverFilters...
                    />
                </Deferred>
            </div>
        </>
    );
}

StudentsReport.layout = (page: any) => <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>;