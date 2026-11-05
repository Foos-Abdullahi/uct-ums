import { Head, Link, router, setLayoutProps } from '@inertiajs/react';
import { Edit3, Wallet } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { FinanceStatementData, Student } from '@/types/student';
import { AddGradeModal } from './components/add-grade-modal';
import { GenerateCertificateModal } from './components/generate-certificate-modal';
import { ProfileAcademicsTab } from './components/profile-academics-tab';
import { ProfileAccountTab } from './components/profile-account-tab';
import { ProfileDocumentsTab } from './components/profile-documents-tab';
import { ProfileFinanceTab } from './components/profile-finance-tab';
import { ProfileOverviewTab } from './components/profile-overview-tab';
import type {
    AcademicSummary,
    AttendanceSummary,
    CurrentSemesterFinance,
    FinancialSummary,
} from './components/profile-shared';
import { ResetPasswordModal } from './components/reset-password-modal';
import { StudentFeeBadge } from './components/student-fee-badge';
import { StudentStatusBadge } from './components/student-status-badge';
import { UploadDocumentModal } from './components/upload-document-modal';

interface AdminStudentsShowProps {
    student: Student;
    financialSummary: FinancialSummary;
    academicSummary: AcademicSummary;
    attendanceSummary: AttendanceSummary;
    financeStatement?: FinanceStatementData;
    currentSemesterFinance: CurrentSemesterFinance | null;
}

const TABS = ['overview', 'academics', 'finance', 'documents', 'account'];

