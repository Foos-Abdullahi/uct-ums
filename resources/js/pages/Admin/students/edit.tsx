import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface AdminStudentsEditProps {
    student: Student;
    programs: Program[];
}

export default function AdminStudentsEdit({
    student,
    programs = [],
}: AdminStudentsEditProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/admin/dashboard' },
        { title: 'Students', href: '/admin/students' },
        { title: student.user?.name ?? student.matric_no, href: `/admin/students/${student.id}` },
        { title: 'Edit', href: `/admin/students/${student.id}/edit` },
    ];

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
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Student - ${student.user?.name}`} />

            <div className="p-6 max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button variant="outline" size="icon" asChild className="h-8 w-8">
                            <Link href={`/admin/students/${student.id}`}>
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-lg font-semibold text-foreground tracking-tight">
                                Edit Student — {student.user?.name}
                            </h1>
                            <p className="text-xs text-muted-foreground">
                                Update student information, program assignment, semester, and status.
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Personal Information */}
                    <Card className="rounded-sm border-border/40 bg-card shadow-xs">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-semibold">
                                Personal Information
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Student identification and contact details.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="address">Residential Address</Label>
                                <Input
                                    id="address"
                                    value={data.address}
                                    onChange={(e) => setData('address', e.target.value)}
                                />
                                {errors.address && <p className="text-xs text-destructive">{errors.address}</p>}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Academic Information */}
                    <Card className="rounded-sm border-border/40 bg-card shadow-xs">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-semibold">
                                Academic Record & Status
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Matriculation ID, academic program, and enrollment standing.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                    <Label htmlFor="program_id">Enrolled Program <span className="text-destructive">*</span></Label>
                                    <Select
                                        value={data.program_id}
                                        onValueChange={(val) => setData('program_id', val)}
                                    >
                                        <SelectTrigger id="program_id">
                                            <SelectValue placeholder="Select Program" />
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
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="current_semester">Current Semester</Label>
                                    <Select
                                        value={String(data.current_semester)}
                                        onValueChange={(val) => setData('current_semester', parseInt(val))}
                                    >
                                        <SelectTrigger id="current_semester">
                                            <SelectValue placeholder="Select semester" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((s) => (
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
                                        onValueChange={(val: any) => setData('enrollment_status', val)}
                                    >
                                        <SelectTrigger id="enrollment_status">
                                            <SelectValue placeholder="Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="enrolled">Enrolled</SelectItem>
                                            <SelectItem value="pending">Pending</SelectItem>
                                            <SelectItem value="suspended">Suspended</SelectItem>
                                            <SelectItem value="graduated">Graduated</SelectItem>
                                            <SelectItem value="withdrawn">Withdrawn</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.enrollment_status && <p className="text-xs text-destructive">{errors.enrollment_status}</p>}
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="fee_status">Fee Status</Label>
                                    <Select
                                        value={data.fee_status}
                                        onValueChange={(val: any) => setData('fee_status', val)}
                                    >
                                        <SelectTrigger id="fee_status">
                                            <SelectValue placeholder="Fee Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="paid">Paid</SelectItem>
                                            <SelectItem value="partial">Partial</SelectItem>
                                            <SelectItem value="unpaid">Unpaid</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.fee_status && <p className="text-xs text-destructive">{errors.fee_status}</p>}
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="gpa">Cumulative GPA</Label>
                                    <Input
                                        id="gpa"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        max="4.00"
                                        placeholder="3.75"
                                        value={data.gpa}
                                        onChange={(e) => setData('gpa', e.target.value)}
                                    />
                                    {errors.gpa && <p className="text-xs text-destructive">{errors.gpa}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                                <div className="grid gap-2">
                                    <Label htmlFor="graduation_date">Graduation Date (If graduated)</Label>
                                    <Input
                                        id="graduation_date"
                                        type="date"
                                        value={data.graduation_date}
                                        onChange={(e) => setData('graduation_date', e.target.value)}
                                    />
                                    {errors.graduation_date && <p className="text-xs text-destructive">{errors.graduation_date}</p>}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Form Actions */}
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
        </AppLayout>
    );
}
