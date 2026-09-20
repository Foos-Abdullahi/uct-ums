import { Head, Link } from '@inertiajs/react';
import {
    Award,
    BookOpen,
    Calendar,
    CheckCircle2,
    CreditCard,
    GraduationCap,
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

            <div className="flex flex-col gap-6 p-4 md:p-6">
                {/* Welcome Banner */}
                <div className="flex flex-col gap-2 rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 border border-primary/20">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <span className="text-xs font-semibold tracking-wider text-primary uppercase">
                                Student Portal
                            </span>
                            <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                                Welcome, {student.user?.name ?? 'Student'}
                            </h1>
                            <p className="text-sm text-muted-foreground mt-1">
                                {student.matric_no} &bull;{' '}
                                {student.program?.name ?? 'Program'} &bull; Semester{' '}
                                {student.current_semester}
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Button asChild size="sm">
                                <Link href="/student/courses">
                                    <BookOpen className="mr-2 h-4 w-4" />
                                    My Courses
                                </Link>
                            </Button>
                            <Button asChild variant="outline" size="sm">
                                <Link href="/student/grades">
                                    <GraduationCap className="mr-2 h-4 w-4" />
                                    View Grades
                                </Link>
                            </Button>
                            {stats.fee_status !== 'paid' && (
                                <Button asChild variant="secondary" size="sm">
                                    <Link href="/student/fees">
                                        <Wallet className="mr-2 h-4 w-4" />
                                        Pay Fees
                                    </Link>
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {/* KPI Stats */}
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">CGPA</CardTitle>
                            <TrendingUp className="h-4 w-4 text-primary" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {stats.gpa ? Number(stats.gpa).toFixed(2) : '—'}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Cumulative GPA
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Credits Earned</CardTitle>
                            <Award className="h-4 w-4 text-emerald-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.passed_credits}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                of {stats.total_credits} attempted
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Attendance</CardTitle>
                            <CheckCircle2 className="h-4 w-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {stats.attendance_rate !== null
                                    ? `${stats.attendance_rate}%`
                                    : '—'}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Overall attendance rate
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Fee Balance</CardTitle>
                            <CreditCard className="h-4 w-4 text-amber-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {stats.outstanding_balance > 0
                                    ? `$${Number(stats.outstanding_balance).toLocaleString()}`
                                    : 'Paid'}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
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

                {/* Enrolled Courses & Recent Grades */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Current Semester Courses */}
                    <div className="lg:col-span-2 space-y-4">
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
                            <Button asChild variant="ghost" size="sm">
                                <Link href="/student/courses">All Courses &rarr;</Link>
                            </Button>
                        </div>

                        {courses.length === 0 ? (
                            <Card>
                                <CardContent className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                                    <BookOpen className="h-10 w-10 stroke-1 mb-2 text-muted-foreground/60" />
                                    <p className="text-sm font-medium">No courses found for this semester</p>
                                    <p className="text-xs">Contact the registrar if you believe this is incorrect.</p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                {courses.map((course) => (
                                    <Card key={course.id} className="hover:border-primary/50 transition-colors">
                                        <CardHeader className="pb-2">
                                            <div className="flex items-start justify-between gap-2">
                                                <Badge variant="outline" className="font-mono text-xs">
                                                    {course.code}
                                                </Badge>
                                                <span className="text-xs text-muted-foreground">
                                                    {course.credit_hours} cr
                                                </span>
                                            </div>
                                            <CardTitle className="text-sm line-clamp-1 mt-1">
                                                {course.name}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="pt-0 text-xs text-muted-foreground space-y-1">
                                            {course.lecturer_name && (
                                                <div className="flex items-center gap-1.5">
                                                    <GraduationCap className="h-3.5 w-3.5 text-primary" />
                                                    <span>{course.lecturer_name}</span>
                                                </div>
                                            )}
                                            {(course.schedule_day || course.schedule_time) && (
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar className="h-3.5 w-3.5 text-primary" />
                                                    <span>
                                                        {course.schedule_day ?? 'TBA'} &bull;{' '}
                                                        {course.schedule_time ?? 'TBA'}
                                                        {course.room ? ` · ${course.room}` : ''}
                                                    </span>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right Column */}
                    <div className="space-y-4">
                        {/* Next Due Invoice */}
                        {next_due_invoice && (
                            <Card className="border-amber-500/30 bg-amber-50/40 dark:bg-amber-950/10">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm text-amber-700 dark:text-amber-400">
                                        Upcoming Fee Deadline
                                    </CardTitle>
                                    <CardDescription className="text-xs">
                                        {next_due_invoice.title}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="text-xs space-y-1">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Balance</span>
                                        <span className="font-semibold text-destructive">
                                            ${Number(next_due_invoice.balance).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Due date</span>
                                        <span className="font-medium">
                                            {next_due_invoice.due_date ?? '—'}
                                        </span>
                                    </div>
                                    <Button asChild size="sm" className="w-full mt-3">
                                        <Link href="/student/fees">Pay Now</Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        )}

                        {/* Recent Grades */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-sm font-semibold">Recent Grades</h3>
                                <Button asChild variant="ghost" size="sm" className="text-xs h-7">
                                    <Link href="/student/grades">View All &rarr;</Link>
                                </Button>
                            </div>
                            <Card>
                                <CardContent className="p-3 space-y-2">
                                    {recent_grades.length === 0 ? (
                                        <p className="text-xs text-muted-foreground text-center py-4">
                                            No grades recorded yet.
                                        </p>
                                    ) : (
                                        recent_grades.map((grade) => (
                                            <div
                                                key={grade.id}
                                                className="flex items-center justify-between text-xs p-2 rounded hover:bg-muted/50"
                                            >
                                                <div className="truncate">
                                                    <div className="font-medium truncate">
                                                        {grade.course_name}
                                                    </div>
                                                    <div className="text-[10px] text-muted-foreground">
                                                        {grade.course_code} &bull; Sem {grade.semester}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                                    <span className="font-bold text-primary">
                                                        {grade.grade ?? '—'}
                                                    </span>
                                                    {grade.grade_point !== null &&
                                                        grade.grade_point !== undefined && (
                                                            <span className="text-[10px] text-muted-foreground">
                                                                ({Number(grade.grade_point).toFixed(1)})
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
