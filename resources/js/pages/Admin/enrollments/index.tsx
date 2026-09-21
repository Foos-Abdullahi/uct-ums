import { Deferred, Head, Link, router } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import {
    Users,
    UserCheck,
    Clock,
    GraduationCap,
    AlertCircle,
    Eye,
} from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { MetricCardsSkeleton } from '@/components/tools/metric-cards-skeleton';
import { MetricCard } from '@/components/tools/MetricCard';
import { DataTable } from '@/components/tools/table/main-table';
import type { DataTableServerFilter } from '@/components/tools/table/types';
import { TableSkeleton } from '@/components/tools/table-skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { BreadcrumbItem } from '@/types';

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
    const { t } = useTranslation();

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
                <Badge
                    variant="outline"
                    className="font-mono text-xs font-semibold uppercase"
                >
                    {row.original.matric_no}
                </Badge>
            ),
        },
        {
            accessorKey: 'user.name',
            header: 'Student Name',
            cell: ({ row }) => (
                <div className="max-w-[220px]">
                    <p className="truncate text-sm font-medium text-foreground">
                        {row.original.user?.name || 'N/A'}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                        {row.original.user?.email || '—'}
                    </p>
                </div>
            ),
        },
        {
            accessorKey: 'program.name',
            header: t('program'),
            cell: ({ row }) => (
                <div className="max-w-[200px]">
                    <span className="block truncate text-xs font-medium text-foreground">
                        {row.original.program?.name || t('unassigned')}
                    </span>
                    {row.original.program?.code && (
                        <Badge
                            variant="secondary"
                            className="mt-0.5 font-mono text-[10px] uppercase"
                        >
                            {row.original.program.code}
                        </Badge>
                    )}
                </div>
            ),
        },
        {
            accessorKey: 'current_semester',
            header: t('term'),
            cell: ({ row }) => (
                <span className="text-xs font-semibold text-foreground">
                    {t('semester_prefix')} {row.original.current_semester || 1}
                </span>
            ),
        },
        {
            accessorKey: 'enrollment_status',
            header: t('enrollment_status_page'),
            cell: ({ row }) => {
                const status = row.original.enrollment_status;

                if (status === 'enrolled') {
                    return (
                        <Badge className="border-emerald-200 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20">
                            {t('enrolled_status_enrollment')}
                        </Badge>
                    );
                }

                if (status === 'pending') {
                    return (
                        <Badge className="border-amber-200 bg-amber-500/10 text-amber-700 hover:bg-amber-500/20">
                            {t('enrollment_pending')}
                        </Badge>
                    );
                }

                if (status === 'graduated') {
                    return (
                        <Badge className="border-sky-200 bg-sky-500/10 text-sky-700 hover:bg-sky-500/20">
                            {t('enrollment_graduated')}
                        </Badge>
                    );
                }

                return <Badge variant="destructive">{status}</Badge>;
            },
        },
        {
            accessorKey: 'fee_status',
            header: t('fee_status_enrollment'),
            cell: ({ row }) => {
                const feeStatus = String(row.original.fee_status);

                if (feeStatus === 'paid') {
                    return (
                        <Badge className="border-emerald-200 bg-emerald-500/10 text-[11px] text-emerald-700">
                            {t('paid_fee_status')}
                        </Badge>
                    );
                }

                if (feeStatus === 'partial') {
                    return (
                        <Badge className="border-amber-200 bg-amber-500/10 text-[11px] text-amber-700">
                            {t('partial_fee_status')}
                        </Badge>
                    );
                }

                return (
                    <Badge variant="destructive" className="text-[11px]">
                        {t('unpaid')}
                    </Badge>
                );
            },
        },
        {
            accessorKey: 'enrollment_date',
            header: 'Enrolled Date',
            cell: ({ row }) => (
                <span className="text-xs text-muted-foreground">
                    {row.original.enrollment_date
                        ? String(row.original.enrollment_date).split('T')[0]
                        : '—'}
                </span>
            ),
        },
        {
            accessorKey: 'gpa',
            header: 'GPA',
            cell: ({ row }) => (
                <span className="text-xs font-bold text-foreground">
                    {row.original.gpa
                        ? Number(row.original.gpa).toFixed(2)
                        : '0.00'}
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
                            <Eye className="mr-1 h-3.5 w-3.5" />
                            {t('profile')}
                        </Link>
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
                { label: t('enrolled_status_enrollment'), value: 'enrolled' },
                { label: t('enrollment_pending'), value: 'pending' },
                { label: t('enrollment_suspended'), value: 'suspended' },
                { label: t('enrollment_graduated'), value: 'graduated' },
                { label: t('withdrawn'), value: 'withdrawn' },
            ],
            value: filters.status || undefined,
        },
        {
            key: 'program_id',
            title: t('program'),
            options: [
                { label: t('all_programs'), value: 'all' },
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
                { label: t('all_semesters'), value: 'all' },
                ...Array.from({ length: 8 }, (_, i) => ({
                    label: `${t('semester')} ${i + 1}`,
                    value: String(i + 1),
                })),
            ],
            value: filters.semester || undefined,
        },
        {
            key: 'fee_status',
            title: t('fee_status'),
            options: [
                { label: t('all_fees'), value: 'all' },
                { label: t('paid'), value: 'paid' },
                { label: t('partial'), value: 'partial' },
                { label: t('unpaid'), value: 'unpaid' },
            ],
            value: filters.fee_status || undefined,
        },
    ];

    return (
        <>
            <Head title={t('enrollments_management')} />

            <div className="space-y-6 p-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h1 className="text-lg font-semibold tracking-tight text-foreground">
                            {t('enrollments_management')}
                        </h1>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            {t('enrollments_description')}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/admin/admissions">
                                <Users className="mr-1.5 h-4 w-4" />
                                {t('admissions_funnel')}
                            </Link>
                        </Button>
                        <Button size="sm" asChild>
                            <Link href="/admin/students/create">
                                <UserCheck className="mr-1.5 h-4 w-4" />
                                {t('enroll_student')}
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Metric Cards */}
                <Deferred data="stats" fallback={<MetricCardsSkeleton />}>
                    {stats && (
                        <div className="grid animate-in grid-cols-1 gap-2 duration-1000 ease-in-out fade-in slide-in-from-top-6 sm:grid-cols-2 md:gap-4 lg:grid-cols-5">
                            <MetricCard
                                title={t('total_enrolled_stats')}
                                value={stats.total_enrolled}
                                icon={Users}
                                color="primary"
                            />
                            <MetricCard
                                title={t('active_students_enrollments')}
                                value={stats.active_students}
                                icon={UserCheck}
                                color="success"
                            />
                            <MetricCard
                                title={t('pending_enrollments_stats')}
                                value={stats.pending_enrollments}
                                icon={Clock}
                                color="warning"
                            />
                            <MetricCard
                                title={t('graduated_students_enrollments')}
                                value={stats.graduated_students}
                                icon={GraduationCap}
                                color="info"
                            />
                            <MetricCard
                                title={t('suspended_students_enrollments')}
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
                        <div className="rounded-md border border-border/60 bg-card p-4">
                            <DataTable
                                title={t('enrollments_list')}
                                searchTitle={t('search_enrollments')}
                                columns={columns}
                                data={enrollments.data}
                                pagination={{
                                    current_page: enrollments.current_page,
                                    last_page: enrollments.last_page,
                                    per_page: enrollments.per_page,
                                    total: enrollments.total,
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
                                        '/admin/enrollments',
                                        {},
                                        { preserveState: true },
                                    );
                                }}
                                onRowClick={(row) =>
                                    router.visit(
                                        `/admin/students/${row.original.id}`,
                                    )
                                }
                            />
                        </div>
                    )}
                </Deferred>
            </div>
        </>
    );
}

AdminEnrollmentsIndex.layout = { breadcrumbs };
