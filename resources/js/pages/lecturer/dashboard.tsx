import { Head, Link } from '@inertiajs/react';
import {
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
import type { CourseAssignment, CourseMaterial, Lecturer } from '@/types/lecturer';

interface Props {
    lecturer: Lecturer;
    stats: {
        total_courses: number;
        total_workload_hours: number;
        total_students: number;
        attendance_sessions: number;
    };
    assignments: (CourseAssignment & { students_count?: number })[];
    recent_attendances: Array<{
        id: number;
        date: string;
        status: string;
        notes: string | null;
        student?: {
            matric_no: string;
            user?: { name: string };
        };
        course?: { code: string; name: string };
    }>;
    recent_grades: Array<{
        id: number;
        grade: string;
        grade_point: string | number | null;
        status: string;
        student?: {
            matric_no: string;
            user?: { name: string };
        };
        course?: { code: string; name: string };
    }>;
    recent_materials: CourseMaterial[];
}

export default function LecturerDashboard({
    lecturer,
    stats,
    assignments,
    recent_attendances,
    recent_grades,
    recent_materials,
}: Props) {
    return (
        <>
            <Head title="Lecturer Dashboard" />

            <div className="flex flex-col gap-6 p-4 md:p-6">
                {/* Welcome Banner */}
                <div className="flex flex-col gap-2 rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 border border-primary/20">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <span className="text-xs font-semibold tracking-wider text-primary uppercase">
                                Lecturer Portal
                            </span>
                            <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                                Welcome back, {lecturer.user?.name ?? 'Lecturer'}
                            </h1>
                            <p className="text-sm text-muted-foreground mt-1">
                                {lecturer.designation} &bull; {lecturer.department ?? 'Academic Faculty'} ({lecturer.lecturer_no})
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Button asChild size="sm">
                                <Link href="/lecturer/attendance">
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    Take Attendance
                                </Link>
                            </Button>
                            <Button asChild variant="outline" size="sm">
                                <Link href="/lecturer/gradebook">
                                    <GraduationCap className="mr-2 h-4 w-4" />
                                    Enter Grades
                                </Link>
                            </Button>
                            <Button asChild variant="secondary" size="sm">
                                <Link href="/lecturer/materials">
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Upload Material
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>

                {/* KPI Stats */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Assigned Courses</CardTitle>
                            <BookOpen className="h-4 w-4 text-primary" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total_courses}</div>
                            <p className="text-xs text-muted-foreground mt-1">Active sections taught</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Teaching Workload</CardTitle>
                            <Clock className="h-4 w-4 text-emerald-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total_workload_hours} hrs</div>
                            <p className="text-xs text-muted-foreground mt-1">Hours allocated per week</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Students Enrolled</CardTitle>
                            <Users className="h-4 w-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total_students}</div>
                            <p className="text-xs text-muted-foreground mt-1">Across all assigned classes</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Attendance Sessions</CardTitle>
                            <CheckCircle2 className="h-4 w-4 text-amber-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.attendance_sessions}</div>
                            <p className="text-xs text-muted-foreground mt-1">Recorded class dates</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Teaching Schedule & Active Courses */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Active Courses */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold tracking-tight">Assigned Courses</h2>
                                <p className="text-sm text-muted-foreground">Your active course sections for this semester</p>
                            </div>
                            <Button asChild variant="ghost" size="sm">
                                <Link href="/lecturer/courses">View All Courses &rarr;</Link>
                            </Button>
                        </div>

                        {assignments.length === 0 ? (
                            <Card>
                                <CardContent className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                                    <BookOpen className="h-10 w-10 stroke-1 mb-2 text-muted-foreground/60" />
                                    <p className="text-sm font-medium">No courses currently assigned</p>
                                    <p className="text-xs">Contact the academic registrar to configure your teaching assignments.</p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                {assignments.map((assignment) => (
                                    <Card key={assignment.id} className="overflow-hidden hover:border-primary/50 transition-colors">
                                        <CardHeader className="pb-3">
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <Badge variant="outline" className="font-mono text-xs mb-1">
                                                        {assignment.course?.code}
                                                    </Badge>
                                                    <CardTitle className="text-base line-clamp-1">
                                                        {assignment.course?.name}
                                                    </CardTitle>
                                                </div>
                                                <Badge className="capitalize text-xs">
                                                    {assignment.section}
                                                </Badge>
                                            </div>
                                            <CardDescription className="text-xs line-clamp-1">
                                                {assignment.course?.program?.name ?? 'General Program'}
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-3 pt-0 text-xs">
                                            <div className="flex flex-col gap-1.5 text-muted-foreground">
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar className="h-3.5 w-3.5 text-primary" />
                                                    <span>{assignment.schedule_day ?? 'Day TBA'} &bull; {assignment.schedule_time ?? 'Time TBA'}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <MapPin className="h-3.5 w-3.5 text-primary" />
                                                    <span>{assignment.room ?? 'Room TBA'}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <Users className="h-3.5 w-3.5 text-primary" />
                                                    <span>{assignment.students_count ?? 0} Students &bull; {assignment.workload_hours} Credit Hours</span>
                                                </div>
                                            </div>

                                            <div className="pt-2 border-t flex items-center justify-between">
                                                <Button asChild variant="outline" size="sm" className="w-full text-xs h-8">
                                                    <Link href={`/lecturer/courses/${assignment.course_id}`}>
                                                        Manage Course Hub
                                                    </Link>
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Schedule / Quick Timeline */}
                    <div className="space-y-4">
                        <div>
                            <h2 className="text-lg font-semibold tracking-tight">Weekly Timetable</h2>
                            <p className="text-sm text-muted-foreground">Your regular lecture days and times</p>
                        </div>

                        <Card>
                            <CardContent className="p-4 space-y-3">
                                {assignments.length === 0 ? (
                                    <p className="text-xs text-muted-foreground text-center py-4">No schedule available.</p>
                                ) : (
                                    assignments.map((assignment) => (
                                        <div key={assignment.id} className="flex items-start gap-3 rounded-lg border p-3 text-xs">
                                            <div className="flex flex-col items-center justify-center rounded-md bg-primary/10 px-2 py-1 text-primary font-semibold text-center min-w-[50px]">
                                                <span>{assignment.schedule_day?.slice(0, 3).toUpperCase() ?? 'TBA'}</span>
                                            </div>
                                            <div className="flex-1 overflow-hidden">
                                                <div className="font-semibold text-foreground truncate">
                                                    {assignment.course?.code} - {assignment.course?.name}
                                                </div>
                                                <div className="text-muted-foreground text-[11px] mt-0.5">
                                                    {assignment.schedule_time ?? 'Time TBA'} &bull; {assignment.room ?? 'Room TBA'}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </CardContent>
                        </Card>

                        {/* Recent Uploaded Materials */}
                        <div className="pt-2">
                            <h3 className="text-sm font-semibold mb-2">Recent Course Materials</h3>
                            <Card>
                                <CardContent className="p-3 space-y-2">
                                    {recent_materials.length === 0 ? (
                                        <p className="text-xs text-muted-foreground text-center py-3">No materials uploaded yet.</p>
                                    ) : (
                                        recent_materials.map((mat) => (
                                            <div key={mat.id} className="flex items-center justify-between text-xs p-2 rounded hover:bg-muted/50">
                                                <div className="flex items-center gap-2 truncate">
                                                    <FileText className="h-4 w-4 text-primary shrink-0" />
                                                    <div className="truncate">
                                                        <div className="font-medium truncate">{mat.title}</div>
                                                        <div className="text-[10px] text-muted-foreground">{mat.course?.code} &bull; {mat.category.replace('_', ' ')}</div>
                                                    </div>
                                                </div>
                                                <Button asChild variant="ghost" size="sm" className="h-7 text-xs px-2">
                                                    <a href={`/lecturer/materials/${mat.id}/download`}>Get</a>
                                                </Button>
                                            </div>
                                        ))
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>

                {/* Recent Attendance & Grades Logs */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {/* Recent Attendance */}
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base">Recent Attendance Submissions</CardTitle>
                                <Button asChild variant="ghost" size="sm" className="text-xs h-7">
                                    <Link href="/lecturer/attendance">View Attendance &rarr;</Link>
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {recent_attendances.length === 0 ? (
                                <p className="text-xs text-muted-foreground text-center py-6">No attendance records logged yet.</p>
                            ) : (
                                recent_attendances.map((item) => (
                                    <div key={item.id} className="flex items-center justify-between rounded-lg border p-2.5 text-xs">
                                        <div>
                                            <div className="font-medium text-foreground">
                                                {item.student?.user?.name ?? item.student?.matric_no}
                                            </div>
                                            <div className="text-muted-foreground text-[11px]">
                                                {item.course?.code} &bull; {item.date}
                                            </div>
                                        </div>
                                        <Badge
                                            variant={
                                                item.status === 'present'
                                                    ? 'default'
                                                    : item.status === 'absent'
                                                    ? 'destructive'
                                                    : 'secondary'
                                            }
                                            className="capitalize text-[10px]"
                                        >
                                            {item.status}
                                        </Badge>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>

                    {/* Recent Grade Entries */}
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base">Recent Gradebook Entries</CardTitle>
                                <Button asChild variant="ghost" size="sm" className="text-xs h-7">
                                    <Link href="/lecturer/gradebook">Open Gradebook &rarr;</Link>
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {recent_grades.length === 0 ? (
                                <p className="text-xs text-muted-foreground text-center py-6">No grades submitted yet.</p>
                            ) : (
                                recent_grades.map((item) => (
                                    <div key={item.id} className="flex items-center justify-between rounded-lg border p-2.5 text-xs">
                                        <div>
                                            <div className="font-medium text-foreground">
                                                {item.student?.user?.name ?? item.student?.matric_no}
                                            </div>
                                            <div className="text-muted-foreground text-[11px]">
                                                {item.course?.code} &bull; Status: {item.status}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-sm text-primary">{item.grade}</span>
                                            {item.grade_point !== null && (
                                                <span className="text-[11px] text-muted-foreground">({item.grade_point} pts)</span>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

LecturerDashboard.layout = {
    breadcrumbs: [{ title: 'Dashboard', href: '/lecturer/dashboard' }],
};
