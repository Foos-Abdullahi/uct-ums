import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Deferred } from '@inertiajs/react';
import { MetricCard } from '@/components/tools/MetricCard';
import { MetricCardsSkeleton } from '@/components/tools/metric-cards-skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { BreadcrumbItem } from '@/types';
import {
    Users,
    GraduationCap,
    BookOpen,
    DollarSign,
    Clock,
    BarChart3,
    FileText,
    UserPlus,
    CheckCircle2,
    XCircle,
    Calendar,
    Layers,
    ShieldCheck,
    ArrowRight,
    Building2,
    Award,
    CreditCard,
    UserCheck,
    Compass,
} from 'lucide-react';

interface DashboardStats {
    total_students: number;
    active_students: number;
    pending_students: number;
    suspended_students: number;
    graduated_students: number;
    total_lecturers: number;
    active_lecturers: number;
    total_courses: number;
    active_courses: number;
    total_programs: number;
    total_revenue: number;
    total_invoiced: number;
    outstanding_balance: number;
    collection_rate: number;
    total_applications: number;
    pending_applications: number;
    approved_applications: number;
    converted_applications: number;
    rejected_applications: number;
    total_assignments: number;
    active_assignments: number;
    total_certificates: number;
}

interface ProgramDistribution {
    id: number;
    name: string;
    code: string;
    department: string;
    faculty: string;
    level: string;
    students_count: number;
    courses_count: number;
}

interface RecentApplication {
    id: number;
    application_no: string;
    name: string;
    email: string;
    program: string;
    program_code: string;
    status: string;
    created_at: string;
    date: string;
}

interface RecentPayment {
    id: number;
    transaction_no: string;
    student_name: string;
    matric_no: string;
    amount: number;
    payment_method: string;
    status: string;
    date: string;
}

interface RecentAssignment {
    id: number;
    course_code: string;
    course_name: string;
    lecturer_name: string;
    department: string;
    schedule: string;
    room: string;
    status: string;
}

interface RecentStudent {
    id: number;
    name: string;
    email: string;
    matric_no: string;
    program: string;
    enrollment_status: string;
    fee_status: string;
    current_semester: number;
    created_at: string;
}

interface SemesterDistribution {
    semester: string;
    total: number;
}

