import React, { useState } from 'react';
import { Deferred, Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { MetricCard } from '@/components/tools/MetricCard';
import { MetricCardsSkeleton } from '@/components/tools/metric-cards-skeleton';
import { DataTable } from '@/components/tools/table/main-table';
import { TableSkeleton } from '@/components/tools/table-skeleton';
import { getLecturerColumns } from './components/lecturer-columns';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import { ResetPasswordModal } from '@/components/tools/reset-password-modal';
import type { BreadcrumbItem } from '@/types';
import type { PaginatedData, Lecturer, LecturerStats } from '@/types/lecturer';
import type { DataTableServerFilter } from '@/components/tools/table/types';
import {
    Users,
    UserCheck,
    UserX,
    UserCog,
    Briefcase,
    Plus,
} from 'lucide-react';
import { toast } from 'sonner';

interface AdminLecturersIndexProps {
    stats?: LecturerStats;
    lecturers?: PaginatedData<Lecturer>;
    departments: string[];
    faculties: string[];
    filters: {
        search: string;
        employment_status: string;
        department: string;
        faculty: string;
        contract_type: string;
        per_page: number;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/admin/dashboard' },
    { title: 'Lecturers', href: '/admin/lecturers' },
];

export default function AdminLecturersIndex({
    stats,
    lecturers,
    departments = [],
    faculties = [],
    filters,
}: AdminLecturersIndexProps) {
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [selectedLecturerForDelete, setSelectedLecturerForDelete] = useState<Lecturer | null>(null);
    const [deleteProcessing, setDeleteProcessing] = useState(false);

    const [passwordModalOpen, setPasswordModalOpen] = useState(false);
    const [selectedLecturerForPassword, setSelectedLecturerForPassword] = useState<Lecturer | null>(null);

    const handleFilterUpdate = (newFilters: Partial<typeof filters>) => {
        router.get(
            '/admin/lecturers',
            { ...filters, ...newFilters },
            { preserveState: true, preserveScroll: true, replace: true }
        );
    };

    const confirmDelete = () => {
        if (!selectedLecturerForDelete) return;

        setDeleteProcessing(true);
        router.delete(`/admin/lecturers/${selectedLecturerForDelete.id}`, {
            onSuccess: () => {
                toast.success(`Lecturer ${selectedLecturerForDelete.user?.name} deleted successfully.`);
                setDeleteModalOpen(false);
                setSelectedLecturerForDelete(null);
                setDeleteProcessing(false);
            },
            onError: () => {
                toast.error('Failed to delete lecturer record.');
                setDeleteProcessing(false);
            },
        });
    };

    const handleToggleStatus = (lecturer: Lecturer) => {
        router.post(`/admin/lecturers/${lecturer.id}/toggle-status`, {}, {
            preserveScroll: true,
            onSuccess: () => toast.success('Lecturer status updated successfully.'),
            onError: () => toast.error('Failed to update lecturer status.'),
        });
    };

    const columns = getLecturerColumns({
        onDelete: (lecturer) => {
            setSelectedLecturerForDelete(lecturer);
            setDeleteModalOpen(true);
        },
        onResetPassword: (lecturer) => {
            setSelectedLecturerForPassword(lecturer);
            setPasswordModalOpen(true);
        },
        onToggleStatus: handleToggleStatus,
    });

    const serverFilters: DataTableServerFilter[] = [
        {
            key: 'employment_status',
            label: 'Status',
            options: [
                { label: 'Active', value: 'active' },
                { label: 'On Leave', value: 'on_leave' },
                { label: 'Sabbatical', value: 'sabbatical' },
                { label: 'Terminated', value: 'terminated' },
            ],
            defaultValue: filters.employment_status || 'all',
        },
        {
            key: 'department',
            label: 'Department',
            options: departments.map((d) => ({ label: d, value: d })),
            defaultValue: filters.department || 'all',
        },
        {
            key: 'contract_type',
            label: 'Contract',
            options: [
                { label: 'Full Time', value: 'full_time' },
                { label: 'Part Time', value: 'part_time' },
                { label: 'Adjunct', value: 'adjunct' },
                { label: 'Visiting', value: 'visiting' },
            ],
            defaultValue: filters.contract_type || 'all',
        },
    ];

    return (
        <>
            <Head title="Lecturers Management" />

            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-lg font-semibold text-foreground tracking-tight">
                            Lecturers Directory
                        </h1>
                        <p className="text-xs text-muted-foreground">
                            Manage university faculty members, designations, department appointments, and teaching loads.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button size="sm" asChild>
                            <Link href="/admin/lecturers/create">
                                <Plus className="h-4 w-4 mr-1.5" />
                                Add Lecturer
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Deferred Metric Cards */}
                <Deferred
                    data="stats"
                    fallback={<MetricCardsSkeleton count={5} />}
                >
                    {stats && (
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:gap-4 lg:grid-cols-5 animate-in fade-in slide-in-from-top-6 duration-700">
                            <MetricCard
                                title="Total Faculty"
                                value={stats.total_lecturers}
                                description="Registered academic staff"
                                icon={Users}
                                variant="primary"
                            />
                            <MetricCard
                                title="Active Teaching"
                                value={stats.active_lecturers}
                                description="Currently lecturing"
                                icon={UserCheck}
                                variant="success"
                            />
                            <MetricCard
                                title="On Leave"
                                value={stats.on_leave_lecturers}
                                description="Sabbatical / leave"
                                icon={UserX}
                                variant="warning"
                            />
                            <MetricCard
                                title="Full-Time"
                                value={stats.full_time_lecturers}
                                description="Permanent faculty"
                                icon={Briefcase}
                                variant="info"
                            />
                            <MetricCard
                                title="Part-Time / Adjunct"
                                value={stats.part_time_lecturers}
                                description="Visiting & adjunct staff"
                                icon={UserCog}
                                variant="default"
                            />
                        </div>
                    )}
                </Deferred>

                {/* Deferred Data Table */}
                <Deferred
                    data="lecturers"
                    fallback={<TableSkeleton columns={6} rows={6} filterCount={3} />}
                >
                    {lecturers && (
                        <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
                            <DataTable
                                columns={columns}
                                data={lecturers.data}
                                pagination={{
                                    current_page: lecturers.current_page,
                                    last_page: lecturers.last_page,
                                    per_page: lecturers.per_page,
                                    total: lecturers.total,
                                }}
                                onPageChange={(page) => handleFilterUpdate({ page } as any)}
                                onPageSizeChange={(per_page) => handleFilterUpdate({ per_page, page: 1 } as any)}
                                serverFilters={serverFilters}
                                onServerFilterChange={(key, values) => {
                                    handleFilterUpdate({ [key]: values?.[0] ?? 'all' });
                                }}
                                onServerFilterClear={() => {
                                    router.get('/admin/lecturers', {}, { preserveState: true });
                                }}
                                onRowClick={(row) => router.visit(`/admin/lecturers/${row.original.id}`)}
                            />
                        </div>
                    )}
                </Deferred>

                {/* Delete Confirmation Modal */}
                <ConfirmDeleteDialog
                    open={deleteModalOpen}
                    onOpenChange={setDeleteModalOpen}
                    title="Delete Lecturer Record"
                    description="Are you sure you want to delete this lecturer? Their user account will be deactivated."
                    itemName={
                        selectedLecturerForDelete
                            ? `${selectedLecturerForDelete.user?.name} (${selectedLecturerForDelete.lecturer_no})`
                            : undefined
                    }
                    loading={deleteProcessing}
                    onConfirm={confirmDelete}
                />

                {/* Password Reset Modal */}
                <ResetPasswordModal
                    open={passwordModalOpen}
                    onOpenChange={setPasswordModalOpen}
                    resetUrl={
                        selectedLecturerForPassword
                            ? `/admin/lecturers/${selectedLecturerForPassword.id}/reset-password`
                            : ''
                    }
                    userName={selectedLecturerForPassword?.user?.name}
                    userIdentifier={selectedLecturerForPassword?.lecturer_no}
                    title="Reset Lecturer Password"
                    description="Set a new secure password for this faculty member account."
                />
            </div>
        </>
    );
}

AdminLecturersIndex.layout = (page: any) => (
    <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>
);