import { Head } from '@inertiajs/react';
import {
    BookOpen,
    Calendar,
    ChevronDown,
    ChevronUp,
    Download,
    FileText,
    GraduationCap,
    MapPin,
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
import type { Student } from '@/types/student';

interface CourseMaterial {
    id: number;
    title: string;
    category: string;
    file_name: string | null;
    file_type: string | null;
    file_size: number | null;
    created_at: string;
}

interface Course {
    id: number;
    code: string;
    name: string;
    credit_hours: number;
    semester: number;
    description: string | null;
    lecturer_name: string | null;
    schedule_day: string | null;
    schedule_time: string | null;
    room: string | null;
    section: string | null;
    materials: CourseMaterial[];
}

interface Props {
    student: Student;
    courses: Course[];
}

function formatFileSize(bytes: number | null): string {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const categoryColors: Record<string, string> = {
    syllabus: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    lecture_notes: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
    assignment: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    lab_manual: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    reading: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    other: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
};

function CourseCard({ course }: { course: Course }) {
    const [showMaterials, setShowMaterials] = useState(false);

    return (
        <Card className="overflow-hidden hover:border-primary/50 transition-colors">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-xs">
                            {course.code}
                        </Badge>
                        {course.section && (
                            <Badge variant="secondary" className="text-xs capitalize">
                                {course.section}
                            </Badge>
                        )}
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                        {course.credit_hours} credit hrs
                    </span>
                </div>
                <CardTitle className="text-base line-clamp-1">{course.name}</CardTitle>
                {course.description && (
                    <CardDescription className="text-xs line-clamp-2">
                        {course.description}
                    </CardDescription>
                )}
            </CardHeader>

            <CardContent className="space-y-2 pt-0 text-xs text-muted-foreground">
                {course.lecturer_name && (
                    <div className="flex items-center gap-1.5">
                        <GraduationCap className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span>{course.lecturer_name}</span>
                    </div>
                )}
                {(course.schedule_day || course.schedule_time) && (
                    <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span>
                            {course.schedule_day ?? 'Day TBA'} &bull;{' '}
                            {course.schedule_time ?? 'Time TBA'}
                        </span>
                    </div>
                )}
                {course.room && (
                    <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span>{course.room}</span>
                    </div>
                )}

                {/* Materials toggle */}
                <div className="border-t pt-2 mt-3">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-xs h-8 justify-between"
                        onClick={() => setShowMaterials(!showMaterials)}
                    >
                        <span className="flex items-center gap-1.5">
                            <FileText className="h-3.5 w-3.5" />
                            Course Materials ({course.materials.length})
                        </span>
                        {showMaterials ? (
                            <ChevronUp className="h-3.5 w-3.5" />
                        ) : (
                            <ChevronDown className="h-3.5 w-3.5" />
                        )}
                    </Button>

                    {showMaterials && (
                        <div className="mt-2 space-y-1.5">
                            {course.materials.length === 0 ? (
                                <p className="text-[11px] text-center text-muted-foreground py-2">
                                    No materials uploaded yet.
                                </p>
                            ) : (
                                course.materials.map((mat) => (
                                    <div
                                        key={mat.id}
                                        className="flex items-center justify-between rounded border p-2 text-[11px] hover:bg-muted/50"
                                    >
                                        <div className="flex items-center gap-2 truncate">
                                            <FileText className="h-3.5 w-3.5 text-primary shrink-0" />
                                            <div className="truncate">
                                                <div className="font-medium truncate">{mat.title}</div>
                                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                                    <span
                                                        className={`inline-flex items-center rounded px-1 py-0.5 text-[10px] font-medium capitalize ${categoryColors[mat.category] ?? categoryColors.other}`}
                                                    >
                                                        {mat.category.replace('_', ' ')}
                                                    </span>
                                                    {mat.file_size && (
                                                        <span>{formatFileSize(mat.file_size)}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <Button
                                            asChild
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 px-2 ml-2 shrink-0"
                                        >
                                            <a
                                                href={`/lecturer/materials/${mat.id}/download`}
                                                target="_blank"
                                                rel="noreferrer"
                                            >
                                                <Download className="h-3.5 w-3.5" />
                                            </a>
                                        </Button>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

export default function StudentCoursesIndex({ student, courses }: Props) {
    return (
        <>
            <Head title="My Courses" />

            <div className="flex flex-col gap-6 p-4 md:p-6">
                <Heading
                    title="My Courses"
                    description={`Semester ${student.current_semester} · ${student.program?.name ?? 'Your Program'}`}
                />

                {courses.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
                            <BookOpen className="h-12 w-12 stroke-1 mb-3 text-muted-foreground/60" />
                            <h3 className="text-base font-semibold text-foreground">No courses found</h3>
                            <p className="text-sm mt-1">
                                No active courses are assigned to your program for semester{' '}
                                {student.current_semester}.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {courses.map((course) => (
                            <CourseCard key={course.id} course={course} />
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}

StudentCoursesIndex.layout = {
    breadcrumbs: [{ title: 'My Courses', href: '/student/courses' }],
};
