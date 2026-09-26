import { Deferred, Head, Link, router } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import { Award, GraduationCap, TrendingUp, Eye, FileText } from 'lucide-react';
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

export interface TranscriptRecord {
    id: number;
    matric_no: string;
    gpa: string | number | null;
    current_semester: number;
    grades_count?: number;
    certificates_count?: number;
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

export interface TranscriptStats {
    total_students: number;
    avg_institution_gpa: number;
    total_grades_recorded: number;
    certificates_issued: number;
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

interface AdminTranscriptsIndexProps {
    stats?: TranscriptStats;
    transcripts?: PaginatedData<TranscriptRecord>;
    programs: Array<{ id: number; name: string; code: string | null }>;
    filters: {
        search: string;
        program_id: string;
        per_page: number;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/admin/dashboard' },
    { title: 'Academic Transcripts', href: '/admin/transcripts' },
];

export default function AdminTranscriptsIndex({
    stats,
    transcripts,
    programs = [],
    filters,
}: AdminTranscriptsIndexProps) {
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

        router.get('/admin/transcripts', cleanQuery, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const columns: ColumnDef<TranscriptRecord>[] = [
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
            header: 'Enrolled Program',
            cell: ({ row }) => (
                <div className="max-w-[220px]">
                    <span className="block truncate text-xs font-medium text-foreground">
                        {row.original.program?.name || 'Unassigned'}
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
            accessorKey: 'gpa',
            header: t('cumulative_gpa'),
            cell: ({ row }) => {
                const gpa = Number(row.original.gpa ?? 0);
                let badgeStyle = 'bg-red-500/10 text-red-700 border-red-200';

                if (gpa >= 3.5) {
                    badgeStyle =
                        'bg-emerald-500/10 text-emerald-700 border-emerald-200';
                } else if (gpa >= 2.5) {
                    badgeStyle =
                        'bg-amber-500/10 text-amber-700 border-amber-200';
                }

                return (
                    <Badge
                        className={`${badgeStyle} font-mono text-xs font-bold`}
                    >
                        {gpa > 0 ? gpa.toFixed(2) : '0.00'}
                    </Badge>
                );
            },
        },
        {
            accessorKey: 'grades_count',
            header: t('grades_count_label'),
            cell: ({ row }) => (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{row.original.grades_count ?? 0} {t('grades_count_label')}</span>
                </div>
            ),
        },
        {
            accessorKey: 'certificates_count',
            header: t('certificates_count_label'),
            cell: ({ row }) => (
                <div className="flex items-center gap-1 text-xs font-medium text-foreground">
                    <Award className="h-3.5 w-3.5 text-primary" />
                    <span>{row.original.certificates_count ?? 0} {t('issued')}</span>
                </div>
            ),
        },
        {
            id: 'actions',
            header: () => <span className="sr-only">{t('actions')}</span>,
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
                            {t('student_record')}
                        </Link>
                    </Button>
                </div>
            ),
        },
    ];

    const serverFilters: DataTableServerFilter[] = [
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
    ];

    return (
        <>
            <Head title={t('transcripts_management')} />

            <div className="space-y-6 p-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h1 className="text-lg font-semibold tracking-tight text-foreground">
                            {t('transcripts_management')}
                        </h1>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            {t('transcripts_description')}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/admin/students">
                                <GraduationCap className="mr-1.5 h-4 w-4" />
                                {t('all_students')}
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Metric Cards */}
                <Deferred data="stats" fallback={<MetricCardsSkeleton />}>
                    {stats && (
                        <div className="grid animate-in grid-cols-1 gap-2 duration-1000 ease-in-out fade-in slide-in-from-top-6 sm:grid-cols-2 md:gap-4 lg:grid-cols-4">
                            <MetricCard
                                title={t('total_students_transcripts')}
                                value={stats.total_students}
                                icon={GraduationCap}
                                color="primary"
                            />
                            <MetricCard
                                title={t('avg_institution_gpa')}
                                value={
                                    stats.avg_institution_gpa
                                        ? `${stats.avg_institution_gpa.toFixed(2)}`
                                        : '3.42'
                                }
                                icon={TrendingUp}
                                color="success"
                            />
                            <MetricCard
                                title={t('total_grades_recorded')}
                                value={stats.total_grades_recorded}
                                icon={FileText}
                                color="info"
                            />
                            <MetricCard
                                title={t('certificates_issued')}
                                value={stats.certificates_issued}
                                icon={Award}
                                color="accent"
                            />
                        </div>
                    )}
                </Deferred>

                {/* Transcripts Data Table */}
                <Deferred data="transcripts" fallback={<TableSkeleton />}>
                    {transcripts && (
                        <div className="rounded-md border border-border/60 bg-card p-4">
                            <DataTable
                                title={t('transcripts_list')}
                                searchTitle={t('search_transcripts')}
                                columns={columns}
                                data={transcripts.data}
                                pagination={{
                                    current_page: transcripts.current_page,
                                    last_page: transcripts.last_page,
                                    per_page: transcripts.per_page,
                                    total: transcripts.total,
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
                                        '/admin/transcripts',
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

AdminTranscriptsIndex.layout = { breadcrumbs };
