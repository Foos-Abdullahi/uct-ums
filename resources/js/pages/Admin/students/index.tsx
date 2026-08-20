import React, { useState } from 'react';
import { Deferred, Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { MetricCard } from '@/components/tools/MetricCard';
import { MetricCardsSkeleton } from '@/components/tools/metric-cards-skeleton';
import { DataTable } from '@/components/tools/table/main-table';
import { StudentsTableSkeleton } from './components/students-table-skeleton';
import { getStudentColumns } from './components/student-columns';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import { ResetPasswordModal } from './components/reset-password-modal';
import type { BreadcrumbItem } from '@/types';
import type { PaginatedData, Program, Student } from '@/types/student';
import type { DataTableServerFilter } from '@/components/tools/table/types';
import {
    Users,
    CheckCircle2,
    Clock,
    Ban,
    GraduationCap,
    Plus,
    UserPlus,
} from 'lucide-react';
import { toast } from 'sonner';

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
    const [selectedStudentForDelete, setSelectedStudentForDelete] = useState<Student | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleteProcessing, setDeleteProcessing] = useState(false);

    const [selectedStudentForPassword, setSelectedStudentForPassword] = useState<Student | null>(null);
    const [passwordModalOpen, setPasswordModalOpen] = useState(false);

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
        if (!selectedStudentForDelete) return;
        setDeleteProcessing(true);

        router.delete(`/admin/students/${selectedStudentForDelete.id}`, {
            onSuccess: () => {
                toast.success(`Student ${selectedStudentForDelete.matric_no} deleted successfully.`);
                setDeleteModalOpen(false);
                setSelectedStudentForDelete(null);
                setDeleteProcessing(false);
            },
            onError: () => {
                toast.error('Failed to delete student.');
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
                    const next = student.enrollment_status === 'suspended' ? 'activated' : 'suspended';
                    toast.success(`Student account ${next}.`);
                },
                onError: () => toast.error('Failed to update student account status.'),
            }
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
            title: 'Status',
            options: [
                { label: 'All Statuses', value: 'all' },
                { label: 'Enrolled', value: 'enrolled' },
                { label: 'Pending', value: 'pending' },
                { label: 'Suspended', value: 'suspended' },
                { label: 'Graduated', value: 'graduated' },
                { label: 'Withdrawn', value: 'withdrawn' },
            ],
            value: filters.enrollment_status || undefined,
        },
        {
            key: 'fee_status',
            title: 'Fee Status',
            options: [
                { label: 'All Fees', value: 'all' },
                { label: 'Paid', value: 'paid' },
                { label: 'Unpaid', value: 'unpaid' },
                { label: 'Partial', value: 'partial' },
            ],
            value: filters.fee_status || undefined,
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
        {
            key: 'semester',
            title: 'Semester',
            options: [
                { label: 'All Semesters', value: 'all' },
                ...[1, 2, 3, 4, 5, 6, 7, 8].map((s) => ({
                    label: `Semester ${s}`,
                    value: String(s),
                })),
            ],
            value: filters.semester || undefined,
        },
        {
            key: 'gender',
            title: 'Gender',
            options: [
                { label: 'All Genders', value: 'all' },
                { label: 'Male', value: 'Male' },
                { label: 'Female', value: 'Female' },
            ],
            value: filters.gender || undefined,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Students Management" />

            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h1 className="text-lg font-semibold text-foreground tracking-tight">
                            Students Management
                        </h1>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Manage and monitor all enrolled student records, academic performance, and fee status.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/admin/admissions">
                                <UserPlus className="h-4 w-4 mr-1.5" />
                                Admissions
                            </Link>
                        </Button>
                        <Button size="sm" asChild>
                            <Link href="/admin/students/create">
                                <Plus className="h-4 w-4 mr-1.5" />
                                Create Student
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Summary Metric Cards with Entrance Animation */}
                <Deferred data="stats" fallback={<MetricCardsSkeleton />}>
                    {stats && (
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:gap-4 lg:grid-cols-5 animate-in fade-in slide-in-from-top-6 duration-1000 ease-in-out">
                            <MetricCard
                                title="Total Students"
                                value={stats.total_students}
                                icon={Users}
                                color="primary"
                            />
                            <MetricCard
                                title="Active Enrolled"
                                value={stats.active_students}
                                icon={CheckCircle2}
                                color="success"
                            />
                            <MetricCard
                                title="Pending Enrollment"
                                value={stats.pending_students}
                                icon={Clock}
                                color="warning"
                            />
                            <MetricCard
                                title="Suspended"
                                value={stats.suspended_students}
                                icon={Ban}
                                color="destructive"
                            />
                            <MetricCard
                                title="Graduated"
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
                        <div className="animate-in fade-in slide-in-from-bottom-6 duration-700 ease-in-out">
                            <DataTable
                                title="Students List"
                                searchTitle="Search by name, email, matric no, phone..."
                                columns={columns}
                                data={students.data}
                                pagination={{
                                    current_page: students.current_page,
                                    last_page: students.last_page,
                                    per_page: students.per_page,
                                    total: students.total,
                                }}
                                onPageChange={(page) => handleFilterUpdate({ ...filters, page } as any)}
                                onPageSizeChange={(per_page) => handleFilterUpdate({ per_page, page: 1 } as any)}
                                serverFilters={serverFilters}
                                onServerFilterChange={(key, values) => {
                                    handleFilterUpdate({ [key]: values?.[0] ?? 'all' });
                                }}
                                onServerFilterClear={() => {
                                    router.get('/admin/students', {}, { preserveState: true });
                                }}
                                onRowClick={(row) => router.visit(`/admin/students/${row.original.id}`)}
                            />
                        </div>
                    )}
                </Deferred>

                {/* Delete Confirmation Modal */}
                <ConfirmDeleteDialog
                    open={deleteModalOpen}
                    onOpenChange={setDeleteModalOpen}
                    title="Delete Student Record"
                    description="Are you sure you want to delete this student? Their user account will be deactivated."
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
            </div>
        </AppLayout>
    );
}
