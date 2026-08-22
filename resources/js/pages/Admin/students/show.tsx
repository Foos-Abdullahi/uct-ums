import React, { useState } from 'react';
import { Head, Link, router, setLayoutProps } from '@inertiajs/react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { StudentStatusBadge } from './components/student-status-badge';
import { StudentFeeBadge } from './components/student-fee-badge';
import { UctPanelCard } from '@/components/tools/uct-panel-card';
import { ResetPasswordModal } from './components/reset-password-modal';
import { ManageFeeModal } from './components/manage-fee-modal';
import { RecordPaymentModal } from './components/record-payment-modal';
import { UploadDocumentModal } from './components/upload-document-modal';
import { GenerateCertificateModal } from './components/generate-certificate-modal';
import { AddGradeModal } from './components/add-grade-modal';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import type { Student, StudentDocument, StudentGrade } from '@/types/student';
import {
    ArrowLeft,
    Edit3,
    KeyRound,
    Ban,
    CheckCircle2,
    BookOpen,
    CreditCard,
    FileText,
    Award,
    Clock,
    User,
    Shield,
    Plus,
    Printer,
    Download,
    Trash2,
    Check,
    X,
    FileUp,
    Receipt,
    GraduationCap,
    ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';

interface FinancialSummary {
    total_invoiced: number;
    total_paid: number;
    total_outstanding: number;
    overdue_count: number;
}

interface AcademicSummary {
    total_credits: number;
    completed_credits: number;
    passed_count: number;
    failed_count: number;
    in_progress_count: number;
    gpa: number | string;
}

interface AttendanceSummary {
    total_classes: number;
    present_count: number;
    late_count: number;
    absent_count: number;
    attendance_rate: number;
}

interface AdminStudentsShowProps {
    student: Student;
    financialSummary: FinancialSummary;
    academicSummary: AcademicSummary;
    attendanceSummary: AttendanceSummary;
}

export default function AdminStudentsShow({
    student,
    financialSummary,
    academicSummary,
    attendanceSummary,
}: AdminStudentsShowProps) {
    const [passwordModalOpen, setPasswordModalOpen] = useState(false);
    const [feeModalOpen, setFeeModalOpen] = useState(false);
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [documentModalOpen, setDocumentModalOpen] = useState(false);
    const [certificateModalOpen, setCertificateModalOpen] = useState(false);
    const [gradeModalOpen, setGradeModalOpen] = useState(false);

    // Delete item state
    const [deleteDocId, setDeleteDocId] = useState<number | null>(null);
    const [deleteGradeId, setDeleteGradeId] = useState<number | null>(null);
    const [deleteProcessing, setDeleteProcessing] = useState(false);

    const name = student.user?.name ?? 'Unknown Student';

    setLayoutProps({
        breadcrumbs: [
            { title: 'Dashboard', href: '/admin/dashboard' },
            { title: 'Students', href: '/admin/students' },
            { title: name, href: `/admin/students/${student.id}` },
        ],
    });

    const initials = name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();

    const isSuspended = student.enrollment_status === 'suspended';

    const handleToggleStatus = () => {
        router.post(
            `/admin/students/${student.id}/toggle-status`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(isSuspended ? 'Student activated.' : 'Student suspended.');
                },
                onError: () => toast.error('Failed to change status.'),
            }
        );
    };

    const handlePaymentStatusChange = (paymentId: number, status: 'approved' | 'rejected') => {
        router.patch(
            `/admin/students/${student.id}/payments/${paymentId}/status`,
            { status },
            {
                preserveScroll: true,
                onSuccess: () => toast.success(`Payment marked as ${status}.`),
                onError: () => toast.error('Failed to update payment status.'),
            }
        );
    };

    const confirmDeleteDocument = () => {
        if (!deleteDocId) return;
        setDeleteProcessing(true);
        router.delete(`/admin/students/${student.id}/documents/${deleteDocId}`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Document removed successfully.');
                setDeleteDocId(null);
                setDeleteProcessing(false);
            },
            onError: () => {
                toast.error('Failed to delete document.');
                setDeleteProcessing(false);
            },
        });
    };

    const confirmDeleteGrade = () => {
        if (!deleteGradeId) return;
        setDeleteProcessing(true);
        router.delete(`/admin/students/${student.id}/grades/${deleteGradeId}`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Grade entry removed.');
                setDeleteGradeId(null);
                setDeleteProcessing(false);
            },
            onError: () => {
                toast.error('Failed to delete grade.');
                setDeleteProcessing(false);
            },
        });
    };

    // Group grades by semester for Transcript tab
    const gradesBySemester: Record<number, StudentGrade[]> = {};
    (student.grades ?? []).forEach((grade) => {
        const sem = grade.semester || 1;
        if (!gradesBySemester[sem]) {
            gradesBySemester[sem] = [];
        }
        gradesBySemester[sem].push(grade);
    });

    return (
        <>
            <Head title={`Student - ${name}`} />

            <div className="p-6 space-y-6">
                {/* Back Button & Actions */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                        <Button
                            variant={isSuspended ? 'outline' : 'destructive'}
                            size="sm"
                            onClick={handleToggleStatus}
                        >
                            {isSuspended ? (
                                <>
                                    <CheckCircle2 className="h-3.5 w-3.5 mr-1.5 text-emerald-600" />
                                    Activate Account
                                </>
                            ) : (
                                <>
                                    <Ban className="h-3.5 w-3.5 mr-1.5" />
                                    Suspend Account
                                </>
                            )}
                        </Button>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPasswordModalOpen(true)}
                        >
                            <KeyRound className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                            Reset Password
                        </Button>

                        <Button size="sm" asChild>
                            <Link href={`/admin/students/${student.id}/edit`}>
                                <Edit3 className="h-3.5 w-3.5 mr-1.5" />
                                Edit Student
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Profile Header Banner — UctPanelCard */}
                <UctPanelCard
                    type="default"
                    className="overflow-hidden"
                    contentClassName="pt-0"
                    headerClassName="border-b-0 pb-0"
                    title={
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 w-full">
                            <div className="flex items-start md:items-center gap-4">
                                <Avatar className="h-16 w-16 border-2 border-primary/20 shrink-0">
                                    <AvatarFallback className="bg-primary/10 text-lg font-bold text-primary">
                                        {initials}
                                    </AvatarFallback>
                                </Avatar>

                                <div className="space-y-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-xl font-bold text-foreground tracking-tight">{name}</span>
                                        <span className="font-mono text-xs font-semibold px-2.5 py-0.5 rounded bg-muted text-foreground border border-border/60">
                                            {student.matric_no}
                                        </span>
                                        <StudentStatusBadge status={student.enrollment_status} />
                                        <StudentFeeBadge status={student.fee_status} />
                                    </div>
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground font-normal">
                                        <span>{student.user?.email}</span>
                                        {student.phone && <span>• {student.phone}</span>}
                                        <span>• {student.program?.name ?? 'No Program Assigned'}</span>
                                        <span>• Semester {student.current_semester ?? 1}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Stats */}
                            <div className="flex items-center gap-3 bg-muted/40 border border-border/40 p-3 rounded-md self-stretch md:self-auto justify-between md:justify-end shrink-0">
                                <div className="text-center px-2">
                                    <p className="text-[10px] uppercase font-semibold text-muted-foreground">CGPA</p>
                                    <p className="text-base font-bold text-foreground">
                                        {student.gpa ? Number(student.gpa).toFixed(2) : '0.00'}
                                    </p>
                                </div>
                                <div className="h-8 w-px bg-border/60" />
                                <div className="text-center px-2">
                                    <p className="text-[10px] uppercase font-semibold text-muted-foreground">Credits</p>
                                    <p className="text-base font-bold text-foreground">
                                        {academicSummary.completed_credits} / {academicSummary.total_credits}
                                    </p>
                                </div>
                                <div className="h-8 w-px bg-border/60" />
                                <div className="text-center px-2">
                                    <p className="text-[10px] uppercase font-semibold text-muted-foreground">Outstanding</p>
                                    <p className="text-base font-bold text-destructive">
                                        ${financialSummary.total_outstanding.toFixed(2)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    }
                />

                {/* 8 Tab Navigation Panels */}
                <Tabs defaultValue="overview" className="space-y-4">
                    <TabsList className="bg-muted/60 p-1 rounded-sm border border-border/40 flex-wrap h-auto">
                        <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
                        <TabsTrigger value="academic" className="text-xs">Academic</TabsTrigger>
                        <TabsTrigger value="finance" className="text-xs">
                            Finance
                            {financialSummary.overdue_count > 0 && (
                                <Badge variant="destructive" className="ml-1.5 h-4 px-1 text-[10px]">
                                    {financialSummary.overdue_count}
                                </Badge>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="attendance" className="text-xs">Attendance</TabsTrigger>
                        <TabsTrigger value="documents" className="text-xs">
                            Documents
                            <span className="ml-1 text-[11px] text-muted-foreground">
                                ({student.documents?.length ?? 0})
                            </span>
                        </TabsTrigger>
                        <TabsTrigger value="transcript" className="text-xs">Transcript</TabsTrigger>
                        <TabsTrigger value="certificates" className="text-xs">Certificates</TabsTrigger>
                        <TabsTrigger value="account" className="text-xs">Account</TabsTrigger>
                    </TabsList>

                    {/* Tab 1: Overview */}
                    <TabsContent value="overview" className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Personal Information Card */}
                            <UctPanelCard
                                title="Personal Information"
                                description="Contact details, matriculation ID, and identity."
                                icon={User}
                                type="default"
                            >
                                <div className="divide-y divide-border/30 text-xs">
                                    <div className="flex justify-between py-2">
                                        <span className="text-muted-foreground">Full Name</span>
                                        <span className="font-medium text-foreground">{name}</span>
                                    </div>
                                    <div className="flex justify-between py-2">
                                        <span className="text-muted-foreground">Matriculation ID</span>
                                        <span className="font-mono font-medium text-foreground">{student.matric_no}</span>
                                    </div>
                                    <div className="flex justify-between py-2">
                                        <span className="text-muted-foreground">Email Address</span>
                                        <span className="font-medium text-foreground">{student.user?.email}</span>
                                    </div>
                                    <div className="flex justify-between py-2">
                                        <span className="text-muted-foreground">Phone Number</span>
                                        <span className="font-medium text-foreground">{student.phone || '—'}</span>
                                    </div>
                                    <div className="flex justify-between py-2">
                                        <span className="text-muted-foreground">Gender</span>
                                        <span className="font-medium text-foreground">{student.gender || '—'}</span>
                                    </div>
                                    <div className="flex justify-between py-2">
                                        <span className="text-muted-foreground">Date of Birth</span>
                                        <span className="font-medium text-foreground">{student.date_of_birth ? String(student.date_of_birth).split('T')[0] : '—'}</span>
                                    </div>
                                    <div className="flex justify-between py-2">
                                        <span className="text-muted-foreground">Address</span>
                                        <span className="font-medium text-foreground text-right">{student.address || '—'}</span>
                                    </div>
                                    <div className="flex justify-between py-2">
                                        <span className="text-muted-foreground">Enrollment Date</span>
                                        <span className="font-medium text-foreground">{student.enrollment_date ? String(student.enrollment_date).split('T')[0] : '—'}</span>
                                    </div>
                                </div>
                            </UctPanelCard>

                            {/* Academic & Financial Summaries */}
                            <div className="space-y-6">
                                <UctPanelCard
                                    title="Academic Program Summary"
                                    description="Degree program, semester level, and GPA."
                                    icon={BookOpen}
                                    type="default"
                                >
                                    <div className="divide-y divide-border/30 text-xs">
                                        <div className="flex justify-between py-2">
                                            <span className="text-muted-foreground">Degree Program</span>
                                            <span className="font-medium text-foreground">{student.program?.name ?? '—'}</span>
                                        </div>
                                        <div className="flex justify-between py-2">
                                            <span className="text-muted-foreground">Degree Level</span>
                                            <span className="font-medium uppercase text-foreground">{student.program?.degree_level ?? 'Bachelor'}</span>
                                        </div>
                                        <div className="flex justify-between py-2">
                                            <span className="text-muted-foreground">Current Semester</span>
                                            <span className="font-medium text-foreground">Semester {student.current_semester}</span>
                                        </div>
                                        <div className="flex justify-between py-2">
                                            <span className="text-muted-foreground">Cumulative GPA</span>
                                            <span className="font-bold text-foreground">{student.gpa ? Number(student.gpa).toFixed(2) : '0.00'} / 4.00</span>
                                        </div>
                                        <div className="flex justify-between py-2">
                                            <span className="text-muted-foreground">Credits Completed</span>
                                            <span className="font-medium text-foreground">{academicSummary.completed_credits} Credits</span>
                                        </div>
                                    </div>
                                </UctPanelCard>

                                <UctPanelCard
                                    title="Financial Balance Summary"
                                    description="Tuition fees, payments, and balance standing."
                                    icon={CreditCard}
                                    type={financialSummary.total_outstanding > 0 ? "warning" : "success"}
                                >
                                    <div className="divide-y divide-border/30 text-xs">
                                        <div className="flex justify-between py-2">
                                            <span className="text-muted-foreground">Total Invoiced Fees</span>
                                            <span className="font-medium text-foreground">${financialSummary.total_invoiced.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between py-2">
                                            <span className="text-muted-foreground">Total Paid Amount</span>
                                            <span className="font-medium text-emerald-600">${financialSummary.total_paid.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between py-2">
                                            <span className="text-muted-foreground">Outstanding Balance</span>
                                            <span className="font-bold text-destructive">${financialSummary.total_outstanding.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between py-2">
                                            <span className="text-muted-foreground">Fee Clearance Status</span>
                                            <StudentFeeBadge status={student.fee_status} />
                                        </div>
                                    </div>
                                </UctPanelCard>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Tab 2: Academic */}
                    <TabsContent value="academic" className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-semibold text-foreground">Course Grades & Enrolled Modules</h3>
                                <p className="text-xs text-muted-foreground">View and record grades for academic coursework.</p>
                            </div>
                            <Button size="sm" onClick={() => setGradeModalOpen(true)}>
                                <Plus className="h-3.5 w-3.5 mr-1.5" />
                                Record Course Grade
                            </Button>
                        </div>

                        <Card className="rounded-sm border-border/40 bg-card shadow-xs overflow-hidden">
                            <Table>
                                <TableHeader className="bg-muted/40">
                                    <TableRow>
                                        <TableHead className="text-xs font-semibold">Course Code</TableHead>
                                        <TableHead className="text-xs font-semibold">Course Name</TableHead>
                                        <TableHead className="text-xs font-semibold">Semester</TableHead>
                                        <TableHead className="text-xs font-semibold">Credits</TableHead>
                                        <TableHead className="text-xs font-semibold">Grade</TableHead>
                                        <TableHead className="text-xs font-semibold">Grade Point</TableHead>
                                        <TableHead className="text-xs font-semibold">Status</TableHead>
                                        <TableHead className="text-xs font-semibold text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {(student.grades && student.grades.length > 0) ? (
                                        student.grades.map((grade) => (
                                            <TableRow key={grade.id}>
                                                <TableCell className="font-mono text-xs font-semibold">
                                                    {grade.course_code}
                                                </TableCell>
                                                <TableCell className="text-xs font-medium text-foreground">
                                                    {grade.course_name}
                                                </TableCell>
                                                <TableCell className="text-xs text-muted-foreground">
                                                    Semester {grade.semester}
                                                </TableCell>
                                                <TableCell className="text-xs text-muted-foreground">
                                                    {grade.credits}
                                                </TableCell>
                                                <TableCell className="text-xs font-bold text-foreground">
                                                    {grade.grade || '—'}
                                                </TableCell>
                                                <TableCell className="text-xs font-mono text-muted-foreground">
                                                    {grade.grade_point !== null && grade.grade_point !== undefined ? Number(grade.grade_point).toFixed(2) : '—'}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant="outline"
                                                        className={
                                                            grade.status === 'passed'
                                                                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600'
                                                                : grade.status === 'failed'
                                                                ? 'border-destructive/30 bg-destructive/10 text-destructive'
                                                                : 'border-amber-500/30 bg-amber-500/10 text-amber-600'
                                                        }
                                                    >
                                                        {grade.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                                        onClick={() => setDeleteGradeId(grade.id)}
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={8} className="h-24 text-center text-xs text-muted-foreground">
                                                No course grades recorded yet. Click "Record Course Grade" to add course results.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </Card>
                    </TabsContent>

                    {/* Tab 3: Finance */}
                    <TabsContent value="finance" className="space-y-6">
                        {/* Financial metric overview */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            <Card className="p-4 border-border/40 rounded-sm bg-card shadow-xs">
                                <p className="text-[11px] font-medium text-muted-foreground uppercase">Total Invoiced</p>
                                <h3 className="text-xl font-bold text-foreground mt-1 tabular-nums">
                                    ${financialSummary.total_invoiced.toFixed(2)}
                                </h3>
                            </Card>
                            <Card className="p-4 border-border/40 rounded-sm bg-card shadow-xs">
                                <p className="text-[11px] font-medium text-muted-foreground uppercase">Total Paid</p>
                                <h3 className="text-xl font-bold text-emerald-600 mt-1 tabular-nums">
                                    ${financialSummary.total_paid.toFixed(2)}
                                </h3>
                            </Card>
                            <Card className="p-4 border-border/40 rounded-sm bg-card shadow-xs">
                                <p className="text-[11px] font-medium text-muted-foreground uppercase">Outstanding Balance</p>
                                <h3 className="text-xl font-bold text-destructive mt-1 tabular-nums">
                                    ${financialSummary.total_outstanding.toFixed(2)}
                                </h3>
                            </Card>
                            <Card className="p-4 border-border/40 rounded-sm bg-card shadow-xs">
                                <p className="text-[11px] font-medium text-muted-foreground uppercase">Clearance Status</p>
                                <div className="mt-1">
                                    <StudentFeeBadge status={student.fee_status} />
                                </div>
                            </Card>
                        </div>

                        {/* Invoices Section */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="text-sm font-semibold text-foreground">Fee Invoices</h4>
                                    <p className="text-xs text-muted-foreground">Tuition and mandatory university charges.</p>
                                </div>
                                <Button size="sm" variant="outline" onClick={() => setFeeModalOpen(true)}>
                                    <Receipt className="h-3.5 w-3.5 mr-1.5" />
                                    Issue Invoice
                                </Button>
                            </div>

                            <Card className="rounded-sm border-border/40 bg-card shadow-xs overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-muted/40">
                                        <TableRow>
                                            <TableHead className="text-xs font-semibold">Invoice No</TableHead>
                                            <TableHead className="text-xs font-semibold">Title</TableHead>
                                            <TableHead className="text-xs font-semibold">Type</TableHead>
                                            <TableHead className="text-xs font-semibold">Amount</TableHead>
                                            <TableHead className="text-xs font-semibold">Paid</TableHead>
                                            <TableHead className="text-xs font-semibold">Due Date</TableHead>
                                            <TableHead className="text-xs font-semibold">Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {(student.invoices && student.invoices.length > 0) ? (
                                            student.invoices.map((inv) => (
                                                <TableRow key={inv.id}>
                                                    <TableCell className="font-mono text-xs font-semibold">
                                                        {inv.invoice_no}
                                                    </TableCell>
                                                    <TableCell className="text-xs font-medium text-foreground">
                                                        {inv.title}
                                                    </TableCell>
                                                    <TableCell className="text-xs capitalize text-muted-foreground">
                                                        {inv.type}
                                                    </TableCell>
                                                    <TableCell className="text-xs font-bold text-foreground">
                                                        ${Number(inv.amount).toFixed(2)}
                                                    </TableCell>
                                                    <TableCell className="text-xs font-medium text-emerald-600">
                                                        ${Number(inv.paid_amount).toFixed(2)}
                                                    </TableCell>
                                                    <TableCell className="text-xs text-muted-foreground">
                                                        {inv.due_date ? String(inv.due_date).split('T')[0] : '—'}
                                                    </TableCell>
                                                    <TableCell>
                                                        <StudentFeeBadge status={inv.status} />
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={7} className="h-20 text-center text-xs text-muted-foreground">
                                                    No invoices issued for this student yet.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </Card>
                        </div>

                        {/* Payments Section */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="text-sm font-semibold text-foreground">Payment Transactions</h4>
                                    <p className="text-xs text-muted-foreground">Bank transfers, cash desk receipts, and online payments.</p>
                                </div>
                                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setPaymentModalOpen(true)}>
                                    <CreditCard className="h-3.5 w-3.5 mr-1.5" />
                                    Record Payment
                                </Button>
                            </div>

                            <Card className="rounded-sm border-border/40 bg-card shadow-xs overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-muted/40">
                                        <TableRow>
                                            <TableHead className="text-xs font-semibold">Transaction No</TableHead>
                                            <TableHead className="text-xs font-semibold">Amount</TableHead>
                                            <TableHead className="text-xs font-semibold">Method</TableHead>
                                            <TableHead className="text-xs font-semibold">Date</TableHead>
                                            <TableHead className="text-xs font-semibold">Notes</TableHead>
                                            <TableHead className="text-xs font-semibold">Status</TableHead>
                                            <TableHead className="text-xs font-semibold text-right">Approval</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {(student.payments && student.payments.length > 0) ? (
                                            student.payments.map((pmt) => (
                                                <TableRow key={pmt.id}>
                                                    <TableCell className="font-mono text-xs font-semibold">
                                                        {pmt.transaction_no}
                                                    </TableCell>
                                                    <TableCell className="text-xs font-bold text-foreground">
                                                        ${Number(pmt.amount).toFixed(2)}
                                                    </TableCell>
                                                    <TableCell className="text-xs capitalize text-muted-foreground">
                                                        {pmt.payment_method.replace('_', ' ')}
                                                    </TableCell>
                                                    <TableCell className="text-xs text-muted-foreground">
                                                        {String(pmt.payment_date).split('T')[0]}
                                                    </TableCell>
                                                    <TableCell className="text-xs text-muted-foreground max-w-[180px] truncate">
                                                        {pmt.notes || '—'}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            variant="outline"
                                                            className={
                                                                pmt.status === 'approved'
                                                                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600'
                                                                    : pmt.status === 'rejected'
                                                                    ? 'border-destructive/30 bg-destructive/10 text-destructive'
                                                                    : 'border-amber-500/30 bg-amber-500/10 text-amber-600'
                                                            }
                                                        >
                                                            {pmt.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {pmt.status === 'pending' ? (
                                                            <div className="flex items-center justify-end gap-1">
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="h-7 text-xs text-emerald-600 hover:text-emerald-700"
                                                                    onClick={() => handlePaymentStatusChange(pmt.id, 'approved')}
                                                                >
                                                                    <Check className="h-3 w-3 mr-1" />
                                                                    Approve
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="h-7 text-xs text-destructive hover:text-destructive"
                                                                    onClick={() => handlePaymentStatusChange(pmt.id, 'rejected')}
                                                                >
                                                                    <X className="h-3 w-3 mr-1" />
                                                                    Reject
                                                                </Button>
                                                            </div>
                                                        ) : (
                                                            <span className="text-[11px] text-muted-foreground">Processed</span>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={7} className="h-20 text-center text-xs text-muted-foreground">
                                                    No payments recorded for this student yet.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Tab 4: Attendance */}
                    <TabsContent value="attendance" className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                            <Card className="p-4 border-border/40 rounded-sm bg-card shadow-xs">
                                <p className="text-[11px] font-medium text-muted-foreground uppercase">Attendance Rate</p>
                                <h3 className="text-xl font-bold text-emerald-600 mt-1 tabular-nums">
                                    {attendanceSummary.attendance_rate}%
                                </h3>
                            </Card>
                            <Card className="p-4 border-border/40 rounded-sm bg-card shadow-xs">
                                <p className="text-[11px] font-medium text-muted-foreground uppercase">Total Classes</p>
                                <h3 className="text-xl font-bold text-foreground mt-1 tabular-nums">
                                    {attendanceSummary.total_classes}
                                </h3>
                            </Card>
                            <Card className="p-4 border-border/40 rounded-sm bg-card shadow-xs">
                                <p className="text-[11px] font-medium text-muted-foreground uppercase">Present Sessions</p>
                                <h3 className="text-xl font-bold text-emerald-600 mt-1 tabular-nums">
                                    {attendanceSummary.present_count}
                                </h3>
                            </Card>
                            <Card className="p-4 border-border/40 rounded-sm bg-card shadow-xs">
                                <p className="text-[11px] font-medium text-muted-foreground uppercase">Absences</p>
                                <h3 className="text-xl font-bold text-destructive mt-1 tabular-nums">
                                    {attendanceSummary.absent_count}
                                </h3>
                            </Card>
                        </div>

                        <Card className="rounded-sm border-border/40 bg-card shadow-xs overflow-hidden">
                            <Table>
                                <TableHeader className="bg-muted/40">
                                    <TableRow>
                                        <TableHead className="text-xs font-semibold">Date</TableHead>
                                        <TableHead className="text-xs font-semibold">Course Name</TableHead>
                                        <TableHead className="text-xs font-semibold">Status</TableHead>
                                        <TableHead className="text-xs font-semibold">Notes</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {(student.attendances && student.attendances.length > 0) ? (
                                        student.attendances.map((att) => (
                                            <TableRow key={att.id}>
                                                <TableCell className="text-xs text-muted-foreground">
                                                    {String(att.date).split('T')[0]}
                                                </TableCell>
                                                <TableCell className="text-xs font-medium text-foreground">
                                                    {att.course_name}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant="outline"
                                                        className={
                                                            att.status === 'present'
                                                                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600'
                                                                : att.status === 'late'
                                                                ? 'border-amber-500/30 bg-amber-500/10 text-amber-600'
                                                                : 'border-destructive/30 bg-destructive/10 text-destructive'
                                                        }
                                                    >
                                                        {att.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-xs text-muted-foreground">
                                                    {att.notes || '—'}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-20 text-center text-xs text-muted-foreground">
                                                No attendance logs recorded for this student yet.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </Card>
                    </TabsContent>

                    {/* Tab 5: Documents */}
                    <TabsContent value="documents" className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-semibold text-foreground">Student Documents & Files</h3>
                                <p className="text-xs text-muted-foreground">Admission records, ID cards, certificates, and academic transcripts.</p>
                            </div>
                            <Button size="sm" onClick={() => setDocumentModalOpen(true)}>
                                <FileUp className="h-3.5 w-3.5 mr-1.5" />
                                Upload Document
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {(student.documents && student.documents.length > 0) ? (
                                student.documents.map((doc) => (
                                    <Card key={doc.id} className="rounded-sm border-border/40 bg-card shadow-xs p-4 flex flex-col justify-between">
                                        <div className="space-y-2">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex h-8 w-8 items-center justify-center rounded bg-primary/10 text-primary">
                                                        <FileText className="h-4 w-4" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-xs font-semibold text-foreground line-clamp-1">{doc.title}</h4>
                                                        <p className="text-[10px] text-muted-foreground capitalize">{doc.category} Document</p>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                                    onClick={() => setDeleteDocId(doc.id)}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                            {doc.file_size && (
                                                <p className="text-[11px] text-muted-foreground">
                                                    Size: {(doc.file_size / 1024).toFixed(1)} KB
                                                </p>
                                            )}
                                        </div>

                                        <div className="pt-3 mt-3 border-t border-border/30 flex items-center justify-between">
                                            <span className="text-[10px] text-muted-foreground">
                                                {doc.created_at ? String(doc.created_at).split('T')[0] : ''}
                                            </span>
                                            <a
                                                href={`/storage/${doc.file_path}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                                            >
                                                <Download className="h-3 w-3" />
                                                View / Download
                                            </a>
                                        </div>
                                    </Card>
                                ))
                            ) : (
                                <div className="col-span-full py-12 text-center text-xs text-muted-foreground border border-dashed border-border rounded-md bg-muted/20">
                                    <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                                    No documents uploaded yet. Click "Upload Document" to attach files.
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    {/* Tab 6: Transcript */}
                    <TabsContent value="transcript" className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-semibold text-foreground">Official Academic Transcript</h3>
                                <p className="text-xs text-muted-foreground">Semester-by-semester course performance, GPA, and cumulative credits.</p>
                            </div>
                            <Button size="sm" variant="outline" onClick={() => window.print()} className="gap-1.5">
                                <Printer className="h-3.5 w-3.5" />
                                Print Transcript
                            </Button>
                        </div>

                        <Card className="rounded-sm border-border/40 bg-card p-6 shadow-xs space-y-6 print:shadow-none print:border-none">
                            {/* Transcript Header */}
                            <div className="border-b border-border/60 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div>
                                    <h2 className="text-lg font-bold text-foreground">UNIVERSAL COLLEGE OF TECHNOLOGY</h2>
                                    <p className="text-xs text-muted-foreground">Office of the University Registrar • Academic Transcript</p>
                                </div>
                                <div className="text-left sm:text-right text-xs space-y-0.5">
                                    <p><span className="text-muted-foreground">Student Name:</span> <strong className="text-foreground">{name}</strong></p>
                                    <p><span className="text-muted-foreground">Matriculation ID:</span> <strong className="font-mono text-foreground">{student.matric_no}</strong></p>
                                    <p><span className="text-muted-foreground">Program:</span> <strong className="text-foreground">{student.program?.name}</strong></p>
                                </div>
                            </div>

                            {/* Semester Tables */}
                            {Object.keys(gradesBySemester).length > 0 ? (
                                Object.entries(gradesBySemester).map(([sem, grades]) => {
                                    const semCredits = grades.reduce((sum, g) => sum + Number(g.credits), 0);
                                    const semPoints = grades.reduce((sum, g) => sum + (Number(g.grade_point || 0) * Number(g.credits)), 0);
                                    const semGpa = semCredits > 0 ? (semPoints / semCredits).toFixed(2) : '0.00';

                                    return (
                                        <div key={sem} className="space-y-2">
                                            <div className="flex items-center justify-between bg-muted/40 px-3 py-1.5 rounded text-xs font-semibold text-foreground">
                                                <span>Semester {sem}</span>
                                                <span>Semester GPA: {semGpa}</span>
                                            </div>
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead className="text-xs">Code</TableHead>
                                                        <TableHead className="text-xs">Course Title</TableHead>
                                                        <TableHead className="text-xs">Credits</TableHead>
                                                        <TableHead className="text-xs">Grade</TableHead>
                                                        <TableHead className="text-xs text-right">Grade Point</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {grades.map((g) => (
                                                        <TableRow key={g.id}>
                                                            <TableCell className="font-mono text-xs font-semibold">{g.course_code}</TableCell>
                                                            <TableCell className="text-xs">{g.course_name}</TableCell>
                                                            <TableCell className="text-xs">{g.credits}</TableCell>
                                                            <TableCell className="text-xs font-bold">{g.grade || '—'}</TableCell>
                                                            <TableCell className="text-xs font-mono text-right">
                                                                {g.grade_point !== null && g.grade_point !== undefined ? Number(g.grade_point).toFixed(2) : '—'}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="py-8 text-center text-xs text-muted-foreground">
                                    No completed courses to generate transcript.
                                </div>
                            )}

                            {/* Transcript Footer Summary */}
                            <div className="border-t border-border/60 pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
                                <div>
                                    <p className="text-muted-foreground">Total Earned Credits: <strong className="text-foreground">{academicSummary.completed_credits}</strong></p>
                                    <p className="text-muted-foreground">Cumulative GPA (CGPA): <strong className="text-foreground text-sm">{student.gpa ? Number(student.gpa).toFixed(2) : '0.00'}</strong></p>
                                </div>
                                <div className="text-left sm:text-right text-[11px] text-muted-foreground">
                                    <p>Official Record Issued: {new Date().toLocaleDateString()}</p>
                                    <p>Universal College of Technology</p>
                                </div>
                            </div>
                        </Card>
                    </TabsContent>

                    {/* Tab 7: Certificates */}
                    <TabsContent value="certificates" className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-semibold text-foreground">Degrees & Certificates</h3>
                                <p className="text-xs text-muted-foreground">University diplomas, completion credentials, and dean's honor certificates.</p>
                            </div>
                            <Button size="sm" onClick={() => setCertificateModalOpen(true)}>
                                <Award className="h-3.5 w-3.5 mr-1.5" />
                                Issue Certificate
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {(student.certificates && student.certificates.length > 0) ? (
                                student.certificates.map((cert) => (
                                    <Card key={cert.id} className="rounded-sm border-border/40 bg-card p-4 shadow-xs flex flex-col justify-between">
                                        <div className="space-y-2">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                                                        <Award className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-semibold text-foreground">{cert.title}</h4>
                                                        <p className="font-mono text-xs text-muted-foreground">{cert.certificate_no}</p>
                                                    </div>
                                                </div>
                                                <Badge
                                                    variant="outline"
                                                    className={cert.status === 'active' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600' : 'border-destructive/30 bg-destructive/10 text-destructive'}
                                                >
                                                    {cert.status}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2">
                                                <span className="capitalize">Type: {cert.type}</span>
                                                <span>Issued: {String(cert.issue_date).split('T')[0]}</span>
                                            </div>
                                        </div>
                                    </Card>
                                ))
                            ) : (
                                <div className="col-span-full py-12 text-center text-xs text-muted-foreground border border-dashed border-border rounded-md bg-muted/20">
                                    <Award className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                                    No certificates issued for this student yet. Click "Issue Certificate" to generate one.
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    {/* Tab 8: Account */}
                    <TabsContent value="account" className="space-y-4">
                        <UctPanelCard
                            title="User Authentication & Account Security"
                            description="Manage login credentials and security controls for this student account."
                            icon={Shield}
                            type="default"
                        >
                            <div className="space-y-4 text-xs">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-3 bg-muted/30 rounded border border-border/40 space-y-2">
                                        <p className="text-muted-foreground">Login Email</p>
                                        <p className="font-semibold text-foreground">{student.user?.email}</p>
                                    </div>
                                    <div className="p-3 bg-muted/30 rounded border border-border/40 space-y-2">
                                        <p className="text-muted-foreground">Account Status</p>
                                        <div className="flex items-center gap-2">
                                            {isSuspended ? (
                                                <Badge variant="destructive">Account Suspended</Badge>
                                            ) : (
                                                <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600">
                                                    Active & Unlocked
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-border/30 flex flex-wrap items-center gap-3">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setPasswordModalOpen(true)}
                                    >
                                        <KeyRound className="h-3.5 w-3.5 mr-1.5" />
                                        Reset Student Password
                                    </Button>

                                    <Button
                                        size="sm"
                                        variant={isSuspended ? 'outline' : 'destructive'}
                                        onClick={handleToggleStatus}
                                    >
                                        {isSuspended ? (
                                            <>
                                                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5 text-emerald-600" />
                                                Re-activate Account
                                            </>
                                        ) : (
                                            <>
                                                <Ban className="h-3.5 w-3.5 mr-1.5" />
                                                Suspend Student Account
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </UctPanelCard>
                    </TabsContent>
                </Tabs>

                {/* Modals */}
                <ResetPasswordModal
                    open={passwordModalOpen}
                    onOpenChange={setPasswordModalOpen}
                    student={student}
                />

                <ManageFeeModal
                    open={feeModalOpen}
                    onOpenChange={setFeeModalOpen}
                    studentId={student.id}
                />

                <RecordPaymentModal
                    open={paymentModalOpen}
                    onOpenChange={setPaymentModalOpen}
                    studentId={student.id}
                    invoices={student.invoices ?? []}
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

                {/* Delete Grade Dialog */}
                <ConfirmDeleteDialog
                    open={deleteGradeId !== null}
                    onOpenChange={(open) => !open && setDeleteGradeId(null)}
                    title="Remove Course Grade"
                    description="Are you sure you want to remove this grade? Student GPA will be recalculated."
                    loading={deleteProcessing}
                    onConfirm={confirmDeleteGrade}
                />

                {/* Delete Document Dialog */}
                <ConfirmDeleteDialog
                    open={deleteDocId !== null}
                    onOpenChange={(open) => !open && setDeleteDocId(null)}
                    title="Delete Document"
                    loading={deleteProcessing}
                    onConfirm={confirmDeleteDocument}
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
