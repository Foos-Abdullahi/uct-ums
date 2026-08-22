import React, { useState } from 'react';
import { Deferred, Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { MetricCard } from '@/components/tools/MetricCard';
import { MetricCardsSkeleton } from '@/components/tools/metric-cards-skeleton';
import { DataTable } from '@/components/tools/table/main-table';
import { getAssignmentColumns } from './components/assignment-columns';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import type { BreadcrumbItem } from '@/types';
import type { CourseAssignment, AssignmentStats, PaginatedData } from './components/assignment';
import type { DataTableServerFilter } from '@/components/tools/table/types';
import {
    ClipboardList,
    CheckCircle2,
    Clock,
    XCircle,
    Plus,
} from 'lucide-react';
import { toast } from 'sonner';
import { TableSkeleton } from '@/components/tools/table-skeleton';

interface AdminAssignmentsIndexProps {
    stats?: AssignmentStats;
    assignments?: PaginatedData<CourseAssignment>;
    lecturers: Array<{ id: number; name: string; lecturer_no: string }>;
    courses: Array<{ id: number; code: string; name: string }>;
    filters: {
        search: string;
        academic_year: string;
        semester: string;
        lecturer_id: string;
        course_id: string;
        status: string;
        per_page: number;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/admin/dashboard' },
    { title: 'Course Assignments', href: '/admin/assignments' },
];

export default function AdminAssignmentsIndex({
    stats,
    assignments,
    lecturers = [],
    courses = [],
    filters,
}: AdminAssignmentsIndexProps) {
    const [selectedAssignment, setSelectedAssignment] = useState<CourseAssignment | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleteProcessing, setDeleteProcessing] = useState(false);

    const handleFilterUpdate = (newFilters: Partial<typeof filters>) => {
        const query = {
            ...filters,
            ...newFilters,
        };

        const cleanQuery: Record<string, any> = {};
        Object.entries(query).forEach(([key, val]) => {
            if (val !== undefined && val !== '' && val !== 'all') {
                cleanQuery[key] = val;
            }
        });

        router.get('/admin/assignments', cleanQuery, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleDelete = (assignment: CourseAssignment) => {
        setSelectedAssignment(assignment);
        setDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        if (!selectedAssignment) return;
        setDeleteProcessing(true);

        router.delete(`/admin/assignments/${selectedAssignment.id}`, {
            onSuccess: () => {
                toast.success('Assignment deleted successfully.');
                setDeleteModalOpen(false);
                setSelectedAssignment(null);
                setDeleteProcessing(false);
            },
            onError: () => {
                toast.error('Failed to delete assignment.');
                setDeleteProcessing(false);
            },
        });
    };

    // Columns now use router.visit for edit and delete via callbacks
    const columns = getAssignmentColumns({
        onDelete: handleDelete,
        // Edit is handled by the column's internal router.visit, so we don't need a local callback.
    });

    const serverFilters: DataTableServerFilter[] = [
        {
            key: 'academic_year',
            title: 'Academic Year',
            options: [
                { label: 'All Years', value: 'all' },
                { label: '2024/2025', value: '2024/2025' },
                { label: '2025/2026', value: '2025/2026' },
                { label: '2026/2027', value: '2026/2027' },
                { label: '2027/2028', value: '2027/2028' },
            ],
            value: filters.academic_year || undefined,
        },
        {
            key: 'semester',
            title: 'Semester',
            options: [
                { label: 'All Semesters', value: 'all' },
                { label: 'Semester 1', value: 'Semester 1' },
                { label: 'Semester 2', value: 'Semester 2' },
                { label: 'Semester 3', value: 'Semester 3' },
                { label: 'Semester 4', value: 'Semester 4' },
                { label: 'Semester 5', value: 'Semester 5' },
                { label: 'Semester 6', value: 'Semester 6' },
            ],
            value: filters.semester || undefined,
        },
        {
            key: 'lecturer_id',
            title: 'Lecturer',
            options: [
                { label: 'All Lecturers', value: 'all' },
                ...lecturers.map((l) => ({
                    label: `${l.name} (${l.lecturer_no})`,
                    value: String(l.id),
                })),
            ],
            value: filters.lecturer_id || undefined,
        },
        {
            key: 'course_id',
            title: 'Course',
            options: [
                { label: 'All Courses', value: 'all' },
                ...courses.map((c) => ({
                    label: `${c.code} - ${c.name}`,
                    value: String(c.id),
                })),
            ],
            value: filters.course_id || undefined,
        },
        {
            key: 'status',
            title: 'Status',
            options: [
                { label: 'All Statuses', value: 'all' },
                { label: 'Assigned', value: 'assigned' },
                { label: 'Active', value: 'active' },
                { label: 'Completed', value: 'completed' },
                { label: 'Cancelled', value: 'cancelled' },
            ],
            value: filters.status || undefined,
        },
    ];

    return (
        <>
            <Head title="Course Assignments" />

            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h1 className="text-lg font-semibold text-foreground tracking-tight">
                            Course Assignments
                        </h1>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Manage which lecturers are assigned to which courses, roles, and schedules.
                        </p>
                    </div>

                    {/* Use Link for full-page creation */}
                    <Button size="sm" asChild>
                        <Link href="/admin/assignments/create">
                            <Plus className="h-4 w-4 mr-1.5" />
                            New Assignment
                        </Link>
                    </Button>
                </div>

                {/* Summary Metric Cards */}
                <Deferred data="stats" fallback={<MetricCardsSkeleton />}>
                    {stats && (
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:gap-4 lg:grid-cols-5 animate-in fade-in slide-in-from-top-6 duration-1000 ease-in-out">
                            <MetricCard
                                title="Total Assignments"
                                value={stats.total_assignments}
                                icon={ClipboardList}
                                color="primary"
                            />
                            <MetricCard
                                title="Active"
                                value={stats.active_assignments}
                                icon={CheckCircle2}
                                color="success"
                            />
                            <MetricCard
                                title="Assigned"
                                value={stats.assigned_assignments}
                                icon={Clock}
                                color="warning"
                            />
                            <MetricCard
                                title="Completed"
                                value={stats.completed_assignments}
                                icon={CheckCircle2}
                                color="info"
                            />
                            <MetricCard
                                title="Cancelled"
                                value={stats.cancelled_assignments}
                                icon={XCircle}
                                color="destructive"
                            />
                        </div>
                    )}
                </Deferred>

                {/* Main DataTable */}
                <Deferred data="assignments" fallback={<TableSkeleton />}>
                    {assignments && (
                        <div className="animate-in fade-in slide-in-from-bottom-6 duration-700 ease-in-out">
                            <DataTable
                                title="Assignments List"
                                searchTitle="Search by course code, lecturer name, or section..."
                                columns={columns}
                                data={assignments.data}
                                pagination={{
                                    current_page: assignments.current_page,
                                    last_page: assignments.last_page,
                                    per_page: assignments.per_page,
                                    total: assignments.total,
                                }}
                                onPageChange={(page) => handleFilterUpdate({ ...filters, page } as any)}
                                onPageSizeChange={(per_page) => handleFilterUpdate({ per_page, page: 1 } as any)}
                                serverFilters={serverFilters}
                                onServerFilterChange={(key, values) => {
                                    handleFilterUpdate({ [key]: values?.[0] ?? 'all' });
                                }}
                                onServerFilterClear={() => {
                                    router.get('/admin/assignments', {}, { preserveState: true });
                                }}
                                onRowClick={(row) => router.visit(`/admin/assignments/${row.original.id}`)}
                            />
                        </div>
                    )}
                </Deferred>

                {/* Delete Confirmation */}
                <ConfirmDeleteDialog
                    open={deleteModalOpen}
                    onOpenChange={setDeleteModalOpen}
                    title="Delete Assignment"
                    description="Are you sure you want to remove this course assignment? This action cannot be undone."
                    itemName={
                        selectedAssignment
                            ? `${selectedAssignment.course?.code} – ${selectedAssignment.lecturer?.user?.name} (${selectedAssignment.section})`
                            : undefined
                    }
                    loading={deleteProcessing}
                    onConfirm={confirmDelete}
                />
            </div>
        </>
    );
}

AdminAssignmentsIndex.layout = { breadcrumbs };