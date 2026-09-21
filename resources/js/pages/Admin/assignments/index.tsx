import { Deferred, Head, Link, router } from '@inertiajs/react';
import {
    ClipboardList,
    CheckCircle2,
    Clock,
    XCircle,
    Plus,
} from 'lucide-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import AppLayout from '@/layouts/app-layout';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import { MetricCardsSkeleton } from '@/components/tools/metric-cards-skeleton';
import { MetricCard } from '@/components/tools/MetricCard';
import { DataTable } from '@/components/tools/table/main-table';
import type { DataTableServerFilter } from '@/components/tools/table/types';
import { TableSkeleton } from '@/components/tools/table-skeleton';
import { Button } from '@/components/ui/button';
import type { BreadcrumbItem } from '@/types';
import type {
    CourseAssignment,
    AssignmentStats,
    PaginatedData,
} from './components/assignment';
import { getAssignmentColumns } from './components/assignment-columns';

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

export default function AdminAssignmentsIndex({
    stats,
    assignments,
    lecturers = [],
    courses = [],
    filters,
}: AdminAssignmentsIndexProps) {
    const { t } = useTranslation();

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('dashboard'), href: '/admin/dashboard' },
        { title: t('breadcrumb_assignments'), href: '/admin/assignments' },
    ];
    const [selectedAssignment, setSelectedAssignment] =
        useState<CourseAssignment | null>(null);
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
        if (!selectedAssignment) {
            return;
        }

        setDeleteProcessing(true);

        router.delete(`/admin/assignments/${selectedAssignment.id}`, {
            onSuccess: () => {
                toast.success(t('assignment_deleted'));
                setDeleteModalOpen(false);
                setSelectedAssignment(null);
                setDeleteProcessing(false);
            },
            onError: () => {
                toast.error(t('failed_delete_assignment'));
                setDeleteProcessing(false);
            },
        });
    };

    const columns = getAssignmentColumns({
        onDelete: handleDelete,
        onEdit: (assignment) =>
            router.visit(`/admin/assignments/${assignment.id}/edit`),
    });

    const serverFilters: DataTableServerFilter[] = [
        {
            key: 'academic_year',
            title: t('academic_year'),
            options: [
                { label: t('all_years'), value: 'all' },
                { label: '2024/2025', value: '2024/2025' },
                { label: '2025/2026', value: '2025/2026' },
                { label: '2026/2027', value: '2026/2027' },
                { label: '2027/2028', value: '2027/2028' },
            ],
            value: filters.academic_year || undefined,
        },
        {
            key: 'semester',
            title: t('semester'),
            options: [
                { label: t('all_semesters'), value: 'all' },
                { label: t('semester_1'), value: 'Semester 1' },
                { label: t('semester_2'), value: 'Semester 2' },
                { label: t('semester_3'), value: 'Semester 3' },
                { label: t('semester_4'), value: 'Semester 4' },
                { label: t('semester_5'), value: 'Semester 5' },
                { label: t('semester_6'), value: 'Semester 6' },
            ],
            value: filters.semester || undefined,
        },
        {
            key: 'lecturer_id',
            title: t('lecturer'),
            options: [
                { label: t('all_lecturers'), value: 'all' },
                ...lecturers.map((l) => ({
                    label: `${l.name} (${l.lecturer_no})`,
                    value: String(l.id),
                })),
            ],
            value: filters.lecturer_id || undefined,
        },
        {
            key: 'course_id',
            title: t('course'),
            options: [
                { label: t('all_courses'), value: 'all' },
                ...courses.map((c) => ({
                    label: `${c.code} - ${c.name}`,
                    value: String(c.id),
                })),
            ],
            value: filters.course_id || undefined,
        },
        {
            key: 'status',
            title: t('status'),
            options: [
                { label: t('all_statuses'), value: 'all' },
                { label: t('assigned'), value: 'assigned' },
                { label: t('active'), value: 'active' },
                { label: t('completed'), value: 'completed' },
                { label: t('cancelled'), value: 'cancelled' },
            ],
            value: filters.status || undefined,
        },
    ];

    return (
        <>
            <Head title={t('assignments_management')} />

            <div className="space-y-6 p-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h1 className="text-lg font-semibold tracking-tight text-foreground">
                            {t('assignments_management')}
                        </h1>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            {t('assignments_description')}
                        </p>
                    </div>

                    {/* Use Link for full-page creation */}
                    <Button size="sm" asChild>
                        <Link href="/admin/assignments/create">
                            <Plus className="mr-1.5 h-4 w-4" />
                            {t('create_assignment')}
                        </Link>
                    </Button>
                </div>

                {/* Summary Metric Cards */}
                <Deferred data="stats" fallback={<MetricCardsSkeleton />}>
                    {stats && (
                        <div className="grid animate-in grid-cols-1 gap-2 duration-1000 ease-in-out fade-in slide-in-from-top-6 sm:grid-cols-2 md:gap-4 lg:grid-cols-5">
                            <MetricCard
                                title={t('total_assignments')}
                                value={stats.total_assignments}
                                icon={ClipboardList}
                                color="primary"
                            />
                            <MetricCard
                                title={t('active')}
                                value={stats.active_assignments}
                                icon={CheckCircle2}
                                color="success"
                            />
                            <MetricCard
                                title={t('assigned')}
                                value={stats.assigned_assignments}
                                icon={Clock}
                                color="warning"
                            />
                            <MetricCard
                                title={t('completed')}
                                value={stats.completed_assignments}
                                icon={CheckCircle2}
                                color="info"
                            />
                            <MetricCard
                                title={t('cancelled')}
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
                        <div className="animate-in duration-700 ease-in-out fade-in slide-in-from-bottom-6">
                            <DataTable
                                title={t('assignments_list')}
                                searchTitle={t('search_assignments')}
                                columns={columns}
                                data={assignments.data}
                                pagination={{
                                    current_page: assignments.current_page,
                                    last_page: assignments.last_page,
                                    per_page: assignments.per_page,
                                    total: assignments.total,
                                }}
                                onPageChange={(page) =>
                                    handleFilterUpdate({
                                        ...filters,
                                        page,
                                    } as any)
                                }
                                onPageSizeChange={(per_page) =>
                                    handleFilterUpdate({
                                        per_page,
                                        page: 1,
                                    } as any)
                                }
                                serverFilters={serverFilters}
                                onServerFilterChange={(key, values) => {
                                    handleFilterUpdate({
                                        [key]: values?.[0] ?? 'all',
                                    });
                                }}
                                onServerFilterClear={() => {
                                    router.get(
                                        '/admin/assignments',
                                        {},
                                        { preserveState: true },
                                    );
                                }}
                                onRowClick={(row) =>
                                    router.visit(
                                        `/admin/assignments/${row.original.id}`,
                                    )
                                }
                            />
                        </div>
                    )}
                </Deferred>

                {/* Delete Confirmation */}
                <ConfirmDeleteDialog
                    open={deleteModalOpen}
                    onOpenChange={setDeleteModalOpen}
                    title={t('delete_assignment')}
                    description={t('delete_assignment_confirm')}
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

AdminAssignmentsIndex.layout = (page: any) => {
    const { t } = useTranslation();
    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('dashboard'), href: '/admin/dashboard' },
        { title: t('breadcrumb_assignments'), href: '/admin/assignments' },
    ];
    return <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>;
};