export default function AdminStudentsShow({
    student,
    financialSummary,
    academicSummary,
    attendanceSummary,
    financeStatement,
    currentSemesterFinance,
}: AdminStudentsShowProps) {
    const [passwordModalOpen, setPasswordModalOpen] = useState(false);
    const [documentModalOpen, setDocumentModalOpen] = useState(false);
    const [certificateModalOpen, setCertificateModalOpen] = useState(false);
    const [gradeModalOpen, setGradeModalOpen] = useState(false);
    const [deleteDocId, setDeleteDocId] = useState<number | null>(null);
    const [deleteGradeId, setDeleteGradeId] = useState<number | null>(null);
    const [deleteProcessing, setDeleteProcessing] = useState(false);

    const [activeTab, setActiveTab] = useState(() => {
        const fromUrl =
            typeof window !== 'undefined'
                ? new URLSearchParams(window.location.search).get('tab')
                : null;

        return fromUrl && TABS.includes(fromUrl) ? fromUrl : 'overview';
    });

    const name = student.user?.name ?? 'Unknown Student';
    const initials = name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();

    setLayoutProps({
        breadcrumbs: [
            { title: 'Dashboard', href: '/admin/dashboard' },
            { title: 'Students', href: '/admin/students' },
            { title: name, href: `/admin/students/${student.id}` },
        ],
    });

    const isSuspended = student.enrollment_status === 'suspended';

    const handleToggleStatus = () => {
        router.post(
            `/admin/students/${student.id}/toggle-status`,
            {},
            {
                preserveScroll: true,
                onSuccess: () =>
                    toast.success(
                        isSuspended ? 'Student activated.' : 'Student suspended.',
                    ),
                onError: () => toast.error('Failed to change status.'),
            },
        );
    };

    const runDelete = (
        url: string,
        successMessage: string,
        failMessage: string,
        done: () => void,
    ) => {
        setDeleteProcessing(true);
        router.delete(url, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(successMessage);
                done();
            },
            onError: () => toast.error(failMessage),
            onFinish: () => setDeleteProcessing(false),
        });
    };

    return (
        <>
            <Head title={`Student - ${name}`} />

            <div className="mx-auto max-w-6xl space-y-6 p-6">
                {/* Header */}
                <div className="flex flex-col gap-4 rounded-lg border bg-card p-5 sm:flex-row sm:items-center">
                    <Avatar className="h-16 w-16 shrink-0 border-2 border-primary/20">
                        <AvatarImage src={student.photo_url ?? undefined} alt={name} />
                        <AvatarFallback className="bg-primary/10 text-lg font-bold text-primary">
                            {initials}
                        </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="text-xl font-bold tracking-tight">{name}</h1>
                            <span className="rounded border bg-muted px-2 py-0.5 font-mono text-xs font-semibold">
                                {student.matric_no}
                            </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {student.program?.name ?? 'No program assigned'} · Semester{' '}
                            {student.current_semester}
                            {student.academic_year ? ` · ${student.academic_year}` : ''}
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                            <StudentStatusBadge status={student.enrollment_status} />
                            <StudentFeeBadge status={financialSummary.clearance_status} />
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" asChild>
                            <Link href={`/admin/finance/students/${student.id}`}>
                                <Wallet className="mr-1.5 h-3.5 w-3.5" />
                                Finance
                            </Link>
                        </Button>
                        <Button size="sm" asChild>
                            <Link href={`/admin/students/${student.id}/edit`}>
                                <Edit3 className="mr-1.5 h-3.5 w-3.5" />
                                Edit
                            </Link>
                        </Button>
                    </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-5">
                    <TabsList className="h-auto w-full justify-start overflow-x-auto sm:w-fit">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="academics">Academics</TabsTrigger>
                        <TabsTrigger value="finance">
                            Finance
                            {financialSummary.overdue_count > 0 && (
                                <Badge
                                    variant="destructive"
                                    className="ml-1.5 h-4 px-1 text-[10px]"
                                >
                                    {financialSummary.overdue_count}
                                </Badge>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="documents">
                            Documents
                            <span className="ml-1 text-[11px] text-muted-foreground">
                                ({(student.documents?.length ?? 0) + (student.certificates?.length ?? 0)})
                            </span>
                        </TabsTrigger>
                        <TabsTrigger value="account">Account</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview">
                        <ProfileOverviewTab
                            student={student}
                            financialSummary={financialSummary}
                            academicSummary={academicSummary}
                            attendanceSummary={attendanceSummary}
                            onNavigate={setActiveTab}
                        />
                    </TabsContent>

                    <TabsContent value="academics">
                        <ProfileAcademicsTab
                            student={student}
                            academicSummary={academicSummary}
                            attendanceSummary={attendanceSummary}
                            onAddGrade={() => setGradeModalOpen(true)}
                            onDeleteGrade={setDeleteGradeId}
                        />
                    </TabsContent>

                    <TabsContent value="finance">
                        <ProfileFinanceTab
                            student={student}
                            financialSummary={financialSummary}
                            currentSemesterFinance={currentSemesterFinance}
                            financeStatement={financeStatement}
                        />
                    </TabsContent>

                    <TabsContent value="documents">
                        <ProfileDocumentsTab
                            student={student}
                            onUpload={() => setDocumentModalOpen(true)}
                            onIssueCertificate={() => setCertificateModalOpen(true)}
                            onDeleteDocument={setDeleteDocId}
                        />
                    </TabsContent>

                    <TabsContent value="account">
                        <ProfileAccountTab
                            student={student}
                            onResetPassword={() => setPasswordModalOpen(true)}
                            onToggleStatus={handleToggleStatus}
                        />
                    </TabsContent>
                </Tabs>

                <ResetPasswordModal
                    open={passwordModalOpen}
                    onOpenChange={setPasswordModalOpen}
                    student={student}
                />
                <UploadDocumentModal
                    open={documentModalOpen}
                    onOpenChange={setDocumentModalOpen}
                    studentId={student.id}
                />
                <GenerateCertificateModal
                    open={certificateModalOpen}
                    onOpenChange={setCertificateModalOpen}
                    studentId={student.id}
                />
                <AddGradeModal
                    open={gradeModalOpen}
                    onOpenChange={setGradeModalOpen}
                    studentId={student.id}
                    defaultSemester={student.current_semester ?? 1}
                />

                <ConfirmDeleteDialog
                    open={deleteGradeId !== null}
                    onOpenChange={(open) => !open && setDeleteGradeId(null)}
                    title="Remove Course Grade"
                    description="Are you sure you want to remove this grade? Student GPA will be recalculated."
                    loading={deleteProcessing}
                    onConfirm={() =>
                        runDelete(
                            `/admin/students/${student.id}/grades/${deleteGradeId}`,
                            'Grade entry removed.',
                            'Failed to delete grade.',
                            () => setDeleteGradeId(null),
                        )
                    }
                />
                <ConfirmDeleteDialog
                    open={deleteDocId !== null}
                    onOpenChange={(open) => !open && setDeleteDocId(null)}
                    title="Delete Document"
                    loading={deleteProcessing}
                    onConfirm={() =>
                        runDelete(
                            `/admin/students/${student.id}/documents/${deleteDocId}`,
                            'Document removed successfully.',
                            'Failed to delete document.',
                            () => setDeleteDocId(null),
                        )
                    }
                />
            </div>
        </>
    );
}

AdminStudentsShow.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/admin/dashboard' },
        { title: 'Students', href: '/admin/students' },
    ],
};
