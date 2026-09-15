import { Head, Link, router } from '@inertiajs/react';
import {
    BookOpen,
    GraduationCap,
    Mail,
    Search,
    UserCheck,
    Users,
} from 'lucide-react';
import { useState } from 'react';
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
import type { Course, PaginatedData } from '@/types/lecturer';
import type { Student } from '@/types/student';

interface Props {
    students: PaginatedData<Student & { attendance_rate?: number | null; total_sessions?: number }>;
    courses: Course[];
    filters: {
        course_id: string;
        search: string;
        per_page: number;
    };
}

export default function LecturerStudentsIndex({
    students,
    courses,
    filters,
}: Props) {
    const [search, setSearch] = useState(filters.search);
    const [courseId, setCourseId] = useState(filters.course_id);

    const handleFilter = (newFilters: Partial<typeof filters>) => {
        const query = {
            search,
            course_id: courseId,
            ...newFilters,
        };

        router.get('/lecturer/students', query, {
            preserveState: true,
            replace: true,
        });
    };

    return (
        <>
            <Head title="Students Roster" />

            <div className="flex flex-col gap-6 p-4 md:p-6">
                <Heading
                    title="Student Directory"
                    description="View all students enrolled across your assigned course sections."
                />

                {/* Filters */}
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by name, matric no, email..."
                            className="pl-9 text-sm"
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                handleFilter({ search: e.target.value });
                            }}
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <Select
                            value={courseId}
                            onValueChange={(val) => {
                                setCourseId(val);
                                handleFilter({ course_id: val });
                            }}
                        >
                            <SelectTrigger className="w-[200px] text-xs">
                                <SelectValue placeholder="Filter by course" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All My Courses</SelectItem>
                                {courses.map((course) => (
                                    <SelectItem key={course.id} value={String(course.id)}>
                                        {course.code} - {course.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Students Table */}
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-base">Students ({students.total})</CardTitle>
                                <CardDescription className="text-xs">
                                    Enrolled candidates across programs for your active teaching assignments.
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {students.data.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
                                <Users className="h-10 w-10 stroke-1 mb-2 text-muted-foreground/60" />
                                <h3 className="text-sm font-semibold text-foreground">No students found</h3>
                                <p className="text-xs mt-1">Try adjusting your search criteria or course filter.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[120px]">Matric No</TableHead>
                                            <TableHead>Student Name</TableHead>
                                            <TableHead>Email / Phone</TableHead>
                                            <TableHead>Degree Program</TableHead>
                                            <TableHead className="text-center">Current Semester</TableHead>
                                            <TableHead className="text-center">Attendance %</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {students.data.map((student) => (
                                            <TableRow key={student.id}>
                                                <TableCell className="font-mono text-xs font-semibold">
                                                    {student.matric_no}
                                                </TableCell>
                                                <TableCell className="text-xs font-medium">
                                                    {student.user?.name ?? 'Unknown Student'}
                                                </TableCell>
                                                <TableCell className="text-xs text-muted-foreground">
                                                    <div>{student.user?.email}</div>
                                                    {student.phone && (
                                                        <div className="text-[11px]">{student.phone}</div>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-xs text-muted-foreground">
                                                    {student.program?.name ?? 'Undergraduate'}
                                                </TableCell>
                                                <TableCell className="text-center text-xs">
                                                    <Badge variant="outline" className="text-xs">
                                                        Sem {student.current_semester}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-center text-xs">
                                                    {student.attendance_rate !== null && student.attendance_rate !== undefined ? (
                                                        <Badge
                                                            variant={student.attendance_rate >= 75 ? 'default' : 'destructive'}
                                                            className="text-[10px]"
                                                        >
                                                            {student.attendance_rate}%
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-muted-foreground text-[11px]">No data</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right text-xs">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Button asChild variant="ghost" size="sm" className="h-7 text-xs px-2">
                                                            <Link href={`/lecturer/attendance?course_id=${courseId !== 'all' ? courseId : ''}`}>
                                                                Attendance
                                                            </Link>
                                                        </Button>
                                                        <Button asChild variant="ghost" size="sm" className="h-7 text-xs px-2">
                                                            <Link href={`/lecturer/gradebook?course_id=${courseId !== 'all' ? courseId : ''}`}>
                                                                Gradebook
                                                            </Link>
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Pagination */}
                {students.last_page > 1 && (
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                            Showing {students.from} to {students.to} of {students.total} students
                        </span>
                        <div className="flex items-center gap-1">
                            {students.current_page > 1 && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleFilter({ search, course_id: courseId, per_page: filters.per_page })}
                                    className="h-7 text-xs"
                                >
                                    <Link href={`/lecturer/students?page=${students.current_page - 1}&search=${search}&course_id=${courseId}`}>
                                        Previous
                                    </Link>
                                </Button>
                            )}
                            <span className="px-2">
                                Page {students.current_page} of {students.last_page}
                            </span>
                            {students.current_page < students.last_page && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-xs"
                                >
                                    <Link href={`/lecturer/students?page=${students.current_page + 1}&search=${search}&course_id=${courseId}`}>
                                        Next
                                    </Link>
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

LecturerStudentsIndex.layout = {
    breadcrumbs: [{ title: 'Students', href: '/lecturer/students' }],
};
