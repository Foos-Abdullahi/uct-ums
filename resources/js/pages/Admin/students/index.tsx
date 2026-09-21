import { Deferred, Head, Link, router } from '@inertiajs/react';
import {
    Users,
    CheckCircle2,
    Clock,
    Ban,
    GraduationCap,
    Plus,
    UserPlus,
    FileSpreadsheet,
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
import type { BreadcrumbItem } from '@/types';
import type { PaginatedData, Program, Student } from '@/types/student';
import { ImportStudentsDialog } from './components/import-students-dialog';
import { ResetPasswordModal } from './components/reset-password-modal';
import { getStudentColumns } from './components/student-columns';
import { StudentsTableSkeleton } from './components/students-table-skeleton';

interface StudentStats {
    total_students: number;
    active_students: number;
    pending_students: number;
    suspended_students: number;
    graduated_students: number;
}

interface AdminStudentsIndexProps {
    stats?: StudentStats;
    students?: PaginatedData<Student>;
    programs: Program[];
    filters: {
        search: string;
        enrollment_status: string;
        fee_status: string;
        program_id: string;
        semester: string;
        gender: string;
        per_page: number;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/admin/dashboard' },
    { title: 'Students', href: '/admin/students' },
];

export default function AdminStudentsIndex({
    stats,
    students,
    programs = [],
    filters,
}: AdminStudentsIndexProps) {
    const { t } = useTranslation();
    const [selectedStudentForDelete, setSelectedStudentForDelete] =
        useState<Student | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleteProcessing, setDeleteProcessing] = useState(false);

    const [selectedStudentForPassword, setSelectedStudentForPassword] =
        useState<Student | null>(null);
    const [passwordModalOpen, setPasswordModalOpen] = useState(false);
    const [importDialogOpen, setImportDialogOpen] = useState(false);

    const handleFilterUpdate = (newFilters: Partial<typeof filters>) => {
        const query = {
            ...filters,
            ...newFilters,
        };

        // Remove empty or 'all' values
        const cleanQuery: Record<string, any> = {};
        Object.entries(query).forEach(([key, val]) => {
            if (val !== undefined && val !== '' && val !== 'all') {
                cleanQuery[key] = val;
            }
        });

        router.get('/admin/students', cleanQuery, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleDelete = (student: Student) => {
        setSelectedStudentForDelete(student);
        setDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        if (!selectedStudentForDelete) {
            return;
        }

        setDeleteProcessing(true);

        router.delete(`/admin/students/${selectedStudentForDelete.id}`, {
            onSuccess: () => {
                toast.success(
                    t('student_deleted_success', { matric_no: selectedStudentForDelete.matric_no }),
                );
                setDeleteModalOpen(false);
                setSelectedStudentForDelete(null);
                setDeleteProcessing(false);
            },
            onError: () => {
                toast.error(t('failed_delete_student'));
                setDeleteProcessing(false);
            },
        });
    };

    const handleResetPassword = (student: Student) => {
        setSelectedStudentForPassword(student);
        setPasswordModalOpen(true);
    };

    const handleToggleStatus = (student: Student) => {
        router.post(
            `/admin/students/${student.id}/toggle-status`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    const next =
                        student.enrollment_status === 'suspended'
                            ? t('student_account_activated')
                            : t('student_account_suspended');
                    toast.success(next);
                },
                onError: () =>
                    toast.error(t('failed_update_status')),
            },
        );
    };

    const columns = getStudentColumns({
        onDelete: handleDelete,
        onResetPassword: handleResetPassword,
        onToggleStatus: handleToggleStatus,
    });

    const serverFilters: DataTableServerFilter[] = [
        {
            key: 'enrollment_status',
            title: t('status'),
            options: [
                { label: t('all_statuses'), value: 'all' },
                { label: t('enrolled_status'), value: 'enrolled' },
                { label: t('pending_status'), value: 'pending' },
                { label: t('suspended_label'), value: 'suspended' },
                { label: t('graduated_label'), value: 'graduated' },
                { label: t('withdrawn'), value: 'withdrawn' },
            ],
            value: filters.enrollment_status || undefined,
        },
        {
            key: 'fee_status',
            title: t('fee_status'),
            options: [
                { label: t('all_fees'), value: 'all' },
                { label: t('paid'), value: 'paid' },
                { label: t('unpaid'), value: 'unpaid' },
                { label: t('partial'), value: 'partial' },
            ],
            value: filters.fee_status || undefined,
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
        {
            key: 'semester',
            title: t('semester_label'),
            options: [
                { label: t('all_semesters'), value: 'all' },
                ...[1, 2, 3, 4, 5, 6, 7, 8].map((s) => ({
                    label: `${t('semester_label')} ${s}`,
                    value: String(s),
                })),
            ],
            value: filters.semester || undefined,
        },
        {
            key: 'gender',
            title: t('gender'),
            options: [
                { label: t('all_genders'), value: 'all' },
                { label: t('male'), value: 'Male' },
                { label: t('female'), value: 'Female' },
            ],
            value: filters.gender || undefined,
        },
    ];

    return (
        <>
            <Head title={t('students_management')} />

            <div className="space-y-6 p-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h1 className="text-lg font-semibold tracking-tight text-foreground">
                            {t('students_management')}
                        </h1>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            {t('students_description')}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setImportDialogOpen(true)}
                        >
                            <FileSpreadsheet className="mr-1.5 h-4 w-4" />
                            {t('import_students')}
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/admin/admissions">
                                <UserPlus className="mr-1.5 h-4 w-4" />
                                {t('admissions_queue')}
                            </Link>
                        </Button>
                        <Button size="sm" asChild>
                            <Link href="/admin/students/create">
                                <Plus className="mr-1.5 h-4 w-4" />
                                {t('create_student')}
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Summary Metric Cards with Entrance Animation */}
                <Deferred data="stats" fallback={<MetricCardsSkeleton />}>
                    {stats && (
                        <div className="grid animate-in grid-cols-1 gap-2 duration-1000 ease-in-out fade-in slide-in-from-top-6 sm:grid-cols-2 md:gap-4 lg:grid-cols-5">
                            <MetricCard
                                title={t('total_students')}
                                value={stats.total_students}
                                icon={Users}
                                color="primary"
                            />
                            <MetricCard
                                title={t('active_enrolled')}
                                value={stats.active_students}
                                icon={CheckCircle2}
                                color="success"
                            />
                            <MetricCard
                                title={t('pending_enrollment')}
                                value={stats.pending_students}
                                icon={Clock}
                                color="warning"
                            />
                            <MetricCard
                                title={t('suspended_status')}
                                value={stats.suspended_students}
                                icon={Ban}
                                color="destructive"
                            />
                            <MetricCard
                                title={t('graduated_status')}
                                value={stats.graduated_students}
                                icon={GraduationCap}
                                color="info"
                            />
                        </div>
                    )}
                </Deferred>

                {/* Main Students DataTable with Entrance Animation */}
                <Deferred data="students" fallback={<StudentsTableSkeleton />}>
                    {students && (
                        <div className="animate-in duration-700 ease-in-out fade-in slide-in-from-bottom-6">
                            <DataTable
                                title={t('students_list')}
                                searchTitle={t('search_students')}
                                columns={columns}
                                data={students.data}
                                pagination={{
                                    current_page: students.current_page,
                                    last_page: students.last_page,
                                    per_page: students.per_page,
                                    total: students.total,
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
                                        '/admin/students',
                                        {},
                                        { preserveState: true },
                                    );
                                }}
                                onRowClick={(row) =>
                                    router.visit(
                                        `/admin/students/${row.original.id}`,
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
                    title={t('delete_student_record')}
                    description={t('delete_student_description')}
                    itemName={
                        selectedStudentForDelete
                            ? `${selectedStudentForDelete.user?.name} (${selectedStudentForDelete.matric_no})`
                            : undefined
                    }
                    loading={deleteProcessing}
                    onConfirm={confirmDelete}
                />

                {/* Password Reset Modal */}
                <ResetPasswordModal
                    open={passwordModalOpen}
                    onOpenChange={setPasswordModalOpen}
                    student={selectedStudentForPassword}
                />

                {/* Import Students Dialog */}
                <ImportStudentsDialog
                    open={importDialogOpen}
                    onOpenChange={setImportDialogOpen}
                    programs={programs}
                    onImported={() => {
                        router.reload({ only: ['students', 'stats'] });
                    }}
                />
            </div>
        </>
    );
}

AdminStudentsIndex.layout = { breadcrumbs };
