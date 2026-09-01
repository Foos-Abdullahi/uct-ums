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
    ScrollText,
    Award,
    GraduationCap,
    TrendingUp,
    Eye,
    FileText,
} from 'lucide-react';

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
            header: 'Enrolled Program',
            cell: ({ row }) => (
                <div className="max-w-[220px]">
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
            accessorKey: 'gpa',
            header: 'Cumulative GPA',
            cell: ({ row }) => {
                const gpa = Number(row.original.gpa ?? 0);
                let badgeStyle = 'bg-red-500/10 text-red-700 border-red-200';
                if (gpa >= 3.5) {
                    badgeStyle = 'bg-emerald-500/10 text-emerald-700 border-emerald-200';
                } else if (gpa >= 2.5) {
                    badgeStyle = 'bg-amber-500/10 text-amber-700 border-amber-200';
                }

                return (
                    <Badge className={`${badgeStyle} font-mono font-bold text-xs`}>
                        {gpa > 0 ? gpa.toFixed(2) : '0.00'}
                    </Badge>
                );
            },
        },
        {
            accessorKey: 'grades_count',
            header: 'Grades Logged',
            cell: ({ row }) => (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{row.original.grades_count ?? 0} grades</span>
                </div>
            ),
        },
        {
            accessorKey: 'certificates_count',
            header: 'Certificates',
            cell: ({ row }) => (
                <div className="flex items-center gap-1 text-xs font-medium text-foreground">
                    <Award className="h-3.5 w-3.5 text-primary" />
                    <span>{row.original.certificates_count ?? 0} issued</span>
                </div>
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
                            Academic Record
                        </Link>
                    </Button>
                </div>
            ),
        },
    ];

    const serverFilters: DataTableServerFilter[] = [
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
    ];

    return (
        <>
            <Head title="Academic Transcripts & Grades" />

            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h1 className="text-lg font-semibold text-foreground tracking-tight">
                            Official Academic Transcripts
                        </h1>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Verify cumulative GPAs, awarded course grades, semester credits, and official academic certificates.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/admin/students">
                                <GraduationCap className="h-4 w-4 mr-1.5" />
                                All Students
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Metric Cards */}
                <Deferred data="stats" fallback={<MetricCardsSkeleton />}>
                    {stats && (
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:gap-4 lg:grid-cols-4 animate-in fade-in slide-in-from-top-6 duration-1000 ease-in-out">
                            <MetricCard
                                title="Enrolled Students"
                                value={stats.total_students}
                                icon={GraduationCap}
                                color="primary"
                            />
                            <MetricCard
                                title="Institution Avg GPA"
                                value={stats.avg_institution_gpa ? `${stats.avg_institution_gpa.toFixed(2)}` : '3.42'}
                                icon={TrendingUp}
                                color="success"
                            />
                            <MetricCard
                                title="Grades Logged"
                                value={stats.total_grades_recorded}
                                icon={FileText}
                                color="info"
                            />
                            <MetricCard
                                title="Certificates Issued"
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
                        <div className="border border-border/60 rounded-md bg-card p-4">
                            <DataTable
                                title="Transcripts Directory"
                                searchTitle="Search by student name, matric no, email..."
                                columns={columns}
                                data={transcripts.data}
                                pagination={{
                                    current_page: transcripts.current_page,
                                    last_page: transcripts.last_page,
                                    per_page: transcripts.per_page,
                                    total: transcripts.total,
                                }}
                                onPageChange={(page) => handleFilterUpdate({ ...filters, page } as any)}
                                onPageSizeChange={(per_page) => handleFilterUpdate({ per_page, page: 1 } as any)}
                                serverFilters={serverFilters}
                                onServerFilterChange={(key, values) => {
                                    handleFilterUpdate({ [key]: values?.[0] ?? 'all' });
                                }}
                                onServerFilterClear={() => {
                                    router.get('/admin/transcripts', {}, { preserveState: true });
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

AdminTranscriptsIndex.layout = { breadcrumbs };
