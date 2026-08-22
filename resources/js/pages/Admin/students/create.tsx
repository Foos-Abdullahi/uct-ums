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
import { ArrowLeft, UserPlus, Loader2, User, GraduationCap, CreditCard } from 'lucide-react';
import { toast } from 'sonner';

interface AdminStudentsCreateProps {
    programs: Program[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/admin/dashboard' },
    { title: 'Students', href: '/admin/students' },
    { title: 'Create Student', href: '/admin/students/create' },
];

export default function AdminStudentsCreate({ programs = [] }: AdminStudentsCreateProps) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        password: '',
        matric_no: '',
        program_id: programs[0]?.id ? String(programs[0].id) : '',
        current_semester: 1,
        phone: '',
        gender: 'Male',
        date_of_birth: '',
        address: '',
        fee_status: 'unpaid',
        enrollment_status: 'enrolled',
        enrollment_date: new Date().toISOString().split('T')[0],
        initial_fee_amount: '1200',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/students', {
            onError: () => {
                toast.error('Please review the form for validation errors.');
            },
        });
    };

    return (
        <>
            <Head title="Create New Student" />

            <div className="p-6 max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div>
                            <h1 className="text-lg font-semibold text-foreground tracking-tight">
                                Create New Student
                            </h1>
                            <p className="text-xs text-muted-foreground">
                                Register a student profile and auto-generate their login account and matriculation ID.
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Section 1: Personal & Contact Information (2 Columns Grid) */}
                    <UctPanelCard
                        title="1. Personal & Contact Information"
                        description="Basic personal details and primary contact information."
                        icon={User}
                        type="default"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Full Name <span className="text-destructive">*</span></Label>
                                <Input
                                    id="name"
                                    placeholder="e.g. Abdirahman Hassan Nur"
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
                                    placeholder="student@uct.edu"
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
                                    placeholder="+252 61 555 0101"
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
                                    placeholder="City, District, Mogadishu"
                                    value={data.address}
                                    onChange={(e) => setData('address', e.target.value)}
                                />
                                {errors.address && <p className="text-xs text-destructive">{errors.address}</p>}
                            </div>

                            <div className="grid gap-2 md:col-span-2">
                                <Label htmlFor="password">Initial Password (Optional)</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Leave blank for default password (password123)"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                />
                                {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                            </div>
                        </div>
                    </UctPanelCard>

                    {/* Section 2: Academic Program & Matriculation (2 Columns Grid) */}
                    <UctPanelCard
                        title="2. Academic Program & Matriculation"
                        description="Select degree program, matriculation number, and current semester."
                        icon={GraduationCap}
                        type="default"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                <Label htmlFor="matric_no">Matriculation ID (Optional)</Label>
                                <Input
                                    id="matric_no"
                                    placeholder="Leave blank for auto (UCT-2026-XXXXX)"
                                    value={data.matric_no}
                                    onChange={(e) => setData('matric_no', e.target.value)}
                                />
                                {errors.matric_no && <p className="text-xs text-destructive">{errors.matric_no}</p>}
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
                                        <SelectItem value="pending">Pending Review</SelectItem>
                                        <SelectItem value="suspended">Suspended</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.enrollment_status && <p className="text-xs text-destructive">{errors.enrollment_status}</p>}
                            </div>

                            <div className="grid gap-2 md:col-span-2">
                                <Label htmlFor="enrollment_date">Enrollment Date</Label>
                                <Input
                                    id="enrollment_date"
                                    type="date"
                                    value={data.enrollment_date}
                                    onChange={(e) => setData('enrollment_date', e.target.value)}
                                />
                                {errors.enrollment_date && <p className="text-xs text-destructive">{errors.enrollment_date}</p>}
                            </div>
                        </div>
                    </UctPanelCard>

                    {/* Section 3: Financial & Invoice Setup (2 Columns Grid) */}
                    <UctPanelCard
                        title="3. Financial & Initial Fee Setup"
                        description="Initial semester invoice and financial standing."
                        icon={CreditCard}
                        type="default"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="initial_fee_amount">Initial Tuition Invoice ($)</Label>
                                <Input
                                    id="initial_fee_amount"
                                    type="number"
                                    step="0.01"
                                    placeholder="1200.00"
                                    value={data.initial_fee_amount}
                                    onChange={(e) => setData('initial_fee_amount', e.target.value)}
                                />
                                <p className="text-[11px] text-muted-foreground">
                                    Generates default registration invoice for Semester 1 tuition. Set to 0 to skip.
                                </p>
                                {errors.initial_fee_amount && <p className="text-xs text-destructive">{errors.initial_fee_amount}</p>}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="fee_status">Initial Fee Status</Label>
                                <Select
                                    value={data.fee_status}
                                    onValueChange={(val) => setData('fee_status', val)}
                                >
                                    <SelectTrigger className="w-full" id="fee_status">
                                        <SelectValue placeholder="Fee status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="unpaid">Unpaid (Full balance due)</SelectItem>
                                        <SelectItem value="partial">Partial</SelectItem>
                                        <SelectItem value="paid">Paid in Full</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.fee_status && <p className="text-xs text-destructive">{errors.fee_status}</p>}
                            </div>
                        </div>
                    </UctPanelCard>

                    {/* Action buttons */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/admin/students">Cancel</Link>
                        </Button>
                        <Button type="submit" size="sm" disabled={processing}>
                            {processing ? (
                                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                            ) : (
                                <UserPlus className="mr-1.5 h-4 w-4" />
                            )}
                            Save & Register Student
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

AdminStudentsCreate.layout = (page: any) => (
    <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>
);
