import { router } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import { CheckCircle2, Eye, Plus, Undo2 } from 'lucide-react';
import React from 'react';
import {
    DataTableRowActionItem,
    DataTableRowActionsMenu,
} from '@/components/tools/table/data-table-row-actions-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    formatHours,
    formatMoney,
    type PayrollRow,
} from '@/types/lecturer-payroll';
import { PayrollStatusBadge } from './payroll-status-badge';

interface PayrollColumnsOptions {
    month: string;
    onMarkPaid: (row: PayrollRow) => void;
    onUndoPaid: (row: PayrollRow) => void;
}

export function getPayrollColumns({
    month,
    onMarkPaid,
    onUndoPaid,
}: PayrollColumnsOptions): ColumnDef<PayrollRow>[] {
    return [
        {
            accessorKey: 'name',
            header: 'Lecturer',
            cell: ({ row }) => {
                const { name, email } = row.original;
                const initials = name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .substring(0, 2)
                    .toUpperCase();

                return (
                    <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 border border-border">
                            <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                                {initials || 'LEC'}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex min-w-0 flex-col">
                            <span className="truncate text-sm font-semibold text-foreground">
                                {name}
                            </span>
                            <span className="truncate text-xs text-muted-foreground">
                                {email}
                            </span>
                        </div>
                    </div>
                );
            },
        },
        {
            accessorKey: 'lecturer_no',
            header: 'Lecturer No',
            cell: ({ row }) => (
                <span className="rounded border border-border/40 bg-muted/60 px-2 py-0.5 font-mono text-xs font-medium text-foreground">
                    {row.original.lecturer_no}
                </span>
            ),
        },
        {
            accessorKey: 'sessions',
            header: 'Sessions',
            cell: ({ row }) => (
                <span className="text-xs font-medium text-foreground">
                    {row.original.sessions}
                </span>
            ),
        },
        {
            accessorKey: 'hours',
            header: 'Hours',
            cell: ({ row }) => (
                <span className="text-xs font-medium text-foreground">
                    {formatHours(row.original.hours)}
                </span>
            ),
        },
        {
            accessorKey: 'total',
            header: 'Amount',
            cell: ({ row }) => (
                <span className="text-sm font-semibold text-foreground">
                    {formatMoney(row.original.total)}
                </span>
            ),
        },
        {
            accessorKey: 'outstanding',
            header: 'Still To Pay',
            cell: ({ row }) => (
                <span
                    className={
                        row.original.outstanding > 0
                            ? 'text-xs font-semibold text-amber-600'
                            : 'text-xs text-muted-foreground'
                    }
                >
                    {formatMoney(row.original.outstanding)}
                </span>
            ),
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => (
                <PayrollStatusBadge status={row.original.status} />
            ),
        },
        {
            id: 'actions',
            header: () => <div className="text-right">Actions</div>,
            cell: ({ row }) => {
                const item = row.original;

                return (
                    <div
                        className="flex justify-end"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <DataTableRowActionsMenu trigger="default" align="end">
                            <DataTableRowActionItem
                                onClick={() =>
                                    router.visit(
                                        `/admin/lecturer-payroll/lecturers/${item.lecturer_id}?month=${month}`,
                                    )
                                }
                            >
                                <Eye className="mr-2 h-3.5 w-3.5" />
                                View Details
                            </DataTableRowActionItem>
                            <DataTableRowActionItem
                                onClick={() =>
                                    router.visit(
                                        `/admin/lecturer-payroll/create?lecturer_id=${item.lecturer_id}`,
                                    )
                                }
                            >
                                <Plus className="mr-2 h-3.5 w-3.5" />
                                Add Hours
                            </DataTableRowActionItem>
                            {item.outstanding > 0 && (
                                <DataTableRowActionItem
                                    onClick={() => onMarkPaid(item)}
                                >
                                    <CheckCircle2 className="mr-2 h-3.5 w-3.5 text-emerald-600" />
                                    Mark as Paid
                                </DataTableRowActionItem>
                            )}
                            {item.paid > 0 && (
                                <DataTableRowActionItem
                                    onClick={() => onUndoPaid(item)}
                                >
                                    <Undo2 className="mr-2 h-3.5 w-3.5 text-amber-600" />
                                    Undo Payment
                                </DataTableRowActionItem>
                            )}
                        </DataTableRowActionsMenu>
                    </div>
                );
            },
        },
    ];
}