interface DashboardProps {
    stats?: DashboardStats;
    programs_distribution?: ProgramDistribution[];
    recent_applications?: RecentApplication[];
    recent_payments?: RecentPayment[];
    recent_assignments?: RecentAssignment[];
    recent_students?: RecentStudent[];
    semester_distribution?: SemesterDistribution[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/admin/dashboard' },
];

export default function AdminDashboard({
    stats,
    programs_distribution = [],
    recent_applications = [],
    recent_payments = [],
    recent_assignments = [],
    semester_distribution = [],
}: DashboardProps) {
    const formatCurrency = (val?: number) => {
        return `$${(val ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    return (
        <>
            <Head title="University Administration Dashboard" />

            <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
                {/* 1. Header Banner */}
                <div className="relative overflow-hidden">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="space-y-1.5">
                            <div className="flex flex-wrap items-center gap-2.5">
                                   <h1 className="text-lg font-semibold text-foreground tracking-tight">
                        Dashboard
                    </h1>
                                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs px-2 py-0.5 gap-1.5 font-medium">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    System Active
                                </Badge>
                            </div>
                          
                    <p className="text-xs text-muted-foreground">
                        Overview of key metrics and recent activity across the university.
                    </p>
                        </div>

                        {/* Fast Action Shortcuts */}
                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                            <Button asChild size="sm" variant="default" className="shadow-xs gap-1.5">
                                <Link href="/admin/students/create">
                                    <UserPlus className="h-3.5 w-3.5" />
                                    <span>Register Student</span>
                                </Link>
                            </Button>
                            <Button asChild size="sm" variant="outline" className="shadow-xs gap-1.5">
                                <Link href="/admin/admissions">
                                    <Layers className="h-3.5 w-3.5" />
                                    <span>Admissions Queue</span>
                                </Link>
                            </Button>
                            <Button asChild size="sm" variant="outline" className="shadow-xs gap-1.5">
                                <Link href="/admin/reports">
                                    <FileText className="h-3.5 w-3.5" />
                                    <span>Analytics</span>
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>

                {/* 2. Key High-Impact Metrics Ribbon */}
                <Deferred data="stats" fallback={<MetricCardsSkeleton count={8} />}>
                    {stats && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4 animate-in fade-in slide-in-from-top-4 duration-700">
                            <MetricCard
                                title="Total Enrolment"
                                value={stats.total_students.toLocaleString()}
                                icon={Users}
                                color="primary"
                                trend={`${stats.active_students} actively enrolled`}
                            />
                            <MetricCard
                                title="Academic Faculty"
                                value={stats.total_lecturers.toLocaleString()}
                                icon={GraduationCap}
                                color="info"
                                trend={`${stats.active_lecturers} on active teaching`}
                            />
                            <MetricCard
                                title="Total Programs"
                                value={`${stats.total_programs} / ${stats.total_courses}`}
                                icon={BookOpen}
                                color="success"
                                trend={`${stats.active_courses} active courses`}
                            />
                            <MetricCard
                                title="Total Collected"
                                value={formatCurrency(stats.total_revenue)}
                                icon={DollarSign}
                                color="warning"
                                trend={`${stats.collection_rate}% collection rate`}
                            />
                            <MetricCard
                                title="Outstanding Fees"
                                value={formatCurrency(stats.outstanding_balance)}
                                icon={CreditCard}
                                color="destructive"
                                trend="Pending student clearance"
                            />
                            <MetricCard
                                title="Pending Admissions"
                                value={stats.pending_applications.toLocaleString()}
                                icon={Clock}
                                color="warning"
                                trend={`${stats.total_applications} total applied`}
                            />
                            <MetricCard
                                title="Active Teaching"
                                value={stats.active_assignments.toLocaleString()}
                                icon={BarChart3}
                                color="info"
                                trend={`${stats.total_assignments} total sections`}
                            />
                            <MetricCard
                                title="Graduated Alumni"
                                value={stats.graduated_students.toLocaleString()}
                                icon={Award}
                                color="primary"
                                trend={`${stats.total_certificates} issued certs`}
                            />
                        </div>
                    )}
                </Deferred>

                {/* 3. Core Operational Summaries (3-Column Grid) */}
                <Deferred data="stats" fallback={<div className="h-48 rounded-lg bg-card border border-border animate-pulse" />}>
                    {stats && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Student Lifecycle & Status */}
                            <Card className="border-border/60 shadow-xs">
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                            <Users className="h-4 w-4 text-primary" />
                                            Student Status Distribution
                                        </CardTitle>
                                        <Badge variant="outline" className="text-[10px]">
                                            {stats.total_students} Total
                                        </Badge>
                                    </div>
                                    <CardDescription className="text-xs">
                                        Enrolment lifecycle breakdown across all departments
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {/* Stacked Progress Bar */}
                                    <div className="h-3 w-full rounded-full bg-muted overflow-hidden flex">
                                        <div
                                            style={{ width: `${stats.total_students > 0 ? (stats.active_students / stats.total_students) * 100 : 0}%` }}
                                            className="bg-emerald-500 h-full"
                                            title={`Active: ${stats.active_students}`}
                                        />
                                        <div
                                            style={{ width: `${stats.total_students > 0 ? (stats.pending_students / stats.total_students) * 100 : 0}%` }}
                                            className="bg-amber-500 h-full"
                                            title={`Pending: ${stats.pending_students}`}
                                        />
                                        <div
                                            style={{ width: `${stats.total_students > 0 ? (stats.suspended_students / stats.total_students) * 100 : 0}%` }}
                                            className="bg-rose-500 h-full"
                                            title={`Suspended: ${stats.suspended_students}`}
                                        />
                                        <div
                                            style={{ width: `${stats.total_students > 0 ? (stats.graduated_students / stats.total_students) * 100 : 0}%` }}
                                            className="bg-sky-500 h-full"
                                            title={`Graduated: ${stats.graduated_students}`}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                                        <div className="flex items-center justify-between p-2 rounded-md bg-emerald-500/5 border border-emerald-500/10">
                                            <div className="flex items-center gap-1.5">
                                                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                                <span className="text-muted-foreground">Enrolled</span>
                                            </div>
                                            <span className="font-semibold text-foreground">{stats.active_students}</span>
                                        </div>
                                        <div className="flex items-center justify-between p-2 rounded-md bg-amber-500/5 border border-amber-500/10">
                                            <div className="flex items-center gap-1.5">
                                                <span className="h-2 w-2 rounded-full bg-amber-500" />
                                                <span className="text-muted-foreground">Pending</span>
                                            </div>
                                            <span className="font-semibold text-foreground">{stats.pending_students}</span>
                                        </div>
                                        <div className="flex items-center justify-between p-2 rounded-md bg-rose-500/5 border border-rose-500/10">
                                            <div className="flex items-center gap-1.5">
                                                <span className="h-2 w-2 rounded-full bg-rose-500" />
                                                <span className="text-muted-foreground">Suspended</span>
                                            </div>
                                            <span className="font-semibold text-foreground">{stats.suspended_students}</span>
                                        </div>
                                        <div className="flex items-center justify-between p-2 rounded-md bg-sky-500/5 border border-sky-500/10">
                                            <div className="flex items-center gap-1.5">
                                                <span className="h-2 w-2 rounded-full bg-sky-500" />
                                                <span className="text-muted-foreground">Graduated</span>
                                            </div>
                                            <span className="font-semibold text-foreground">{stats.graduated_students}</span>
                                        </div>
                                    </div>

                                    <Button asChild variant="ghost" size="sm" className="w-full text-xs text-primary justify-between">
                                        <Link href="/admin/students">
                                            <span>Open Student Directory</span>
                                            <ArrowRight className="h-3.5 w-3.5" />
                                        </Link>
                                    </Button>
                                </CardContent>
                            </Card>

                            {/* Financial Solvency & Recovery */}
                            <Card className="border-border/60 shadow-xs">
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                            <DollarSign className="h-4 w-4 text-emerald-600" />
                                            Tuition & Fees Health
                                        </CardTitle>
                                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]">
                                            {stats.collection_rate}% Collected
                                        </Badge>
                                    </div>
                                    <CardDescription className="text-xs">
                                        Invoiced totals against collected student payments
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-muted-foreground">Collection Progress</span>
                                            <span className="font-medium">{stats.collection_rate}%</span>
                                        </div>
                                        <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
                                            <div
                                                style={{ width: `${Math.min(100, stats.collection_rate)}%` }}
                                                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2 text-xs pt-1">
                                        <div className="flex items-center justify-between p-2 rounded-md bg-muted/40">
                                            <span className="text-muted-foreground">Total Invoiced</span>
                                            <span className="font-semibold">{formatCurrency(stats.total_invoiced)}</span>
                                        </div>
                                        <div className="flex items-center justify-between p-2 rounded-md bg-emerald-500/5 text-emerald-700 dark:text-emerald-400">
                                            <span>Cleared Payments</span>
                                            <span className="font-semibold">{formatCurrency(stats.total_revenue)}</span>
                                        </div>
                                        <div className="flex items-center justify-between p-2 rounded-md bg-destructive/5 text-destructive">
                                            <span>Outstanding Balance</span>
                                            <span className="font-semibold">{formatCurrency(stats.outstanding_balance)}</span>
                                        </div>
                                    </div>

                                    <Button asChild variant="ghost" size="sm" className="w-full text-xs text-primary justify-between">
                                        <Link href="/admin/reports/finance">
                                            <span>View Detailed Ledger</span>
                                            <ArrowRight className="h-3.5 w-3.5" />
                                        </Link>
                                    </Button>
                                </CardContent>
                            </Card>

                            {/* Admissions Conversion Pipeline */}
                            <Card className="border-border/60 shadow-xs">
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                            <Layers className="h-4 w-4 text-sky-600" />
                                            Admissions Funnel
                                        </CardTitle>
                                        <Badge variant="outline" className="text-[10px]">
                                            {stats.total_applications} Candidates
                                        </Badge>
                                    </div>
                                    <CardDescription className="text-xs">
                                        New applicant flow and conversion to registered students
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="space-y-2 text-xs">
                                        <div className="flex items-center justify-between p-2 rounded-md bg-amber-500/10 border border-amber-500/20">
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-3.5 w-3.5 text-amber-600" />
                                                <span className="font-medium text-amber-900 dark:text-amber-300">Pending Review</span>
                                            </div>
                                            <span className="font-bold text-amber-700 dark:text-amber-400">{stats.pending_applications}</span>
                                        </div>

                                        <div className="flex items-center justify-between p-2 rounded-md bg-sky-500/10 border border-sky-500/20">
                                            <div className="flex items-center gap-2">
                                                <CheckCircle2 className="h-3.5 w-3.5 text-sky-600" />
                                                <span className="font-medium text-sky-900 dark:text-sky-300">Approved Offers</span>
                                            </div>
                                            <span className="font-bold text-sky-700 dark:text-sky-400">{stats.approved_applications}</span>
                                        </div>

                                        <div className="flex items-center justify-between p-2 rounded-md bg-emerald-500/10 border border-emerald-500/20">
                                            <div className="flex items-center gap-2">
                                                <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
                                                <span className="font-medium text-emerald-900 dark:text-emerald-300">Enrolled Students</span>
                                            </div>
                                            <span className="font-bold text-emerald-700 dark:text-emerald-400">{stats.converted_applications}</span>
                                        </div>

                                        <div className="flex items-center justify-between p-2 rounded-md bg-rose-500/5 text-muted-foreground">
                                            <div className="flex items-center gap-2">
                                                <XCircle className="h-3.5 w-3.5 text-rose-500" />
                                                <span>Declined / Rejected</span>
                                            </div>
                                            <span className="font-semibold">{stats.rejected_applications}</span>
                                        </div>
                                    </div>

                                    <Button asChild variant="ghost" size="sm" className="w-full text-xs text-primary justify-between">
                                        <Link href="/admin/admissions">
                                            <span>Review Applications</span>
                                            <ArrowRight className="h-3.5 w-3.5" />
                                        </Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </Deferred>

                {/* 4. Academic Programs & Cohort Breakdown (2-Column Grid) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Top Academic Programs */}
                    <div className="lg:col-span-2">
                        <Deferred data="programs_distribution" fallback={<div className="h-72 rounded-lg bg-card border border-border animate-pulse" />}>
                            <Card className="border-border/60 shadow-xs h-full flex flex-col justify-between">
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                                <Building2 className="h-4 w-4 text-primary" />
                                                Academic Programs & Enrolment Density
                                            </CardTitle>
                                            <CardDescription className="text-xs">
                                                Leading degree programs ranked by student volume
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {programs_distribution.length === 0 ? (
                                        <div className="text-center py-8 text-xs text-muted-foreground">
                                            No program distribution data available.
                                        </div>
                                    ) : (
                                        <div className="space-y-2.5">
                                            {programs_distribution.map((prog) => (
                                                <div
                                                    key={prog.id}
                                                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 rounded-lg border border-border/40 bg-card hover:bg-muted/20 gap-2 transition-colors"
                                                >
                                                    <div className="space-y-0.5">
                                                        <div className="flex items-center gap-2">
                                                            <Badge variant="outline" className="font-mono text-[10px]">
                                                                {prog.code}
                                                            </Badge>
                                                            <p className="text-xs font-semibold text-foreground">
                                                                {prog.name}
                                                            </p>
                                                        </div>
                                                        <p className="text-[11px] text-muted-foreground">
                                                            {prog.department} • <span className="capitalize">{prog.level}</span>
                                                        </p>
                                                    </div>

                                                    <div className="flex items-center gap-4 text-xs shrink-0">
                                                        <div className="text-right">
                                                            <span className="font-semibold text-foreground">
                                                                {prog.students_count}
                                                            </span>
                                                            <p className="text-[10px] text-muted-foreground">Enrolled Students</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="font-semibold text-foreground">
                                                                {prog.courses_count}
                                                            </span>
                                                            <p className="text-[10px] text-muted-foreground">Offered Courses</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </Deferred>
                    </div>

                    {/* Semester Cohort Distribution */}
                    <Deferred data="semester_distribution" fallback={<div className="h-72 rounded-lg bg-card border border-border animate-pulse" />}>
                        <Card className="border-border/60 shadow-xs h-full flex flex-col justify-between">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-primary" />
                                    Active Cohort Progression
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Students categorized by semester progression
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {semester_distribution.length === 0 ? (
                                    <div className="text-center py-8 text-xs text-muted-foreground">
                                        No semester cohort breakdown available.
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {semester_distribution.map((sem) => (
                                            <div key={sem.semester} className="space-y-1.5">
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="font-medium text-foreground">{sem.semester}</span>
                                                    <span className="text-muted-foreground font-semibold">{sem.total} Students</span>
                                                </div>
                                                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                                                    <div
                                                        style={{ width: `${Math.min(100, (sem.total / (stats?.total_students || 1)) * 100)}%` }}
                                                        className="h-full bg-primary rounded-full"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </Deferred>
                </div>

                {/* 5. Live Operations Feeds Grid (3 Clean Cards) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Feed 1: Pending Admissions Awaiting Action */}
                    <Deferred data="recent_applications" fallback={<div className="h-64 rounded-lg bg-card border border-border animate-pulse" />}>
                        <Card className="border-border/60 shadow-xs flex flex-col justify-between">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-primary" />
                                            Admissions Queue
                                        </CardTitle>
                                        <CardDescription className="text-xs">
                                            Candidates awaiting review
                                        </CardDescription>
                                    </div>
                                    <Button asChild variant="outline" size="sm" className="h-7 text-xs">
                                        <Link href="/admin/admissions">View All</Link>
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {recent_applications.length === 0 ? (
                                    <div className="text-center py-6 text-xs text-muted-foreground">
                                        No pending admissions at this moment.
                                    </div>
                                ) : (
                                    <div className="space-y-2.5">
                                        {recent_applications.slice(0, 5).map((app) => (
                                            <div
                                                key={app.id}
                                                className="flex items-center justify-between p-2.5 rounded-lg border border-border/40 bg-card hover:bg-muted/30 transition-colors"
                                            >
                                                <div className="space-y-0.5 min-w-0">
                                                    <p className="text-xs font-semibold text-foreground truncate">
                                                        {app.name}
                                                    </p>
                                                    <p className="text-[11px] text-muted-foreground truncate">
                                                        {app.program}
                                                    </p>
                                                </div>

                                                <div className="flex items-center gap-2 shrink-0">
                                                    <Badge
                                                        variant={app.status === 'approved' ? 'default' : app.status === 'pending' ? 'secondary' : 'outline'}
                                                        className="text-[10px] uppercase py-0"
                                                    >
                                                        {app.status}
                                                    </Badge>
                                                    <Button asChild size="sm" variant="ghost" className="h-6 px-2 text-xs">
                                                        <Link href={`/admin/admissions/${app.id}`}>
                                                            Review
                                                        </Link>
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </Deferred>

                    {/* Feed 2: Recent Tuition Payments */}
                    <Deferred data="recent_payments" fallback={<div className="h-64 rounded-lg bg-card border border-border animate-pulse" />}>
                        <Card className="border-border/60 shadow-xs flex flex-col justify-between">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                            <DollarSign className="h-4 w-4 text-emerald-600" />
                                            Recent Receipts
                                        </CardTitle>
                                        <CardDescription className="text-xs">
                                            Incoming cashier & bank payments
                                        </CardDescription>
                                    </div>
                                    <Button asChild variant="outline" size="sm" className="h-7 text-xs">
                                        <Link href="/admin/reports/finance">Ledger</Link>
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {recent_payments.length === 0 ? (
                                    <div className="text-center py-6 text-xs text-muted-foreground">
                                        No payment transactions recorded recently.
                                    </div>
                                ) : (
                                    <div className="space-y-2.5">
                                        {recent_payments.slice(0, 5).map((payment) => (
                                            <div
                                                key={payment.id}
                                                className="flex items-center justify-between p-2.5 rounded-lg border border-border/40 bg-card hover:bg-muted/30 transition-colors"
                                            >
                                                <div className="space-y-0.5 min-w-0">
                                                    <p className="text-xs font-semibold text-foreground truncate">
                                                        {payment.student_name}
                                                    </p>
                                                    <p className="text-[11px] text-muted-foreground truncate font-mono">
                                                        {payment.transaction_no}
                                                    </p>
                                                </div>

                                                <div className="text-right shrink-0">
                                                    <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                                        +${payment.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </p>
                                                    <span className="text-[10px] text-muted-foreground capitalize">
                                                        {payment.payment_method}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </Deferred>

                    {/* Feed 3: Active Teaching Allocations */}
                    <Deferred data="recent_assignments" fallback={<div className="h-64 rounded-lg bg-card border border-border animate-pulse" />}>
                        <Card className="border-border/60 shadow-xs flex flex-col justify-between">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                            <GraduationCap className="h-4 w-4 text-primary" />
                                            Faculty Teaching
                                        </CardTitle>
                                        <CardDescription className="text-xs">
                                            Active course schedules & rooms
                                        </CardDescription>
                                    </div>
                                    <Button asChild variant="outline" size="sm" className="h-7 text-xs">
                                        <Link href="/admin/assignments">Assignments</Link>
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {recent_assignments.length === 0 ? (
                                    <div className="text-center py-6 text-xs text-muted-foreground">
                                        No teaching assignments allocated.
                                    </div>
                                ) : (
                                    <div className="space-y-2.5">
                                        {recent_assignments.slice(0, 5).map((ca) => (
                                            <div
                                                key={ca.id}
                                                className="flex items-center justify-between p-2.5 rounded-lg border border-border/40 bg-card hover:bg-muted/30 transition-colors"
                                            >
                                                <div className="space-y-0.5 min-w-0">
                                                    <p className="text-xs font-semibold text-foreground truncate">
                                                        {ca.course_name}
                                                    </p>
                                                    <p className="text-[11px] text-muted-foreground truncate">
                                                        {ca.lecturer_name} • {ca.room}
                                                    </p>
                                                </div>

                                                <Badge variant="outline" className="text-[10px] font-mono shrink-0">
                                                    {ca.course_code}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </Deferred>
                </div>

                {/* 6. Administrative Shortcuts Operations Center */}
                <Card className="border-border/60 shadow-xs">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                    <Compass className="h-4 w-4 text-primary" />
                                    Administrative Management Directory
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Quick navigation to core university management modules and configurations
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                            <Link
                                href="/admin/students"
                                className="flex flex-col items-center justify-center p-3.5 rounded-lg border border-border/40 bg-card hover:border-primary/50 hover:bg-primary/5 transition-all text-center group"
                            >
                                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform mb-2">
                                    <Users className="h-4 w-4" />
                                </div>
                                <span className="text-xs font-semibold text-foreground">Students</span>
                                <span className="text-[10px] text-muted-foreground mt-0.5">Directory & Profiles</span>
                            </Link>

                            <Link
                                href="/admin/admissions"
                                className="flex flex-col items-center justify-center p-3.5 rounded-lg border border-border/40 bg-card hover:border-primary/50 hover:bg-primary/5 transition-all text-center group"
                            >
                                <div className="h-9 w-9 rounded-full bg-sky-500/10 flex items-center justify-center text-sky-600 group-hover:scale-110 transition-transform mb-2">
                                    <Layers className="h-4 w-4" />
                                </div>
                                <span className="text-xs font-semibold text-foreground">Admissions</span>
                                <span className="text-[10px] text-muted-foreground mt-0.5">Screen & Admit</span>
                            </Link>

                            <Link
                                href="/admin/lecturers"
                                className="flex flex-col items-center justify-center p-3.5 rounded-lg border border-border/40 bg-card hover:border-primary/50 hover:bg-primary/5 transition-all text-center group"
                            >
                                <div className="h-9 w-9 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform mb-2">
                                    <GraduationCap className="h-4 w-4" />
                                </div>
                                <span className="text-xs font-semibold text-foreground">Lecturers</span>
                                <span className="text-[10px] text-muted-foreground mt-0.5">Faculty Staff</span>
                            </Link>

                            <Link
                                href="/admin/assignments"
                                className="flex flex-col items-center justify-center p-3.5 rounded-lg border border-border/40 bg-card hover:border-primary/50 hover:bg-primary/5 transition-all text-center group"
                            >
                                <div className="h-9 w-9 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform mb-2">
                                    <BookOpen className="h-4 w-4" />
                                </div>
                                <span className="text-xs font-semibold text-foreground">Teaching</span>
                                <span className="text-[10px] text-muted-foreground mt-0.5">Course Allocation</span>
                            </Link>

                            <Link
                                href="/admin/reports"
                                className="flex flex-col items-center justify-center p-3.5 rounded-lg border border-border/40 bg-card hover:border-primary/50 hover:bg-primary/5 transition-all text-center group"
                            >
                                <div className="h-9 w-9 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform mb-2">
                                    <BarChart3 className="h-4 w-4" />
                                </div>
                                <span className="text-xs font-semibold text-foreground">Reports</span>
                                <span className="text-[10px] text-muted-foreground mt-0.5">Institutional Data</span>
                            </Link>

                            <Link
                                href="/admin/users"
                                className="flex flex-col items-center justify-center p-3.5 rounded-lg border border-border/40 bg-card hover:border-primary/50 hover:bg-primary/5 transition-all text-center group"
                            >
                                <div className="h-9 w-9 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform mb-2">
                                    <ShieldCheck className="h-4 w-4" />
                                </div>
                                <span className="text-xs font-semibold text-foreground">Users & Roles</span>
                                <span className="text-[10px] text-muted-foreground mt-0.5">Security & Access</span>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

AdminDashboard.layout = (page: any) => <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>;