import { Head, Link, router } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import {
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Clock,
    DollarSign,
    Edit3,
    Plus,
    Trash2,
    Undo2,
    Wallet,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import { MetricCard } from '@/components/tools/MetricCard';
import { DataTable } from '@/components/tools/table/main-table';
import {
    DataTableRowActionItem,
    DataTableRowActionItemDestructive,
    DataTableRowActionsMenu,
} from '@/components/tools/table/data-table-row-actions-menu';
import { UctPanelCard } from '@/components/tools/uct-panel-card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import {
    formatHours,
    formatMoney,
    type PayrollCourseTotal,
    type PayrollEntry,
    type PayrollStatus,
} from '@/types/lecturer-payroll';
import { PayConfirmDialog } from './components/pay-confirm-dialog';
import { PayrollStatusBadge } from './components/payroll-status-badge';

interface Props {
    lecturer: {
        id: number;
        name: string;
        email: string | null;
        lecturer_no: string;
        department: string | null;
        designation: string | null;
        employment_status: string;
    };
    month: string;
    month_label: string;
    previous_month: string;
    next_month: string;
    summary: {
        sessions: number;
        hours: number;
        total: number;
        paid: number;
        outstanding: number;
        status: PayrollStatus;
    };
    courses: PayrollCourseTotal[];
    entries: PayrollEntry[];
}

