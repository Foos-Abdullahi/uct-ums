import { Head, router } from '@inertiajs/react';
import {
    Award,
    BookOpen,
    CheckCircle2,
    GraduationCap,
    TrendingDown,
    TrendingUp,
} from 'lucide-react';
import { useState } from 'react';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardDescription,
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
import type { Student, StudentGrade } from '@/types/student';

interface SemesterGroup {
    semester: number;
    gpa: number | null;
    grades: StudentGrade[];
}

interface Stats {
    cgpa: number | string | null;
    total_credits: number;
    passed: number;
    failed: number;
    in_progress: number;
}

interface Props {
    student: Student;
    grades_by_semester: SemesterGroup[];
    stats: Stats;
    available_semesters: number[];
    filters: { semester: string };
}

const statusVariant = (status: string) => {
    if (status === 'passed') return 'default';
    if (status === 'failed') return 'destructive';
    return 'secondary';
};

export default function StudentGradesIndex({
    student,
    grades_by_semester,
    stats,
    available_semesters,
    filters,
}: Props) {
    const [semester, setSemester] = useState(filters.semester);

    const handleFilter = (val: string) => {
        setSemester(val);
        router.get('/student/grades', { semester: val }, { preserveState: true, replace: true });
    };

    const totalGrades = grades_by_semester.reduce((sum, s) => sum + s.grades.length, 0);

    return (
        <>
            <Head title="My Grades" />

            <div className="flex flex-col gap-6 p-4 md:p-6">
                <Heading
                    title="My Grades"
                    description="Academic performance record across all completed semesters."
                />

                {/* Summary Cards */}
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">CGPA</CardTitle>
                            <TrendingUp className="h-4 w-4 text-primary" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {stats.cgpa ? Number(stats.cgpa).toFixed(2) : '—'}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Cumulative GPA</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Credits Earned</CardTitle>
                            <Award className="h-4 w-4 text-emerald-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total_credits}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Total credit hours
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Passed</CardTitle>
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-emerald-600">{stats.passed}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                of {stats.passed + stats.failed} graded
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                            <TrendingDown className="h-4 w-4 text-amber-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.in_progress}</div>
                            <p className="text-xs text-muted-foreground mt-1">Pending grading</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filter */}
                <div className="flex items-center gap-3">
                    <Select value={semester} onValueChange={handleFilter}>
                        <SelectTrigger className="w-[180px] text-xs">
                            <SelectValue placeholder="Filter by semester" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Semesters</SelectItem>
                            {available_semesters.map((s) => (
                                <SelectItem key={s} value={String(s)}>
                                    Semester {s}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <span className="text-xs text-muted-foreground">
                        {totalGrades} {totalGrades === 1 ? 'course' : 'courses'} shown
                    </span>
                </div>

                {/* Grades by Semester */}
                {grades_by_semester.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
                            <GraduationCap className="h-12 w-12 stroke-1 mb-3 text-muted-foreground/60" />
                            <h3 className="text-base font-semibold text-foreground">No grades found</h3>
                            <p className="text-sm mt-1">No grades have been recorded yet.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-6">
                        {grades_by_semester.map((group) => (
                            <Card key={group.semester}>
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="text-base">
                                                Semester {group.semester}
                                            </CardTitle>
                                            <CardDescription className="text-xs">
                                                {group.grades.length} course
                                                {group.grades.length !== 1 ? 's' : ''}
                                            </CardDescription>
                                        </div>
                                        {group.gpa !== null && (
                                            <div className="text-right">
                                                <div className="text-xs text-muted-foreground">Semester GPA</div>
                                                <div className="text-xl font-bold text-primary">
                                                    {Number(group.gpa).toFixed(2)}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="w-[120px]">Code</TableHead>
                                                    <TableHead>Course Name</TableHead>
                                                    <TableHead className="text-center w-[80px]">Credits</TableHead>
                                                    <TableHead className="text-center w-[80px]">Grade</TableHead>
                                                    <TableHead className="text-center w-[100px]">GP</TableHead>
                                                    <TableHead className="w-[120px]">Status</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {group.grades.map((grade) => (
                                                    <TableRow key={grade.id}>
                                                        <TableCell className="font-mono text-xs font-semibold">
                                                            {grade.course_code}
                                                        </TableCell>
                                                        <TableCell className="text-xs">
                                                            {grade.course_name}
                                                        </TableCell>
                                                        <TableCell className="text-center text-xs">
                                                            {grade.credits}
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            <span className="font-bold text-primary text-sm">
                                                                {grade.grade ?? '—'}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell className="text-center font-mono text-xs">
                                                            {grade.grade_point !== null &&
                                                            grade.grade_point !== undefined
                                                                ? Number(grade.grade_point).toFixed(2)
                                                                : '—'}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge
                                                                variant={statusVariant(grade.status)}
                                                                className="capitalize text-[10px]"
                                                            >
                                                                {grade.status.replace('_', ' ')}
                                                            </Badge>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Legend */}
                <div className="flex flex-wrap gap-3 pt-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                        <BookOpen className="h-3.5 w-3.5" />
                        GP = Grade Point &nbsp;|&nbsp; Credits are applied only when the course is passed.
                    </div>
                </div>
            </div>
        </>
    );
}

StudentGradesIndex.layout = {
    breadcrumbs: [{ title: 'Grades', href: '/student/grades' }],
};
