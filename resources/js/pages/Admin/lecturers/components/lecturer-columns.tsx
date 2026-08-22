import React from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { router } from '@inertiajs/react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LecturerStatusBadge } from './lecturer-status-badge';
import {
    DataTableRowActionsMenu,
    DataTableRowActionItem,
    DataTableRowActionItemDestructive,
} from '@/components/tools/table/data-table-row-actions-menu';
import type { Lecturer } from '@/types/lecturer';
import { Eye, Edit3, KeyRound, Ban, CheckCircle2, Trash2 } from 'lucide-react';

interface LecturerColumnsOptions {
    onDelete: (lecturer: Lecturer) => void;
    onResetPassword: (lecturer: Lecturer) => void;
    onToggleStatus: (lecturer: Lecturer) => void;
}

export function getLecturerColumns({
    onDelete,
    onResetPassword,
    onToggleStatus,
}: LecturerColumnsOptions): ColumnDef<Lecturer>[] {
    return [
        {
            accessorKey: 'user.name',
            header: 'Lecturer',
            cell: ({ row }) => {
                const lecturer = row.original;
                const name = lecturer.user?.name ?? 'Unknown';
                const email = lecturer.user?.email ?? '';
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
                        <div className="flex flex-col min-w-0">
                            <span className="text-sm font-semibold text-foreground truncate">
                                {name}
                            </span>
                            <span className="text-xs text-muted-foreground truncate">
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
            cell: ({ row }) => {
                return (
                    <span className="font-mono text-xs font-medium text-foreground bg-muted/60 px-2 py-0.5 rounded border border-border/40">
                        {row.original.lecturer_no}
                    </span>
                );
            },
        },
        {
            accessorKey: 'department',
            header: 'Department',
            cell: ({ row }) => {
                return (
                    <span className="text-xs font-medium text-foreground">
                        {row.original.department}
                    </span>
                );
            },
        },
        {
            accessorKey: 'faculty',
            header: 'Faculty',
            cell: ({ row }) => {
                return (
                    <span className="text-xs text-muted-foreground">
                        {row.original.faculty}
                    </span>
                );
            },
        },
        {
            accessorKey: 'designation',
            header: 'Designation',
            cell: ({ row }) => {
                return (
                    <span className="text-xs font-medium text-foreground">
                        {row.original.designation}
                    </span>
                );
            },
        },
        {
            accessorKey: 'employment_status',
            header: 'Status',
            cell: ({ row }) => {
                return <LecturerStatusBadge status={row.original.employment_status} />;
            },
        },
        {
            accessorKey: 'contract_type',
            header: 'Contract',
            cell: ({ row }) => {
                return (
                    <span className="text-xs font-medium text-muted-foreground uppercase">
                        {row.original.contract_type}
                    </span>
                );
            },
        },
        {
            id: 'actions',
            header: () => <div className="text-right">Actions</div>,
            cell: ({ row }) => {
                const lecturer = row.original;
                const isInactive = lecturer.employment_status === 'inactive' || lecturer.employment_status === 'terminated';

                return (
                    <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
                        <DataTableRowActionsMenu trigger="default" align="end">
                            <DataTableRowActionItem
                                onClick={() => router.visit(`/admin/lecturers/${lecturer.id}`)}
                            >
                                <Eye className="h-3.5 w-3.5 mr-2" />
                                View Profile
                            </DataTableRowActionItem>
                            <DataTableRowActionItem
                                onClick={() => router.visit(`/admin/lecturers/${lecturer.id}/edit`)}
                            >
                                <Edit3 className="h-3.5 w-3.5 mr-2" />
                                Edit Lecturer
                            </DataTableRowActionItem>
                            <DataTableRowActionItem onClick={() => onResetPassword(lecturer)}>
                                <KeyRound className="h-3.5 w-3.5 mr-2" />
                                Reset Password
                            </DataTableRowActionItem>
                            <DataTableRowActionItem onClick={() => onToggleStatus(lecturer)}>
                                {isInactive ? (
                                    <>
                                        <CheckCircle2 className="h-3.5 w-3.5 mr-2 text-emerald-600" />
                                        <span>Activate Account</span>
                                    </>
                                ) : (
                                    <>
                                        <Ban className="h-3.5 w-3.5 mr-2 text-amber-600" />
                                        <span>Deactivate Account</span>
                                    </>
                                )}
                            </DataTableRowActionItem>
                            <DataTableRowActionItemDestructive onClick={() => onDelete(lecturer)}>
                                <Trash2 className="h-3.5 w-3.5 mr-2" />
                                Delete Record
                            </DataTableRowActionItemDestructive>
                        </DataTableRowActionsMenu>
                    </div>
                );
            },
        },
    ];
}