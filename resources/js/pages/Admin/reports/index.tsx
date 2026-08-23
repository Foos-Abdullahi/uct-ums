import React from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Deferred } from '@inertiajs/react';
import { MetricCard } from '@/components/tools/MetricCard';
import { MetricCardsSkeleton } from '@/components/tools/metric-cards-skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { BreadcrumbItem } from '@/types';
import {
    Users, GraduationCap, BookOpen, DollarSign, Clock,
    BarChart3, Award, Layers, UserCheck, TrendingUp,
    CreditCard, CheckCircle2, XCircle,
} from 'lucide-react';

interface Kpis {
    total_students: number;
    active_students: number;
    graduated_students: number;
    pending_students: number;
    suspended_students: number;
    withdrawn_students: number;
    total_lecturers: number;
    active_lecturers: number;
    total_courses: number;
    active_courses: number;
    total_programs: number;
    total_assignments: number;
    active_assignments: number;
    total_admissions: number;
    pending_admissions: number;
    approved_admissions: number;
    rejected_admissions: number;
    total_invoiced: number;
    total_collected: number;
    total_outstanding: number;
    collection_rate: number;
    total_certificates: number;
}

interface ProgramData {
    id: number;
    name: string;
    short_name: string;
    level: string;
    students_count: number;
    courses_count: number;
}

interface AdmissionPipeline {
    status: string;
    label: string;
    total: number;
}

interface PaymentByMethod {
    method: string;
    label: string;
    transactions: number;
    total: number;
}

interface AssignmentByRole {
    role: string;
    label: string;
    total: number;
}

interface SemesterCohort {
    semester: string;
    total: number;
}

interface RecentPayment {
    id: number;
    amount: number;
    method: string;
    date: string;
    student_name: string;
    matric_no: string;
    reference_no: string;
}

interface TopStudent {
    name: string;
    matric_no: string;
    program: string;
    gpa: number;
    courses_taken: number;
}

