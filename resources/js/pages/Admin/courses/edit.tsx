import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, BookOpen, Save } from 'lucide-react';
import React from 'react';
import { UctPanelCard } from '@/components/tools/uct-panel-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface EditCourseProps {
    course: {
        id: number;
        program_id: number;
        code: string;
        name: string;
        credit_hours: number;
        semester: number;
        level: string;
        status: string;
        description: string | null;
    };
    programs: Array<{ id: number; name: string; code: string | null }>;
}

export default function AdminCourseEdit({
    course,
    programs = [],
}: EditCourseProps) {
    const { data, setData, put, processing, errors } = useForm({
        program_id: course.program_id,
        code: course.code,
        name: course.name,
        credit_hours: course.credit_hours,
        semester: course.semester,
        level: course.level,
        status: course.status,
        description: course.description || '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/admin/courses/${course.id}`);
    };

    return (
        <>
            <Head title={`Edit ${course.code} - ${course.name}`} />

            <div className="max-w-4xl space-y-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-semibold tracking-tight text-foreground">
                            Edit Course
                        </h1>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            Update credit allocation, term, status, and syllabus
                            outline.
                        </p>
                    </div>

                    <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/courses/${course.id}`}>
                            <ArrowLeft className="mr-1.5 h-4 w-4" />
                            Back to Details
                        </Link>
                    </Button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <UctPanelCard
                        title="Course Settings"
                        description="Modify course code, credit weighting, and affiliated program."
                        icon={BookOpen}
                    >
                        <div className="grid grid-cols-1 gap-4 pt-2 md:grid-cols-2">
                            <div className="space-y-1.5 md:col-span-2">
                                <Label
                                    htmlFor="name"
                                    className="text-xs font-semibold"
                                >
                                    Course Title{' '}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) =>
                                        setData('name', e.target.value)
                                    }
                                    className="text-xs"
                                    required
                                />
                                {errors.name && (
                                    <p className="text-[11px] text-destructive">
                                        {errors.name}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <Label
                                    htmlFor="code"
                                    className="text-xs font-semibold"
                                >
                                    Course Code{' '}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="code"
                                    value={data.code}
                                    onChange={(e) =>
                                        setData(
                                            'code',
                                            e.target.value.toUpperCase(),
                                        )
                                    }
                                    className="font-mono text-xs uppercase"
                                    required
                                />
                                {errors.code && (
                                    <p className="text-[11px] text-destructive">
                                        {errors.code}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <Label
                                    htmlFor="program_id"
                                    className="text-xs font-semibold"
                                >
                                    Academic Program{' '}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <select
                                    id="program_id"
                                    className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:ring-1 focus:ring-ring focus:outline-none"
                                    value={data.program_id}
                                    onChange={(e) =>
                                        setData(
                                            'program_id',
                                            parseInt(e.target.value),
                                        )
                                    }
                                    required
                                >
                                    {programs.map((prog) => (
                                        <option key={prog.id} value={prog.id}>
                                            {prog.name} ({prog.code || 'N/A'})
                                        </option>
                                    ))}
                                </select>
                                {errors.program_id && (
                                    <p className="text-[11px] text-destructive">
                                        {errors.program_id}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <Label
                                    htmlFor="credit_hours"
                                    className="text-xs font-semibold"
                                >
                                    Credit Hours{' '}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="credit_hours"
                                    type="number"
                                    min="1"
                                    max="10"
                                    value={data.credit_hours}
                                    onChange={(e) =>
                                        setData(
                                            'credit_hours',
                                            parseInt(e.target.value) || 3,
                                        )
                                    }
                                    className="text-xs"
                                    required
                                />
                                {errors.credit_hours && (
                                    <p className="text-[11px] text-destructive">
                                        {errors.credit_hours}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <Label
                                    htmlFor="semester"
                                    className="text-xs font-semibold"
                                >
                                    Semester Term{' '}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <select
                                    id="semester"
                                    className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:ring-1 focus:ring-ring focus:outline-none"
                                    value={data.semester}
                                    onChange={(e) =>
                                        setData(
                                            'semester',
                                            parseInt(e.target.value) || 1,
                                        )
                                    }
                                    required
                                >
                                    {Array.from({ length: 8 }, (_, i) => (
                                        <option key={i + 1} value={i + 1}>
                                            Semester {i + 1}
                                        </option>
                                    ))}
                                </select>
                                {errors.semester && (
                                    <p className="text-[11px] text-destructive">
                                        {errors.semester}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <Label
                                    htmlFor="level"
                                    className="text-xs font-semibold"
                                >
                                    Level{' '}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <select
                                    id="level"
                                    className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:ring-1 focus:ring-ring focus:outline-none"
                                    value={data.level}
                                    onChange={(e) =>
                                        setData('level', e.target.value)
                                    }
                                    required
                                >
                                    <option value="undergraduate">
                                        Undergraduate
                                    </option>
                                    <option value="postgraduate">
                                        Postgraduate
                                    </option>
                                    <option value="doctorate">Doctorate</option>
                                    <option value="diploma">Diploma</option>
                                </select>
                                {errors.level && (
                                    <p className="text-[11px] text-destructive">
                                        {errors.level}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <Label
                                    htmlFor="status"
                                    className="text-xs font-semibold"
                                >
                                    Status{' '}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <select
                                    id="status"
                                    className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:ring-1 focus:ring-ring focus:outline-none"
                                    value={data.status}
                                    onChange={(e) =>
                                        setData('status', e.target.value)
                                    }
                                    required
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                    <option value="archived">Archived</option>
                                </select>
                                {errors.status && (
                                    <p className="text-[11px] text-destructive">
                                        {errors.status}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-1.5 md:col-span-2">
                                <Label
                                    htmlFor="description"
                                    className="text-xs font-semibold"
                                >
                                    Syllabus Description
                                </Label>
                                <Textarea
                                    id="description"
                                    rows={3}
                                    value={data.description}
                                    onChange={(e) =>
                                        setData('description', e.target.value)
                                    }
                                    className="text-xs"
                                />
                                {errors.description && (
                                    <p className="text-[11px] text-destructive">
                                        {errors.description}
                                    </p>
                                )}
                            </div>
                        </div>
                    </UctPanelCard>

                    <div className="flex items-center justify-end gap-3">
                        <Button variant="outline" size="sm" asChild>
                            <Link href={`/admin/courses/${course.id}`}>
                                Cancel
                            </Link>
                        </Button>
                        <Button type="submit" size="sm" disabled={processing}>
                            <Save className="mr-1.5 h-4 w-4" />
                            {processing ? 'Saving...' : 'Update Course'}
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

AdminCourseEdit.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/admin/dashboard' },
        { title: 'Courses', href: '/admin/courses' },
    ],
};
