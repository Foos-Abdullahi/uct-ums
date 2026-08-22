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
import type { Program, Student } from '@/types/student';
import { ArrowLeft, Save, Loader2, User, GraduationCap, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

interface AdminStudentsEditProps {
    student: Student;
    programs: Program[];
}

export default function AdminStudentsEdit({ student, programs = [] }: AdminStudentsEditProps) {
    const { data, setData, put, processing, errors } = useForm({
        name: student.user?.name ?? '',
        email: student.user?.email ?? '',
        matric_no: student.matric_no ?? '',
        program_id: student.program_id ? String(student.program_id) : '',
        current_semester: student.current_semester ?? 1,
        phone: student.phone ?? '',
        gender: student.gender ?? 'Male',
        date_of_birth: student.date_of_birth ? String(student.date_of_birth).split('T')[0] : '',
        address: student.address ?? '',
        fee_status: student.fee_status ?? 'unpaid',
        enrollment_status: student.enrollment_status ?? 'enrolled',
        gpa: student.gpa ? String(student.gpa) : '',
        enrollment_date: student.enrollment_date ? String(student.enrollment_date).split('T')[0] : '',
        graduation_date: student.graduation_date ? String(student.graduation_date).split('T')[0] : '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/admin/students/${student.id}`, {
            onError: () => {
                toast.error('Please fix errors in the form.');
            },
        });
    };

    return (
        <>
            <Head title={`Edit Student - ${student.user?.name}`} />

            <div className="p-6 max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div>
                            <h1 className="text-lg font-semibold text-foreground tracking-tight">
                                Edit Student Record
                            </h1>
                            <p className="text-xs text-muted-foreground">
                                Update profile details for {student.user?.name} ({student.matric_no})
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Section 1: Personal Information (2 Columns Grid) */}
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

                    {/* Section 2: Academic Information (2 Columns Grid) */}
                    <UctPanelCard
                        title="2. Academic Enrollment & Program"
                        description="Academic degree program, matriculation number, GPA, and semester progression."
                        icon={GraduationCap}
                        type="default"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="matric_no">Matriculation ID <span className="text-destructive">*</span></Label>
                                <Input
                                    id="matric_no"
                                    value={data.matric_no}
                                    onChange={(e) => setData('matric_no', e.target.value)}
                                    required
                                />
                                {errors.matric_no && <p className="text-xs text-destructive">{errors.matric_no}</p>}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="program_id">Degree Program <span className="text-destructive">*</span></Label>
                                <Select
                                    value={data.program_id}
                                    onValueChange={(val) => setData('program_id', val)}
                                >
                                    <SelectTrigger className="w-full" id="program_id">
                                        <SelectValue placeholder="Select program" />
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
                                <Label htmlFor="current_semester">Current Semester</Label>
                                <Select
                                    value={String(data.current_semester)}
                                    onValueChange={(val) => setData('current_semester', Number(val))}
                                >
                                    <SelectTrigger className="w-full" id="current_semester">
                                        <SelectValue placeholder="Semester" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                                            <SelectItem key={s} value={String(s)}>
                                                Semester {s}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.current_semester && <p className="text-xs text-destructive">{errors.current_semester}</p>}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="enrollment_status">Enrollment Status</Label>
                                <Select
                                    value={data.enrollment_status}
                                    onValueChange={(val) => setData('enrollment_status', val)}
                                >
                                    <SelectTrigger className="w-full" id="enrollment_status">
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="enrolled">Enrolled (Active)</SelectItem>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="suspended">Suspended</SelectItem>
                                        <SelectItem value="graduated">Graduated</SelectItem>
                                        <SelectItem value="withdrawn">Withdrawn</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.enrollment_status && <p className="text-xs text-destructive">{errors.enrollment_status}</p>}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="gpa">Cumulative GPA</Label>
                                <Input
                                    id="gpa"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="4.00"
                                    placeholder="3.50"
                                    value={data.gpa}
                                    onChange={(e) => setData('gpa', e.target.value)}
                                />
                                {errors.gpa && <p className="text-xs text-destructive">{errors.gpa}</p>}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="enrollment_date">Enrollment Date</Label>
                                <Input
                                    id="enrollment_date"
                                    type="date"
                                    value={data.enrollment_date}
                                    onChange={(e) => setData('enrollment_date', e.target.value)}
                                />
                                {errors.enrollment_date && <p className="text-xs text-destructive">{errors.enrollment_date}</p>}
                            </div>

                            <div className="grid gap-2 md:col-span-2">
                                <Label htmlFor="graduation_date">Graduation Date (If Applicable)</Label>
                                <Input
                                    id="graduation_date"
                                    type="date"
                                    value={data.graduation_date}
                                    onChange={(e) => setData('graduation_date', e.target.value)}
                                />
                                {errors.graduation_date && <p className="text-xs text-destructive">{errors.graduation_date}</p>}
                            </div>
                        </div>
                    </UctPanelCard>

                    {/* Section 3: Financial Standing (2 Columns Grid) */}
                    <UctPanelCard
                        title="3. Financial Status & Standing"
                        description="Fee clearance standing across current and past terms."
                        icon={DollarSign}
                        type="default"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="fee_status">Fee Standing Status <span className="text-destructive">*</span></Label>
                                <Select
                                    value={data.fee_status}
                                    onValueChange={(val) => setData('fee_status', val)}
                                >
                                    <SelectTrigger className="w-full" id="fee_status">
                                        <SelectValue placeholder="Fee status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="paid">Paid in Full</SelectItem>
                                        <SelectItem value="partial">Partial Payment</SelectItem>
                                        <SelectItem value="unpaid">Unpaid / Outstanding</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.fee_status && <p className="text-xs text-destructive">{errors.fee_status}</p>}
                            </div>
                        </div>
                    </UctPanelCard>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                        <Button variant="outline" size="sm" asChild>
                            <Link href={`/admin/students/${student.id}`}>Cancel</Link>
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

AdminStudentsEdit.layout = (page: any) => {
    const student = page?.props?.student;
    const name = student?.user?.name ?? 'Student';
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/admin/dashboard' },
        { title: 'Students', href: '/admin/students' },
        { title: name, href: `/admin/students/${student?.id ?? ''}` },
        { title: 'Edit Profile', href: `/admin/students/${student?.id ?? ''}/edit` },
    ];
    return <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>;
};
