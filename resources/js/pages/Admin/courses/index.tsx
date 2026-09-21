import { Deferred, Head, Link, router } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import {
    BookOpen,
    CheckCircle,
    ClipboardList,
    Plus,
    Eye,
    Trash2,
    Calendar,
    GraduationCap,
} from 'lucide-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import { MetricCardsSkeleton } from '@/components/tools/metric-cards-skeleton';
import { MetricCard } from '@/components/tools/MetricCard';
import { DataTable } from '@/components/tools/table/main-table';
import type { DataTableServerFilter } from '@/components/tools/table/types';
import { TableSkeleton } from '@/components/tools/table-skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { BreadcrumbItem } from '@/types';

export interface CourseItem {
    id: number;
    program_id: number;
    code: string;
    name: string;
    credit_hours: number;
    semester: number;
    level: string;
    description: string | null;
    status: string;
    program?: {
        id: number;
        name: string;
        code: string | null;
    };
    assignments_count?: number;
    created_at?: string;
}

export interface CourseStats {
    total_courses: number;
    active_courses: number;
    total_assignments: number;
    total_credits: number;
}

export interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
}

interface AdminCoursesIndexProps {
    stats?: CourseStats;
    courses?: PaginatedData<CourseItem>;
    programs: Array<{ id: number; name: string; code: string | null }>;
    filters: {
        search: string;
        program_id: string;
        semester: string;
        status: string;
        level: string;
        per_page: number;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/admin/dashboard' },
    { title: 'Courses', href: '/admin/courses' },
];

export default function AdminCoursesIndex({
    stats,
    courses,
    programs = [],
    filters,
}: AdminCoursesIndexProps) {
    const { t } = useTranslation();

    const [selectedForDelete, setSelectedForDelete] =
        useState<CourseItem | null>(null);
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

        router.get('/admin/courses', cleanQuery, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const confirmDelete = () => {
        if (!selectedForDelete) {
            return;
        }

        setDeleteProcessing(true);

        router.delete(`/admin/courses/${selectedForDelete.id}`, {
            onSuccess: () => {
                toast.success(
                    t('course_deleted', { code: selectedForDelete.code, name: selectedForDelete.name }),
                );
                setDeleteModalOpen(false);
                setSelectedForDelete(null);
                setDeleteProcessing(false);
            },
            onError: () => {
                toast.error(t('failed_delete_course'));
                setDeleteProcessing(false);
            },
        });
    };

    const columns: ColumnDef<CourseItem>[] = [
        {
            accessorKey: 'code',
            header: t('code'),
            cell: ({ row }) => (
                <Badge
                    variant="outline"
                    className="font-mono text-xs font-semibold uppercase"
                >
                    {row.original.code}
                </Badge>
            ),
        },
        {
            accessorKey: 'name',
            header: t('course_title'),
            cell: ({ row }) => (
                <div className="max-w-[280px]">
                    <p className="truncate text-sm font-medium text-foreground">
                        {row.original.name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                        {row.original.program?.name || t('general_program')}
                    </p>
                </div>
            ),
        },
        {
            accessorKey: 'credit_hours',
            header: t('course_credits'),
            cell: ({ row }) => (
                <span className="text-xs font-semibold text-foreground">
                    {row.original.credit_hours} CH
                </span>
            ),
        },
        {
            accessorKey: 'semester',
            header: t('semester'),
            cell: ({ row }) => (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{t('semester_prefix')} {row.original.semester}</span>
                </div>
            ),
        },
        {
            accessorKey: 'level',
            header: t('program_level'),
            cell: ({ row }) => (
                <Badge variant="secondary" className="text-[11px] capitalize">
                    {row.original.level}
                </Badge>
            ),
        },
        {
            accessorKey: 'assignments_count',
            header: t('lecturer_assignments_label'),
            cell: ({ row }) => (
                <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                    <ClipboardList className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{row.original.assignments_count ?? 0}</span>
                </div>
            ),
        },
        {
            accessorKey: 'status',
            header: t('status'),
            cell: ({ row }) => {
                const status = row.original.status;

                if (status === 'active') {
                    return (
                        <Badge className="border-emerald-200 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20">
                            {t('active')}
                        </Badge>
                    );
                }

                if (status === 'inactive') {
                    return (
                        <Badge
                            variant="outline"
                            className="text-muted-foreground"
                        >
                            {t('inactive')}
                        </Badge>
                    );
                }

                return <Badge variant="destructive">{t('archived')}</Badge>;
            },
        },
        {
            id: 'actions',
            header: () => <span className="sr-only">{t('actions')}</span>,
            cell: ({ row }) => (
                <div className="flex items-center justify-end gap-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        asChild
                    >
                        <Link href={`/admin/courses/${row.original.id}`}>
                            <Eye className="mr-1 h-3.5 w-3.5" />
                            {t('view')}
                        </Link>
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                        onClick={(e) => {
                            e.stopPropagation();
                            setSelectedForDelete(row.original);
                            setDeleteModalOpen(true);
                        }}
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                </div>
            ),
        },
    ];

    const serverFilters: DataTableServerFilter[] = [
        {
            key: 'status',
            title: t('status'),
            options: [
                { label: t('all_statuses'), value: 'all' },
                { label: t('active'), value: 'active' },
                { label: t('inactive'), value: 'inactive' },
                { label: t('archived'), value: 'archived' },
            ],
            value: filters.status || undefined,
        },
        {
            key: 'program_id',
            title: t('program'),
            options: [
                { label: t('all_programs_filter'), value: 'all' },
                ...programs.map((p) => ({
                    label: p.name,
                    value: String(p.id),
                })),
            ],
            value: filters.program_id || undefined,
        },
        {
            key: 'semester',
            title: t('semester'),
            options: [
                { label: t('all_semesters_filter'), value: 'all' },
                ...Array.from({ length: 8 }, (_, i) => ({
                    label: `${t('semester')} ${i + 1}`,
                    value: String(i + 1),
                })),
            ],
            value: filters.semester || undefined,
        },
    ];

    return (
        <>
            <Head title={t('courses_management')} />

            <div className="space-y-6 p-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h1 className="text-lg font-semibold tracking-tight text-foreground">
                            {t('courses_management')}
                        </h1>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            {t('courses_description')}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/admin/assignments">
                                <ClipboardList className="mr-1.5 h-4 w-4" />
                                {t('breadcrumb_assignments')}
                            </Link>
                        </Button>
                        <Button size="sm" asChild>
                            <Link href="/admin/courses/create">
                                <Plus className="mr-1.5 h-4 w-4" />
                                {t('create_course')}
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Metric Cards */}
                <Deferred data="stats" fallback={<MetricCardsSkeleton />}>
                    {stats && (
                        <div className="grid animate-in grid-cols-1 gap-2 duration-1000 ease-in-out fade-in slide-in-from-top-6 sm:grid-cols-2 md:gap-4 lg:grid-cols-4">
                            <MetricCard
                                title={t('total_courses_stats')}
                                value={stats.total_courses}
                                icon={BookOpen}
                                color="primary"
                            />
                            <MetricCard
                                title={t('active_courses_stats')}
                                value={stats.active_courses}
                                icon={CheckCircle}
                                color="success"
                            />
                            <MetricCard
                                title={t('total_assignments_stats')}
                                value={stats.total_assignments}
                                icon={ClipboardList}
                                color="info"
                            />
                            <MetricCard
                                title={t('total_credits_stats')}
                                value={stats.total_credits}
                                icon={GraduationCap}
                                color="accent"
                            />
                        </div>
                    )}
                </Deferred>

                {/* Courses Data Table */}
                <Deferred data="courses" fallback={<TableSkeleton />}>
                    {courses && (
                        <div className="rounded-md border border-border/60 bg-card p-4">
                            <DataTable
                                title={t('courses_list')}
                                searchTitle={t('search_courses')}
                                columns={columns}
                                data={courses.data}
                                pagination={{
                                    current_page: courses.current_page,
                                    last_page: courses.last_page,
                                    per_page: courses.per_page,
                                    total: courses.total,
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
                                        '/admin/courses',
                                        {},
                                        { preserveState: true },
                                    );
                                }}
                                onRowClick={(row) =>
                                    router.visit(
                                        `/admin/courses/${row.original.id}`,
                                    )
                                }
                            />
                        </div>
                    )}
                </Deferred>

                {/* Delete Confirmation Modal */}
                <ConfirmDeleteDialog
                    open={deleteModalOpen}
                    onOpenChange={setDeleteModalOpen}
                    title={t('delete_course')}
                    description={t('delete_course_confirm')}
                    itemName={
                        selectedForDelete
                            ? `${selectedForDelete.code} - ${selectedForDelete.name}`
                            : undefined
                    }
                    loading={deleteProcessing}
                    onConfirm={confirmDelete}
                />
            </div>
        </>
    );
}

AdminCoursesIndex.layout = { breadcrumbs };
