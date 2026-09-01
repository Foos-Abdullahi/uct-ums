import React, { useState } from 'react';
import { Deferred, Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MetricCard } from '@/components/tools/MetricCard';
import { MetricCardsSkeleton } from '@/components/tools/metric-cards-skeleton';
import { DataTable } from '@/components/tools/table/main-table';
import { TableSkeleton } from '@/components/tools/table-skeleton';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import type { BreadcrumbItem } from '@/types';
import type { DataTableServerFilter } from '@/components/tools/table/types';
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
import { toast } from 'sonner';

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
    const [selectedForDelete, setSelectedForDelete] = useState<CourseItem | null>(null);
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
        if (!selectedForDelete) return;
        setDeleteProcessing(true);

        router.delete(`/admin/courses/${selectedForDelete.id}`, {
            onSuccess: () => {
                toast.success(`Course ${selectedForDelete.code} - ${selectedForDelete.name} deleted.`);
                setDeleteModalOpen(false);
                setSelectedForDelete(null);
                setDeleteProcessing(false);
            },
            onError: () => {
                toast.error('Failed to delete course.');
                setDeleteProcessing(false);
            },
        });
    };

    const columns: ColumnDef<CourseItem>[] = [
        {
            accessorKey: 'code',
            header: 'Code',
            cell: ({ row }) => (
                <Badge variant="outline" className="font-mono text-xs font-semibold uppercase">
                    {row.original.code}
                </Badge>
            ),
        },
        {
            accessorKey: 'name',
            header: 'Course Name',
            cell: ({ row }) => (
                <div className="max-w-[280px]">
                    <p className="font-medium text-foreground truncate text-sm">{row.original.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{row.original.program?.name || 'General Program'}</p>
                </div>
            ),
        },
        {
            accessorKey: 'credit_hours',
            header: 'Credits',
            cell: ({ row }) => (
                <span className="text-xs font-semibold text-foreground">
                    {row.original.credit_hours} CH
                </span>
            ),
        },
        {
            accessorKey: 'semester',
            header: 'Semester',
            cell: ({ row }) => (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>Sem {row.original.semester}</span>
                </div>
            ),
        },
        {
            accessorKey: 'level',
            header: 'Level',
            cell: ({ row }) => (
                <Badge variant="secondary" className="capitalize text-[11px]">
                    {row.original.level}
                </Badge>
            ),
        },
        {
            accessorKey: 'assignments_count',
            header: 'Lecturer Assignments',
            cell: ({ row }) => (
                <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                    <ClipboardList className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{row.original.assignments_count ?? 0}</span>
                </div>
            ),
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => {
                const status = row.original.status;
                if (status === 'active') {
                    return (
                        <Badge className="bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 border-emerald-200">
                            Active
                        </Badge>
                    );
                }
                if (status === 'inactive') {
                    return (
                        <Badge variant="outline" className="text-muted-foreground">
                            Inactive
                        </Badge>
                    );
                }
                return (
                    <Badge variant="destructive">
                        Archived
                    </Badge>
                );
            },
        },
        {
            id: 'actions',
            header: () => <span className="sr-only">Actions</span>,
            cell: ({ row }) => (
                <div className="flex items-center justify-end gap-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        asChild
                    >
                        <Link href={`/admin/courses/${row.original.id}`}>
                            <Eye className="h-3.5 w-3.5 mr-1" />
                            View
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
            title: 'Status',
            options: [
                { label: 'All Statuses', value: 'all' },
                { label: 'Active', value: 'active' },
                { label: 'Inactive', value: 'inactive' },
                { label: 'Archived', value: 'archived' },
            ],
            value: filters.status || undefined,
        },
        {
            key: 'program_id',
            title: 'Program',
            options: [
                { label: 'All Programs', value: 'all' },
                ...programs.map((p) => ({
                    label: p.name,
                    value: String(p.id),
                })),
            ],
            value: filters.program_id || undefined,
        },
        {
            key: 'semester',
            title: 'Semester',
            options: [
                { label: 'All Semesters', value: 'all' },
                ...Array.from({ length: 8 }, (_, i) => ({
                    label: `Semester ${i + 1}`,
                    value: String(i + 1),
                })),
            ],
            value: filters.semester || undefined,
        },
    ];

    return (
        <>
            <Head title="Course Catalog" />

            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h1 className="text-lg font-semibold text-foreground tracking-tight">
                            Course Catalog
                        </h1>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Manage curriculum modules, credit allocations, syllabus levels, and faculty teaching assignments.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/admin/assignments">
                                <ClipboardList className="h-4 w-4 mr-1.5" />
                                Assignments
                            </Link>
                        </Button>
                        <Button size="sm" asChild>
                            <Link href="/admin/courses/create">
                                <Plus className="h-4 w-4 mr-1.5" />
                                New Course
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Metric Cards */}
                <Deferred data="stats" fallback={<MetricCardsSkeleton />}>
                    {stats && (
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:gap-4 lg:grid-cols-4 animate-in fade-in slide-in-from-top-6 duration-1000 ease-in-out">
                            <MetricCard
                                title="Total Courses"
                                value={stats.total_courses}
                                icon={BookOpen}
                                color="primary"
                            />
                            <MetricCard
                                title="Active Courses"
                                value={stats.active_courses}
                                icon={CheckCircle}
                                color="success"
                            />
                            <MetricCard
                                title="Teaching Assignments"
                                value={stats.total_assignments}
                                icon={ClipboardList}
                                color="info"
                            />
                            <MetricCard
                                title="Total Credits"
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
                        <div className="border border-border/60 rounded-md bg-card p-4">
                            <DataTable
                                title="Course List"
                                searchTitle="Search by course code, name, description..."
                                columns={columns}
                                data={courses.data}
                                pagination={{
                                    current_page: courses.current_page,
                                    last_page: courses.last_page,
                                    per_page: courses.per_page,
                                    total: courses.total,
                                }}
                                onPageChange={(page) => handleFilterUpdate({ ...filters, page } as any)}
                                onPageSizeChange={(per_page) => handleFilterUpdate({ per_page, page: 1 } as any)}
                                serverFilters={serverFilters}
                                onServerFilterChange={(key, values) => {
                                    handleFilterUpdate({ [key]: values?.[0] ?? 'all' });
                                }}
                                onServerFilterClear={() => {
                                    router.get('/admin/courses', {}, { preserveState: true });
                                }}
                                onRowClick={(row) => router.visit(`/admin/courses/${row.original.id}`)}
                            />
                        </div>
                    )}
                </Deferred>

                {/* Delete Confirmation Modal */}
                <ConfirmDeleteDialog
                    open={deleteModalOpen}
                    onOpenChange={setDeleteModalOpen}
                    title="Delete Course"
                    description="Are you sure you want to delete this course? This action cannot be undone."
                    itemName={selectedForDelete ? `${selectedForDelete.code} - ${selectedForDelete.name}` : undefined}
                    loading={deleteProcessing}
                    onConfirm={confirmDelete}
                />
            </div>
        </>
    );
}

AdminCoursesIndex.layout = { breadcrumbs };
