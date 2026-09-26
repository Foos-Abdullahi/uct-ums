import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, BookOpen, Save } from 'lucide-react';
import React from 'react';
import { UctPanelCard } from '@/components/tools/uct-panel-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NumberInput } from '@/components/ui/number-input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
    DEGREE_LEVELS,
    durationBounds,
    durationUnit
    
} from '@/lib/programs';
import type {ProgramFormValues} from '@/lib/programs';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/admin/dashboard' },
    { title: 'Programs', href: '/admin/programs' },
    { title: 'New Program', href: '/admin/programs/create' },
];

export default function AdminProgramCreate() {
    const { data, setData, post, processing, errors } =
        useForm<ProgramFormValues>({
            name: '',
            code: '',
            degree_level: 'bachelor',
            duration_semesters: '',
            total_credits: 120,
            department: '',
            faculty: '',
            status: 'active',
            description: '',
        });

    const duration = durationBounds(data.degree_level);
    const durationUnitLabel = durationUnit(data.degree_level);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/programs');
    };

    return (
        <>
            <Head title="Create Academic Program" />

            <div className="max-w-4xl space-y-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-semibold tracking-tight text-foreground">
                            Create Academic Program
                        </h1>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            Define program code, degree level, total credits,
                            and faculty affiliation.
                        </p>
                    </div>

                    <Button variant="outline" size="sm" asChild>
                        <Link href="/admin/programs">
                            <ArrowLeft className="mr-1.5 h-4 w-4" />
                            Back to Programs
                        </Link>
                    </Button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <UctPanelCard
                        title="Program Information"
                        description="Core program identity, accreditation, and curriculum structure."
                        icon={BookOpen}
                    >
                        <div className="grid grid-cols-1 gap-4 pt-2 md:grid-cols-2">
                            <div className="space-y-1.5 md:col-span-2">
                                <Label
                                    htmlFor="name"
                                    className="text-xs font-semibold"
                                >
                                    Program Full Name{' '}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    placeholder="e.g. Bachelor of Science in Software Engineering"
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
                                    Program Code{' '}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="code"
                                    placeholder="e.g. BSC-SE, NCS, AVE"
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
                                    htmlFor="degree_level"
                                    className="text-xs font-semibold"
                                >
                                    Degree Level{' '}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <Select
                                    value={data.degree_level}
                                    onValueChange={(value) =>
                                        setData('degree_level', value)
                                    }
                                >
                                    <SelectTrigger
                                        id="degree_level"
                                        size="sm"
                                        className="text-xs"
                                    >
                                        <SelectValue placeholder="Select a degree level" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {DEGREE_LEVELS.map((level) => (
                                            <SelectItem
                                                key={level.value}
                                                value={level.value}
                                                className="text-xs"
                                            >
                                                {level.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.degree_level && (
                                    <p className="text-[11px] text-destructive">
                                        {errors.degree_level}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <Label
                                    htmlFor="duration_semesters"
                                    className="text-xs font-semibold"
                                >
                                    Duration ({durationUnitLabel}){' '}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <NumberInput
                                    id="duration_semesters"
                                    aria-label={`Duration in ${durationUnitLabel.toLowerCase()}`}
                                    value={data.duration_semesters}
                                    onValueChange={(value) =>
                                        setData('duration_semesters', value)
                                    }
                                    min={duration.min}
                                    max={duration.max}
                                    placeholder={duration.placeholder}
                                    required
                                />
                                <p className="text-[11px] text-muted-foreground">
                                    Enter a whole number from{' '}
                                    {duration.min} to {duration.max}{' '}
                                    {durationUnitLabel.toLowerCase()}.
                                </p>
                                {errors.duration_semesters && (
                                    <p className="text-[11px] text-destructive">
                                        {errors.duration_semesters}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <Label
                                    htmlFor="total_credits"
                                    className="text-xs font-semibold"
                                >
                                    Total Required Credits{' '}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <NumberInput
                                    id="total_credits"
                                    value={data.total_credits}
                                    onValueChange={(value) =>
                                        setData('total_credits', value)
                                    }
                                    min={1}
                                    max={300}
                                    placeholder="120"
                                    required
                                />
                                {errors.total_credits && (
                                    <p className="text-[11px] text-destructive">
                                        {errors.total_credits}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <Label
                                    htmlFor="faculty"
                                    className="text-xs font-semibold"
                                >
                                    Faculty Affiliation
                                </Label>
                                <Input
                                    id="faculty"
                                    placeholder="e.g. Faculty of Computing & Information Technology"
                                    value={data.faculty}
                                    onChange={(e) =>
                                        setData('faculty', e.target.value)
                                    }
                                    className="text-xs"
                                />
                                {errors.faculty && (
                                    <p className="text-[11px] text-destructive">
                                        {errors.faculty}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <Label
                                    htmlFor="department"
                                    className="text-xs font-semibold"
                                >
                                    Academic Department
                                </Label>
                                <Input
                                    id="department"
                                    placeholder="e.g. Software Engineering"
                                    value={data.department}
                                    onChange={(e) =>
                                        setData('department', e.target.value)
                                    }
                                    className="text-xs"
                                />
                                {errors.department && (
                                    <p className="text-[11px] text-destructive">
                                        {errors.department}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-1.5 md:col-span-2">
                                <Label
                                    htmlFor="description"
                                    className="text-xs font-semibold"
                                >
                                    Curriculum Overview / Description
                                </Label>
                                <Textarea
                                    id="description"
                                    placeholder="Summary of learning outcomes and specialization areas..."
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
                            <Link href="/admin/programs">Cancel</Link>
                        </Button>
                        <Button type="submit" size="sm" disabled={processing}>
                            <Save className="mr-1.5 h-4 w-4" />
                            {processing ? 'Saving...' : 'Create Program'}
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

AdminProgramCreate.layout = { breadcrumbs };
