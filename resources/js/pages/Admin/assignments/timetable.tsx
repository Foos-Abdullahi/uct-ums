import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, CalendarDays, Plus } from 'lucide-react';
import {
    WeeklyTimetable,
    type TimetableEntry,
} from '@/components/timetable/weekly-timetable';
import { UctPanelCard } from '@/components/tools/uct-panel-card';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type { CourseAssignment } from './components/assignment';

interface TimetableAssignment extends CourseAssignment {
    course?: CourseAssignment['course'] & {
        program?: { id: number; name: string } | null;
    };
}

interface TimetableProps {
    assignments: TimetableAssignment[];
    programs: Array<{ id: number; name: string }>;
    academicYears: string[];
    sections: string[];
    filters: {
        academic_year: string;
        semester: string;
        program_id: string | number;
        section: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/admin/dashboard' },
    { title: 'Assignments', href: '/admin/assignments' },
    { title: 'Weekly Timetable', href: '/admin/assignments/timetable' },
];

export default function AdminTimetable({
    assignments,
    programs,
    academicYears,
    sections,
    filters,
}: TimetableProps) {
    const entries: TimetableEntry[] = assignments.map((assignment) => ({
        id: assignment.id,
        course_code: assignment.course?.code ?? 'Course',
        course_name: assignment.course?.name ?? 'Unnamed course',
        lecturer_name: assignment.lecturer?.user?.name,
        program_name: assignment.course?.program?.name,
        section: assignment.section,
        room: assignment.room ?? 'Room TBA',
        weekday: assignment.weekday ?? '',
        start_time: assignment.start_time ?? '',
        end_time: assignment.end_time ?? '',
    }));

    const updateFilter = (key: keyof TimetableProps['filters'], value: string) => {
        router.get(
            '/admin/assignments/timetable',
            { ...filters, [key]: value },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    return (
        <>
            <Head title="Weekly Timetable" />
            <div className="space-y-6 p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-xl font-semibold tracking-tight">
                            Weekly Timetable
                        </h1>
                        <p className="text-xs text-muted-foreground">
                            Filter teaching sessions by academic period, program,
                            and student section.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/admin/assignments">
                                <ArrowLeft className="mr-1.5 size-4" />
                                Assignments
                            </Link>
                        </Button>
                        <Button size="sm" asChild>
                            <Link href="/admin/assignments/create">
                                <Plus className="mr-1.5 size-4" />
                                Add Session
                            </Link>
                        </Button>
                    </div>
                </div>

                <UctPanelCard
                    title="Schedule Filters"
                    description="Each course assignment contributes one weekly session."
                    icon={CalendarDays}
                    type="default"
                >
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <Select
                            value={String(filters.academic_year)}
                            onValueChange={(value) =>
                                updateFilter('academic_year', value)
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Academic year" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All years</SelectItem>
                                {academicYears.map((year) => (
                                    <SelectItem key={year} value={year}>
                                        {year}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select
                            value={filters.semester}
                            onValueChange={(value) =>
                                updateFilter('semester', value)
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Semester" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All semesters</SelectItem>
                                {Array.from({ length: 8 }, (_, index) => index + 1).map(
                                    (semester) => (
                                        <SelectItem
                                            key={semester}
                                            value={`Semester ${semester}`}
                                        >
                                            Semester {semester}
                                        </SelectItem>
                                    ),
                                )}
                            </SelectContent>
                        </Select>

                        <Select
                            value={String(filters.program_id)}
                            onValueChange={(value) =>
                                updateFilter('program_id', value)
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Program" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All programs</SelectItem>
                                {programs.map((program) => (
                                    <SelectItem
                                        key={program.id}
                                        value={String(program.id)}
                                    >
                                        {program.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select
                            value={filters.section}
                            onValueChange={(value) =>
                                updateFilter('section', value)
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Section" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All sections</SelectItem>
                                {sections.map((section) => (
                                    <SelectItem key={section} value={section}>
                                        {section}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </UctPanelCard>

                <UctPanelCard
                    title="Weekly Schedule"
                    description={`${entries.length} scheduled session${entries.length === 1 ? '' : 's'}`}
                    icon={CalendarDays}
                    type="default"
                >
                    <WeeklyTimetable entries={entries} />
                </UctPanelCard>
            </div>
        </>
    );
}

AdminTimetable.layout = (page: React.ReactNode) => (
    <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>
);
