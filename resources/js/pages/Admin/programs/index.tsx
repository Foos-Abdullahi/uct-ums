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
    GraduationCap,
    Users,
    Layers,
    Plus,
    Building,
    Eye,
    Trash2,
    CheckCircle,
    XCircle,
} from 'lucide-react';
import { toast } from 'sonner';

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
    { title: 'Dashboard', href: '/admin/dashboard' },
    { title: 'Academic Programs', href: '/admin/programs' },
];

export default function AdminProgramsIndex({
    stats,
    programs,
    faculties = [],
    filters,
}: AdminProgramsIndexProps) {
    const [selectedForDelete, setSelectedForDelete] = useState<ProgramItem | null>(null);
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
        if (!selectedForDelete) return;
        setDeleteProcessing(true);

        router.delete(`/admin/programs/${selectedForDelete.id}`, {
            onSuccess: () => {
                toast.success(`Program ${selectedForDelete.name} deleted.`);
                setDeleteModalOpen(false);
                setSelectedForDelete(null);
                setDeleteProcessing(false);
            },
            onError: () => {
                toast.error('Failed to delete academic program.');
                setDeleteProcessing(false);
            },
        });
    };

    const columns: ColumnDef<ProgramItem>[] = [
        {
            accessorKey: 'code',
            header: 'Code',
            cell: ({ row }) => (
                <Badge variant="outline" className="font-mono text-xs font-semibold uppercase">
                    {row.original.code || 'N/A'}
                </Badge>
            ),
        },
        {
            accessorKey: 'name',
            header: 'Program Name',
            cell: ({ row }) => (
                <div className="max-w-[280px]">
                    <p className="font-medium text-foreground truncate text-sm">{row.original.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{row.original.department || row.original.faculty || 'General Department'}</p>
                </div>
            ),
        },
        {
            accessorKey: 'faculty',
            header: 'Faculty',
            cell: ({ row }) => (
                <span className="text-xs text-muted-foreground">
                    {row.original.faculty || '—'}
                </span>
            ),
        },
        {
            accessorKey: 'degree_level',
            header: 'Degree Level',
            cell: ({ row }) => (
                <Badge variant="secondary" className="capitalize text-[11px]">
                    {row.original.degree_level}
                </Badge>
            ),
        },
        {
            accessorKey: 'duration_semesters',
            header: 'Duration',
            cell: ({ row }) => (
                <span className="text-xs text-muted-foreground">
                    {row.original.duration_semesters} Semesters ({row.original.total_credits} Credits)
                </span>
            ),
        },
        {
            accessorKey: 'students_count',
            header: 'Students',
            cell: ({ row }) => (
                <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                    <Users className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{row.original.students_count ?? 0}</span>
                </div>
            ),
        },
        {
            accessorKey: 'courses_count',
            header: 'Courses',
            cell: ({ row }) => (
                <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                    <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{row.original.courses_count ?? 0}</span>
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
                        <Link href={`/admin/programs/${row.original.id}`}>
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
            key: 'degree_level',
            title: 'Degree Level',
            options: [
                { label: 'All Levels', value: 'all' },
                { label: 'Bachelor', value: 'bachelor' },
                { label: 'Master', value: 'master' },
                { label: 'Doctorate', value: 'doctorate' },
                { label: 'Diploma', value: 'diploma' },
                { label: 'Certificate', value: 'certificate' },
            ],
            value: filters.degree_level || undefined,
        },
        {
            key: 'faculty',
            title: 'Faculty',
            options: [
                { label: 'All Faculties', value: 'all' },
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
            <Head title="Academic Programs" />

            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h1 className="text-lg font-semibold text-foreground tracking-tight">
                            Academic Programs
                        </h1>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Manage undergraduate and postgraduate degree curricula, faculty departments, and credit requirements.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/admin/courses">
                                <BookOpen className="h-4 w-4 mr-1.5" />
                                Course Catalog
                            </Link>
                        </Button>
                        <Button size="sm" asChild>
                            <Link href="/admin/programs/create">
                                <Plus className="h-4 w-4 mr-1.5" />
                                New Program
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Metric Cards */}
                <Deferred data="stats" fallback={<MetricCardsSkeleton />}>
                    {stats && (
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:gap-4 lg:grid-cols-5 animate-in fade-in slide-in-from-top-6 duration-1000 ease-in-out">
                            <MetricCard
                                title="Total Programs"
                                value={stats.total_programs}
                                icon={Layers}
                                color="primary"
                            />
                            <MetricCard
                                title="Active Programs"
                                value={stats.active_programs}
                                icon={CheckCircle}
                                color="success"
                            />
                            <MetricCard
                                title="Total Students"
                                value={stats.total_students}
                                icon={Users}
                                color="info"
                            />
                            <MetricCard
                                title="Total Courses"
                                value={stats.total_courses}
                                icon={BookOpen}
                                color="warning"
                            />
                            <MetricCard
                                title="Faculties"
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
                        <div className="border border-border/60 rounded-md bg-card p-4">
                            <DataTable
                                title="Programs List"
                                searchTitle="Search by program name, code, department..."
                                columns={columns}
                                data={programs.data}
                                pagination={{
                                    current_page: programs.current_page,
                                    last_page: programs.last_page,
                                    per_page: programs.per_page,
                                    total: programs.total,
                                }}
                                onPageChange={(page) => handleFilterUpdate({ ...filters, page } as any)}
                                onPageSizeChange={(per_page) => handleFilterUpdate({ per_page, page: 1 } as any)}
                                serverFilters={serverFilters}
                                onServerFilterChange={(key, values) => {
                                    handleFilterUpdate({ [key]: values?.[0] ?? 'all' });
                                }}
                                onServerFilterClear={() => {
                                    router.get('/admin/programs', {}, { preserveState: true });
                                }}
                                onRowClick={(row) => router.visit(`/admin/programs/${row.original.id}`)}
                            />
                        </div>
                    )}
                </Deferred>

                {/* Delete Confirmation Modal */}
                <ConfirmDeleteDialog
                    open={deleteModalOpen}
                    onOpenChange={setDeleteModalOpen}
                    title="Delete Academic Program"
                    description="Are you sure you want to delete this program? This action cannot be undone."
                    itemName={selectedForDelete?.name}
                    loading={deleteProcessing}
                    onConfirm={confirmDelete}
                />
            </div>
        </>
    );
}

AdminProgramsIndex.layout = { breadcrumbs };