export default function AdminLecturerPayrollShow({
    lecturer,
    month,
    month_label,
    previous_month,
    next_month,
    summary,
    courses,
    entries,
}: Props) {
    const [deleteTarget, setDeleteTarget] = useState<PayrollEntry | null>(null);
    const [deleteProcessing, setDeleteProcessing] = useState(false);
    const [payOpen, setPayOpen] = useState(false);
    const [payProcessing, setPayProcessing] = useState(false);

    const base = `/admin/lecturer-payroll/lecturers/${lecturer.id}`;
    const initials = lecturer.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();

    const confirmDelete = () => {
        if (!deleteTarget) {
            return;
        }

        setDeleteProcessing(true);
        router.delete(`/admin/lecturer-payroll/sessions/${deleteTarget.id}`, {
            preserveScroll: true,
            onFinish: () => {
                setDeleteProcessing(false);
                setDeleteTarget(null);
            },
        });
    };

    const confirmPay = () => {
        setPayProcessing(true);
        router.post(
            `${base}/paid`,
            { month },
            {
                preserveScroll: true,
                onFinish: () => {
                    setPayProcessing(false);
                    setPayOpen(false);
                },
            },
        );
    };

    const columns = useMemo<ColumnDef<PayrollEntry>[]>(
        () => [
            {
                accessorKey: 'session_date',
                header: 'Date',
                cell: ({ row }) => (
                    <span className="text-xs font-medium text-foreground">
                        {row.original.session_date}
                    </span>
                ),
            },
            {
                accessorKey: 'course',
                header: 'Course',
                cell: ({ row }) => (
                    <div className="flex min-w-0 flex-col">
                        <span className="truncate text-sm font-semibold text-foreground">
                            {row.original.course}
                        </span>
                        {row.original.notes && (
                            <span className="truncate text-xs text-muted-foreground">
                                {row.original.notes}
                            </span>
                        )}
                    </div>
                ),
            },
            {
                accessorKey: 'hours',
                header: 'Hours',
                cell: ({ row }) => (
                    <span className="text-xs font-medium">
                        {formatHours(row.original.hours)}
                    </span>
                ),
            },
            {
                accessorKey: 'hourly_rate',
                header: 'Rate',
                cell: ({ row }) => (
                    <span className="text-xs text-muted-foreground">
                        {formatMoney(row.original.hourly_rate)}
                    </span>
                ),
            },
            {
                accessorKey: 'amount',
                header: 'Amount',
                cell: ({ row }) => (
                    <span className="text-sm font-semibold">
                        {formatMoney(row.original.amount)}
                    </span>
                ),
            },
            {
                accessorKey: 'paid',
                header: 'Status',
                cell: ({ row }) => (
                    <PayrollStatusBadge
                        status={row.original.paid ? 'paid' : 'unpaid'}
                    />
                ),
            },
            {
                id: 'actions',
                header: () => <div className="text-right">Actions</div>,
                cell: ({ row }) => {
                    const entry = row.original;

                    if (entry.paid) {
                        return (
                            <div className="text-right text-xs text-muted-foreground">
                                Locked
                            </div>
                        );
                    }

                    return (
                        <div
                            className="flex justify-end"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <DataTableRowActionsMenu
                                trigger="default"
                                align="end"
                            >
                                <DataTableRowActionItem
                                    onClick={() =>
                                        router.visit(
                                            `/admin/lecturer-payroll/sessions/${entry.id}/edit`,
                                        )
                                    }
                                >
                                    <Edit3 className="mr-2 h-3.5 w-3.5" />
                                    Edit Hours
                                </DataTableRowActionItem>
                                <DataTableRowActionItemDestructive
                                    onClick={() => setDeleteTarget(entry)}
                                >
                                    <Trash2 className="mr-2 h-3.5 w-3.5" />
                                    Delete Entry
                                </DataTableRowActionItemDestructive>
                            </DataTableRowActionsMenu>
                        </div>
                    );
                },
            },
        ],
        [],
    );

    return (
        <>
            <Head title={`Payroll - ${lecturer.name}`} />

            <div className="space-y-6 p-6">
                {/* Profile Header Banner */}
                <UctPanelCard
                    type="default"
                    className="overflow-hidden"
                    title={
                        <div className="flex flex-col items-start gap-3.5 sm:flex-row sm:items-center">
                            <Avatar className="h-14 w-14 shrink-0 border-2 border-primary/20">
                                <AvatarFallback className="bg-primary/10 text-base font-bold text-primary">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                            <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-lg font-bold tracking-tight text-foreground">
                                        {lecturer.name}
                                    </span>
                                    <span className="rounded border border-border/60 bg-muted px-2 py-0.5 font-mono text-xs font-semibold text-foreground">
                                        {lecturer.lecturer_no}
                                    </span>
                                    {summary.sessions > 0 && (
                                        <PayrollStatusBadge
                                            status={summary.status}
                                        />
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {lecturer.designation
                                        ? `${lecturer.designation} • `
                                        : ''}
                                    {lecturer.department}
                                </p>
                            </div>
                        </div>
                    }
                    actions={
                        <div className="flex flex-wrap items-center gap-2">
                            <Button variant="outline" size="sm" asChild>
                                <Link
                                    href={`/admin/lecturer-payroll/create?lecturer_id=${lecturer.id}`}
                                >
                                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                                    Add Hours
                                </Link>
                            </Button>
                            {summary.outstanding > 0 && (
                                <Button
                                    size="sm"
                                    onClick={() => setPayOpen(true)}
                                >
                                    <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                                    Mark as Paid
                                </Button>
                            )}
                            {summary.paid > 0 && (
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() =>
                                        router.delete(`${base}/paid`, {
                                            data: { month },
                                            preserveScroll: true,
                                        })
                                    }
                                >
                                    <Undo2 className="mr-1.5 h-3.5 w-3.5" />
                                    Undo Payment
                                </Button>
                            )}
                        </div>
                    }
                />

                {/* Month switcher */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" asChild>
                            <Link
                                href={`${base}?month=${previous_month}`}
                                aria-label="Previous month"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <span className="min-w-36 text-center text-sm font-semibold">
                            {month_label}
                        </span>
                        <Button variant="outline" size="icon" asChild>
                            <Link
                                href={`${base}?month=${next_month}`}
                                aria-label="Next month"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                        <Link href={`/admin/lecturer-payroll?month=${month}`}>
                            Back to Payroll
                        </Link>
                    </Button>
                </div>

                {/* Metric cards */}
                <div className="grid animate-in grid-cols-1 gap-2 duration-700 fade-in slide-in-from-top-6 sm:grid-cols-2 md:gap-4 lg:grid-cols-4">
                    <MetricCard
                        title="Hours Taught"
                        value={formatHours(summary.hours)}
                        description={`${summary.sessions} sessions`}
                        icon={Clock}
                        variant="info"
                    />
                    <MetricCard
                        title="Total Pay"
                        value={formatMoney(summary.total)}
                        description="Hours × hourly rate"
                        icon={DollarSign}
                        variant="primary"
                    />
                    <MetricCard
                        title="Already Paid"
                        value={formatMoney(summary.paid)}
                        description="Marked as paid"
                        icon={CheckCircle2}
                        variant="success"
                    />
                    <MetricCard
                        title="Still To Pay"
                        value={formatMoney(summary.outstanding)}
                        description="Waiting for payment"
                        icon={Wallet}
                        variant="warning"
                    />
                </div>

                {/* By course */}
                {courses.length > 0 && (
                    <UctPanelCard
                        title="Hours by Course"
                        description="What this lecturer earned on each course this month."
                        icon={Clock}
                        type="info"
                    >
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {courses.map((c) => (
                                <div
                                    key={c.course_id}
                                    className="rounded-lg border border-border/60 bg-background p-3 transition-colors hover:border-primary/40"
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="font-mono text-xs font-semibold">
                                            {c.code}
                                        </span>
                                        <Badge
                                            variant="outline"
                                            className="text-[11px]"
                                        >
                                            {c.sessions}{' '}
                                            {c.sessions === 1
                                                ? 'session'
                                                : 'sessions'}
                                        </Badge>
                                    </div>
                                    <p className="mt-1 truncate text-xs text-muted-foreground">
                                        {c.name}
                                    </p>
                                    <div className="mt-3 flex items-end justify-between">
                                        <span className="text-sm font-medium">
                                            {formatHours(c.hours)}
                                        </span>
                                        <span className="text-base font-bold text-foreground">
                                            {formatMoney(c.total)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </UctPanelCard>
                )}

                {/* Entries */}
                <div className="animate-in duration-700 fade-in slide-in-from-bottom-6">
                    <DataTable
                        title="Teaching Sessions"
                        searchTitle="Search sessions..."
                        searchable={false}
                        hideFilter
                        hidePagination
                        columns={columns}
                        data={entries}
                    />
                </div>

                <ConfirmDeleteDialog
                    open={!!deleteTarget}
                    onOpenChange={(open) => !open && setDeleteTarget(null)}
                    title="Delete Entry"
                    description="This removes the hours from this month's payroll."
                    itemName={
                        deleteTarget
                            ? `${deleteTarget.session_date} – ${deleteTarget.course}`
                            : undefined
                    }
                    loading={deleteProcessing}
                    onConfirm={confirmDelete}
                />

                <PayConfirmDialog
                    open={payOpen}
                    onOpenChange={setPayOpen}
                    description={`Confirm that ${lecturer.name} was paid ${formatMoney(summary.outstanding)} for ${month_label}.`}
                    loading={payProcessing}
                    onConfirm={confirmPay}
                />
            </div>
        </>
    );
}

AdminLecturerPayrollShow.layout = (page: any) => {
    const lecturer = page?.props?.lecturer;
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/admin/dashboard' },
        { title: 'Lecturer Payroll', href: '/admin/lecturer-payroll' },
        { title: lecturer?.name ?? 'Lecturer', href: '#' },
    ];

    return <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>;
};
