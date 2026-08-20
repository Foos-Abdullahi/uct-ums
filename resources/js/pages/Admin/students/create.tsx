import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { UctSectionCard } from '@/components/uct-section-card';
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
import {
    ArrowLeft,
    UserPlus,
    Loader2,
    User,
    GraduationCap,
    Wallet,
} from 'lucide-react';
import { toast } from 'sonner';

interface AdminStudentsCreateProps {
    programs: Program[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/admin/dashboard' },
    { title: 'Students', href: '/admin/students' },
    { title: 'Create Student', href: '/admin/students/create' },
];

export default function AdminStudentsCreate({
    programs = [],
}: AdminStudentsCreateProps) {
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
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create New Student" />

            <div className="mx-auto max-w-4xl space-y-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            size="icon"
                            asChild
                            className="h-8 w-8"
                        >
                            <Link href="/admin/students">
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-lg font-semibold tracking-tight text-foreground">
                                Create New Student
                            </h1>
                            <p className="text-xs text-muted-foreground">
                                Register a student profile and auto-generate
                                their login account and matriculation ID.
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Personal Information */}
                    <UctSectionCard
                        step={1}
                        icon={User}
                        title="Personal & Contact Information"
                        description="Basic personal details of the student."
                        error={Boolean(
                            errors.name ||
                            errors.email ||
                            errors.phone ||
                            errors.gender ||
                            errors.date_of_birth ||
                            errors.address,
                        )}
                        contentClassName="space-y-4"
                    >
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="name">
                                    Full Name{' '}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    placeholder="e.g. Abdirahman Hassan Nur"
                                    value={data.name}
                                    onChange={(e) =>
                                        setData('name', e.target.value)
                                    }
                                    required
                                />
                                {errors.name && (
                                    <p className="text-xs text-destructive">
                                        {errors.name}
                                    </p>
                                )}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="email">
                                    Email Address{' '}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="student@uct.edu"
                                    value={data.email}
                                    onChange={(e) =>
                                        setData('email', e.target.value)
                                    }
                                    required
                                />
                                {errors.email && (
                                    <p className="text-xs text-destructive">
                                        {errors.email}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div className="grid gap-2">
                                <Label htmlFor="phone">Phone Number</Label>
                                <Input
                                    id="phone"
                                    placeholder="+252 61 555 0101"
                                    value={data.phone}
                                    onChange={(e) =>
                                        setData('phone', e.target.value)
                                    }
                                />
                                {errors.phone && (
                                    <p className="text-xs text-destructive">
                                        {errors.phone}
                                    </p>
                                )}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="gender">Gender</Label>
                                <Select
                                    value={data.gender}
                                    onValueChange={(val) =>
                                        setData('gender', val)
                                    }
                                >
                                    <SelectTrigger id="gender">
                                        <SelectValue placeholder="Select gender" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Male">
                                            Male
                                        </SelectItem>
                                        <SelectItem value="Female">
                                            Female
                                        </SelectItem>
                                        <SelectItem value="Other">
                                            Other
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.gender && (
                                    <p className="text-xs text-destructive">
                                        {errors.gender}
                                    </p>
                                )}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="date_of_birth">
                                    Date of Birth
                                </Label>
                                <Input
                                    id="date_of_birth"
                                    type="date"
                                    value={data.date_of_birth}
                                    onChange={(e) =>
                                        setData('date_of_birth', e.target.value)
                                    }
                                />
                                {errors.date_of_birth && (
                                    <p className="text-xs text-destructive">
                                        {errors.date_of_birth}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="address">Residential Address</Label>
                            <Input
                                id="address"
                                placeholder="District, City, Country"
                                value={data.address}
                                onChange={(e) =>
                                    setData('address', e.target.value)
                                }
                            />
                            {errors.address && (
                                <p className="text-xs text-destructive">
                                    {errors.address}
                                </p>
                            )}
                        </div>
                    </UctSectionCard>

                    {/* Academic Information */}
                    <UctSectionCard
                        step={2}
                        icon={GraduationCap}
                        title="Academic Enrollment"
                        description="Academic program assignment and semester status."
                        error={Boolean(
                            errors.program_id ||
                            errors.matric_no ||
                            errors.current_semester ||
                            errors.enrollment_status ||
                            errors.enrollment_date,
                        )}
                        contentClassName="space-y-4"
                    >
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="program_id">
                                    Enrolled Program{' '}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <Select
                                    value={data.program_id}
                                    onValueChange={(val) =>
                                        setData('program_id', val)
                                    }
                                >
                                    <SelectTrigger id="program_id">
                                        <SelectValue placeholder="Select Program" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {programs.map((p) => (
                                            <SelectItem
                                                key={p.id}
                                                value={String(p.id)}
                                            >
                                                {p.name} (
                                                {p.degree_level ?? 'Degree'})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.program_id && (
                                    <p className="text-xs text-destructive">
                                        {errors.program_id}
                                    </p>
                                )}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="matric_no">
                                    Matriculation ID{' '}
                                    <span className="text-xs font-normal text-muted-foreground">
                                        (Leave empty for auto-generated)
                                    </span>
                                </Label>
                                <Input
                                    id="matric_no"
                                    placeholder="Auto-generated e.g. UCT-2026-00001"
                                    value={data.matric_no}
                                    onChange={(e) =>
                                        setData('matric_no', e.target.value)
                                    }
                                />
                                {errors.matric_no && (
                                    <p className="text-xs text-destructive">
                                        {errors.matric_no}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div className="grid gap-2">
                                <Label htmlFor="current_semester">
                                    Current Semester
                                </Label>
                                <Select
                                    value={String(data.current_semester)}
                                    onValueChange={(val) =>
                                        setData(
                                            'current_semester',
                                            parseInt(val),
                                        )
                                    }
                                >
                                    <SelectTrigger id="current_semester">
                                        <SelectValue placeholder="Select semester" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {[
                                            1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11,
                                            12,
                                        ].map((s) => (
                                            <SelectItem
                                                key={s}
                                                value={String(s)}
                                            >
                                                Semester {s}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.current_semester && (
                                    <p className="text-xs text-destructive">
                                        {errors.current_semester}
                                    </p>
                                )}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="enrollment_status">
                                    Enrollment Status
                                </Label>
                                <Select
                                    value={data.enrollment_status}
                                    onValueChange={(val) =>
                                        setData('enrollment_status', val)
                                    }
                                >
                                    <SelectTrigger id="enrollment_status">
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="enrolled">
                                            Enrolled / Active
                                        </SelectItem>
                                        <SelectItem value="pending">
                                            Pending
                                        </SelectItem>
                                        <SelectItem value="suspended">
                                            Suspended
                                        </SelectItem>
                                        <SelectItem value="graduated">
                                            Graduated
                                        </SelectItem>
                                        <SelectItem value="withdrawn">
                                            Withdrawn
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.enrollment_status && (
                                    <p className="text-xs text-destructive">
                                        {errors.enrollment_status}
                                    </p>
                                )}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="enrollment_date">
                                    Enrollment Date
                                </Label>
                                <Input
                                    id="enrollment_date"
                                    type="date"
                                    value={data.enrollment_date}
                                    onChange={(e) =>
                                        setData(
                                            'enrollment_date',
                                            e.target.value,
                                        )
                                    }
                                />
                                {errors.enrollment_date && (
                                    <p className="text-xs text-destructive">
                                        {errors.enrollment_date}
                                    </p>
                                )}
                            </div>
                        </div>
                    </UctSectionCard>

                    {/* Account Credentials & Financials */}
                    <UctSectionCard
                        step={3}
                        icon={Wallet}
                        title="Account Password & Tuition Invoice"
                        description="Setup default account access and initial tuition invoice."
                        error={Boolean(
                            errors.password || errors.initial_fee_amount,
                        )}
                        contentClassName="space-y-4"
                    >
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="password">
                                    Account Password{' '}
                                    <span className="text-xs font-normal text-muted-foreground">
                                        (Default: password123)
                                    </span>
                                </Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Leave empty for default password123"
                                    value={data.password}
                                    onChange={(e) =>
                                        setData('password', e.target.value)
                                    }
                                />
                                {errors.password && (
                                    <p className="text-xs text-destructive">
                                        {errors.password}
                                    </p>
                                )}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="initial_fee_amount">
                                    Initial Semester Invoice ($ USD)
                                </Label>
                                <Input
                                    id="initial_fee_amount"
                                    type="number"
                                    step="0.01"
                                    placeholder="1200.00"
                                    value={data.initial_fee_amount}
                                    onChange={(e) =>
                                        setData(
                                            'initial_fee_amount',
                                            e.target.value,
                                        )
                                    }
                                />
                                <span className="text-[11px] text-muted-foreground">
                                    Creates an initial tuition invoice for
                                    Semester 1.
                                </span>
                                {errors.initial_fee_amount && (
                                    <p className="text-xs text-destructive">
                                        {errors.initial_fee_amount}
                                    </p>
                                )}
                            </div>
                        </div>
                    </UctSectionCard>

                    {/* Form Actions */}
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
        </AppLayout>
    );
}