interface ReportsIndexProps {
    kpis?: Kpis;
    programs_data?: ProgramData[];
    admissions_pipeline?: AdmissionPipeline[];
    payments_by_method?: PaymentByMethod[];
    assignments_by_role?: AssignmentByRole[];
    semester_cohorts?: SemesterCohort[];
    recent_payments?: RecentPayment[];
    top_students?: TopStudent[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/admin/dashboard' },
    { title: 'Reports & Analytics', href: '/admin/reports' },
];

const fmt = (n?: number) => `$${(n ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const num = (n?: number) => (n ?? 0).toLocaleString();

// Bar chart using CSS widths
function BarChart({
    data,
    labelKey,
    valueKey,
    colorClass = 'bg-primary',
    formatValue,
}: {
    data: Record<string, any>[];
    labelKey: string;
    valueKey: string;
    colorClass?: string;
    formatValue?: (v: number) => string;
}) {
    const max = Math.max(...data.map((d) => Number(d[valueKey]) || 0), 1);
    return (
        <div className="space-y-2.5">
            {data.map((row, i) => {
                const val = Number(row[valueKey]) || 0;
                const pct = Math.round((val / max) * 100);
                return (
                    <div key={i} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-foreground font-medium truncate max-w-[60%]">{row[labelKey]}</span>
                            <span className="text-muted-foreground font-semibold shrink-0 ml-2">
                                {formatValue ? formatValue(val) : val.toLocaleString()}
                            </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                            <div
                                style={{ width: `${pct}%` }}
                                className={`h-full rounded-full transition-all duration-700 ${colorClass}`}
                            />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// Donut-style ring chart using SVG
function DonutChart({ segments, size = 120 }: { segments: { label: string; value: number; color: string }[]; size?: number }) {
    const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
    const r = 42;
    const cx = size / 2;
    const cy = size / 2;
    const circumference = 2 * Math.PI * r;
    let offset = 0;

    return (
        <div className="flex items-center gap-4">
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
                <circle cx={cx} cy={cy} r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="14" />
                {segments.map((seg, i) => {
                    const dashLen = (seg.value / total) * circumference;
                    const dashGap = circumference - dashLen;
                    const el = (
                        <circle
                            key={i}
                            cx={cx} cy={cy} r={r}
                            fill="none"
                            stroke={seg.color}
                            strokeWidth="14"
                            strokeDasharray={`${dashLen} ${dashGap}`}
                            strokeDashoffset={-offset}
                            className="transition-all duration-700"
                        />
                    );
                    offset += dashLen;
                    return el;
                })}
                <text x={cx} y={cy} textAnchor="middle" dy="0.35em" className="rotate-90" style={{ fontSize: 14, fill: 'currentColor', fontWeight: 700 }}>
                    {total}
                </text>
            </svg>
            <div className="space-y-1.5 min-w-0">
                {segments.map((seg, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs">
                        <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: seg.color }} />
                        <span className="text-muted-foreground truncate">{seg.label}</span>
                        <span className="font-semibold text-foreground ml-auto pl-2">{seg.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function ReportsIndex({
    kpis,
    programs_data = [],
    admissions_pipeline = [],
    payments_by_method = [],
    assignments_by_role = [],
    semester_cohorts = [],
    recent_payments = [],
    top_students = [],
}: ReportsIndexProps) {

    const studentSegments = kpis
        ? [
              { label: 'Enrolled', value: kpis.active_students, color: '#22c55e' },
              { label: 'Pending', value: kpis.pending_students, color: '#f59e0b' },
              { label: 'Graduated', value: kpis.graduated_students, color: '#3b82f6' },
              { label: 'Suspended', value: kpis.suspended_students, color: '#ef4444' },
              { label: 'Withdrawn', value: kpis.withdrawn_students, color: '#6b7280' },
          ]
        : [];

    return (
        <>
            <Head title="Reports & Analytics" />

            <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">

                {/* ── Header ──────────────────────────────────────────────── */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-primary" />
                            Institutional Analytics & Reports
                        </h1>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Comprehensive overview of all university operations — students, academics, admissions, and finances.
                        </p>
                    </div>
                    <Badge variant="outline" className="self-start text-xs px-2 py-1 bg-primary/5 border-primary/20 text-primary">
                        2026/2027 Academic Session
                    </Badge>
                </div>

                {/* ── Section 1: Core KPI Ribbon ───────────────────────────── */}
                <Deferred data="kpis" fallback={<MetricCardsSkeleton count={8} />}>
                    {kpis && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-in fade-in slide-in-from-top-4 duration-700">
                            <MetricCard title="Total Students" value={num(kpis.total_students)} icon={Users} color="primary" trend={`${num(kpis.active_students)} enrolled`} />
                            <MetricCard title="Academic Faculty" value={num(kpis.total_lecturers)} icon={GraduationCap} color="info" trend={`${num(kpis.active_lecturers)} active`} />
                            <MetricCard title="Courses Offered" value={num(kpis.total_courses)} icon={BookOpen} color="success" trend={`${num(kpis.active_courses)} active`} />
                            <MetricCard title="Total Collected" value={fmt(kpis.total_collected)} icon={DollarSign} color="warning" trend={`${kpis.collection_rate}% rate`} />
                            <MetricCard title="Outstanding Fees" value={fmt(kpis.total_outstanding)} icon={CreditCard} color="destructive" trend="Pending clearance" />
                            <MetricCard title="Pending Admissions" value={num(kpis.pending_admissions)} icon={Clock} color="warning" trend={`${num(kpis.total_admissions)} total`} />
                            <MetricCard title="Course Sections" value={num(kpis.active_assignments)} icon={TrendingUp} color="info" trend={`${num(kpis.total_assignments)} total`} />
                            <MetricCard title="Graduated Alumni" value={num(kpis.graduated_students)} icon={Award} color="primary" trend={`${num(kpis.total_certificates)} certs issued`} />
                        </div>
                    )}
                </Deferred>

                {/* ── Section 2: Student & Finance Charts (3-col) ──────────── */}
                <Deferred data="kpis" fallback={<div className="h-52 rounded-xl bg-card border border-border animate-pulse" />}>
                    {kpis && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                            {/* Student status donut */}
                            <Card className="border-border/60 shadow-xs">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                        <Users className="h-4 w-4 text-primary" />
                                        Student Status
                                    </CardTitle>
                                    <CardDescription className="text-xs">Enrolment lifecycle breakdown</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <DonutChart segments={studentSegments} size={110} />
                                </CardContent>
                            </Card>

                            {/* Fee collection progress */}
                            <Card className="border-border/60 shadow-xs">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                        <DollarSign className="h-4 w-4 text-emerald-600" />
                                        Fee Collection Health
                                    </CardTitle>
                                    <CardDescription className="text-xs">Invoiced vs collected vs outstanding</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-muted-foreground">Collection Rate</span>
                                            <span className="font-semibold text-emerald-600">{kpis.collection_rate}%</span>
                                        </div>
                                        <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
                                            <div style={{ width: `${Math.min(100, kpis.collection_rate)}%` }} className="h-full bg-emerald-500 rounded-full" />
                                        </div>
                                    </div>
                                    <div className="space-y-2 text-xs">
                                        <div className="flex justify-between p-2 rounded bg-muted/40">
                                            <span className="text-muted-foreground">Total Invoiced</span>
                                            <span className="font-semibold">{fmt(kpis.total_invoiced)}</span>
                                        </div>
                                        <div className="flex justify-between p-2 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                                            <span>Collected</span>
                                            <span className="font-semibold">{fmt(kpis.total_collected)}</span>
                                        </div>
                                        <div className="flex justify-between p-2 rounded bg-destructive/10 text-destructive">
                                            <span>Outstanding</span>
                                            <span className="font-semibold">{fmt(kpis.total_outstanding)}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Admissions pipeline donut */}
                            <Deferred data="admissions_pipeline" fallback={<Card className="border-border/60 shadow-xs h-full animate-pulse" />}>
                                <Card className="border-border/60 shadow-xs">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                            <Layers className="h-4 w-4 text-sky-600" />
                                            Admissions Pipeline
                                        </CardTitle>
                                        <CardDescription className="text-xs">Applicant status breakdown</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {admissions_pipeline.length > 0 ? (
                                            <DonutChart
                                                size={110}
                                                segments={admissions_pipeline.map((a) => ({
                                                    label: a.label,
                                                    value: a.total,
                                                    color: a.status === 'approved' ? '#22c55e'
                                                         : a.status === 'pending' ? '#f59e0b'
                                                         : a.status === 'rejected' ? '#ef4444'
                                                         : '#3b82f6',
                                                }))}
                                            />
                                        ) : (
                                            <p className="text-xs text-muted-foreground text-center py-6">No admissions data</p>
                                        )}
                                    </CardContent>
                                </Card>
                            </Deferred>
                        </div>
                    )}
                </Deferred>

                {/* ── Section 3: Academic Program Distribution ─────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    <Deferred data="programs_data" fallback={<div className="h-52 rounded-xl bg-card border border-border animate-pulse" />}>
                        <Card className="border-border/60 shadow-xs">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                    <BookOpen className="h-4 w-4 text-primary" />
                                    Programs by Student Enrolment
                                </CardTitle>
                                <CardDescription className="text-xs">Ranked bar chart of student volume per program</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {programs_data.length > 0 ? (
                                    <BarChart
                                        data={programs_data}
                                        labelKey="short_name"
                                        valueKey="students_count"
                                        colorClass="bg-primary"
                                    />
                                ) : (
                                    <p className="text-xs text-muted-foreground text-center py-6">No program data</p>
                                )}
                            </CardContent>
                        </Card>
                    </Deferred>

                    <Deferred data="semester_cohorts" fallback={<div className="h-52 rounded-xl bg-card border border-border animate-pulse" />}>
                        <Card className="border-border/60 shadow-xs">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                    <GraduationCap className="h-4 w-4 text-primary" />
                                    Active Cohort by Semester
                                </CardTitle>
                                <CardDescription className="text-xs">Students grouped by current semester progression</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {semester_cohorts.length > 0 ? (
                                    <BarChart
                                        data={semester_cohorts}
                                        labelKey="semester"
                                        valueKey="total"
                                        colorClass="bg-sky-500"
                                    />
                                ) : (
                                    <p className="text-xs text-muted-foreground text-center py-6">No cohort data recorded yet</p>
                                )}
                            </CardContent>
                        </Card>
                    </Deferred>
                </div>

                {/* ── Section 4: Faculty & Finance Distribution ────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    <Deferred data="assignments_by_role" fallback={<div className="h-52 rounded-xl bg-card border border-border animate-pulse" />}>
                        <Card className="border-border/60 shadow-xs">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                    <UserCheck className="h-4 w-4 text-indigo-600" />
                                    Teaching Workload by Role
                                </CardTitle>
                                <CardDescription className="text-xs">How course sections are distributed across lecturer roles</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {assignments_by_role.length > 0 ? (
                                    <BarChart
                                        data={assignments_by_role}
                                        labelKey="label"
                                        valueKey="total"
                                        colorClass="bg-indigo-500"
                                    />
                                ) : (
                                    <p className="text-xs text-muted-foreground text-center py-6">No assignment data</p>
                                )}
                            </CardContent>
                        </Card>
                    </Deferred>

                    <Deferred data="payments_by_method" fallback={<div className="h-52 rounded-xl bg-card border border-border animate-pulse" />}>
                        <Card className="border-border/60 shadow-xs">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                    <CreditCard className="h-4 w-4 text-emerald-600" />
                                    Payment Methods Breakdown
                                </CardTitle>
                                <CardDescription className="text-xs">Revenue volume collected per payment channel</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {payments_by_method.length > 0 ? (
                                    <BarChart
                                        data={payments_by_method}
                                        labelKey="label"
                                        valueKey="total"
                                        colorClass="bg-emerald-500"
                                        formatValue={(v) => fmt(v)}
                                    />
                                ) : (
                                    <p className="text-xs text-muted-foreground text-center py-6">No payment data recorded yet</p>
                                )}
                            </CardContent>
                        </Card>
                    </Deferred>
                </div>

                {/* ── Section 5: Live Data Feeds ────────────────────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Recent payments feed */}
                    <Deferred data="recent_payments" fallback={<div className="h-52 rounded-xl bg-card border border-border animate-pulse" />}>
                        <Card className="border-border/60 shadow-xs">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                    <DollarSign className="h-4 w-4 text-emerald-600" />
                                    Recent Payments
                                </CardTitle>
                                <CardDescription className="text-xs">Latest cleared fee transactions</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {recent_payments.length === 0 ? (
                                    <p className="text-xs text-muted-foreground text-center py-6">No payments recorded yet</p>
                                ) : (
                                    <div className="space-y-2">
                                        {recent_payments.map((p) => (
                                            <div key={p.id} className="flex items-center justify-between p-2.5 rounded-lg border border-border/40 hover:bg-muted/30 transition-colors">
                                                <div className="min-w-0">
                                                    <p className="text-xs font-semibold text-foreground truncate">{p.student_name}</p>
                                                    <p className="text-[11px] text-muted-foreground font-mono">{p.matric_no} · {p.method}</p>
                                                </div>
                                                <div className="text-right shrink-0 ml-3">
                                                    <p className="text-xs font-bold text-emerald-600">{fmt(p.amount)}</p>
                                                    <p className="text-[10px] text-muted-foreground">{p.date}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </Deferred>

                    {/* Top students by GPA */}
                    <Deferred data="top_students" fallback={<div className="h-52 rounded-xl bg-card border border-border animate-pulse" />}>
                        <Card className="border-border/60 shadow-xs">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                    <Award className="h-4 w-4 text-amber-500" />
                                    Top Students by GPA
                                </CardTitle>
                                <CardDescription className="text-xs">Highest average grade points across recorded courses</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {top_students.length === 0 ? (
                                    <p className="text-xs text-muted-foreground text-center py-6">No grade data available yet</p>
                                ) : (
                                    <div className="space-y-2">
                                        {top_students.map((s, i) => (
                                            <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg border border-border/40 hover:bg-muted/30 transition-colors">
                                                <div className="h-7 w-7 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center text-xs font-bold shrink-0">
                                                    {i + 1}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-xs font-semibold text-foreground truncate">{s.name}</p>
                                                    <p className="text-[11px] text-muted-foreground truncate">{s.program}</p>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <p className="text-xs font-bold text-amber-600">{s.gpa.toFixed(2)} GPA</p>
                                                    <p className="text-[10px] text-muted-foreground">{s.courses_taken} courses</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </Deferred>
                </div>

                {/* ── Section 6: Program Detail Table ──────────────────────── */}
                <Deferred data="programs_data" fallback={<div className="h-40 rounded-xl bg-card border border-border animate-pulse" />}>
                    {programs_data.length > 0 && (
                        <Card className="border-border/60 shadow-xs">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                    <BookOpen className="h-4 w-4 text-primary" />
                                    Academic Programs Summary
                                </CardTitle>
                                <CardDescription className="text-xs">Full program list with students and courses data</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs">
                                        <thead>
                                            <tr className="border-b border-border/40">
                                                <th className="text-left py-2 px-3 text-muted-foreground font-medium">Program</th>
                                                <th className="text-left py-2 px-3 text-muted-foreground font-medium">Level</th>
                                                <th className="text-right py-2 px-3 text-muted-foreground font-medium">Students</th>
                                                <th className="text-right py-2 px-3 text-muted-foreground font-medium">Courses</th>
                                                <th className="text-right py-2 px-3 text-muted-foreground font-medium">Enrolment Bar</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {programs_data.map((p) => {
                                                const maxStudents = Math.max(...programs_data.map((x) => x.students_count), 1);
                                                const pct = Math.round((p.students_count / maxStudents) * 100);
                                                return (
                                                    <tr key={p.id} className="border-b border-border/20 hover:bg-muted/20 transition-colors">
                                                        <td className="py-2.5 px-3 font-medium text-foreground">{p.short_name}</td>
                                                        <td className="py-2.5 px-3">
                                                            <Badge variant="outline" className="text-[10px]">{p.level}</Badge>
                                                        </td>
                                                        <td className="py-2.5 px-3 text-right font-semibold">{p.students_count}</td>
                                                        <td className="py-2.5 px-3 text-right text-muted-foreground">{p.courses_count}</td>
                                                        <td className="py-2.5 px-3 w-32">
                                                            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                                                                <div style={{ width: `${pct}%` }} className="h-full bg-primary rounded-full" />
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </Deferred>

            </div>
        </>
    );
}

ReportsIndex.layout = (page: any) => <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>;