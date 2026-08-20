import React from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { router } from '@inertiajs/react';
import { AdmissionStatusBadge } from './admission-status-badge';
import {
    DataTableRowActionsMenu,
    DataTableRowActionItem,
    DataTableRowActionItemDestructive,
} from '@/components/tools/table/data-table-row-actions-menu';
import type { Admission } from '@/types/admission';
import { Eye, CheckSquare, UserPlus, Trash2 } from 'lucide-react';

interface AdmissionColumnsOptions {
    onReview: (admission: Admission) => void;
    onConvert: (admission: Admission) => void;
    onDelete: (admission: Admission) => void;
}

export function getAdmissionColumns({
    onReview,
    onConvert,
    onDelete,
}: AdmissionColumnsOptions): ColumnDef<Admission>[] {
    return [
        {
            accessorKey: 'application_no',
            header: 'App No',
            cell: ({ row }) => {
                return (
                    <span className="font-mono text-xs font-semibold text-foreground bg-muted/60 px-2 py-0.5 rounded border border-border/40">
                        {row.original.application_no}
                    </span>
                );
            },
        },
        {
            accessorKey: 'full_name',
            header: 'Applicant',
            cell: ({ row }) => {
                const adm = row.original;
                return (
                    <div className="flex flex-col">
                        <span className="text-xs font-semibold text-foreground truncate">
                            {adm.full_name || `${adm.first_name} ${adm.last_name}`}
                        </span>
                        <span className="text-[11px] text-muted-foreground truncate">
                            {adm.email} {adm.phone ? `• ${adm.phone}` : ''}
                        </span>
                    </div>
                );
            },
        },
        {
            accessorKey: 'program.name',
            header: 'Desired Program',
            cell: ({ row }) => {
                const program = row.original.program;
                return (
                    <div className="flex flex-col">
                        <span className="text-xs font-medium text-foreground truncate max-w-[220px]">
                            {program?.name ?? 'Unassigned'}
                        </span>
                        {row.original.entry_semester && (
                            <span className="text-[10px] text-muted-foreground">
                                {row.original.entry_semester}
                            </span>
                        )}
                    </div>
                );
            },
        },
        {
            accessorKey: 'previous_gpa',
            header: 'Prior GPA',
            cell: ({ row }) => {
                const gpa = row.original.previous_gpa;
                return (
                    <div className="flex flex-col">
                        <span className="font-mono text-xs font-medium text-foreground">
                            {gpa !== null && gpa !== undefined ? Number(gpa).toFixed(2) : '—'}
                        </span>
                        {row.original.previous_qualification && (
                            <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                                {row.original.previous_qualification}
                            </span>
                        )}
                    </div>
                );
            },
        },
        {
            accessorKey: 'application_date',
            header: 'Date',
            cell: ({ row }) => {
                return (
                    <span className="text-xs text-muted-foreground">
                        {row.original.application_date ? String(row.original.application_date).split('T')[0] : '—'}
                    </span>
                );
            },
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => {
                return <AdmissionStatusBadge status={row.original.status} />;
            },
        },
        {
            id: 'actions',
            header: () => <div className="text-right">Actions</div>,
            cell: ({ row }) => {
                const admission = row.original;
                const isEnrolled = admission.status === 'enrolled';

                return (
                    <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
                        <DataTableRowActionsMenu trigger="default" align="end">
                            <DataTableRowActionItem
                                onClick={() => router.visit(`/admin/admissions/${admission.id}`)}
                            >
                                <Eye className="h-3.5 w-3.5 mr-2" />
                                View Details
                            </DataTableRowActionItem>
                            {!isEnrolled && (
                                <DataTableRowActionItem onClick={() => onReview(admission)}>
                                    <CheckSquare className="h-3.5 w-3.5 mr-2" />
                                    Review Status
                                </DataTableRowActionItem>
                            )}
                            {!isEnrolled && admission.status === 'approved' && (
                                <DataTableRowActionItem onClick={() => onConvert(admission)}>
                                    <UserPlus className="h-3.5 w-3.5 mr-2 text-purple-600" />
                                    <span>Convert to Student</span>
                                </DataTableRowActionItem>
                            )}
                            <DataTableRowActionItemDestructive onClick={() => onDelete(admission)}>
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
