import { Deferred, Head, Link, router } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import {
    BookOpen,
    Users,
    Layers,
    Plus,
    Building,
    Eye,
    Trash2,
    CheckCircle,
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { BreadcrumbItem } from '@/types';

export interface ProgramItem {
    id: number;
    name: string;
    code: string | null;
    degree_level: string;
    duration_semesters: number;
    total_credits: number;
    department: string | null;
    faculty: string | null;
    status: string;
    description: string | null;
    students_count?: number;
    courses_count?: number;
    created_at?: string;
}

export interface ProgramStats {
    total_programs: number;
    active_programs: number;
    total_students: number;
    total_courses: number;
    faculties_count: number;
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

interface AdminProgramsIndexProps {
    stats?: ProgramStats;
    programs?: PaginatedData<ProgramItem>;
    faculties: string[];
    filters: {
        search: string;
        faculty: string;
        degree_level: string;
        status: string;
        per_page: number;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Academic Programs', href: '/admin/programs' },
];

export default function AdminProgramsIndex({
    stats,
    programs,
    faculties = [],
    filters,
}: AdminProgramsIndexProps) {
    const { t } = useTranslation();

    const [selectedForDelete, setSelectedForDelete] =
        useState<ProgramItem | null>(null);
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

        router.get('/admin/programs', cleanQuery, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const confirmDelete = () => {
        if (!selectedForDelete) {
            return;
        }

        setDeleteProcessing(true);

        router.delete(`/admin/programs/${selectedForDelete.id}`, {
            onSuccess: () => {
                toast.success(t('program_deleted', { name: selectedForDelete.name }));
                setDeleteModalOpen(false);
                setSelectedForDelete(null);
                setDeleteProcessing(false);
            },
            onError: () => {
                toast.error(t('failed_delete_program'));
                setDeleteProcessing(false);
            },
        });
    };

    const columns: ColumnDef<ProgramItem>[] = [
        {
            accessorKey: 'code',
            header: t('code'),
            cell: ({ row }) => (
                <Badge
                    variant="outline"
                    className="font-mono text-xs font-semibold uppercase"
                >
                    {row.original.code || 'N/A'}
                </Badge>
            ),
        },
        {
            accessorKey: 'name',
            header: t('program_name_label'),
            cell: ({ row }) => (
                <div className="max-w-[280px]">
                    <p className="truncate text-sm font-medium text-foreground">
                        {row.original.name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                        {row.original.department ||
                            row.original.faculty ||
                            t('department')}
                    </p>
                </div>
            ),
        },
        {
            accessorKey: 'faculty',
            header: t('faculty_label'),
            cell: ({ row }) => (
                <span className="text-xs text-muted-foreground">
                    {row.original.faculty || '—'}
                </span>
            ),
        },
        {
            accessorKey: 'degree_level',
            header: t('degree_level'),
            cell: ({ row }) => (
                <Badge variant="secondary" className="text-[11px] capitalize">
                    {row.original.degree_level}
                </Badge>
            ),
        },
        {
            accessorKey: 'duration_semesters',
            header: t('program_duration'),
            cell: ({ row }) => (
                <span className="text-xs text-muted-foreground">
                    {row.original.duration_semesters} {t('semester_label')} (
                    {row.original.total_credits} {t('credit_hours')})
                </span>
            ),
        },
        {
            accessorKey: 'students_count',
            header: t('students_count'),
            cell: ({ row }) => (
                <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                    <Users className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{row.original.students_count ?? 0}</span>
                </div>
            ),
        },
        {
            accessorKey: 'courses_count',
            header: t('courses'),
            cell: ({ row }) => (
                <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                    <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{row.original.courses_count ?? 0}</span>
                </div>
            ),
        },
        {
            accessorKey: 'status',
            header: t('program_status'),
            cell: ({ row }) => {
                const status = row.original.status;

                if (status === 'active') {
                    return (
                        <Badge className="border-emerald-200 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20">
                            {t('program_active')}
                        </Badge>
                    );
                }

                if (status === 'inactive') {
                    return (
                        <Badge
                            variant="outline"
                            className="text-muted-foreground"
                        >
                            {t('program_inactive')}
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
                        <Link href={`/admin/programs/${row.original.id}`}>
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
            title: t('program_status'),
            options: [
                { label: t('all_statuses'), value: 'all' },
                { label: t('program_active'), value: 'active' },
                { label: t('program_inactive'), value: 'inactive' },
                { label: t('archived'), value: 'archived' },
            ],
            value: filters.status || undefined,
        },
        {
            key: 'degree_level',
            title: t('degree_level'),
            options: [
                { label: t('all_degree_levels'), value: 'all' },
                { label: t('bachelor'), value: 'bachelor' },
                { label: t('master'), value: 'master' },
                { label: t('phd'), value: 'doctorate' },
                { label: t('diploma'), value: 'diploma' },
                { label: t('certificate'), value: 'certificate' },
            ],
            value: filters.degree_level || undefined,
        },
        {
            key: 'faculty',
            title: t('faculty_label'),
            options: [
                { label: t('all_faculties'), value: 'all' },
                ...faculties.map((f) => ({
                    label: f,
                    value: f,
                })),
            ],
            value: filters.faculty || undefined,
        },
    ];

    return (
        <>
            <Head title={t('programs_management')} />

            <div className="space-y-6 p-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h1 className="text-lg font-semibold tracking-tight text-foreground">
                            {t('programs_management')}
                        </h1>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            {t('programs_description')}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/admin/courses">
                                <BookOpen className="mr-1.5 h-4 w-4" />
                                {t('courses_curriculum')}
                            </Link>
                        </Button>
                        <Button size="sm" asChild>
                            <Link href="/admin/programs/create">
                                <Plus className="mr-1.5 h-4 w-4" />
                                {t('create_program')}
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Metric Cards */}
                <Deferred data="stats" fallback={<MetricCardsSkeleton />}>
                    {stats && (
                        <div className="grid animate-in grid-cols-1 gap-2 duration-1000 ease-in-out fade-in slide-in-from-top-6 sm:grid-cols-2 md:gap-4 lg:grid-cols-5">
                            <MetricCard
                                title={t('total_programs_stats')}
                                value={stats.total_programs}
                                icon={Layers}
                                color="primary"
                            />
                            <MetricCard
                                title={t('active_programs_stats')}
                                value={stats.active_programs}
                                icon={CheckCircle}
                                color="success"
                            />
                            <MetricCard
                                title={t('total_students_stats')}
                                value={stats.total_students}
                                icon={Users}
                                color="info"
                            />
                            <MetricCard
                                title={t('total_courses_stats')}
                                value={stats.total_courses}
                                icon={BookOpen}
                                color="warning"
                            />
                            <MetricCard
                                title={t('faculties_count')}
                                value={stats.faculties_count}
                                icon={Building}
                                color="accent"
                            />
                        </div>
                    )}
                </Deferred>

                {/* Programs Data Table */}
                <Deferred data="programs" fallback={<TableSkeleton />}>
                    {programs && (
                        <div className="rounded-md border border-border/60 bg-card p-4">
                            <DataTable
                                title={t('programs_list')}
                                searchTitle={t('search_programs')}
                                columns={columns}
                                data={programs.data}
                                pagination={{
                                    current_page: programs.current_page,
                                    last_page: programs.last_page,
                                    per_page: programs.per_page,
                                    total: programs.total,
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
                                        '/admin/programs',
                                        {},
                                        { preserveState: true },
                                    );
                                }}
                                onRowClick={(row) =>
                                    router.visit(
                                        `/admin/programs/${row.original.id}`,
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
                    title={t('delete_program')}
                    description={t('delete_program_confirm')}
                    itemName={selectedForDelete?.name}
                    loading={deleteProcessing}
                    onConfirm={confirmDelete}
                />
            </div>
        </>
    );
}

AdminProgramsIndex.layout = { breadcrumbs };
