import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    BookOpen,
    Edit3,
    Trash2,
    Layers,
    GraduationCap,
} from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import { UctPanelCard } from '@/components/tools/uct-panel-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { durationUnit } from '@/lib/programs';

interface Course {
    id: number;
    code: string;
    name: string;
    credit_hours: number;
    semester: number;
    level: string;
    status: string;
}

interface ProgramDetails {
    id: number;
    name: string;
    code: string | null;
    degree_level: string;
    duration_semesters: number;
    total_credits: number;
    department: string | null;
    faculty: string | null;
    status: string;
    description: string | null;
    students_count?: number;
    courses_count?: number;
    admissions_count?: number;
    courses?: Course[];
}

interface AdminProgramShowProps {
    program: ProgramDetails;
}

export default function AdminProgramShow({ program }: AdminProgramShowProps) {
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleteProcessing, setDeleteProcessing] = useState(false);

    const handleDelete = () => {
        setDeleteProcessing(true);
        router.delete(`/admin/programs/${program.id}`, {
            onSuccess: () => {
                toast.success('Program deleted successfully.');
                setDeleteModalOpen(false);
                setDeleteProcessing(false);
            },
            onError: () => {
                toast.error('Failed to delete program.');
                setDeleteProcessing(false);
            },
        });
    };

    const handleToggleStatus = () => {
        router.post(
            `/admin/programs/${program.id}/toggle-status`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => toast.success('Program status updated.'),
            },
        );
    };

    return (
        <>
            <Head title={`${program.name} - Academic Program`} />

            <div className="space-y-6 p-6">
                {/* Header UctPanelCard matching clean design standard */}
                <UctPanelCard
                    title={program.name}
                    subtitle={
                        <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                            <span>
                                {program.faculty ||
                                    'Faculty of Computing & Information Technology'}
                            </span>
                            {program.department && (
                                <span>· {program.department}</span>
                            )}
                        </div>
                    }
                    icon={BookOpen}
                    badge={
                        <div className="flex items-center gap-1.5">
                            {program.code && (
                                <Badge
                                    variant="outline"
                                    className="font-mono text-xs font-bold uppercase"
                                >
                                    {program.code}
                                </Badge>
                            )}
                            <Badge
                                className={
                                    program.status === 'active'
                                        ? 'border-emerald-200 bg-emerald-500/10 text-emerald-700'
                                        : 'bg-muted text-muted-foreground'
                                }
                            >
                                {program.status}
                            </Badge>
                        </div>
                    }
                    actions={
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" asChild>
                                <Link href="/admin/programs">
                                    <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                                    Back
                                </Link>
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleToggleStatus}
                            >
                                {program.status === 'active'
                                    ? 'Deactivate'
                                    : 'Activate'}
                            </Button>
                            <Button size="sm" asChild>
                                <Link
                                    href={`/admin/programs/${program.id}/edit`}
                                >
                                    <Edit3 className="mr-1.5 h-3.5 w-3.5" />
                                    Edit
                                </Link>
                            </Button>
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => setDeleteModalOpen(true)}
                            >
                                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                                Delete
                            </Button>
                        </div>
                    }
                />

                {/* Program Details and Curriculum Grid */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    {/* Left: Program Metadata */}
                    <div className="space-y-6">
                        <UctPanelCard
                            title="Program Summary"
                            description="Key academic parameters."
                            icon={Layers}
                        >
                            <div className="divide-y divide-border/30 pt-1 text-xs">
                                <div className="flex justify-between py-2">
                                    <span className="text-muted-foreground">
                                        Degree Level
                                    </span>
                                    <span className="font-medium text-foreground capitalize">
                                        {program.degree_level}
                                    </span>
                                </div>
                                <div className="flex justify-between py-2">
                                    <span className="text-muted-foreground">
                                        Duration
                                    </span>
                                    <span className="font-medium text-foreground">
                                        {program.duration_semesters}{' '}
                                        {durationUnit(program.degree_level)}
                                    </span>
                                </div>
                                <div className="flex justify-between py-2">
                                    <span className="text-muted-foreground">
                                        Required Credits
                                    </span>
                                    <span className="font-medium text-foreground">
                                        {program.total_credits} Credits
                                    </span>
                                </div>
                                <div className="flex justify-between py-2">
                                    <span className="text-muted-foreground">
                                        Enrolled Students
                                    </span>
                                    <span className="font-medium text-foreground">
                                        {program.students_count ?? 0}
                                    </span>
                                </div>
                                <div className="flex justify-between py-2">
                                    <span className="text-muted-foreground">
                                        Courses in Catalog
                                    </span>
                                    <span className="font-medium text-foreground">
                                        {program.courses_count ?? 0}
                                    </span>
                                </div>
                            </div>
                        </UctPanelCard>
                    </div>

                    {/* Right: Course List by Semester */}
                    <div className="space-y-4 md:col-span-2">
                        <UctPanelCard
                            title="Program Curriculum & Courses"
                            description="Active subjects aligned to this degree syllabus."
                            icon={GraduationCap}
                            actions={
                                <Button size="sm" variant="outline" asChild>
                                    <Link
                                        href={`/admin/courses/create?program_id=${program.id}`}
                                    >
                                        <BookOpen className="mr-1.5 h-3.5 w-3.5" />
                                        Add Course
                                    </Link>
                                </Button>
                            }
                        >
                            {!program.courses ||
                            program.courses.length === 0 ? (
                                <p className="py-4 text-center text-xs text-muted-foreground italic">
                                    No courses currently registered for this
                                    program.
                                </p>
                            ) : (
                                <div className="divide-y divide-border/40 text-xs">
                                    {program.courses.map((course) => (
                                        <div
                                            key={course.id}
                                            className="flex items-center justify-between rounded px-2 py-2.5 transition-colors hover:bg-muted/20"
                                        >
                                            <div className="flex items-center gap-3">
                                                <Badge
                                                    variant="outline"
                                                    className="font-mono text-xs uppercase"
                                                >
                                                    {course.code}
                                                </Badge>
                                                <div>
                                                    <p className="font-medium text-foreground">
                                                        {course.name}
                                                    </p>
                                                    <p className="text-[11px] text-muted-foreground">
                                                        Semester{' '}
                                                        {course.semester} ·{' '}
                                                        {course.level}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs font-semibold text-muted-foreground">
                                                    {course.credit_hours} CH
                                                </span>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 px-2"
                                                    asChild
                                                >
                                                    <Link
                                                        href={`/admin/courses/${course.id}`}
                                                    >
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
                {program.description && (
                    <UctPanelCard title="Description" icon={BookOpen}>
                        <p className="pt-1 text-xs leading-relaxed text-muted-foreground">
                            {program.description}
                        </p>
                    </UctPanelCard>
                )}

                {/* Delete Confirmation Modal */}
                <ConfirmDeleteDialog
                    open={deleteModalOpen}
                    onOpenChange={setDeleteModalOpen}
                    title="Delete Program"
                    description="Are you sure you want to delete this program? This action cannot be undone."
                    itemName={program.name}
                    loading={deleteProcessing}
                    onConfirm={handleDelete}
                />
            </div>
        </>
    );
}

AdminProgramShow.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/admin/dashboard' },
        { title: 'Programs', href: '/admin/programs' },
    ],
};
