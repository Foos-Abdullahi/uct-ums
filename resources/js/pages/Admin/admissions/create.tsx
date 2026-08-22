import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { UctPanelCard } from '@/components/tools/uct-panel-card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { BreadcrumbItem } from '@/types';
import type { Program } from '@/types/student';
import { ArrowLeft, UserPlus, Loader2, User, BookOpen } from 'lucide-react';
import { toast } from 'sonner';

interface AdminAdmissionsCreateProps {
    programs: Program[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/admin/dashboard' },
    { title: 'Admissions', href: '/admin/admissions' },
    { title: 'New Application', href: '/admin/admissions/create' },
];

export default function AdminAdmissionsCreate({
    programs = [],
}: AdminAdmissionsCreateProps) {
    const { data, setData, post, processing, errors } = useForm({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        gender: 'Male',
        date_of_birth: '',
        address: '',
        program_id: programs[0]?.id ? String(programs[0].id) : '',
        entry_semester: 'Semester 1',
        previous_qualification: '',
        previous_gpa: '',
        notes: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/admissions', {
            onError: () => {
                toast.error('Please fix validation errors in the application form.');
            },
        });
    };

    return (
        <>
            <Head title="Submit New Admission Application" />

            <div className="p-6 max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div>
                            <h1 className="text-lg font-semibold text-foreground tracking-tight">
                                New Admission Application
                            </h1>
                            <p className="text-xs text-muted-foreground">
                                Register an incoming applicant into the admissions pipeline.
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Personal Information (2 Columns Grid) */}
                    <UctPanelCard
                        title="1. Applicant Personal Information"
                        description="Contact information and personal identification."
                        icon={User}
                        type="default"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="first_name">First Name <span className="text-destructive">*</span></Label>
                                <Input
                                    id="first_name"
                                    placeholder="e.g. Hassan"
                                    value={data.first_name}
                                    onChange={(e) => setData('first_name', e.target.value)}
                                    required
                                />
                                {errors.first_name && <p className="text-xs text-destructive">{errors.first_name}</p>}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="last_name">Last / Family Name <span className="text-destructive">*</span></Label>
                                <Input
                                    id="last_name"
                                    placeholder="e.g. Jama Warsame"
                                    value={data.last_name}
                                    onChange={(e) => setData('last_name', e.target.value)}
                                    required
                                />
                                {errors.last_name && <p className="text-xs text-destructive">{errors.last_name}</p>}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="email">Email Address <span className="text-destructive">*</span></Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="applicant@example.com"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    required
                                />
                                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="phone">Phone Number</Label>
                                <Input
                                    id="phone"
                                    placeholder="+252 61 555 0000"
                                    value={data.phone}
                                    onChange={(e) => setData('phone', e.target.value)}
                                />
                                {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="gender">Gender</Label>
                                <Select
                                    value={data.gender}
                                    onValueChange={(val) => setData('gender', val)}
                                >
                                    <SelectTrigger className="w-full" id="gender">
                                        <SelectValue placeholder="Select gender" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Male">Male</SelectItem>
                                        <SelectItem value="Female">Female</SelectItem>
                                        <SelectItem value="Other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.gender && <p className="text-xs text-destructive">{errors.gender}</p>}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="date_of_birth">Date of Birth</Label>
                                <Input
                                    id="date_of_birth"
                                    type="date"
                                    value={data.date_of_birth}
                                    onChange={(e) => setData('date_of_birth', e.target.value)}
                                />
                                {errors.date_of_birth && <p className="text-xs text-destructive">{errors.date_of_birth}</p>}
                            </div>

                            <div className="grid gap-2 md:col-span-2">
                                <Label htmlFor="address">Residential Address</Label>
                                <Input
                                    id="address"
                                    placeholder="City, Region, Country"
                                    value={data.address}
                                    onChange={(e) => setData('address', e.target.value)}
                                />
                                {errors.address && <p className="text-xs text-destructive">{errors.address}</p>}
                            </div>
                        </div>
                    </UctPanelCard>

                    {/* Academic Program & Qualifications (2 Columns Grid) */}
                    <UctPanelCard
                        title="2. Academic Program & Prior Qualifications"
                        description="Desired degree program, entry semester, and high school or transfer background."
                        icon={BookOpen}
                        type="default"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="program_id">Target Program <span className="text-destructive">*</span></Label>
                                <Select
                                    value={data.program_id}
                                    onValueChange={(val) => setData('program_id', val)}
                                >
                                    <SelectTrigger className="w-full" id="program_id">
                                        <SelectValue placeholder="Select target program" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {programs.map((p) => (
                                            <SelectItem key={p.id} value={String(p.id)}>
                                                {p.name} ({p.degree_level ?? 'Degree'})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.program_id && <p className="text-xs text-destructive">{errors.program_id}</p>}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="entry_semester">Entry Semester</Label>
                                <Select
                                    value={data.entry_semester}
                                    onValueChange={(val) => setData('entry_semester', val)}
                                >
                                    <SelectTrigger className="w-full" id="entry_semester">
                                        <SelectValue placeholder="Select entry semester" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Semester 1">Semester 1 (Fall / Spring)</SelectItem>
                                        <SelectItem value="Semester 2">Semester 2 (Direct entry)</SelectItem>
                                        <SelectItem value="Transfer">Transfer Student (Advanced standing)</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.entry_semester && <p className="text-xs text-destructive">{errors.entry_semester}</p>}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="previous_qualification">Prior Academic Qualification</Label>
                                <Input
                                    id="previous_qualification"
                                    placeholder="e.g. National High School Leaving Certificate"
                                    value={data.previous_qualification}
                                    onChange={(e) => setData('previous_qualification', e.target.value)}
                                />
                                {errors.previous_qualification && (
                                    <p className="text-xs text-destructive">{errors.previous_qualification}</p>
                                )}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="previous_gpa">Prior GPA / Grade Score</Label>
                                <Input
                                    id="previous_gpa"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="4.00"
                                    placeholder="3.80"
                                    value={data.previous_gpa}
                                    onChange={(e) => setData('previous_gpa', e.target.value)}
                                />
                                {errors.previous_gpa && <p className="text-xs text-destructive">{errors.previous_gpa}</p>}
                            </div>

                            <div className="grid gap-2 md:col-span-2">
                                <Label htmlFor="notes">Applicant Notes / Personal Statement</Label>
                                <textarea
                                    id="notes"
                                    rows={3}
                                    className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    placeholder="Any notes regarding applicant background, transfer credits, or scholarships..."
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                />
                                {errors.notes && <p className="text-xs text-destructive">{errors.notes}</p>}
                            </div>
                        </div>
                    </UctPanelCard>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/admin/admissions">Cancel</Link>
                        </Button>
                        <Button type="submit" size="sm" disabled={processing}>
                            {processing ? (
                                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                            ) : (
                                <UserPlus className="mr-1.5 h-4 w-4" />
                            )}
                            Submit Application
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

AdminAdmissionsCreate.layout = (page: any) => (
    <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>
);
