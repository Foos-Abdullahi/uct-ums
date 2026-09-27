import { Deferred, Head, Link, router } from '@inertiajs/react';
import {
    ClipboardList,
    Clock,
    Eye,
    CheckCircle2,
    UserCheck,
    Plus,
    Users,
} from 'lucide-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import { MetricCardsSkeleton } from '@/components/tools/metric-cards-skeleton';
import { MetricCard } from '@/components/tools/MetricCard';
import { DataTable } from '@/components/tools/table/main-table';
import type { DataTableServerFilter } from '@/components/tools/table/types';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type { Admission } from '@/types/admission';
import type { PaginatedData, Program } from '@/types/student';
import { getAdmissionColumns } from './components/admission-columns';
import { AdmissionsTableSkeleton } from './components/admissions-table-skeleton';
import { ConvertToStudentModal } from './components/convert-to-student-modal';
import { ReviewAdmissionModal } from './components/review-admission-modal';

interface AdmissionStats {
    total_applications: number;
    pending: number;
    under_review: number;
    approved: number;
    rejected: number;
    enrolled: number;
}

interface AdminAdmissionsIndexProps {
    stats?: AdmissionStats;
    admissions?: PaginatedData<Admission>;
    programs: Program[];
    filters: {
        search: string;
        status: string;
        program_id: string;
        per_page: number;
    };
}

