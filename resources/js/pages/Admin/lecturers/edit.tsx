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
import { Textarea } from '@/components/ui/textarea';
import type { BreadcrumbItem } from '@/types';
import type { Lecturer } from '@/types/lecturer';
import { ArrowLeft, Save, Loader2, User, Briefcase, GraduationCap, MapPin } from 'lucide-react';
import { toast } from 'sonner';

interface AdminLecturersEditProps {
    lecturer: Lecturer;
    departments: string[];
    faculties: string[];
}

export default function AdminLecturersEdit({ lecturer, departments = [], faculties = [] }: AdminLecturersEditProps) {
    const { data, setData, put, processing, errors } = useForm({
        name: lecturer.user?.name ?? '',
        email: lecturer.user?.email ?? '',
        lecturer_no: lecturer.lecturer_no ?? '',
        department: lecturer.department ?? '',
        faculty: lecturer.faculty ?? '',
        designation: lecturer.designation ?? '',
        qualification: lecturer.qualification ?? '',
        specialization: lecturer.specialization ?? '',
        phone: lecturer.phone ?? '',
        gender: lecturer.gender ?? 'Male',
        date_of_birth: lecturer.date_of_birth ? String(lecturer.date_of_birth).split('T')[0] : '',
        address: lecturer.address ?? '',
        hire_date: lecturer.hire_date ? String(lecturer.hire_date).split('T')[0] : '',
        employment_status: lecturer.employment_status ?? 'active',
        contract_type: lecturer.contract_type ?? 'full_time',
        office_location: lecturer.office_location ?? '',
        bio: lecturer.bio ?? '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/admin/lecturers/${lecturer.id}`, {
            onError: () => {
                toast.error('Please fix errors in the form.');
            },
        });
    };

    return (
        <>
            <Head title={`Edit Lecturer - ${lecturer.user?.name}`} />

            <div className="p-6 max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-semibold text-foreground tracking-tight">
                            Edit Lecturer Record
                        </h1>
                        <p className="text-xs text-muted-foreground">
                            Update profile details for {lecturer.user?.name} ({lecturer.lecturer_no})
                        </p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/lecturers/${lecturer.id}`}>
                            <ArrowLeft className="h-4 w-4 mr-1.5" />
                            Back to Profile
                        </Link>
                    </Button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Section 1: Personal Information */}
                    <UctPanelCard
                        title="1. Personal Details & Contact"
                        description="Primary personal information and login credentials."
                        icon={User}
                        type="default"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Full Name <span className="text-destructive">*</span></Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    required
                                />
                                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="email">Email Address <span className="text-destructive">*</span></Label>
                                <Input
                                    id="email"
                                    type="email"
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
                                    <SelectTrigger id="gender">
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

                            <div className="grid gap-2">
                                <Label htmlFor="address">Address</Label>
                                <Input
                                    id="address"
                                    value={data.address}
                                    onChange={(e) => setData('address', e.target.value)}
                                />
                                {errors.address && <p className="text-xs text-destructive">{errors.address}</p>}
                            </div>
                        </div>
                    </UctPanelCard>

                    {/* Section 2: Professional Details */}
                    <UctPanelCard
                        title="2. Professional & Employment Details"
                        description="Academic title, department, faculty, and contract information."
                        icon={Briefcase}
                        type="default"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="lecturer_no">Staff ID <span className="text-destructive">*</span></Label>
                                <Input
                                    id="lecturer_no"
                                    value={data.lecturer_no}
                                    onChange={(e) => setData('lecturer_no', e.target.value)}
                                    required
                                />
                                {errors.lecturer_no && <p className="text-xs text-destructive">{errors.lecturer_no}</p>}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="designation">Designation / Job Title <span className="text-destructive">*</span></Label>
                                <Input
                                    id="designation"
                                    value={data.designation}
                                    onChange={(e) => setData('designation', e.target.value)}
                                    required
                                />
                                {errors.designation && <p className="text-xs text-destructive">{errors.designation}</p>}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="department">Department <span className="text-destructive">*</span></Label>
                                <Select
                                    value={data.department}
                                    onValueChange={(val) => setData('department', val)}
                                >
                                    <SelectTrigger id="department">
                                        <SelectValue placeholder="Select department" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {departments.map((d) => (
                                            <SelectItem key={d} value={d}>{d}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.department && <p className="text-xs text-destructive">{errors.department}</p>}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="faculty">Faculty <span className="text-destructive">*</span></Label>
                                <Select
                                    value={data.faculty}
                                    onValueChange={(val) => setData('faculty', val)}
                                >
                                    <SelectTrigger id="faculty">
                                        <SelectValue placeholder="Select faculty" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {faculties.map((f) => (
                                            <SelectItem key={f} value={f}>{f}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.faculty && <p className="text-xs text-destructive">{errors.faculty}</p>}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="qualification">Highest Qualification</Label>
                                <Input
                                    id="qualification"
                                    value={data.qualification}
                                    onChange={(e) => setData('qualification', e.target.value)}
                                />
                                {errors.qualification && <p className="text-xs text-destructive">{errors.qualification}</p>}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="specialization">Specialization / Research Area</Label>
                                <Input
                                    id="specialization"
                                    value={data.specialization}
                                    onChange={(e) => setData('specialization', e.target.value)}
                                />
                                {errors.specialization && <p className="text-xs text-destructive">{errors.specialization}</p>}
                            </div>
                        </div>
                    </UctPanelCard>

                    {/* Section 3: Employment & Office */}
                    <UctPanelCard
                        title="3. Employment Status & Office"
                        description="Contract type, employment status, office location, and hire date."
                        icon={MapPin}
                        type="default"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="employment_status">Employment Status</Label>
                                <Select
                                    value={data.employment_status}
                                    onValueChange={(val) => setData('employment_status', val)}
                                >
                                    <SelectTrigger id="employment_status">
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="on_leave">On Leave</SelectItem>
                                        <SelectItem value="inactive">Inactive</SelectItem>
                                        <SelectItem value="terminated">Terminated</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.employment_status && <p className="text-xs text-destructive">{errors.employment_status}</p>}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="contract_type">Contract Type</Label>
                                <Select
                                    value={data.contract_type}
                                    onValueChange={(val) => setData('contract_type', val)}
                                >
                                    <SelectTrigger id="contract_type">
                                        <SelectValue placeholder="Select contract" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="full_time">Full Time</SelectItem>
                                        <SelectItem value="part_time">Part Time</SelectItem>
                                        <SelectItem value="visiting">Visiting</SelectItem>
                                        <SelectItem value="adjunct">Adjunct</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.contract_type && <p className="text-xs text-destructive">{errors.contract_type}</p>}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="hire_date">Hire Date</Label>
                                <Input
                                    id="hire_date"
                                    type="date"
                                    value={data.hire_date}
                                    onChange={(e) => setData('hire_date', e.target.value)}
                                />
                                {errors.hire_date && <p className="text-xs text-destructive">{errors.hire_date}</p>}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="office_location">Office Location</Label>
                                <Input
                                    id="office_location"
                                    value={data.office_location}
                                    onChange={(e) => setData('office_location', e.target.value)}
                                />
                                {errors.office_location && <p className="text-xs text-destructive">{errors.office_location}</p>}
                            </div>

                            <div className="grid gap-2 md:col-span-2">
                                <Label htmlFor="bio">Biography / Brief Profile</Label>
                                <Textarea
                                    id="bio"
                                    value={data.bio}
                                    onChange={(e) => setData('bio', e.target.value)}
                                    rows={3}
                                />
                                {errors.bio && <p className="text-xs text-destructive">{errors.bio}</p>}
                            </div>
                        </div>
                    </UctPanelCard>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                        <Button variant="outline" size="sm" asChild>
                            <Link href={`/admin/lecturers/${lecturer.id}`}>Cancel</Link>
                        </Button>
                        <Button type="submit" size="sm" disabled={processing}>
                            {processing ? (
                                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="mr-1.5 h-4 w-4" />
                            )}
                            Save Changes
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

AdminLecturersEdit.layout = (page: any) => {
    const lecturer = page?.props?.lecturer;
    const name = lecturer?.user?.name ?? 'Lecturer';
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/admin/dashboard' },
        { title: 'Lecturers', href: '/admin/lecturers' },
        { title: name, href: `/admin/lecturers/${lecturer?.id ?? ''}` },
        { title: 'Edit Profile', href: `/admin/lecturers/${lecturer?.id ?? ''}/edit` },
    ];
    return <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>;
};