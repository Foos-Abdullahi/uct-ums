import { Head, Link, router } from '@inertiajs/react';
import {
    BookOpen,
    Calendar,
    CheckCircle2,
    GraduationCap,
    MapPin,
    Search,
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
import type { CourseAssignment } from '@/types/lecturer';

interface Props {
    assignments: (CourseAssignment & { students_count?: number })[];
    academic_years: string[];
    filters: {
        search: string;
        semester: string;
        academic_year: string;
    };
}

export default function LecturerCoursesIndex({
    assignments,
    academic_years,
    filters,
}: Props) {
    const [search, setSearch] = useState(filters.search);
    const [semester, setSemester] = useState(filters.semester);
    const [academicYear, setAcademicYear] = useState(filters.academic_year);

    const handleFilter = (newFilters: Partial<typeof filters>) => {
        const query = {
            search,
            semester,
            academic_year: academicYear,
            ...newFilters,
        };

        router.get('/lecturer/courses', query, {
            preserveState: true,
            replace: true,
        });
    };

    return (
        <>
            <Head title="My Courses" />

            <div className="flex flex-col gap-6 p-4 md:p-6">
                <Heading
                    title="My Assigned Courses"
                    description="View and manage the courses you are currently assigned to teach."
                />

                {/* Filters */}
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by code, title, room, section..."
                            className="pl-9 text-sm"
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                handleFilter({ search: e.target.value });
                            }}
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Select
                            value={semester}
                            onValueChange={(val) => {
                                setSemester(val);
                                handleFilter({ semester: val });
                            }}
                        >
                            <SelectTrigger className="w-[150px] text-xs">
                                <SelectValue placeholder="Semester" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Semesters</SelectItem>
                                <SelectItem value="Semester 1">Semester 1</SelectItem>
                                <SelectItem value="Semester 2">Semester 2</SelectItem>
                                <SelectItem value="Semester 3">Semester 3</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select
                            value={academicYear}
                            onValueChange={(val) => {
                                setAcademicYear(val);
                                handleFilter({ academic_year: val });
                            }}
                        >
                            <SelectTrigger className="w-[150px] text-xs">
                                <SelectValue placeholder="Academic Year" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Academic Years</SelectItem>
                                {academic_years.map((year) => (
                                    <SelectItem key={year} value={year}>
                                        {year}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Courses Grid */}
                {assignments.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
                            <BookOpen className="h-12 w-12 stroke-1 mb-3 text-muted-foreground/60" />
                            <h3 className="text-base font-semibold text-foreground">No courses found</h3>
                            <p className="text-sm mt-1">There are no courses matching your search or filters.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {assignments.map((assignment) => (
                            <Card key={assignment.id} className="flex flex-col justify-between overflow-hidden hover:border-primary/50 transition-all">
                                <div>
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between gap-2">
                                            <Badge variant="outline" className="font-mono text-xs">
                                                {assignment.course?.code}
                                            </Badge>
                                            <Badge className="capitalize text-xs">
                                                {assignment.section}
                                            </Badge>
                                        </div>
                                        <CardTitle className="text-lg line-clamp-1 mt-2">
                                            {assignment.course?.name}
                                        </CardTitle>
                                        <CardDescription className="text-xs line-clamp-1">
                                            {assignment.course?.program?.name ?? 'Academic Program'} &bull; {assignment.academic_year}
                                        </CardDescription>
                                    </CardHeader>

                                    <CardContent className="space-y-2.5 pt-0 text-xs text-muted-foreground">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-primary shrink-0" />
                                            <span>
                                                {assignment.schedule_day ?? 'Day TBA'} &bull; {assignment.schedule_time ?? 'Time TBA'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <MapPin className="h-4 w-4 text-primary shrink-0" />
                                            <span>{assignment.room ?? 'Room TBA'}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Users className="h-4 w-4 text-primary shrink-0" />
                                            <span>
                                                {assignment.students_count ?? 0} Enrolled Students &bull; {assignment.workload_hours} Credit Hours
                                            </span>
                                        </div>
                                    </CardContent>
                                </div>

                                <div className="p-4 pt-0 border-t bg-muted/20 space-y-2 mt-4">
                                    <Button asChild className="w-full text-xs" size="sm">
                                        <Link href={`/lecturer/courses/${assignment.course_id}`}>
                                            <BookOpen className="mr-2 h-3.5 w-3.5" />
                                            View Course Hub
                                        </Link>
                                    </Button>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Button asChild variant="outline" size="sm" className="text-xs h-8">
                                            <Link href={`/lecturer/attendance?course_id=${assignment.course_id}`}>
                                                <CheckCircle2 className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
                                                Attendance
                                            </Link>
                                        </Button>
                                        <Button asChild variant="outline" size="sm" className="text-xs h-8">
                                            <Link href={`/lecturer/gradebook?course_id=${assignment.course_id}`}>
                                                <GraduationCap className="mr-1.5 h-3.5 w-3.5 text-primary" />
                                                Gradebook
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}

LecturerCoursesIndex.layout = {
    breadcrumbs: [{ title: 'My Courses', href: '/lecturer/courses' }],
};
