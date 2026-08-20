import React from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { router } from '@inertiajs/react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { StudentStatusBadge } from './student-status-badge';
import { StudentFeeBadge } from './student-fee-badge';
import {
    DataTableRowActionsMenu,
    DataTableRowActionItem,
    DataTableRowActionItemDestructive,
} from '@/components/tools/table/data-table-row-actions-menu';
import type { Student } from '@/types/student';
import { Eye, Edit3, KeyRound, Ban, CheckCircle2, Trash2 } from 'lucide-react';

interface StudentColumnsOptions {
    onDelete: (student: Student) => void;
    onResetPassword: (student: Student) => void;
    onToggleStatus: (student: Student) => void;
}

export function getStudentColumns({
    onDelete,
    onResetPassword,
    onToggleStatus,
}: StudentColumnsOptions): ColumnDef<Student>[] {
    return [
        {
            accessorKey: 'user.name',
            header: 'Student',
            cell: ({ row }) => {
                const student = row.original;
                const name = student.user?.name ?? 'Unknown';
                const email = student.user?.email ?? '';
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
                                {initials || 'ST'}
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
            accessorKey: 'matric_no',
            header: 'Matric No',
            cell: ({ row }) => {
                return (
                    <span className="font-mono text-xs font-medium text-foreground bg-muted/60 px-2 py-0.5 rounded border border-border/40">
                        {row.original.matric_no}
                    </span>
                );
            },
        },
        {
            accessorKey: 'program.name',
            header: 'Program',
            cell: ({ row }) => {
                const program = row.original.program;
                return (
                    <div className="flex flex-col">
                        <span className="text-xs font-medium text-foreground truncate max-w-[200px]">
                            {program?.name ?? 'Unassigned'}
                        </span>
                        {program?.degree_level && (
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                                {program.degree_level}
                            </span>
                        )}
                    </div>
                );
            },
        },
        {
            accessorKey: 'current_semester',
            header: 'Semester',
            cell: ({ row }) => {
                return (
                    <span className="text-xs font-medium text-muted-foreground">
                        Semester {row.original.current_semester ?? 1}
                    </span>
                );
            },
        },
        {
            accessorKey: 'enrollment_status',
            header: 'Status',
            cell: ({ row }) => {
                return <StudentStatusBadge status={row.original.enrollment_status} />;
            },
        },
        {
            accessorKey: 'fee_status',
            header: 'Fee Status',
            cell: ({ row }) => {
                return <StudentFeeBadge status={row.original.fee_status} />;
            },
        },
        {
            accessorKey: 'gpa',
            header: 'GPA',
            cell: ({ row }) => {
                const gpa = row.original.gpa;
                return (
                    <span className="font-mono text-xs font-medium text-foreground">
                        {gpa !== null && gpa !== undefined ? Number(gpa).toFixed(2) : '-'}
                    </span>
                );
            },
        },
        {
            id: 'actions',
            header: () => <div className="text-right">Actions</div>,
            cell: ({ row }) => {
                const student = row.original;
                const isSuspended = student.enrollment_status === 'suspended';

                return (
                    <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
                        <DataTableRowActionsMenu trigger="default" align="end">
                            <DataTableRowActionItem
                                onClick={() => router.visit(`/admin/students/${student.id}`)}
                            >
                                <Eye className="h-3.5 w-3.5 mr-2" />
                                View Profile
                            </DataTableRowActionItem>
                            <DataTableRowActionItem
                                onClick={() => router.visit(`/admin/students/${student.id}/edit`)}
                            >
                                <Edit3 className="h-3.5 w-3.5 mr-2" />
                                Edit Student
                            </DataTableRowActionItem>
                            <DataTableRowActionItem onClick={() => onResetPassword(student)}>
                                <KeyRound className="h-3.5 w-3.5 mr-2" />
                                Reset Password
                            </DataTableRowActionItem>
                            <DataTableRowActionItem onClick={() => onToggleStatus(student)}>
                                {isSuspended ? (
                                    <>
                                        <CheckCircle2 className="h-3.5 w-3.5 mr-2 text-emerald-600" />
                                        <span>Activate Account</span>
                                    </>
                                ) : (
                                    <>
                                        <Ban className="h-3.5 w-3.5 mr-2 text-amber-600" />
                                        <span>Suspend Account</span>
                                    </>
                                )}
                            </DataTableRowActionItem>
                            <DataTableRowActionItemDestructive onClick={() => onDelete(student)}>
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
