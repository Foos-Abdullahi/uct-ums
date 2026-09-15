import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    BookOpen,
    Calendar,
    CheckCircle2,
    Clock,
    FileText,
    GraduationCap,
    MapPin,
    PlusCircle,
    Users,
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { AttendanceSessionSummary, Course, CourseAssignment, CourseMaterial } from '@/types/lecturer';

interface EnrolledStudentItem {
    id: number;
    matric_no: string;
    name: string;
    email: string;
    gender: string | null;
    grade?: string | null;
    grade_point?: string | number | null;
    grade_status?: string | null;
    attendance_rate?: number | null;
    total_attendances?: number;
}

interface Props {
    course: Course;
    assignment: CourseAssignment;
    students: EnrolledStudentItem[];
    attendance_sessions: AttendanceSessionSummary[];
    materials: CourseMaterial[];
}

export default function LecturerCourseShow({
    course,
    assignment,
    students,
    attendance_sessions,
    materials,
}: Props) {
    return (
        <>
            <Head title={`${course.code} - ${course.name}`} />

            <div className="flex flex-col gap-6 p-4 md:p-6">
                {/* Back button & Course Header */}
                <div className="flex flex-col gap-4">
                    <Button asChild variant="ghost" size="sm" className="w-fit text-xs -ml-2 text-muted-foreground">
                        <Link href="/lecturer/courses">
                            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                            Back to My Courses
                        </Link>
                    </Button>

                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 rounded-2xl border bg-card p-6 shadow-xs">
                        <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="outline" className="font-mono text-xs">
                                    {course.code}
                                </Badge>
                                <Badge className="capitalize text-xs">
                                    {assignment.section}
                                </Badge>
                                <Badge variant="secondary" className="capitalize text-xs">
                                    {assignment.role.replace('_', ' ')}
                                </Badge>
                            </div>
                            <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                                {course.name}
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                {course.program?.name ?? 'General Program'} &bull; Semester {course.semester} &bull; {assignment.academic_year}
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <Button asChild size="sm">
                                <Link href={`/lecturer/attendance?course_id=${course.id}`}>
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    Take Attendance
                                </Link>
                            </Button>
                            <Button asChild variant="outline" size="sm">
                                <Link href={`/lecturer/gradebook?course_id=${course.id}`}>
                                    <GraduationCap className="mr-2 h-4 w-4" />
                                    Enter Grades
                                </Link>
                            </Button>
                            <Button asChild variant="secondary" size="sm">
                                <Link href={`/lecturer/materials?course_id=${course.id}`}>
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Add Material
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>

                {/* KPI Overview Pills */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <Card className="p-4">
                        <div className="text-xs text-muted-foreground">Enrolled Students</div>
                        <div className="text-xl font-bold mt-1">{students.length}</div>
                    </Card>
                    <Card className="p-4">
                        <div className="text-xs text-muted-foreground">Credit Hours</div>
                        <div className="text-xl font-bold mt-1">{course.credit_hours} hrs</div>
                    </Card>
                    <Card className="p-4">
                        <div className="text-xs text-muted-foreground">Class Schedule</div>
                        <div className="text-sm font-semibold mt-1 line-clamp-1">{assignment.schedule_day ?? 'TBA'} {assignment.schedule_time}</div>
                    </Card>
                    <Card className="p-4">
                        <div className="text-xs text-muted-foreground">Assigned Room</div>
                        <div className="text-sm font-semibold mt-1 line-clamp-1">{assignment.room ?? 'Room TBA'}</div>
                    </Card>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="students" className="space-y-4">
                    <TabsList className="grid w-full grid-cols-4 max-w-md">
                        <TabsTrigger value="students">Students ({students.length})</TabsTrigger>
                        <TabsTrigger value="attendance">Attendance</TabsTrigger>
                        <TabsTrigger value="materials">Materials ({materials.length})</TabsTrigger>
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                    </TabsList>

                    {/* Students Tab */}
                    <TabsContent value="students" className="space-y-4">
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">Enrolled Student Roster</CardTitle>
                                <CardDescription className="text-xs">
                                    Students officially registered for this course section.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                {students.length === 0 ? (
                                    <div className="p-8 text-center text-sm text-muted-foreground">
                                        No students enrolled in this course yet.
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="w-[120px]">Matric No</TableHead>
                                                    <TableHead>Student Name</TableHead>
                                                    <TableHead>Email</TableHead>
                                                    <TableHead className="text-center">Attendance %</TableHead>
                                                    <TableHead className="text-center">Grade</TableHead>
                                                    <TableHead className="text-center">Status</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {students.map((student) => (
                                                    <TableRow key={student.id}>
                                                        <TableCell className="font-mono text-xs font-medium">
                                                            {student.matric_no}
                                                        </TableCell>
                                                        <TableCell className="font-medium text-xs">
                                                            {student.name}
                                                        </TableCell>
                                                        <TableCell className="text-xs text-muted-foreground">
                                                            {student.email}
                                                        </TableCell>
                                                        <TableCell className="text-center text-xs">
                                                            {student.attendance_rate !== null && student.attendance_rate !== undefined ? (
                                                                <Badge
                                                                    variant={student.attendance_rate >= 75 ? 'default' : 'destructive'}
                                                                    className="text-[10px]"
                                                                >
                                                                    {student.attendance_rate}% ({student.total_attendances} sessions)
                                                                </Badge>
                                                            ) : (
                                                                <span className="text-muted-foreground text-[11px]">No records</span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-center text-xs font-bold text-primary">
                                                            {student.grade ?? '—'}
                                                        </TableCell>
                                                        <TableCell className="text-center text-xs">
                                                            <Badge
                                                                variant={
                                                                    student.grade_status === 'passed'
                                                                        ? 'default'
                                                                        : student.grade_status === 'failed'
                                                                        ? 'destructive'
                                                                        : 'outline'
                                                                }
                                                                className="capitalize text-[10px]"
                                                            >
                                                                {student.grade_status ?? 'in_progress'}
                                                            </Badge>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Attendance Tab */}
                    <TabsContent value="attendance" className="space-y-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-3">
                                <div>
                                    <CardTitle className="text-base">Recent Attendance Sessions</CardTitle>
                                    <CardDescription className="text-xs">
                                        Past session records and breakdown of attendance status.
                                    </CardDescription>
                                </div>
                                <Button asChild size="sm">
                                    <Link href={`/lecturer/attendance?course_id=${course.id}`}>
                                        <CheckCircle2 className="mr-2 h-4 w-4" />
                                        Take Attendance
                                    </Link>
                                </Button>
                            </CardHeader>
                            <CardContent className="p-0">
                                {attendance_sessions.length === 0 ? (
                                    <div className="p-8 text-center text-sm text-muted-foreground">
                                        No attendance sessions recorded yet for this course.
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Date</TableHead>
                                                    <TableHead className="text-center">Total Students</TableHead>
                                                    <TableHead className="text-center">Present</TableHead>
                                                    <TableHead className="text-center">Absent</TableHead>
                                                    <TableHead className="text-center">Late</TableHead>
                                                    <TableHead className="text-center">Excused</TableHead>
                                                    <TableHead className="text-right">Action</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {attendance_sessions.map((session) => (
                                                    <TableRow key={session.date}>
                                                        <TableCell className="font-semibold text-xs">
                                                            {session.date}
                                                        </TableCell>
                                                        <TableCell className="text-center text-xs">
                                                            {session.total}
                                                        </TableCell>
                                                        <TableCell className="text-center text-xs text-emerald-600 font-semibold">
                                                            {session.present}
                                                        </TableCell>
                                                        <TableCell className="text-center text-xs text-rose-600 font-semibold">
                                                            {session.absent}
                                                        </TableCell>
                                                        <TableCell className="text-center text-xs text-amber-600 font-semibold">
                                                            {session.late}
                                                        </TableCell>
                                                        <TableCell className="text-center text-xs text-blue-600 font-semibold">
                                                            {session.excused}
                                                        </TableCell>
                                                        <TableCell className="text-right text-xs">
                                                            <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
                                                                <Link href={`/lecturer/attendance?course_id=${course.id}&date=${session.date}`}>
                                                                    Edit
                                                                </Link>
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Materials Tab */}
                    <TabsContent value="materials" className="space-y-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-3">
                                <div>
                                    <CardTitle className="text-base">Course Documents & Materials</CardTitle>
                                    <CardDescription className="text-xs">
                                        Lecture notes, syllabi, assignment briefs, and reading materials.
                                    </CardDescription>
                                </div>
                                <Button asChild size="sm">
                                    <Link href={`/lecturer/materials?course_id=${course.id}`}>
                                        <PlusCircle className="mr-2 h-4 w-4" />
                                        Upload Material
                                    </Link>
                                </Button>
                            </CardHeader>
                            <CardContent>
                                {materials.length === 0 ? (
                                    <div className="p-8 text-center text-sm text-muted-foreground">
                                        No materials uploaded for this course yet.
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        {materials.map((mat) => (
                                            <div key={mat.id} className="flex items-start justify-between rounded-lg border p-3 hover:bg-muted/30">
                                                <div className="flex items-start gap-3 truncate">
                                                    <FileText className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                                    <div className="truncate">
                                                        <div className="font-semibold text-xs text-foreground truncate">{mat.title}</div>
                                                        <div className="text-[11px] text-muted-foreground mt-0.5">
                                                            <Badge variant="outline" className="text-[9px] uppercase mr-1">
                                                                {mat.category.replace('_', ' ')}
                                                            </Badge>
                                                            {mat.file_name}
                                                        </div>
                                                    </div>
                                                </div>
                                                <Button asChild variant="outline" size="sm" className="h-7 text-xs px-2 shrink-0">
                                                    <a href={`/lecturer/materials/${mat.id}/download`}>
                                                        Download
                                                    </a>
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Overview Tab */}
                    <TabsContent value="overview" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Course Description & Syllabus</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-sm">
                                <p className="text-muted-foreground leading-relaxed">
                                    {course.description ?? 'No detailed syllabus or course description provided.'}
                                </p>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 pt-4 border-t text-xs">
                                    <div>
                                        <span className="font-semibold block text-foreground mb-1">Teaching Details:</span>
                                        <ul className="space-y-1 text-muted-foreground">
                                            <li>Role: <strong className="text-foreground capitalize">{assignment.role.replace('_', ' ')}</strong></li>
                                            <li>Workload: <strong className="text-foreground">{assignment.workload_hours} hours/week</strong></li>
                                            <li>Section: <strong className="text-foreground">{assignment.section}</strong></li>
                                            <li>Semester: <strong className="text-foreground">{assignment.semester}</strong></li>
                                        </ul>
                                    </div>
                                    <div>
                                        <span className="font-semibold block text-foreground mb-1">Notes from Academic Office:</span>
                                        <p className="text-muted-foreground italic">
                                            {assignment.notes ?? 'No additional administrative notes.'}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </>
    );
}

LecturerCourseShow.layout = {
    breadcrumbs: [
        { title: 'My Courses', href: '/lecturer/courses' },
        { title: 'Course Hub', href: '#' },
    ],
};
