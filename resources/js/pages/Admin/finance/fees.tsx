import { Deferred, Head, Link, router, useForm } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import {
    Receipt,
    CheckCircle2,
    Clock,
    AlertCircle,
    DollarSign,
    Users,
    Eye,
    Loader2,
    Plus,
} from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { MetricCardsSkeleton } from '@/components/tools/metric-cards-skeleton';
import { MetricCard } from '@/components/tools/MetricCard';
import { DataTable } from '@/components/tools/table/main-table';
import type { DataTableServerFilter } from '@/components/tools/table/types';
import { TableSkeleton } from '@/components/tools/table-skeleton';
import { UctPanelCard } from '@/components/tools/uct-panel-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { BreadcrumbItem } from '@/types';

export interface StudentFeeRecord {
    id: number;
    matric_no: string;
    fee_status: string;
    total_billed?: number;
    total_paid?: number;
    user?: {
        name: string;
        email: string;
    };
    program?: {
        id: number;
        name: string;
        code: string | null;
        degree_level: string;
    };
}

export interface FeeStats {
    total_students: number;
    fully_paid_students: number;
    partial_students: number;
    unpaid_students: number;
    total_receivables: number;
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

interface AdminFinanceFeesProps {
    stats?: FeeStats;
    students?: PaginatedData<StudentFeeRecord>;
    programs: Array<{
        id: number;
        name: string;
        code: string | null;
        degree_level: string;
    }>;
    recording_students: Array<{
        id: number;
        matric_no: string;
        name: string;
    }>;
    filters: {
        search: string;
        program_id: string;
        fee_status: string;
        per_page: number;
    };
}

export default function AdminFinanceFees({
    stats,
    students,
    programs = [],
    recording_students: recordingStudents = [],
    filters,
}: AdminFinanceFeesProps) {
    const { t } = useTranslation();
    const [recordFeeOpen, setRecordFeeOpen] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        student_id: '',
        title: '',
        type: 'tuition',
        amount: '',
        due_date: '',
    });

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('breadcrumb_dashboard'), href: '/admin/dashboard' },
        { title: t('breadcrumb_finance'), href: '/admin/finance' },
        { title: t('breadcrumb_fees'), href: '/admin/finance/fees' },
    ];

    const formatCurrency = (val: number) =>
        `$${Number(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

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

        router.get('/admin/finance/fees', cleanQuery, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleRecordFee = (event: React.FormEvent) => {
        event.preventDefault();

        post('/admin/finance/invoices', {
            onSuccess: () => {
                toast.success('Fee recorded successfully.');
                reset();
                setRecordFeeOpen(false);
            },
            onError: () => {
                toast.error('Please correct the highlighted fee details.');
            },
        });
    };

    const columns: ColumnDef<StudentFeeRecord>[] = [
        {
            accessorKey: 'matric_no',
            header: t('matric_no_fees'),
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
            header: t('student_name'),
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
            header: t('program_filter_fees'),
            cell: ({ row }) => (
                <div className="max-w-[200px]">
                    <span className="block truncate text-xs font-medium text-foreground">
                        {row.original.program?.name || t('unassigned')}
                    </span>
                    <Badge
                        variant="secondary"
                        className="mt-0.5 text-[10px] capitalize uppercase"
                    >
                        {row.original.program?.degree_level || 'Undergraduate'}
                    </Badge>
                </div>
            ),
        },
        {
            accessorKey: 'total_billed',
            header: t('total_billed'),
            cell: ({ row }) => (
                <span className="text-xs font-semibold text-foreground">
                    {formatCurrency(row.original.total_billed ?? 0)}
                </span>
            ),
        },
        {
            accessorKey: 'total_paid',
            header: t('total_paid_fees'),
            cell: ({ row }) => (
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(row.original.total_paid ?? 0)}
                </span>
            ),
        },
        {
            id: 'balance',
            header: t('balance'),
            cell: ({ row }) => {
                const billed = Number(row.original.total_billed ?? 0);
                const paid = Number(row.original.total_paid ?? 0);
                const balance = Math.max(0, billed - paid);

                return (
                    <span
                        className={`text-xs font-bold ${balance > 0 ? 'text-destructive' : 'text-muted-foreground'}`}
                    >
                        {balance > 0 ? formatCurrency(balance) : '$0.00'}
                    </span>
                );
            },
        },
        {
            accessorKey: 'fee_status',
            header: 'Status',
            cell: ({ row }) => {
                const status = String(row.original.fee_status);

                if (status === 'paid') {
                    return (
                        <Badge className="border-emerald-200 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20">
                            {t('fully_paid_status')}
                        </Badge>
                    );
                }

                if (status === 'partial') {
                    return (
                        <Badge className="border-amber-200 bg-amber-500/10 text-amber-700 hover:bg-amber-500/20">
                            {t('partial_status')}
                        </Badge>
                    );
                }

                return (
                    <Badge variant="destructive">{t('unpaid_status')}</Badge>
                );
            },
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
                        <Link
                            href={`/admin/students/${row.original.id}?tab=finance`}
                        >
                            <Eye className="mr-1 h-3.5 w-3.5" />
                            {t('view_student_profile')}
                        </Link>
                    </Button>
                </div>
            ),
        },
    ];

    const serverFilters: DataTableServerFilter[] = [
        {
            key: 'fee_status',
            title: t('fee_status_filter'),
            options: [
                { label: t('all_fee_statuses'), value: 'all' },
                { label: t('fully_paid_status'), value: 'paid' },
                { label: t('partial_status'), value: 'partial' },
                { label: t('unpaid_status'), value: 'unpaid' },
            ],
            value: filters.fee_status || undefined,
        },
        {
            key: 'program_id',
            title: t('program_filter_fees'),
            options: [
                { label: t('all_programs_fees'), value: 'all' },
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
            <Head title={t('fee_schedules')} />

            <div className="space-y-6 p-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h1 className="text-lg font-semibold tracking-tight text-foreground">
                            {t('fee_schedules')}
                        </h1>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            {t('fee_schedules_description')}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            size="sm"
                            onClick={() => setRecordFeeOpen(true)}
                        >
                            <Plus className="mr-1.5 h-4 w-4" />
                            Record fee
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/admin/finance/invoices">
                                <Receipt className="mr-1.5 h-4 w-4" />
                                {t('invoices_list_page')}
                            </Link>
                        </Button>
                        <Button size="sm" asChild>
                            <Link href="/admin/finance/payments">
                                <DollarSign className="mr-1.5 h-4 w-4" />
                                {t('record_payment')}
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Metric Cards */}
                <Deferred data="stats" fallback={<MetricCardsSkeleton />}>
                    {stats && (
                        <div className="grid animate-in grid-cols-1 gap-2 duration-1000 ease-in-out fade-in slide-in-from-top-6 sm:grid-cols-2 md:gap-4 lg:grid-cols-5">
                            <MetricCard
                                title={t('total_receivables')}
                                value={formatCurrency(stats.total_receivables)}
                                icon={DollarSign}
                                color="destructive"
                            />
                            <MetricCard
                                title={t('fully_paid_students')}
                                value={`${stats.fully_paid_students} ${t('students')}`}
                                icon={CheckCircle2}
                                color="success"
                            />
                            <MetricCard
                                title={t('partial_students')}
                                value={`${stats.partial_students} ${t('students')}`}
                                icon={Clock}
                                color="warning"
                            />
                            <MetricCard
                                title={t('unpaid_students')}
                                value={`${stats.unpaid_students} ${t('students')}`}
                                icon={AlertCircle}
                                color="destructive"
                            />
                            <MetricCard
                                title={t('total_students_fees')}
                                value={`${stats.total_students} ${t('students')}`}
                                icon={Users}
                                color="primary"
                            />
                        </div>
                    )}
                </Deferred>

                {/* Fee Structure Reference Matrix */}
                <UctPanelCard
                    title={t('institutional_tuition_schedule')}
                    description={t('approved_fee_schedule')}
                    icon={Receipt}
                >
                    <div className="grid grid-cols-1 gap-4 pt-2 md:grid-cols-3">
                        <div className="space-y-2 rounded border border-border/60 bg-muted/20 p-3.5">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-foreground">
                                    {t('undergraduate_tuition')}
                                </span>
                                <Badge
                                    variant="outline"
                                    className="text-[10px]"
                                >
                                    {t('bachelor')}
                                </Badge>
                            </div>
                            <p className="text-xl font-bold text-foreground">
                                $450.00{' '}
                                <span className="text-xs font-normal text-muted-foreground">
                                    / {t('semester')}
                                </span>
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                                {t('includes_registration')}
                            </p>
                        </div>

                        <div className="space-y-2 rounded border border-border/60 bg-muted/20 p-3.5">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-foreground">
                                    {t('postgraduate_tuition')}
                                </span>
                                <Badge
                                    variant="outline"
                                    className="text-[10px]"
                                >
                                    {t('master')} / {t('phd')}
                                </Badge>
                            </div>
                            <p className="text-xl font-bold text-foreground">
                                $750.00{' '}
                                <span className="text-xs font-normal text-muted-foreground">
                                    / {t('semester')}
                                </span>
                            </p>
                            <p className="text-[11px text-muted-foreground">
                                {t('includes_thesis')}
                            </p>
                        </div>

                        <div className="space-y-2 rounded border border-border/60 bg-muted/20 p-3.5">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-foreground">
                                    {t('one_time_institutional_fees')}
                                </span>
                                <Badge
                                    variant="outline"
                                    className="text-[10px]"
                                >
                                    Ancillary
                                </Badge>
                            </div>
                            <div className="space-y-1 pt-1 text-xs text-muted-foreground">
                                <div className="flex justify-between">
                                    <span>{t('admission_matriculation')}:</span>{' '}
                                    <span className="font-semibold text-foreground">
                                        $50.00
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span>{t('graduation_transcript')}:</span>{' '}
                                    <span className="font-semibold text-foreground">
                                        $100.00
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </UctPanelCard>

                {/* Student Fee Ledger Data Table */}
                <Deferred data="students" fallback={<TableSkeleton />}>
                    {students && (
                        <div className="rounded-md border border-border/60 bg-card p-4">
                            <DataTable
                                title={t('fees_list_label')}
                                searchTitle={t('search_fees')}
                                columns={columns}
                                data={students.data}
                                pagination={{
                                    current_page: students.current_page,
                                    last_page: students.last_page,
                                    per_page: students.per_page,
                                    total: students.total,
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
                                        '/admin/finance/fees',
                                        {},
                                        { preserveState: true },
                                    );
                                }}
                                onRowClick={(row) =>
                                    router.visit(
                                        `/admin/students/${row.original.id}?tab=finance`,
                                    )
                                }
                            />
                        </div>
                    )}
                </Deferred>

                <Dialog open={recordFeeOpen} onOpenChange={setRecordFeeOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-base font-semibold">
                                Record student fee
                            </DialogTitle>
                            <DialogDescription className="text-xs">
                                Select the student and fee category to issue a
                                new charge.
                            </DialogDescription>
                        </DialogHeader>

                        <form
                            onSubmit={handleRecordFee}
                            className="space-y-4 py-2"
                        >
                            <div className="space-y-1.5">
                                <Label
                                    htmlFor="record-fee-student"
                                    className="text-xs font-semibold"
                                >
                                    Student{' '}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <select
                                    id="record-fee-student"
                                    className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:ring-1 focus:ring-ring focus:outline-none"
                                    value={data.student_id}
                                    onChange={(event) =>
                                        setData(
                                            'student_id',
                                            event.target.value,
                                        )
                                    }
                                    required
                                >
                                    <option value="">Select student</option>
                                    {recordingStudents.map((student) => (
                                        <option
                                            key={student.id}
                                            value={student.id}
                                        >
                                            {student.name} ({student.matric_no})
                                        </option>
                                    ))}
                                </select>
                                {errors.student_id && (
                                    <p className="text-[11px] text-destructive">
                                        {errors.student_id}
                                    </p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label
                                        htmlFor="record-fee-type"
                                        className="text-xs font-semibold"
                                    >
                                        Fee type{' '}
                                        <span className="text-destructive">
                                            *
                                        </span>
                                    </Label>
                                    <Input
                                        id="record-fee-type"
                                        placeholder="e.g. Registration Fee"
                                        value={data.type}
                                        onChange={(event) =>
                                            setData('type', event.target.value)
                                        }
                                        required
                                    />
                                    {errors.type && (
                                        <p className="text-[11px] text-destructive">
                                            {errors.type}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-1.5">
                                    <Label
                                        htmlFor="record-fee-amount"
                                        className="text-xs font-semibold"
                                    >
                                        Amount ($){' '}
                                        <span className="text-destructive">
                                            *
                                        </span>
                                    </Label>
                                    <Input
                                        id="record-fee-amount"
                                        type="number"
                                        min="1"
                                        step="0.01"
                                        value={data.amount}
                                        onChange={(event) =>
                                            setData(
                                                'amount',
                                                event.target.value,
                                            )
                                        }
                                        required
                                    />
                                    {errors.amount && (
                                        <p className="text-[11px] text-destructive">
                                            {errors.amount}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label
                                    htmlFor="record-fee-title"
                                    className="text-xs font-semibold"
                                >
                                    Charge title{' '}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="record-fee-title"
                                    placeholder="e.g. Registration Fee - 2026/27"
                                    value={data.title}
                                    onChange={(event) =>
                                        setData('title', event.target.value)
                                    }
                                    required
                                />
                                {errors.title && (
                                    <p className="text-[11px] text-destructive">
                                        {errors.title}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <Label
                                    htmlFor="record-fee-due-date"
                                    className="text-xs font-semibold"
                                >
                                    Due date
                                </Label>
                                <Input
                                    id="record-fee-due-date"
                                    type="date"
                                    value={data.due_date}
                                    onChange={(event) =>
                                        setData('due_date', event.target.value)
                                    }
                                />
                                {errors.due_date && (
                                    <p className="text-[11px] text-destructive">
                                        {errors.due_date}
                                    </p>
                                )}
                            </div>

                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    disabled={processing}
                                    onClick={() => setRecordFeeOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    size="sm"
                                    disabled={processing}
                                >
                                    {processing && (
                                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                    )}
                                    Record fee
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}

AdminFinanceFees.layout = {
    breadcrumbs: [
        { title: 'breadcrumb_dashboard', href: '/admin/dashboard' },
        { title: 'breadcrumb_finance', href: '/admin/finance' },
        { title: 'breadcrumb_fees', href: '/admin/finance/fees' },
    ],
};
