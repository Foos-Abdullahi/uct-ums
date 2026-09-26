import { Head, Link } from '@inertiajs/react';
import {
    ArrowRight,
    Award,
    BookOpen,
    Calendar,
    CheckCircle2,
    CreditCard,
    GraduationCap,
    Sparkles,
    TrendingUp,
    Wallet,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import type { Student, StudentGrade } from '@/types/student';

interface Course {
    id: number;
    code: string;
    name: string;
    credit_hours: number;
    lecturer_name: string | null;
    schedule_day: string | null;
    schedule_time: string | null;
    room: string | null;
}

interface Invoice {
    id: number;
    invoice_no: string;
    title: string;
    amount: number;
    balance: number;
    due_date: string | null;
    status: string;
}

interface Stats {
    gpa: number | string | null;
    total_credits: number;
    passed_credits: number;
    attendance_rate: number | null;
    outstanding_balance: number;
    fee_status: string;
}

interface Props {
    student: Student;
    stats: Stats;
    courses: Course[];
    recent_grades: StudentGrade[];
    next_due_invoice: Invoice | null;
}

const feeStatusVariant = (status: string) => {
    if (status === 'paid') return 'default';
    if (status === 'partial') return 'secondary';
    return 'destructive';
};

export default function StudentDashboard({
    student,
    stats,
    courses,
    recent_grades,
    next_due_invoice,
}: Props) {
    return (
        <>
            <Head title="Student Dashboard" />

            <div className="mx-auto flex w-full max-w-7xl flex-col gap-7 p-4 sm:p-6 lg:p-8">
                <section className="relative overflow-hidden rounded-3xl bg-[#132a55] px-6 py-7 text-primary-foreground shadow-xl shadow-primary/15 sm:px-8 sm:py-9">
                    <div className="absolute -top-24 -right-16 size-64 rounded-full bg-white/10" />
                    <div className="absolute right-32 -bottom-20 size-48 rounded-full border-[24px] border-cyan-300/15" />
                    <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                        <div className="max-w-2xl">
                            <div className="mb-3 flex items-center gap-2 text-xs font-semibold tracking-[0.18em] text-cyan-200 uppercase">
                                <Sparkles className="size-4" />
                                Your learning space
                            </div>
                            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                                Good to see you,{' '}
                                {student.user?.name ?? 'Student'}.
                            </h1>
                            <p className="mt-3 text-sm leading-6 text-slate-200 sm:text-base">
                                {student.program?.name ?? 'Your programme'}{' '}
                                <span className="mx-1.5 text-cyan-300">•</span>{' '}
                                Semester {student.current_semester}{' '}
                                <span className="mx-1.5 text-cyan-300">•</span>{' '}
                                {student.matric_no}
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Button
                                asChild
                                size="sm"
                                className="bg-white text-primary shadow-none hover:bg-slate-100"
                            >
                                <Link href="/student/courses">
                                    <BookOpen className="mr-2 h-4 w-4" />
                                    My Courses
                                </Link>
                            </Button>
                            <Button
                                asChild
                                variant="outline"
                                size="sm"
                                className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                            >
                                <Link href="/student/grades">
                                    <GraduationCap className="mr-2 h-4 w-4" />
                                    View Grades
                                </Link>
                            </Button>
                            {stats.fee_status !== 'paid' && (
                                <Button
                                    asChild
                                    size="sm"
                                    className="bg-cyan-300 text-slate-950 hover:bg-cyan-200"
                                >
                                    <Link href="/student/fees">
                                        <Wallet className="mr-2 h-4 w-4" />
                                        Pay Fees
                                    </Link>
                                </Button>
                            )}
                        </div>
                    </div>
                </section>

                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
                    <Card className="border-0 bg-white shadow-sm ring-1 ring-slate-200/70 dark:bg-card dark:ring-border">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2 sm:p-5 sm:pb-2">
                            <CardTitle className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                CGPA
                            </CardTitle>
                            <span className="rounded-xl bg-primary/10 p-2 text-primary">
                                <TrendingUp className="size-4" />
                            </span>
                        </CardHeader>
                        <CardContent className="p-4 pt-1 sm:p-5 sm:pt-1">
                            <div className="text-2xl font-bold tracking-tight sm:text-3xl">
                                {stats.gpa ? Number(stats.gpa).toFixed(2) : '—'}
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Cumulative GPA
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-0 bg-white shadow-sm ring-1 ring-slate-200/70 dark:bg-card dark:ring-border">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2 sm:p-5 sm:pb-2">
                            <CardTitle className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                Credits
                            </CardTitle>
                            <span className="rounded-xl bg-emerald-500/10 p-2 text-emerald-600">
                                <Award className="size-4" />
                            </span>
                        </CardHeader>
                        <CardContent className="p-4 pt-1 sm:p-5 sm:pt-1">
                            <div className="text-2xl font-bold tracking-tight sm:text-3xl">
                                {stats.passed_credits}
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                                of {stats.total_credits} attempted
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-0 bg-white shadow-sm ring-1 ring-slate-200/70 dark:bg-card dark:ring-border">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2 sm:p-5 sm:pb-2">
                            <CardTitle className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                Attendance
                            </CardTitle>
                            <span className="rounded-xl bg-sky-500/10 p-2 text-sky-600">
                                <CheckCircle2 className="size-4" />
                            </span>
                        </CardHeader>
                        <CardContent className="p-4 pt-1 sm:p-5 sm:pt-1">
                            <div className="text-2xl font-bold tracking-tight sm:text-3xl">
                                {stats.attendance_rate !== null
                                    ? `${stats.attendance_rate}%`
                                    : '—'}
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Overall attendance rate
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-0 bg-white shadow-sm ring-1 ring-slate-200/70 dark:bg-card dark:ring-border">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2 sm:p-5 sm:pb-2">
                            <CardTitle className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                Fee balance
                            </CardTitle>
                            <span className="rounded-xl bg-amber-500/10 p-2 text-amber-600">
                                <CreditCard className="size-4" />
                            </span>
                        </CardHeader>
                        <CardContent className="p-4 pt-1 sm:p-5 sm:pt-1">
                            <div className="text-2xl font-bold tracking-tight sm:text-3xl">
                                {stats.outstanding_balance > 0
                                    ? `$${Number(stats.outstanding_balance).toLocaleString()}`
                                    : 'Paid'}
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                                <Badge
                                    variant={feeStatusVariant(stats.fee_status)}
                                    className="text-[10px] capitalize"
                                >
                                    {stats.fee_status}
                                </Badge>
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="space-y-4 lg:col-span-2">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold tracking-tight">
                                    Current Semester Courses
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    Semester {student.current_semester} &mdash;{' '}
                                    {student.program?.name}
                                </p>
                            </div>
                            <Button
                                asChild
                                variant="ghost"
                                size="sm"
                                className="rounded-xl"
                            >
                                <Link href="/student/courses">
                                    All courses{' '}
                                    <ArrowRight className="ml-1 size-4" />
                                </Link>
                            </Button>
                        </div>

                        {courses.length === 0 ? (
                            <Card>
                                <CardContent className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                                    <BookOpen className="mb-2 h-10 w-10 stroke-1 text-muted-foreground/60" />
                                    <p className="text-sm font-medium">
                                        No courses found for this semester
                                    </p>
                                    <p className="text-xs">
                                        Contact the registrar if you believe
                                        this is incorrect.
                                    </p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                {courses.map((course) => (
                                    <Card
                                        key={course.id}
                                        className="group border-slate-200/80 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md dark:border-border"
                                    >
                                        <CardHeader className="pb-2">
                                            <div className="flex items-start justify-between gap-2">
                                                <Badge
                                                    variant="outline"
                                                    className="font-mono text-xs"
                                                >
                                                    {course.code}
                                                </Badge>
                                                <span className="text-xs text-muted-foreground">
                                                    {course.credit_hours} cr
                                                </span>
                                            </div>
                                            <CardTitle className="mt-1 line-clamp-1 text-sm">
                                                {course.name}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-1 pt-0 text-xs text-muted-foreground">
                                            {course.lecturer_name && (
                                                <div className="flex items-center gap-1.5">
                                                    <GraduationCap className="h-3.5 w-3.5 text-primary" />
                                                    <span>
                                                        {course.lecturer_name}
                                                    </span>
                                                </div>
                                            )}
                                            {(course.schedule_day ||
                                                course.schedule_time) && (
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar className="h-3.5 w-3.5 text-primary" />
                                                    <span>
                                                        {course.schedule_day ??
                                                            'TBA'}{' '}
                                                        &bull;{' '}
                                                        {course.schedule_time ??
                                                            'TBA'}
                                                        {course.room
                                                            ? ` · ${course.room}`
                                                            : ''}
                                                    </span>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="space-y-4">
                        {next_due_invoice && (
                            <Card className="overflow-hidden border-amber-500/25 bg-amber-50/70 shadow-sm dark:bg-amber-950/10">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm text-amber-700 dark:text-amber-400">
                                        Upcoming Fee Deadline
                                    </CardTitle>
                                    <CardDescription className="text-xs">
                                        {next_due_invoice.title}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-1 text-xs">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">
                                            Balance
                                        </span>
                                        <span className="font-semibold text-destructive">
                                            $
                                            {Number(
                                                next_due_invoice.balance,
                                            ).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">
                                            Due date
                                        </span>
                                        <span className="font-medium">
                                            {next_due_invoice.due_date ?? '—'}
                                        </span>
                                    </div>
                                    <Button
                                        asChild
                                        size="sm"
                                        className="mt-3 w-full"
                                    >
                                        <Link href="/student/fees">
                                            Pay Now
                                        </Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        )}

                        <div>
                            <div className="mb-2 flex items-center justify-between">
                                <h3 className="text-sm font-semibold">
                                    Recent Grades
                                </h3>
                                <Button
                                    asChild
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 rounded-lg text-xs"
                                >
                                    <Link href="/student/grades">
                                        View all{' '}
                                        <ArrowRight className="ml-1 size-3" />
                                    </Link>
                                </Button>
                            </div>
                            <Card>
                                <CardContent className="space-y-2 p-3">
                                    {recent_grades.length === 0 ? (
                                        <p className="py-4 text-center text-xs text-muted-foreground">
                                            No grades recorded yet.
                                        </p>
                                    ) : (
                                        recent_grades.map((grade) => (
                                            <div
                                                key={grade.id}
                                                className="flex items-center justify-between rounded p-2 text-xs hover:bg-muted/50"
                                            >
                                                <div className="truncate">
                                                    <div className="truncate font-medium">
                                                        {grade.course_name}
                                                    </div>
                                                    <div className="text-[10px] text-muted-foreground">
                                                        {grade.course_code}{' '}
                                                        &bull; Sem{' '}
                                                        {grade.semester}
                                                    </div>
                                                </div>
                                                <div className="ml-2 flex shrink-0 items-center gap-1.5">
                                                    <span className="font-bold text-primary">
                                                        {grade.grade ?? '—'}
                                                    </span>
                                                    {grade.grade_point !==
                                                        null &&
                                                        grade.grade_point !==
                                                            undefined && (
                                                            <span className="text-[10px] text-muted-foreground">
                                                                (
                                                                {Number(
                                                                    grade.grade_point,
                                                                ).toFixed(1)}
                                                                )
                                                            </span>
                                                        )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

StudentDashboard.layout = {
    breadcrumbs: [{ title: 'Dashboard', href: '/student/dashboard' }],
};
