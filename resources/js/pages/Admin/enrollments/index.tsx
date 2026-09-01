import React from 'react';
import { Deferred, Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MetricCard } from '@/components/tools/MetricCard';
import { MetricCardsSkeleton } from '@/components/tools/metric-cards-skeleton';
import { DataTable } from '@/components/tools/table/main-table';
import { TableSkeleton } from '@/components/tools/table-skeleton';
import type { BreadcrumbItem } from '@/types';
import type { DataTableServerFilter } from '@/components/tools/table/types';
import type { ColumnDef } from '@tanstack/react-table';
import {
    Users,
    UserCheck,
    Clock,
    GraduationCap,
    AlertCircle,
    Eye,
    Calendar,
} from 'lucide-react';

export interface EnrollmentRecord {
    id: number;
    matric_no: string;
    enrollment_status: string;
    current_semester: number;
    fee_status: string;
    enrollment_date: string | null;
    gpa: string | number | null;
    user: {
        id: number;
        name: string;
        email: string;
    };
    program?: {
        id: number;
        name: string;
        code: string | null;
    };
}

export interface EnrollmentStats {
    total_enrolled: number;
    active_students: number;
    pending_enrollments: number;
    graduated_students: number;
    suspended_students: number;
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

interface AdminEnrollmentsIndexProps {
    stats?: EnrollmentStats;
    enrollments?: PaginatedData<EnrollmentRecord>;
    programs: Array<{ id: number; name: string; code: string | null }>;
    filters: {
        search: string;
        program_id: string;
        status: string;
        semester: string;
        fee_status: string;
        per_page: number;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/admin/dashboard' },
    { title: 'Enrollments', href: '/admin/enrollments' },
];

export default function AdminEnrollmentsIndex({
    stats,
    enrollments,
    programs = [],
    filters,
}: AdminEnrollmentsIndexProps) {
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

        router.get('/admin/enrollments', cleanQuery, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const columns: ColumnDef<EnrollmentRecord>[] = [
        {
            accessorKey: 'matric_no',
            header: 'Matric No',
            cell: ({ row }) => (
                <Badge variant="outline" className="font-mono text-xs font-semibold uppercase">
                    {row.original.matric_no}
                </Badge>
            ),
        },
        {
            accessorKey: 'user.name',
            header: 'Student Name',
            cell: ({ row }) => (
                <div className="max-w-[220px]">
                    <p className="font-medium text-foreground truncate text-sm">{row.original.user?.name || 'N/A'}</p>
                    <p className="text-xs text-muted-foreground truncate">{row.original.user?.email || '—'}</p>
                </div>
            ),
        },
        {
            accessorKey: 'program.name',
            header: 'Academic Program',
            cell: ({ row }) => (
                <div className="max-w-[200px]">
                    <span className="text-xs font-medium text-foreground truncate block">
                        {row.original.program?.name || 'Unassigned'}
                    </span>
                    {row.original.program?.code && (
                        <Badge variant="secondary" className="font-mono text-[10px] uppercase mt-0.5">
                            {row.original.program.code}
                        </Badge>
                    )}
                </div>
            ),
        },
        {
            accessorKey: 'current_semester',
            header: 'Term',
            cell: ({ row }) => (
                <span className="text-xs font-semibold text-foreground">
                    Sem {row.original.current_semester || 1}
                </span>
            ),
        },
        {
            accessorKey: 'enrollment_status',
            header: 'Enrollment Status',
            cell: ({ row }) => {
                const status = row.original.enrollment_status;
                if (status === 'enrolled') {
                    return (
                        <Badge className="bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 border-emerald-200">
                            Enrolled
                        </Badge>
                    );
                }
                if (status === 'pending') {
                    return (
                        <Badge className="bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 border-amber-200">
                            Pending
                        </Badge>
                    );
                }
                if (status === 'graduated') {
                    return (
                        <Badge className="bg-sky-500/10 text-sky-700 hover:bg-sky-500/20 border-sky-200">
                            Graduated
                        </Badge>
                    );
                }
                return (
                    <Badge variant="destructive">
                        {status}
                    </Badge>
                );
            },
        },
        {
            accessorKey: 'fee_status',
            header: 'Fee Status',
            cell: ({ row }) => {
                const feeStatus = String(row.original.fee_status);
                if (feeStatus === 'paid') {
                    return (
                        <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-200 text-[11px]">
                            Paid
                        </Badge>
                    );
                }
                if (feeStatus === 'partial') {
                    return (
                        <Badge className="bg-amber-500/10 text-amber-700 border-amber-200 text-[11px]">
                            Partial
                        </Badge>
                    );
                }
                return (
                    <Badge variant="destructive" className="text-[11px]">
                        Unpaid
                    </Badge>
                );
            },
        },
        {
            accessorKey: 'enrollment_date',
            header: 'Enrolled Date',
            cell: ({ row }) => (
                <span className="text-xs text-muted-foreground">
                    {row.original.enrollment_date ? String(row.original.enrollment_date).split('T')[0] : '—'}
                </span>
            ),
        },
        {
            accessorKey: 'gpa',
            header: 'GPA',
            cell: ({ row }) => (
                <span className="text-xs font-bold text-foreground">
                    {row.original.gpa ? Number(row.original.gpa).toFixed(2) : '0.00'}
                </span>
            ),
        },
        {
            id: 'actions',
            header: () => <span className="sr-only">Actions</span>,
            cell: ({ row }) => (
                <div className="flex items-center justify-end">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        asChild
                    >
                        <Link href={`/admin/students/${row.original.id}`}>
                            <Eye className="h-3.5 w-3.5 mr-1" />
                            Profile
                        </Link>
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
                { label: 'Enrolled', value: 'enrolled' },
                { label: 'Pending', value: 'pending' },
                { label: 'Suspended', value: 'suspended' },
                { label: 'Graduated', value: 'graduated' },
                { label: 'Withdrawn', value: 'withdrawn' },
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
        {
            key: 'fee_status',
            title: 'Fee Status',
            options: [
                { label: 'All Fee Statuses', value: 'all' },
                { label: 'Paid', value: 'paid' },
                { label: 'Partial', value: 'partial' },
                { label: 'Unpaid', value: 'unpaid' },
            ],
            value: filters.fee_status || undefined,
        },
    ];

    return (
        <>
            <Head title="Student Enrollments" />

            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h1 className="text-lg font-semibold text-foreground tracking-tight">
                            Student Enrollments
                        </h1>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Manage student academic registrations, program affiliations, cohort progressions, and matriculation standing.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/admin/admissions">
                                <Users className="h-4 w-4 mr-1.5" />
                                Admissions Funnel
                            </Link>
                        </Button>
                        <Button size="sm" asChild>
                            <Link href="/admin/students/create">
                                <UserCheck className="h-4 w-4 mr-1.5" />
                                Enroll Student
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Metric Cards */}
                <Deferred data="stats" fallback={<MetricCardsSkeleton />}>
                    {stats && (
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:gap-4 lg:grid-cols-5 animate-in fade-in slide-in-from-top-6 duration-1000 ease-in-out">
                            <MetricCard
                                title="Total Enrolled"
                                value={stats.total_enrolled}
                                icon={Users}
                                color="primary"
                            />
                            <MetricCard
                                title="Active Students"
                                value={stats.active_students}
                                icon={UserCheck}
                                color="success"
                            />
                            <MetricCard
                                title="Pending"
                                value={stats.pending_enrollments}
                                icon={Clock}
                                color="warning"
                            />
                            <MetricCard
                                title="Graduated"
                                value={stats.graduated_students}
                                icon={GraduationCap}
                                color="info"
                            />
                            <MetricCard
                                title="Suspended"
                                value={stats.suspended_students}
                                icon={AlertCircle}
                                color="destructive"
                            />
                        </div>
                    )}
                </Deferred>

                {/* Enrollments Data Table */}
                <Deferred data="enrollments" fallback={<TableSkeleton />}>
                    {enrollments && (
                        <div className="border border-border/60 rounded-md bg-card p-4">
                            <DataTable
                                title="Enrollment Roster"
                                searchTitle="Search by matric no, student name, email..."
                                columns={columns}
                                data={enrollments.data}
                                pagination={{
                                    current_page: enrollments.current_page,
                                    last_page: enrollments.last_page,
                                    per_page: enrollments.per_page,
                                    total: enrollments.total,
                                }}
                                onPageChange={(page) => handleFilterUpdate({ ...filters, page } as any)}
                                onPageSizeChange={(per_page) => handleFilterUpdate({ per_page, page: 1 } as any)}
                                serverFilters={serverFilters}
                                onServerFilterChange={(key, values) => {
                                    handleFilterUpdate({ [key]: values?.[0] ?? 'all' });
                                }}
                                onServerFilterClear={() => {
                                    router.get('/admin/enrollments', {}, { preserveState: true });
                                }}
                                onRowClick={(row) => router.visit(`/admin/students/${row.original.id}`)}
                            />
                        </div>
                    )}
                </Deferred>
            </div>
        </>
    );
}

AdminEnrollmentsIndex.layout = { breadcrumbs };
