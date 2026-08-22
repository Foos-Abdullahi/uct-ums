import React from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { router } from '@inertiajs/react';
import { CourseAssignment } from './assignment';
import {
    DataTableRowActionsMenu,
    DataTableRowActionItem,
    DataTableRowActionItemDestructive,
} from '@/components/tools/table/data-table-row-actions-menu';
import { AssignmentStatusBadge } from './assignment-status-badge';
import { AssignmentRoleBadge } from './assignment-role-badge';
import { Eye, Edit3, Trash2 } from 'lucide-react';

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
                        <span className="text-xs text-muted-foreground truncate max-w-[180px]">
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
                <span className="text-xs font-medium bg-muted/60 px-2 py-0.5 rounded border border-border/40">
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
            cell: ({ row }) => <AssignmentStatusBadge status={row.original.status} />,
        },
        {
            accessorKey: 'workload_hours',
            header: 'Hours',
            cell: ({ row }) => (
                <span className="text-xs font-mono font-medium">
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
                    <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
                        <DataTableRowActionsMenu trigger="default" align="end">
                            <DataTableRowActionItem
                                onClick={() => router.visit(`/admin/assignments/${assignment.id}`)}
                            >
                                <Eye className="h-3.5 w-3.5 mr-2" />
                                View Details
                            </DataTableRowActionItem>
                            <DataTableRowActionItem onClick={() => onEdit(assignment)}>
                                <Edit3 className="h-3.5 w-3.5 mr-2" />
                                Edit Assignment
                            </DataTableRowActionItem>
                            <DataTableRowActionItemDestructive onClick={() => onDelete(assignment)}>
                                <Trash2 className="h-3.5 w-3.5 mr-2" />
                                Delete
                            </DataTableRowActionItemDestructive>
                        </DataTableRowActionsMenu>
                    </div>
                );
            },
        },
    ];
}