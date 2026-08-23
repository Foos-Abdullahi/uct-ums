import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { UctPanelCard } from '@/components/tools/uct-panel-card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { AdmissionStatusBadge } from './components/admission-status-badge';
import { ReviewAdmissionModal } from './components/review-admission-modal';
import { ConvertToStudentModal } from './components/convert-to-student-modal';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import type { BreadcrumbItem } from '@/types';
import type { Admission } from '@/types/admission';
import {
    ArrowLeft,
    CheckSquare,
    UserCheck,
    ExternalLink,
    Trash2,
    User,
    BookOpen,
    ClipboardCheck,
} from 'lucide-react';
import { toast } from 'sonner';

interface AdminAdmissionsShowProps {
    admission: Admission;
}

export default function AdminAdmissionsShow({
    admission,
}: AdminAdmissionsShowProps) {
    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    const [convertModalOpen, setConvertModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleteProcessing, setDeleteProcessing] = useState(false);

    const fullName = admission.full_name || `${admission.first_name} ${admission.last_name}`;
    const initials = fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();

    const isEnrolled = admission.status === 'enrolled';

    const confirmDelete = () => {
        setDeleteProcessing(true);
        router.delete(`/admin/admissions/${admission.id}`, {
            onSuccess: () => {
                toast.success('Application deleted successfully.');
                setDeleteModalOpen(false);
                setDeleteProcessing(false);
            },
            onError: () => {
                toast.error('Failed to delete application.');
                setDeleteProcessing(false);
            },
        });
    };

    return (
        <>
            <Head title={`Application - ${admission.application_no}`} />

            <div className="p-6 space-y-6">
                {/* Main Profile Header Banner — UctPanelCard */}
                <UctPanelCard
                    type="default"
                    className="overflow-hidden"
                    title={
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3.5">
                            <Avatar className="h-14 w-14 border-2 border-primary/20 shrink-0">
                                <AvatarFallback className="bg-primary/10 text-base font-bold text-primary">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>

                            <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-lg font-bold text-foreground tracking-tight">
                                        {fullName}
                                    </span>
                                    <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-muted text-foreground border border-border/60">
                                        {admission.application_no}
                                    </span>
                                    <AdmissionStatusBadge status={admission.status} />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {admission.email} {admission.phone ? `• ${admission.phone}` : ''}
                                </p>
                            </div>
                        </div>
                    }
                    actions={
                        <div className="flex flex-wrap items-center gap-2">
                            {!isEnrolled && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setReviewModalOpen(true)}
                                >
                                    <CheckSquare className="h-3.5 w-3.5 mr-1.5" />
                                    Review Status
                                </Button>
                            )}

                            {!isEnrolled && admission.status === 'approved' && (
                                <Button
                                    size="sm"
                                    className="bg-purple-600 hover:bg-purple-700 text-white shadow-xs"
                                    onClick={() => setConvertModalOpen(true)}
                                >
                                    <UserCheck className="h-3.5 w-3.5 mr-1.5" />
                                    Convert to Student
                                </Button>
                            )}

                            {isEnrolled && admission.student_id && (
                                <Button size="sm" asChild>
                                    <Link href={`/admin/students/${admission.student_id}`}>
                                        <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                                        View Student Profile
                                    </Link>
                                </Button>
                            )}

                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => setDeleteModalOpen(true)}
                            >
                                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                                Delete
                            </Button>
                        </div>
                    }
                />

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Applicant Information */}
                    <UctPanelCard className='h-fit'
                        title="Applicant Personal Details"
                        icon={User}
                        type="default"
                    >
                        <div className="divide-y divide-border/30 text-xs">
                            <div className="flex justify-between py-2">
                                <span className="text-muted-foreground">Full Name</span>
                                <span className="font-medium text-foreground">{fullName}</span>
                            </div>
                            <div className="flex justify-between py-2">
                                <span className="text-muted-foreground">Email Address</span>
                                <span className="font-medium text-foreground">{admission.email}</span>
                            </div>
                            <div className="flex justify-between py-2">
                                <span className="text-muted-foreground">Phone Number</span>
                                <span className="font-medium text-foreground">{admission.phone || '—'}</span>
                            </div>
                            <div className="flex justify-between py-2">
                                <span className="text-muted-foreground">Gender</span>
                                <span className="font-medium text-foreground">{admission.gender || '—'}</span>
                            </div>
                            <div className="flex justify-between py-2">
                                <span className="text-muted-foreground">Date of Birth</span>
                                <span className="font-medium text-foreground">
                                    {admission.date_of_birth ? String(admission.date_of_birth).split('T')[0] : '—'}
                                </span>
                            </div>
                            <div className="flex justify-between py-2">
                                <span className="text-muted-foreground">Address</span>
                                <span className="font-medium text-foreground text-right">{admission.address || '—'}</span>
                            </div>
                        </div>
                    </UctPanelCard>

                    {/* Academic Background & Decision */}
                    <div className="space-y-6">
                        <UctPanelCard
                            title="Academic Qualification & Program"
                            icon={BookOpen}
                            type="default"
                        >
                            <div className="divide-y divide-border/30 text-xs">
                                <div className="flex justify-between py-2">
                                    <span className="text-muted-foreground">Chosen Program</span>
                                    <span className="font-medium text-foreground">{admission.program?.name ?? '—'}</span>
                                </div>
                                <div className="flex justify-between py-2">
                                    <span className="text-muted-foreground">Entry Semester</span>
                                    <span className="font-medium text-foreground">{admission.entry_semester || 'Semester 1'}</span>
                                </div>
                                <div className="flex justify-between py-2">
                                    <span className="text-muted-foreground">Prior Qualification</span>
                                    <span className="font-medium text-foreground">{admission.previous_qualification || '—'}</span>
                                </div>
                                <div className="flex justify-between py-2">
                                    <span className="text-muted-foreground">Prior GPA Score</span>
                                    <span className="font-bold text-foreground">
                                        {admission.previous_gpa ? Number(admission.previous_gpa).toFixed(2) : '—'} / 4.00
                                    </span>
                                </div>
                            </div>
                        </UctPanelCard>

                        {/* Review Evaluation Card */}
                        <UctPanelCard
                            title="Review Decision & Evaluation Notes"
                            icon={ClipboardCheck}
                            type={admission.status === 'rejected' ? 'delete' : admission.status === 'approved' ? 'success' : 'default'}
                        >
                            <div className="space-y-3 text-xs">
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Application Status</span>
                                    <AdmissionStatusBadge status={admission.status} />
                                </div>

                                <div className="space-y-1.5 pt-2 border-t border-border/40">
                                    <span className="text-muted-foreground font-medium">Evaluation Notes:</span>
                                    <p className="p-3 rounded bg-muted/50 border border-border/40 text-foreground italic leading-relaxed">
                                        {admission.review_notes || admission.notes || 'No review notes provided yet.'}
                                    </p>
                                </div>
                            </div>
                        </UctPanelCard>
                    </div>
                </div>

                {/* Modals */}
                <ReviewAdmissionModal
                    open={reviewModalOpen}
                    onOpenChange={setReviewModalOpen}
                    admission={admission}
                />

                <ConvertToStudentModal
                    open={convertModalOpen}
                    onOpenChange={setConvertModalOpen}
                    admission={admission}
                />

                <ConfirmDeleteDialog
                    open={deleteModalOpen}
                    onOpenChange={setDeleteModalOpen}
                    title="Delete Application"
                    description="Are you sure you want to permanently delete this application record?"
                    itemName={`${fullName} (${admission.application_no})`}
                    loading={deleteProcessing}
                    onConfirm={confirmDelete}
                />
            </div>
        </>
    );
}

AdminAdmissionsShow.layout = (page: any) => {
    const admission = page?.props?.admission;
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/admin/dashboard' },
        { title: 'Admissions', href: '/admin/admissions' },
        { title: admission?.application_no ?? 'Application', href: `/admin/admissions/${admission?.id ?? ''}` },
    ];
    return <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>;
};
