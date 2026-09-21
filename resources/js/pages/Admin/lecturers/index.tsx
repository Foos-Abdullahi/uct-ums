import { Deferred, Head, Link, router } from '@inertiajs/react';
import {
    Users,
    UserCheck,
    UserX,
    UserCog,
    Briefcase,
    Plus,
} from 'lucide-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import { MetricCardsSkeleton } from '@/components/tools/metric-cards-skeleton';
import { MetricCard } from '@/components/tools/MetricCard';
import { ResetPasswordModal } from '@/components/tools/reset-password-modal';
import { DataTable } from '@/components/tools/table/main-table';
import type { DataTableServerFilter } from '@/components/tools/table/types';
import { TableSkeleton } from '@/components/tools/table-skeleton';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type { PaginatedData, Lecturer, LecturerStats } from '@/types/lecturer';
import { getLecturerColumns } from './components/lecturer-columns';

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

export default function AdminLecturersIndex({
    stats,
    lecturers,
    departments = [],
    filters,
}: AdminLecturersIndexProps) {
    const { t } = useTranslation();

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [selectedLecturerForDelete, setSelectedLecturerForDelete] =
        useState<Lecturer | null>(null);
    const [deleteProcessing, setDeleteProcessing] = useState(false);

    const [passwordModalOpen, setPasswordModalOpen] = useState(false);
    const [selectedLecturerForPassword, setSelectedLecturerForPassword] =
        useState<Lecturer | null>(null);

    const handleFilterUpdate = (newFilters: Partial<typeof filters>) => {
        router.get(
            '/admin/lecturers',
            { ...filters, ...newFilters },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    const confirmDelete = () => {
        if (!selectedLecturerForDelete) {
            return;
        }

        setDeleteProcessing(true);
        router.delete(`/admin/lecturers/${selectedLecturerForDelete.id}`, {
            onSuccess: () => {
                toast.success(
                    t('lecturer_deleted', { name: selectedLecturerForDelete.user?.name }),
                );
                setDeleteModalOpen(false);
                setSelectedLecturerForDelete(null);
                setDeleteProcessing(false);
            },
            onError: () => {
                toast.error(t('failed_delete_lecturer'));
                setDeleteProcessing(false);
            },
        });
    };

    const handleToggleStatus = (lecturer: Lecturer) => {
        router.post(
            `/admin/lecturers/${lecturer.id}/toggle-status`,
            {},
            {
                preserveScroll: true,
                onSuccess: () =>
                    toast.success(t('lecturer_status_updated')),
                onError: () => toast.error(t('failed_update_lecturer_status')),
            },
        );
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
            title: t('status'),
            options: [
                { label: t('active'), value: 'active' },
                { label: t('on_leave'), value: 'on_leave' },
                { label: t('sabbatical'), value: 'sabbatical' },
                { label: t('inactive'), value: 'inactive' },
                { label: t('terminated'), value: 'terminated' },
            ],
            value: filters.employment_status || undefined,
        },
        {
            key: 'department',
            title: t('department'),
            options: departments.map((d) => ({ label: d, value: d })),
            value: filters.department || undefined,
        },
        {
            key: 'contract_type',
            title: t('contract'),
            options: [
                { label: t('full_time'), value: 'full_time' },
                { label: t('part_time'), value: 'part_time' },
                { label: t('adjunct'), value: 'adjunct' },
                { label: t('visiting'), value: 'visiting' },
            ],
            value: filters.contract_type || undefined,
        },
    ];

    return (
        <>
            <Head title={t('lecturers_management')} />

            <div className="space-y-6 p-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-lg font-semibold tracking-tight text-foreground">
                            {t('lecturers_directory')}
                        </h1>
                        <p className="text-xs text-muted-foreground">
                            {t('lecturers_description')}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button size="sm" asChild>
                            <Link href="/admin/lecturers/create">
                                <Plus className="mr-1.5 h-4 w-4" />
                                {t('create_lecturer')}
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
                        <div className="grid animate-in grid-cols-1 gap-2 duration-700 fade-in slide-in-from-top-6 sm:grid-cols-2 md:gap-4 lg:grid-cols-5">
                            <MetricCard
                                title={t('total_faculty')}
                                value={stats.total_lecturers}
                                description={t('registered_academic_staff')}
                                icon={Users}
                                variant="primary"
                            />
                            <MetricCard
                                title={t('active_teaching')}
                                value={stats.active_lecturers}
                                description={t('currently_lecturing')}
                                icon={UserCheck}
                                variant="success"
                            />
                            <MetricCard
                                title={t('on_leave')}
                                value={stats.on_leave_lecturers}
                                description={t('sabbatical_leave')}
                                icon={UserX}
                                variant="warning"
                            />
                            <MetricCard
                                title={t('full_time')}
                                value={stats.full_time_lecturers}
                                description={t('permanent_faculty')}
                                icon={Briefcase}
                                variant="info"
                            />
                            <MetricCard
                                title={t('part_time_adjunct')}
                                value={stats.part_time_lecturers}
                                description={t('visiting_adjunct_staff')}
                                icon={UserCog}
                                variant="default"
                            />
                        </div>
                    )}
                </Deferred>

                {/* Deferred Data Table */}
                <Deferred
                    data="lecturers"
                    fallback={
                        <TableSkeleton columns={6} rows={6} filterCount={3} />
                    }
                >
                    {lecturers && (
                        <div className="animate-in duration-700 fade-in slide-in-from-bottom-6">
                            <DataTable
                                title={t('lecturers_list')}
                                searchTitle={t('search_lecturers')}
                                columns={columns}
                                data={lecturers.data}
                                pagination={{
                                    current_page: lecturers.current_page,
                                    last_page: lecturers.last_page,
                                    per_page: lecturers.per_page,
                                    total: lecturers.total,
                                }}
                                onPageChange={(page) =>
                                    handleFilterUpdate({ page } as any)
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
                                        '/admin/lecturers',
                                        {},
                                        { preserveState: true },
                                    );
                                }}
                                onRowClick={(row) =>
                                    router.visit(
                                        `/admin/lecturers/${row.original.id}`,
                                    )
                                }
                            />
                        </div>
                    )}
                </Deferred>

                {/* Delete Confirmation Modal */}
                <ConfirmDeleteDialog
                    open={deleteModalOpen}
                    onOpenChange={setDeleteModalOpen}
                    title={t('delete_lecturer')}
                    description={t('delete_lecturer_confirm')}
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
                    title={t('reset_lecturer_password')}
                    description={t('reset_password_description')}
                />
            </div>
        </>
    );
}

AdminLecturersIndex.layout = (page: any) => {
    const { t } = useTranslation();
    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('dashboard'), href: '/admin/dashboard' },
        { title: t('breadcrumb_lecturers'), href: '/admin/lecturers' },
    ];
    return <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>;
};
