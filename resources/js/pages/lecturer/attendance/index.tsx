import { Head, router } from '@inertiajs/react';
import {
    Calendar,
    CheckCircle2,
    Clock,
    FileText,
    HelpCircle,
    Save,
    Users,
    XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
import type { AttendanceRosterItem, AttendanceSessionSummary, Course } from '@/types/lecturer';

interface Props {
    courses: Course[];
    selected_course_id: number;
    selected_date: string;
    course: Course | null;
    students: AttendanceRosterItem[];
    history_sessions: AttendanceSessionSummary[];
}

export default function LecturerAttendanceIndex({
    courses,
    selected_course_id,
    selected_date,
    course,
    students,
    history_sessions,
}: Props) {
    const [courseId, setCourseId] = useState<number>(selected_course_id);
    const [date, setDate] = useState<string>(selected_date);
    const [records, setRecords] = useState<AttendanceRosterItem[]>(students);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setRecords(students);
    }, [students]);

    const handleCourseOrDateChange = (newCourseId: number, newDate: string) => {
        router.get(
            '/lecturer/attendance',
            { course_id: newCourseId, date: newDate },
            { preserveState: true, replace: true }
        );
    };

    const updateStatus = (studentId: number, status: 'present' | 'absent' | 'late' | 'excused') => {
        setRecords((prev) =>
            prev.map((r) => (r.student_id === studentId ? { ...r, status } : r))
        );
    };

    const updateNotes = (studentId: number, notes: string) => {
        setRecords((prev) =>
            prev.map((r) => (r.student_id === studentId ? { ...r, notes } : r))
        );
    };

    const markAll = (status: 'present' | 'absent') => {
        setRecords((prev) => prev.map((r) => ({ ...r, status })));
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (!courseId || records.length === 0) return;

        setIsSaving(true);
        router.post(
            '/lecturer/attendance',
            {
                course_id: courseId,
                date,
                records: records.map((r) => ({
                    student_id: r.student_id,
                    status: r.status,
                    notes: r.notes || null,
                })),
            },
            {
                preserveScroll: true,
                onFinish: () => setIsSaving(false),
            }
        );
    };

    const presentCount = records.filter((r) => r.status === 'present').length;
    const absentCount = records.filter((r) => r.status === 'absent').length;
    const lateCount = records.filter((r) => r.status === 'late').length;
    const excusedCount = records.filter((r) => r.status === 'excused').length;

    return (
        <>
            <Head title="Attendance Management" />

            <div className="flex flex-col gap-6 p-4 md:p-6">
                <Heading
                    title="Student Attendance Tracking"
                    description="Record daily class roll calls and monitor attendance history for your sections."
                />

                {/* Session Selector & Actions */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Select Class & Date</CardTitle>
                        <CardDescription className="text-xs">
                            Choose the course section and lecture date to view or record attendance.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap items-center gap-4">
                            <div className="w-full sm:w-[280px]">
                                <label className="text-xs font-medium text-muted-foreground block mb-1">
                                    Assigned Course
                                </label>
                                <Select
                                    value={courseId ? String(courseId) : ''}
                                    onValueChange={(val) => {
                                        const newId = Number(val);
                                        setCourseId(newId);
                                        handleCourseOrDateChange(newId, date);
                                    }}
                                >
                                    <SelectTrigger className="text-xs">
                                        <SelectValue placeholder="Select course" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {courses.map((c) => (
                                            <SelectItem key={c.id} value={String(c.id)}>
                                                {c.code} - {c.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="w-full sm:w-[200px]">
                                <label className="text-xs font-medium text-muted-foreground block mb-1">
                                    Lecture Date
                                </label>
                                <Input
                                    type="date"
                                    className="text-xs"
                                    value={date}
                                    onChange={(e) => {
                                        setDate(e.target.value);
                                        handleCourseOrDateChange(courseId, e.target.value);
                                    }}
                                />
                            </div>

                            {course && (
                                <div className="ml-auto flex items-center gap-2 pt-4 sm:pt-0">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => markAll('present')}
                                        className="text-xs h-8"
                                    >
                                        <CheckCircle2 className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
                                        All Present
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => markAll('absent')}
                                        className="text-xs h-8"
                                    >
                                        <XCircle className="mr-1.5 h-3.5 w-3.5 text-rose-600" />
                                        All Absent
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Summary Counters */}
                        {course && records.length > 0 && (
                            <div className="flex flex-wrap items-center gap-3 mt-4 pt-3 border-t text-xs">
                                <span className="text-muted-foreground">Roster: <strong>{records.length}</strong></span>
                                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20 text-xs">
                                    Present: {presentCount}
                                </Badge>
                                <Badge variant="outline" className="bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20 text-xs">
                                    Absent: {absentCount}
                                </Badge>
                                <Badge variant="outline" className="bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20 text-xs">
                                    Late: {lateCount}
                                </Badge>
                                <Badge variant="outline" className="bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20 text-xs">
                                    Excused: {excusedCount}
                                </Badge>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Attendance Roster Form */}
                <form onSubmit={handleSave}>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-3">
                            <div>
                                <CardTitle className="text-base">
                                    Class Attendance Roster ({course?.code ?? 'No course selected'})
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Date: {date} &bull; Click on each status button to toggle.
                                </CardDescription>
                            </div>
                            <Button type="submit" disabled={isSaving || records.length === 0} size="sm">
                                <Save className="mr-2 h-4 w-4" />
                                {isSaving ? 'Saving...' : 'Save Attendance'}
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            {records.length === 0 ? (
                                <div className="p-12 text-center text-sm text-muted-foreground">
                                    {course ? 'No students enrolled in this course.' : 'Select a course to view students.'}
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-[120px]">Matric No</TableHead>
                                                <TableHead className="min-w-[180px]">Student Name</TableHead>
                                                <TableHead className="w-[300px] text-center">Status</TableHead>
                                                <TableHead>Remarks / Reason</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {records.map((student) => (
                                                <TableRow key={student.student_id}>
                                                    <TableCell className="font-mono text-xs font-semibold">
                                                        {student.matric_no}
                                                    </TableCell>
                                                    <TableCell className="text-xs font-medium">
                                                        {student.name}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center justify-center gap-1">
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                variant={student.status === 'present' ? 'default' : 'outline'}
                                                                onClick={() => updateStatus(student.student_id, 'present')}
                                                                className={`h-7 px-2.5 text-[11px] ${
                                                                    student.status === 'present'
                                                                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                                                        : ''
                                                                }`}
                                                            >
                                                                Present
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                variant={student.status === 'absent' ? 'default' : 'outline'}
                                                                onClick={() => updateStatus(student.student_id, 'absent')}
                                                                className={`h-7 px-2.5 text-[11px] ${
                                                                    student.status === 'absent'
                                                                        ? 'bg-rose-600 hover:bg-rose-700 text-white'
                                                                        : ''
                                                                }`}
                                                            >
                                                                Absent
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                variant={student.status === 'late' ? 'default' : 'outline'}
                                                                onClick={() => updateStatus(student.student_id, 'late')}
                                                                className={`h-7 px-2.5 text-[11px] ${
                                                                    student.status === 'late'
                                                                        ? 'bg-amber-600 hover:bg-amber-700 text-white'
                                                                        : ''
                                                                }`}
                                                            >
                                                                Late
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                variant={student.status === 'excused' ? 'default' : 'outline'}
                                                                onClick={() => updateStatus(student.student_id, 'excused')}
                                                                className={`h-7 px-2.5 text-[11px] ${
                                                                    student.status === 'excused'
                                                                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                                                        : ''
                                                                }`}
                                                            >
                                                                Excused
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Input
                                                            type="text"
                                                            placeholder="Optional note (e.g. medical reason, arrived 15m late)"
                                                            value={student.notes}
                                                            onChange={(e) => updateNotes(student.student_id, e.target.value)}
                                                            className="h-7 text-xs max-w-sm"
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </form>

                {/* Attendance History */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Recorded Class Sessions History</CardTitle>
                        <CardDescription className="text-xs">
                            Select any previous session to review or modify attendance records.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        {history_sessions.length === 0 ? (
                            <div className="p-8 text-center text-sm text-muted-foreground">
                                No past attendance sessions recorded for this course.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Lecture Date</TableHead>
                                            <TableHead className="text-center">Total</TableHead>
                                            <TableHead className="text-center">Present</TableHead>
                                            <TableHead className="text-center">Absent</TableHead>
                                            <TableHead className="text-center">Late</TableHead>
                                            <TableHead className="text-center">Excused</TableHead>
                                            <TableHead className="text-right">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {history_sessions.map((session) => (
                                            <TableRow key={session.date}>
                                                <TableCell className="font-semibold text-xs">
                                                    {session.date}
                                                </TableCell>
                                                <TableCell className="text-center text-xs">
                                                    {session.total}
                                                </TableCell>
                                                <TableCell className="text-center text-xs font-semibold text-emerald-600">
                                                    {session.present}
                                                </TableCell>
                                                <TableCell className="text-center text-xs font-semibold text-rose-600">
                                                    {session.absent}
                                                </TableCell>
                                                <TableCell className="text-center text-xs font-semibold text-amber-600">
                                                    {session.late}
                                                </TableCell>
                                                <TableCell className="text-center text-xs font-semibold text-blue-600">
                                                    {session.excused}
                                                </TableCell>
                                                <TableCell className="text-right text-xs">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => {
                                                            setDate(session.date);
                                                            handleCourseOrDateChange(courseId, session.date);
                                                        }}
                                                        className="h-7 text-xs"
                                                    >
                                                        Edit Session
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
            </div>
        </>
    );
}

LecturerAttendanceIndex.layout = {
    breadcrumbs: [{ title: 'Attendance', href: '/lecturer/attendance' }],
};