export default function AdminAdmissionsIndex({
    stats,
    admissions,
    programs = [],
    filters,
}: AdminAdmissionsIndexProps) {
    const { t } = useTranslation();

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('dashboard'), href: '/admin/dashboard' },
        { title: t('breadcrumb_admissions'), href: '/admin/admissions' },
    ];
    const [selectedForReview, setSelectedForReview] =
        useState<Admission | null>(null);
    const [reviewModalOpen, setReviewModalOpen] = useState(false);

    const [selectedForConvert, setSelectedForConvert] =
        useState<Admission | null>(null);
    const [convertModalOpen, setConvertModalOpen] = useState(false);

    const [selectedForDelete, setSelectedForDelete] =
        useState<Admission | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleteProcessing, setDeleteProcessing] = useState(false);

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

        router.get('/admin/admissions', cleanQuery, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleReview = (admission: Admission) => {
        setSelectedForReview(admission);
        setReviewModalOpen(true);
    };

    const handleConvert = (admission: Admission) => {
        setSelectedForConvert(admission);
        setConvertModalOpen(true);
    };

    const handleDelete = (admission: Admission) => {
        setSelectedForDelete(admission);
        setDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        if (!selectedForDelete) {
            return;
        }

        setDeleteProcessing(true);

        router.delete(`/admin/admissions/${selectedForDelete.id}`, {
            onSuccess: () => {
                toast.success(
                    `Application ${selectedForDelete.application_no} deleted.`,
                );
                setDeleteModalOpen(false);
                setSelectedForDelete(null);
                setDeleteProcessing(false);
            },
            onError: () => {
                toast.error('Failed to delete admission application.');
                setDeleteProcessing(false);
            },
        });
    };

    const columns = getAdmissionColumns({
        onReview: handleReview,
        onConvert: handleConvert,
        onDelete: handleDelete,
    });

    const serverFilters: DataTableServerFilter[] = [
        {
            key: 'status',
            title: t('status'),
            options: [
                { label: t('all_statuses'), value: 'all' },
                { label: t('pending'), value: 'pending' },
                { label: t('under_review'), value: 'under_review' },
                { label: t('approved'), value: 'approved' },
                { label: t('rejected'), value: 'rejected' },
                { label: t('enrolled'), value: 'enrolled' },
            ],
            value: filters.status || undefined,
        },
        {
            key: 'program_id',
            title: t('program'),
            options: [
                { label: t('all_programs'), value: 'all' },
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
            <Head title={t('admissions_management')} />

            <div className="space-y-6 p-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h1 className="text-lg font-semibold tracking-tight text-foreground">
                            {t('admissions_management')}
                        </h1>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            {t('admissions_description')}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/admin/students">
                                <Users className="mr-1.5 h-4 w-4" />
                                {t('all_students')}
                            </Link>
                        </Button>
                        <Button size="sm" asChild>
                            <Link href="/admin/admissions/create">
                                <Plus className="mr-1.5 h-4 w-4" />
                                {t('create_application')}
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Metric Cards with Entrance Animation */}
                <Deferred data="stats" fallback={<MetricCardsSkeleton />}>
                    {stats && (
                        <div className="grid animate-in grid-cols-1 gap-2 duration-1000 ease-in-out fade-in slide-in-from-top-6 sm:grid-cols-2 md:gap-4 lg:grid-cols-5">
                            <MetricCard
                                title={t('total_applications')}
                                value={stats.total_applications}
                                icon={ClipboardList}
                                color="primary"
                            />
                            <MetricCard
                                title={t('pending')}
                                value={stats.pending}
                                icon={Clock}
                                color="warning"
                            />
                            <MetricCard
                                title={t('under_review')}
                                value={stats.under_review}
                                icon={Eye}
                                color="info"
                            />
                            <MetricCard
                                title={t('approved')}
                                value={stats.approved}
                                icon={CheckCircle2}
                                color="success"
                            />
                            <MetricCard
                                title={t('enrolled_students')}
                                value={stats.enrolled}
                                icon={UserCheck}
                                color="primary"
                            />
                        </div>
                    )}
                </Deferred>

                {/* Main Admissions DataTable with Entrance Animation */}
                <Deferred
                    data="admissions"
                    fallback={<AdmissionsTableSkeleton />}
                >
                    {admissions && (
                        <div className="animate-in duration-700 ease-in-out fade-in slide-in-from-bottom-6">
                            <DataTable
                                title={t('applications_list')}
                                searchTitle={t('search_applications')}
                                columns={columns}
                                data={admissions.data}
                                pagination={{
                                    current_page: admissions.current_page,
                                    last_page: admissions.last_page,
                                    per_page: admissions.per_page,
                                    total: admissions.total,
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
                                        '/admin/admissions',
                                        {},
                                        { preserveState: true },
                                    );
                                }}
                                onRowClick={(row) =>
                                    router.visit(
                                        `/admin/admissions/${row.original.id}`,
                                    )
                                }
                            />
                        </div>
                    )}
                </Deferred>

                {/* Review Modal */}
                <ReviewAdmissionModal
                    open={reviewModalOpen}
                    onOpenChange={setReviewModalOpen}
                    admission={selectedForReview}
                />

                {/* Convert to Student Modal */}
                <ConvertToStudentModal
                    open={convertModalOpen}
                    onOpenChange={setConvertModalOpen}
                    admission={selectedForConvert}
                />

                {/* Delete Confirmation Modal */}
                <ConfirmDeleteDialog
                    open={deleteModalOpen}
                    onOpenChange={setDeleteModalOpen}
                    title={t('delete_application')}
                    description={t('delete_application_confirm')}
                    itemName={
                        selectedForDelete
                            ? `${selectedForDelete.full_name} (${selectedForDelete.application_no})`
                            : undefined
                    }
                    loading={deleteProcessing}
                    onConfirm={confirmDelete}
                />
            </div>
        </>
    );
}

function AdminAdmissionsLayout({ children }: { children: React.ReactNode }) {
    const { t } = useTranslation();
    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('dashboard'), href: '/admin/dashboard' },
        { title: t('breadcrumb_admissions'), href: '/admin/admissions' },
    ];

    return <AppLayout breadcrumbs={breadcrumbs}>{children}</AppLayout>;
}

AdminAdmissionsIndex.layout = (page) => (
    <AdminAdmissionsLayout>{page}</AdminAdmissionsLayout>
);
