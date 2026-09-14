import { router } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import { Eye, Edit3, Trash2 } from 'lucide-react';
import React from 'react';
import {
    DataTableRowActionsMenu,
    DataTableRowActionItem,
    DataTableRowActionItemDestructive,
} from '@/components/tools/table/data-table-row-actions-menu';
import type { CourseAssignment } from './assignment';
import { AssignmentRoleBadge } from './assignment-role-badge';
import { AssignmentStatusBadge } from './assignment-status-badge';

interface AssignmentColumnsOptions {
    onDelete: (assignment: CourseAssignment) => void;
    onEdit: (assignment: CourseAssignment) => void;
}

export function getAssignmentColumns({
    onDelete,
    onEdit,
}: AssignmentColumnsOptions): ColumnDef<CourseAssignment>[] {
    return [
        {
            accessorKey: 'course.code',
            header: 'Course',
            cell: ({ row }) => {
                const course = row.original.course;

                return (
                    <div className="flex flex-col">
                        <span className="text-sm font-medium text-foreground">
                            {course?.code ?? 'N/A'}
                        </span>
                        <span className="max-w-[180px] truncate text-xs text-muted-foreground">
                            {course?.name ?? ''}
                        </span>
                    </div>
                );
            },
        },
        {
            accessorKey: 'lecturer.user.name',
            header: 'Lecturer',
            cell: ({ row }) => {
                const lecturer = row.original.lecturer;

                return (
                    <span className="text-sm font-medium text-foreground">
                        {lecturer?.user?.name ?? 'Unknown'}
                    </span>
                );
            },
        },
        {
            accessorKey: 'academic_year',
            header: 'Academic Year',
            cell: ({ row }) => (
                <span className="text-xs font-medium text-muted-foreground">
                    {row.original.academic_year}
                </span>
            ),
        },
        {
            accessorKey: 'semester',
            header: 'Semester',
            cell: ({ row }) => (
                <span className="text-xs font-medium text-muted-foreground">
                    {row.original.semester}
                </span>
            ),
        },
        {
            accessorKey: 'section',
            header: 'Section',
            cell: ({ row }) => (
                <span className="rounded border border-border/40 bg-muted/60 px-2 py-0.5 text-xs font-medium">
                    {row.original.section}
                </span>
            ),
        },
        {
            accessorKey: 'role',
            header: 'Role',
            cell: ({ row }) => <AssignmentRoleBadge role={row.original.role} />,
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => (
                <AssignmentStatusBadge status={row.original.status} />
            ),
        },
        {
            accessorKey: 'workload_hours',
            header: 'Hours',
            cell: ({ row }) => (
                <span className="font-mono text-xs font-medium">
                    {row.original.workload_hours}
                </span>
            ),
        },
        {
            id: 'actions',
            header: () => <div className="text-right">Actions</div>,
            cell: ({ row }) => {
                const assignment = row.original;

                return (
                    <div
                        className="flex justify-end"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <DataTableRowActionsMenu trigger="default" align="end">
                            <DataTableRowActionItem
                                onClick={() =>
                                    router.visit(
                                        `/admin/assignments/${assignment.id}`,
                                    )
                                }
                            >
                                <Eye className="mr-2 h-3.5 w-3.5" />
                                View Details
                            </DataTableRowActionItem>
                            <DataTableRowActionItem
                                onClick={() => onEdit(assignment)}
                            >
                                <Edit3 className="mr-2 h-3.5 w-3.5" />
                                Edit Assignment
                            </DataTableRowActionItem>
                            <DataTableRowActionItemDestructive
                                onClick={() => onDelete(assignment)}
                            >
                                <Trash2 className="mr-2 h-3.5 w-3.5" />
                                Delete
                            </DataTableRowActionItemDestructive>
                        </DataTableRowActionsMenu>
                    </div>
                );
            },
        },
    ];
}
