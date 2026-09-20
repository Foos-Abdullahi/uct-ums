import { Head, router } from '@inertiajs/react';
import {
    CheckCircle2,
    Clock,
    Users,
    XCircle,
} from 'lucide-react';
import { useState } from 'react';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import type { Student, StudentAttendance } from '@/types/student';

interface CourseSummary {
    course_name: string;
    course_code: string | null;
    total: number;
    present: number;
    late: number;
    absent: number;
    excused: number;
    rate: number | null;
}

interface AvailableCourse {
    id: number | null;
    name: string;
}

interface Props {
    student: Student;
    attendances: StudentAttendance[];
    course_summaries: CourseSummary[];
    overall_rate: number | null;
    total_sessions: number;
    available_courses: AvailableCourse[];
    filters: { course: string };
}

const statusVariant = (status: string) => {
    if (status === 'present') return 'default';
    if (status === 'absent') return 'destructive';
    if (status === 'late') return 'secondary';
    return 'outline';
};

const rateColor = (rate: number | null) => {
    if (rate === null) return 'text-muted-foreground';
    if (rate >= 75) return 'text-emerald-600';
    if (rate >= 50) return 'text-amber-600';
    return 'text-destructive';
};

export default function StudentAttendanceIndex({
    student,
    attendances,
    course_summaries,
    overall_rate,
    total_sessions,
    available_courses,
    filters,
}: Props) {
    const [courseFilter, setCourseFilter] = useState(filters.course);

    const handleFilter = (val: string) => {
        setCourseFilter(val);
        router.get('/student/attendance', { course: val }, { preserveState: true, replace: true });
    };

    return (
        <>
            <Head title="My Attendance" />

            <div className="flex flex-col gap-6 p-4 md:p-6">
                <Heading
                    title="My Attendance"
                    description="Track your attendance records across all courses."
                />

                {/* Overall Summary */}
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Overall Rate</CardTitle>
                            <CheckCircle2 className="h-4 w-4 text-primary" />
                        </CardHeader>
                        <CardContent>
                            <div className={`text-2xl font-bold ${rateColor(overall_rate)}`}>
                                {overall_rate !== null ? `${overall_rate}%` : '—'}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Across all courses
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
                            <Users className="h-4 w-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{total_sessions}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Across {course_summaries.length} course
                                {course_summaries.length !== 1 ? 's' : ''}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Present</CardTitle>
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-emerald-600">
                                {course_summaries.reduce((sum, c) => sum + c.present + c.late, 0)}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Present + Late
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Absent</CardTitle>
                            <XCircle className="h-4 w-4 text-destructive" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-destructive">
                                {course_summaries.reduce((sum, c) => sum + c.absent, 0)}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Unexcused absences
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Per-Course Summary Cards */}
                {course_summaries.length > 0 && (
                    <div>
                        <h2 className="text-base font-semibold mb-3">Course Breakdown</h2>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {course_summaries.map((summary) => (
                                <Card key={summary.course_name} className="hover:border-primary/40 transition-colors">
                                    <CardHeader className="pb-2">
                                        {summary.course_code && (
                                            <Badge variant="outline" className="font-mono text-xs w-fit">
                                                {summary.course_code}
                                            </Badge>
                                        )}
                                        <CardTitle className="text-sm line-clamp-1 mt-1">
                                            {summary.course_name}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        <div className="flex items-end justify-between">
                                            <div className="grid grid-cols-4 gap-1 text-center text-[11px]">
                                                <div>
                                                    <div className="font-semibold text-emerald-600">{summary.present}</div>
                                                    <div className="text-muted-foreground">Present</div>
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-amber-600">{summary.late}</div>
                                                    <div className="text-muted-foreground">Late</div>
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-destructive">{summary.absent}</div>
                                                    <div className="text-muted-foreground">Absent</div>
                                                </div>
                                                <div>
                                                    <div className="font-semibold">{summary.excused}</div>
                                                    <div className="text-muted-foreground">Excused</div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div
                                                    className={`text-xl font-bold ${rateColor(summary.rate)}`}
                                                >
                                                    {summary.rate !== null ? `${summary.rate}%` : '—'}
                                                </div>
                                                <div className="text-[10px] text-muted-foreground">
                                                    {summary.total} sessions
                                                </div>
                                            </div>
                                        </div>

                                        {/* Rate bar */}
                                        {summary.rate !== null && (
                                            <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all ${
                                                        summary.rate >= 75
                                                            ? 'bg-emerald-500'
                                                            : summary.rate >= 50
                                                              ? 'bg-amber-500'
                                                              : 'bg-destructive'
                                                    }`}
                                                    style={{ width: `${summary.rate}%` }}
                                                />
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {/* Attendance Records Table */}
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between flex-wrap gap-3">
                            <CardTitle className="text-base">Attendance Records</CardTitle>
                            <Select value={courseFilter} onValueChange={handleFilter}>
                                <SelectTrigger className="w-[200px] text-xs">
                                    <SelectValue placeholder="Filter by course" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Courses</SelectItem>
                                    {available_courses.map((c) => (
                                        <SelectItem key={c.name} value={c.name}>
                                            {c.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {attendances.length === 0 ? (
                            <div className="p-12 text-center text-sm text-muted-foreground">
                                <Clock className="h-10 w-10 stroke-1 mb-2 mx-auto text-muted-foreground/60" />
                                No attendance records found.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Course</TableHead>
                                            <TableHead className="w-[120px]">Status</TableHead>
                                            <TableHead>Notes</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {attendances.map((record) => (
                                            <TableRow key={record.id}>
                                                <TableCell className="font-mono text-xs">
                                                    {record.date}
                                                </TableCell>
                                                <TableCell className="text-xs">
                                                    {record.course_name}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={statusVariant(record.status)}
                                                        className="capitalize text-[10px]"
                                                    >
                                                        {record.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-xs text-muted-foreground">
                                                    {record.notes ?? '—'}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

StudentAttendanceIndex.layout = {
    breadcrumbs: [{ title: 'Attendance', href: '/student/attendance' }],
};
