import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UctPanelCard } from '@/components/tools/uct-panel-card';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import type { BreadcrumbItem } from '@/types';
import {
    ArrowLeft,
    BookOpen,
    Edit3,
    Trash2,
    Calendar,
    GraduationCap,
    ClipboardList,
    Layers,
    User,
} from 'lucide-react';
import { toast } from 'sonner';

interface CourseDetails {
    id: number;
    program_id: number;
    code: string;
    name: string;
    credit_hours: number;
    semester: number;
    level: string;
    status: string;
    description: string | null;
    assignments_count?: number;
    program?: {
        id: number;
        name: string;
        code: string | null;
    };
    assignments?: Array<{
        id: number;
        academic_year: string;
        semester: string;
        section: string;
        role: string;
        status: string;
        lecturer?: {
            id: number;
            lecturer_no: string;
            user?: {
                name: string;
                email: string;
            };
        };
    }>;
}

interface AdminCourseShowProps {
    course: CourseDetails;
}

export default function AdminCourseShow({ course }: AdminCourseShowProps) {
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleteProcessing, setDeleteProcessing] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/admin/dashboard' },
        { title: 'Courses', href: '/admin/courses' },
        { title: `${course.code} - ${course.name}`, href: `/admin/courses/${course.id}` },
    ];

    const handleDelete = () => {
        setDeleteProcessing(true);
        router.delete(`/admin/courses/${course.id}`, {
            onSuccess: () => {
                toast.success('Course deleted successfully.');
                setDeleteModalOpen(false);
                setDeleteProcessing(false);
            },
            onError: () => {
                toast.error('Failed to delete course.');
                setDeleteProcessing(false);
            },
        });
    };

    const handleToggleStatus = () => {
        router.post(`/admin/courses/${course.id}/toggle-status`, {}, {
            preserveScroll: true,
            onSuccess: () => toast.success('Course status updated.'),
        });
    };

    return (
        <>
            <Head title={`${course.code} - ${course.name}`} />

            <div className="p-6 space-y-6">
                {/* Header UctPanelCard */}
                <UctPanelCard
                    title={`${course.code} - ${course.name}`}
                    subtitle={
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                            <span>{course.program?.name || 'Unassigned Program'}</span>
                            <span>· Semester {course.semester}</span>
                        </div>
                    }
                    icon={BookOpen}
                    badge={
                        <div className="flex items-center gap-1.5">
                            <Badge variant="outline" className="font-mono text-xs uppercase font-bold">
                                {course.credit_hours} Credits
                            </Badge>
                            <Badge
                                className={
                                    course.status === 'active'
                                        ? 'bg-emerald-500/10 text-emerald-700 border-emerald-200'
                                        : 'bg-muted text-muted-foreground'
                                }
                            >
                                {course.status}
                            </Badge>
                        </div>
                    }
                    actions={
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" asChild>
                                <Link href="/admin/courses">
                                    <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
                                    Back
                                </Link>
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleToggleStatus}
                            >
                                {course.status === 'active' ? 'Deactivate' : 'Activate'}
                            </Button>
                            <Button size="sm" asChild>
                                <Link href={`/admin/courses/${course.id}/edit`}>
                                    <Edit3 className="h-3.5 w-3.5 mr-1.5" />
                                    Edit
                                </Link>
                            </Button>
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => setDeleteModalOpen(true)}
                            >
                                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                                Delete
                            </Button>
                        </div>
                    }
                />

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Left: Summary */}
                    <div className="space-y-6">
                        <UctPanelCard
                            title="Course Details"
                            description="Core course attributes."
                            icon={Layers}
                        >
                            <div className="divide-y divide-border/30 text-xs pt-1">
                                <div className="flex justify-between py-2">
                                    <span className="text-muted-foreground">Course Code</span>
                                    <span className="font-mono font-bold text-foreground">{course.code}</span>
                                </div>
                                <div className="flex justify-between py-2">
                                    <span className="text-muted-foreground">Credit Hours</span>
                                    <span className="font-semibold text-foreground">{course.credit_hours} CH</span>
                                </div>
                                <div className="flex justify-between py-2">
                                    <span className="text-muted-foreground">Semester Term</span>
                                    <span className="font-semibold text-foreground">Semester {course.semester}</span>
                                </div>
                                <div className="flex justify-between py-2">
                                    <span className="text-muted-foreground">Curriculum Level</span>
                                    <span className="capitalize text-foreground font-medium">{course.level}</span>
                                </div>
                                <div className="flex justify-between py-2">
                                    <span className="text-muted-foreground">Program</span>
                                    <span className="text-foreground truncate max-w-[150px] font-medium">{course.program?.name || '—'}</span>
                                </div>
                            </div>
                        </UctPanelCard>

                        {course.description && (
                            <UctPanelCard
                                title="Syllabus Description"
                                icon={BookOpen}
                            >
                                <p className="text-xs text-muted-foreground leading-relaxed pt-1">
                                    {course.description}
                                </p>
                            </UctPanelCard>
                        )}
                    </div>

                    {/* Right: Lecturer Teaching Assignments */}
                    <div className="md:col-span-2 space-y-4">
                        <UctPanelCard
                            title="Faculty Teaching Assignments"
                            description="Lecturers assigned to instruct sections of this course."
                            icon={ClipboardList}
                            actions={
                                <Button size="sm" variant="outline" asChild>
                                    <Link href={`/admin/assignments/create?course_id=${course.id}`}>
                                        <User className="h-3.5 w-3.5 mr-1.5" />
                                        Assign Lecturer
                                    </Link>
                                </Button>
                            }
                        >
                            {!course.assignments || course.assignments.length === 0 ? (
                                <p className="text-xs text-muted-foreground italic py-4 text-center">
                                    No active teaching assignments for this course yet.
                                </p>
                            ) : (
                                <div className="divide-y divide-border/40 text-xs">
                                    {course.assignments.map((assignment) => (
                                        <div
                                            key={assignment.id}
                                            className="flex items-center justify-between py-2.5 hover:bg-muted/20 px-2 rounded transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="rounded-full bg-primary/10 p-2 text-primary">
                                                    <User className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-foreground">{assignment.lecturer?.user?.name || 'Assigned Lecturer'}</p>
                                                    <p className="text-[11px] text-muted-foreground">
                                                        Section {assignment.section} · {assignment.academic_year} ({assignment.semester})
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Badge variant="outline" className="text-[10px] capitalize">
                                                    {assignment.role.replace('_', ' ')}
                                                </Badge>
                                                <Button variant="ghost" size="sm" className="h-7 px-2" asChild>
                                                    <Link href={`/admin/assignments/${assignment.id}`}>
                                                        View
                                                    </Link>
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </UctPanelCard>
                    </div>
                </div>

                {/* Delete Confirmation Modal */}
                <ConfirmDeleteDialog
                    open={deleteModalOpen}
                    onOpenChange={setDeleteModalOpen}
                    title="Delete Course"
                    description="Are you sure you want to delete this course? This action cannot be undone."
                    itemName={`${course.code} - ${course.name}`}
                    loading={deleteProcessing}
                    onConfirm={handleDelete}
                />
            </div>
        </>
    );
}

AdminCourseShow.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/admin/dashboard' },
        { title: 'Courses', href: '/admin/courses' },
    ],
};
