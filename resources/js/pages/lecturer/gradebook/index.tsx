import { Head, router } from '@inertiajs/react';
import {
    Award,
    CheckCircle2,
    GraduationCap,
    Info,
    RotateCcw,
    Save,
    Users,
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
import type { Course, GradebookStudentItem } from '@/types/lecturer';

const GRADE_POINTS_MAP: Record<string, number> = {
    A: 4.0,
    'A-': 3.7,
    'B+': 3.3,
    B: 3.0,
    'B-': 2.7,
    'C+': 2.3,
    C: 2.0,
    D: 1.0,
    F: 0.0,
};

interface Props {
    courses: Course[];
    selected_course_id: number;
    course: Course | null;
    students: GradebookStudentItem[];
}

export default function LecturerGradebookIndex({
    courses,
    selected_course_id,
    course,
    students,
}: Props) {
    const [courseId, setCourseId] = useState<number>(selected_course_id);
    const [gradeRows, setGradeRows] = useState<GradebookStudentItem[]>(students);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setGradeRows(students);
    }, [students]);

    const handleCourseChange = (newCourseId: number) => {
        setCourseId(newCourseId);
        router.get(
            '/lecturer/gradebook',
            { course_id: newCourseId },
            { preserveState: true, replace: true }
        );
    };

    const handleGradeChange = (studentId: number, gradeVal: string) => {
        const uppercaseGrade = gradeVal.trim().toUpperCase();
        const gradePoint = GRADE_POINTS_MAP[uppercaseGrade] ?? null;
        let status: 'passed' | 'failed' | 'in_progress' = 'in_progress';

        if (uppercaseGrade === 'F') {
            status = 'failed';
        } else if (gradePoint !== null) {
            status = 'passed';
        }

        setGradeRows((prev) =>
            prev.map((r) =>
                r.student_id === studentId
                    ? {
                          ...r,
                          grade: uppercaseGrade,
                          grade_point: gradePoint,
                          status,
                      }
                    : r
            )
        );
    };

    const handleStatusChange = (
        studentId: number,
        status: 'passed' | 'failed' | 'in_progress'
    ) => {
        setGradeRows((prev) =>
            prev.map((r) => (r.student_id === studentId ? { ...r, status } : r))
        );
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (!courseId || gradeRows.length === 0) return;

        setIsSaving(true);
        router.post(
            '/lecturer/gradebook',
            {
                course_id: courseId,
                grades: gradeRows.map((r) => ({
                    student_id: r.student_id,
                    credits: r.credits,
                    grade: r.grade || null,
                    grade_point: r.grade_point,
                    status: r.status,
                })),
            },
            {
                preserveScroll: true,
                onFinish: () => setIsSaving(false),
            }
        );
    };

    // Computations
    const gradedCount = gradeRows.filter((r) => r.grade).length;
    const passedCount = gradeRows.filter((r) => r.status === 'passed').length;
    const failedCount = gradeRows.filter((r) => r.status === 'failed').length;
    const pointsSum = gradeRows
        .filter((r) => r.grade_point !== null && r.grade_point !== undefined)
        .reduce((sum, r) => sum + (r.grade_point ?? 0), 0);
    const averageGpa =
        gradedCount > 0 ? (pointsSum / gradedCount).toFixed(2) : '0.00';

    return (
        <>
            <Head title="Course Gradebook" />

            <div className="flex flex-col gap-6 p-4 md:p-6">
                <Heading
                    title="Course Gradebook"
                    description="Input, evaluate, and submit student letter grades and grade points for your assigned courses."
                />

                {/* Course Selector & Grading Scale Info */}
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    <Card className="lg:col-span-1">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Select Course</CardTitle>
                            <CardDescription className="text-xs">
                                Select which course grade sheet to view and edit.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Select
                                value={courseId ? String(courseId) : ''}
                                onValueChange={(val) => handleCourseChange(Number(val))}
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

                            {course && (
                                <div className="mt-4 text-xs space-y-1 text-muted-foreground border-t pt-3">
                                    <div>Program: <strong className="text-foreground">{course.program?.name}</strong></div>
                                    <div>Credit Hours: <strong className="text-foreground">{course.credit_hours}</strong></div>
                                    <div>Semester: <strong className="text-foreground">Semester {course.semester}</strong></div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="lg:col-span-2">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-1.5">
                                <Award className="h-4 w-4 text-primary" />
                                Grading Scale Reference & Statistics
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Automated grade point translation based on the UCT academic standard.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex flex-wrap gap-1.5 text-xs">
                                {Object.entries(GRADE_POINTS_MAP).map(([grade, pt]) => (
                                    <Badge key={grade} variant="outline" className="font-mono text-[11px] px-2 py-0.5">
                                        <strong>{grade}</strong>: {pt.toFixed(1)} pts
                                    </Badge>
                                ))}
                            </div>

                            <div className="grid grid-cols-4 gap-2 pt-2 border-t text-xs">
                                <div className="p-2 rounded bg-muted/40 text-center">
                                    <div className="text-muted-foreground">Enrolled</div>
                                    <div className="text-base font-bold text-foreground mt-0.5">{gradeRows.length}</div>
                                </div>
                                <div className="p-2 rounded bg-muted/40 text-center">
                                    <div className="text-muted-foreground">Graded</div>
                                    <div className="text-base font-bold text-primary mt-0.5">{gradedCount}</div>
                                </div>
                                <div className="p-2 rounded bg-muted/40 text-center">
                                    <div className="text-muted-foreground">Passed</div>
                                    <div className="text-base font-bold text-emerald-600 mt-0.5">{passedCount}</div>
                                </div>
                                <div className="p-2 rounded bg-muted/40 text-center">
                                    <div className="text-muted-foreground">Class Avg</div>
                                    <div className="text-base font-bold text-foreground mt-0.5">{averageGpa}</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Gradebook Sheet */}
                <form onSubmit={handleSave}>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-3">
                            <div>
                                <CardTitle className="text-base">
                                    Grade Sheet: {course?.code} - {course?.name}
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Enter letter grades (e.g. A, B+, C, F). Grade points and pass/fail statuses will calculate automatically.
                                </CardDescription>
                            </div>
                            <Button type="submit" disabled={isSaving || gradeRows.length === 0} size="sm">
                                <Save className="mr-2 h-4 w-4" />
                                {isSaving ? 'Saving...' : 'Save & Publish Grades'}
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            {gradeRows.length === 0 ? (
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
                                                <TableHead className="w-[100px] text-center">Credits</TableHead>
                                                <TableHead className="w-[130px]">Letter Grade</TableHead>
                                                <TableHead className="w-[120px] text-center">Grade Point</TableHead>
                                                <TableHead className="w-[140px]">Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {gradeRows.map((student) => (
                                                <TableRow key={student.student_id}>
                                                    <TableCell className="font-mono text-xs font-semibold">
                                                        {student.matric_no}
                                                    </TableCell>
                                                    <TableCell className="text-xs font-medium">
                                                        {student.name}
                                                    </TableCell>
                                                    <TableCell className="text-center text-xs">
                                                        {student.credits}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Select
                                                            value={student.grade || 'none'}
                                                            onValueChange={(val) =>
                                                                handleGradeChange(
                                                                    student.student_id,
                                                                    val === 'none' ? '' : val
                                                                )
                                                            }
                                                        >
                                                            <SelectTrigger className="h-7 text-xs font-bold text-primary">
                                                                <SelectValue placeholder="Grade" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="none">— Select —</SelectItem>
                                                                {Object.keys(GRADE_POINTS_MAP).map((grade) => (
                                                                    <SelectItem key={grade} value={grade}>
                                                                        {grade}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </TableCell>
                                                    <TableCell className="text-center text-xs font-mono font-semibold">
                                                        {student.grade_point !== null && student.grade_point !== undefined
                                                            ? Number(student.grade_point).toFixed(2)
                                                            : '—'}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Select
                                                            value={student.status}
                                                            onValueChange={(val: 'passed' | 'failed' | 'in_progress') =>
                                                                handleStatusChange(student.student_id, val)
                                                            }
                                                        >
                                                            <SelectTrigger className="h-7 text-xs">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="passed">Passed</SelectItem>
                                                                <SelectItem value="failed">Failed</SelectItem>
                                                                <SelectItem value="in_progress">In Progress</SelectItem>
                                                            </SelectContent>
                                                        </Select>
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
            </div>
        </>
    );
}

LecturerGradebookIndex.layout = {
    breadcrumbs: [{ title: 'Gradebook', href: '/lecturer/gradebook' }],
};
