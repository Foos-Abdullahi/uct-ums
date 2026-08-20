import React, { useState } from 'react';
import { Head, Link, router, setLayoutProps } from '@inertiajs/react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AdmissionStatusBadge } from './components/admission-status-badge';
import { ReviewAdmissionModal } from './components/review-admission-modal';
import { ConvertToStudentModal } from './components/convert-to-student-modal';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import type { Admission } from '@/types/admission';
import {
    ArrowLeft,
    CheckSquare,
    UserCheck,
    Trash2,
    BookOpen,
    User,
    Calendar,
    FileText,
    ExternalLink,
    ClipboardCheck,
} from 'lucide-react';
import { toast } from 'sonner';

interface AdminAdmissionsShowProps {
    admission: Admission;
}

export default function AdminAdmissionsShow({ admission }: AdminAdmissionsShowProps) {
    setLayoutProps({
        breadcrumbs: [
            { title: 'Dashboard', href: '/admin/dashboard' },
            { title: 'Admissions', href: '/admin/admissions' },
            { title: admission.application_no, href: `/admin/admissions/${admission.id}` },
        ],
    });

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

            <div className="p-6 max-w-5xl mx-auto space-y-6">
                {/* Header Back & Actions */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <Button variant="ghost" size="sm" asChild className="w-fit gap-1 text-muted-foreground hover:text-foreground">
                        <Link href="/admin/admissions">
                            <ArrowLeft className="h-4 w-4" />
                            Back to Admissions
                        </Link>
                    </Button>

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
                                className="bg-purple-600 hover:bg-purple-700 text-white"
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
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            onClick={() => setDeleteModalOpen(true)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Main Profile Header Banner */}
                <Card className="overflow-hidden border-border/40 bg-card rounded-sm shadow-xs">
                    <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                            <div className="flex items-start md:items-center gap-4">
                                <Avatar className="h-16 w-16 border-2 border-primary/20 shrink-0">
                                    <AvatarFallback className="bg-primary/10 text-lg font-bold text-primary">
                                        {initials}
                                    </AvatarFallback>
                                </Avatar>

                                <div className="space-y-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h1 className="text-xl font-bold text-foreground tracking-tight">
                                            {fullName}
                                        </h1>
                                        <span className="font-mono text-xs font-semibold px-2.5 py-0.5 rounded bg-muted text-foreground border border-border/60">
                                            {admission.application_no}
                                        </span>
                                        <AdmissionStatusBadge status={admission.status} />
                                    </div>

                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                        <span>{admission.email}</span>
                                        {admission.phone && <span>• {admission.phone}</span>}
                                        <span>• Applied: {String(admission.application_date).split('T')[0]}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 bg-muted/40 border border-border/40 p-3 rounded-md">
                                <div className="text-left md:text-right">
                                    <p className="text-[10px] uppercase font-semibold text-muted-foreground">Target Program</p>
                                    <p className="text-xs font-bold text-foreground max-w-[200px] truncate">
                                        {admission.program?.name ?? 'Unassigned'}
                                    </p>
                                    <p className="text-[11px] text-muted-foreground">{admission.entry_semester || 'Semester 1'}</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Applicant Information */}
                    <Card className="rounded-sm border-border/40 bg-card shadow-xs">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <User className="h-4 w-4 text-primary" />
                                Applicant Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="divide-y divide-border/30 text-xs">
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
                        </CardContent>
                    </Card>

                    {/* Academic Background & Decision */}
                    <div className="space-y-6">
                        <Card className="rounded-sm border-border/40 bg-card shadow-xs">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                    <BookOpen className="h-4 w-4 text-primary" />
                                    Academic Qualification & Program
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="divide-y divide-border/30 text-xs">
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
                            </CardContent>
                        </Card>

                        {/* Review Evaluation Card */}
                        <Card className="rounded-sm border-border/40 bg-card shadow-xs">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                    <ClipboardCheck className="h-4 w-4 text-primary" />
                                    Review Decision & Notes
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-xs">
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Application Status</span>
                                    <AdmissionStatusBadge status={admission.status} />
                                </div>
                                <div className="p-3 bg-muted/30 rounded border border-border/40">
                                    <p className="text-[11px] font-medium text-muted-foreground uppercase mb-1">
                                        Evaluation Notes
                                    </p>
                                    <p className="text-foreground leading-relaxed">
                                        {admission.review_notes || 'No review notes entered yet.'}
                                    </p>
                                </div>
                                {admission.notes && (
                                    <div className="p-3 bg-muted/20 rounded border border-border/30">
                                        <p className="text-[11px] font-medium text-muted-foreground uppercase mb-1">
                                            Applicant Statement
                                        </p>
                                        <p className="text-foreground italic">
                                            "{admission.notes}"
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
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
                    loading={deleteProcessing}
                    onConfirm={confirmDelete}
                />
            </div>
        </>
    );
}

AdminAdmissionsShow.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/admin/dashboard' },
        { title: 'Admissions', href: '/admin/admissions' },
    ],
};
