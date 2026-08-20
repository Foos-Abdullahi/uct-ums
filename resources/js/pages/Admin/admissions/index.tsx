import React, { useState } from 'react';
import { Deferred, Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { MetricCard } from '@/components/tools/MetricCard';
import { MetricCardsSkeleton } from '@/components/tools/metric-cards-skeleton';
import { DataTable } from '@/components/tools/table/main-table';
import { AdmissionsTableSkeleton } from './components/admissions-table-skeleton';
import { getAdmissionColumns } from './components/admission-columns';
import { ReviewAdmissionModal } from './components/review-admission-modal';
import { ConvertToStudentModal } from './components/convert-to-student-modal';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import type { BreadcrumbItem } from '@/types';
import type { Admission } from '@/types/admission';
import type { PaginatedData, Program } from '@/types/student';
import type { DataTableServerFilter } from '@/components/tools/table/types';
import {
    ClipboardList,
    Clock,
    Eye,
    CheckCircle2,
    UserCheck,
    Plus,
    Users,
} from 'lucide-react';
import { toast } from 'sonner';

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

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/admin/dashboard' },
    { title: 'Admissions', href: '/admin/admissions' },
];

export default function AdminAdmissionsIndex({
    stats,
    admissions,
    programs = [],
    filters,
}: AdminAdmissionsIndexProps) {
    const [selectedForReview, setSelectedForReview] = useState<Admission | null>(null);
    const [reviewModalOpen, setReviewModalOpen] = useState(false);

    const [selectedForConvert, setSelectedForConvert] = useState<Admission | null>(null);
    const [convertModalOpen, setConvertModalOpen] = useState(false);

    const [selectedForDelete, setSelectedForDelete] = useState<Admission | null>(null);
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
        if (!selectedForDelete) return;
        setDeleteProcessing(true);

        router.delete(`/admin/admissions/${selectedForDelete.id}`, {
            onSuccess: () => {
                toast.success(`Application ${selectedForDelete.application_no} deleted.`);
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
            title: 'Status',
            options: [
                { label: 'All Statuses', value: 'all' },
                { label: 'Pending', value: 'pending' },
                { label: 'Under Review', value: 'under_review' },
                { label: 'Approved', value: 'approved' },
                { label: 'Rejected', value: 'rejected' },
                { label: 'Enrolled', value: 'enrolled' },
            ],
            value: filters.status || undefined,
        },
        {
            key: 'program_id',
            title: 'Program',
            options: [
                { label: 'All Programs', value: 'all' },
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
            <Head title="Admissions & Applications" />

            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h1 className="text-lg font-semibold text-foreground tracking-tight">
                            Admissions Management
                        </h1>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Process new student applications, review qualifying documents, and convert approved applicants.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/admin/students">
                                <Users className="h-4 w-4 mr-1.5" />
                                All Students
                            </Link>
                        </Button>
                        <Button size="sm" asChild>
                            <Link href="/admin/admissions/create">
                                <Plus className="h-4 w-4 mr-1.5" />
                                New Application
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Metric Cards with Entrance Animation */}
                <Deferred data="stats" fallback={<MetricCardsSkeleton />}>
                    {stats && (
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:gap-4 lg:grid-cols-5 animate-in fade-in slide-in-from-top-6 duration-1000 ease-in-out">
                            <MetricCard
                                title="Total Applications"
                                value={stats.total_applications}
                                icon={ClipboardList}
                                color="primary"
                            />
                            <MetricCard
                                title="Pending"
                                value={stats.pending}
                                icon={Clock}
                                color="warning"
                            />
                            <MetricCard
                                title="Under Review"
                                value={stats.under_review}
                                icon={Eye}
                                color="info"
                            />
                            <MetricCard
                                title="Approved"
                                value={stats.approved}
                                icon={CheckCircle2}
                                color="success"
                            />
                            <MetricCard
                                title="Enrolled Students"
                                value={stats.enrolled}
                                icon={UserCheck}
                                color="primary"
                            />
                        </div>
                    )}
                </Deferred>

                {/* Main Admissions DataTable with Entrance Animation */}
                <Deferred data="admissions" fallback={<AdmissionsTableSkeleton />}>
                    {admissions && (
                        <div className="animate-in fade-in slide-in-from-bottom-6 duration-700 ease-in-out">
                            <DataTable
                                title="Applications List"
                                searchTitle="Search by name, email, application no, phone..."
                                columns={columns}
                                data={admissions.data}
                                pagination={{
                                    current_page: admissions.current_page,
                                    last_page: admissions.last_page,
                                    per_page: admissions.per_page,
                                    total: admissions.total,
                                }}
                                onPageChange={(page) => handleFilterUpdate({ ...filters, page } as any)}
                                onPageSizeChange={(per_page) => handleFilterUpdate({ per_page, page: 1 } as any)}
                                serverFilters={serverFilters}
                                onServerFilterChange={(key, values) => {
                                    handleFilterUpdate({ [key]: values?.[0] ?? 'all' });
                                }}
                                onServerFilterClear={() => {
                                    router.get('/admin/admissions', {}, { preserveState: true });
                                }}
                                onRowClick={(row) => router.visit(`/admin/admissions/${row.original.id}`)}
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
                    title="Delete Application"
                    description="Are you sure you want to delete this admission application record?"
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

AdminAdmissionsIndex.layout = { breadcrumbs };
