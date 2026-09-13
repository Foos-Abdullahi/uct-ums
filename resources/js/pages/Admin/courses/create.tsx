import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, BookOpen, Save } from 'lucide-react';
import React from 'react';
import { UctPanelCard } from '@/components/tools/uct-panel-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { BreadcrumbItem } from '@/types';

interface CreateCourseProps {
    programs: Array<{ id: number; name: string; code: string | null }>;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/admin/dashboard' },
    { title: 'Courses', href: '/admin/courses' },
    { title: 'New Course', href: '/admin/courses/create' },
];

export default function AdminCourseCreate({
    programs = [],
}: CreateCourseProps) {
    const { data, setData, post, processing, errors } = useForm({
        program_id: programs[0]?.id ? String(programs[0].id) : '',
        code: '',
        name: '',
        credit_hours: 3,
        semester: 1,
        level: 'undergraduate',
        status: 'active',
        description: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/courses');
    };

    return (
        <>
            <Head title="Create New Course" />

            <div className="max-w-4xl space-y-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-semibold tracking-tight text-foreground">
                            Create New Course
                        </h1>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            Register a new curriculum course module with credit
                            weighting and program allocation.
                        </p>
                    </div>

                    <Button variant="outline" size="sm" asChild>
                        <Link href="/admin/courses">
                            <ArrowLeft className="mr-1.5 h-4 w-4" />
                            Back to Courses
                        </Link>
                    </Button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <UctPanelCard
                        title="Course Information"
                        description="Course code, title, and academic requirements."
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
                                    placeholder="e.g. Advanced Database Systems"
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
                                    placeholder="e.g. SWE302, CS101, NET201"
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
                                        setData('program_id', e.target.value)
                                    }
                                    required
                                >
                                    <option value="">Select a Program</option>
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
                                            Semester {i + 1} (Year{' '}
                                            {Math.ceil((i + 1) / 2)})
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
                                    Curriculum Level{' '}
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
                                    placeholder="Overview of syllabus, prerequisites, and learning goals..."
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
                            <Link href="/admin/courses">Cancel</Link>
                        </Button>
                        <Button type="submit" size="sm" disabled={processing}>
                            <Save className="mr-1.5 h-4 w-4" />
                            {processing ? 'Saving...' : 'Create Course'}
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

AdminCourseCreate.layout = { breadcrumbs };
