import React from 'react';
import { Deferred, Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { MetricCard } from '@/components/tools/MetricCard';
import { MetricCardsSkeleton } from '@/components/tools/metric-cards-skeleton';
import { UctPanelCard } from '@/components/tools/uct-panel-card';
import type { BreadcrumbItem } from '@/types';
import {
    Calendar,
    BookOpen,
    Users,
    GraduationCap,
    Clock,
    Layers,
    ArrowRight,
} from 'lucide-react';

export interface SemesterCourse {
    id: number;
    code: string;
    name: string;
    credit_hours: number;
    program_id: number;
    status: string;
    program?: {
        name: string;
        code: string | null;
    };
}

export interface SemesterData {
    semester_number: number;
    name: string;
    level: string;
    courses_count: number;
    students_count: number;
    total_credits: number;
    courses: SemesterCourse[];
}

export interface SemesterStats {
    total_semesters: number;
    active_cohorts: number;
    total_courses_offered: number;
    total_enrolled_students: number;
}

interface AdminSemestersIndexProps {
    stats?: SemesterStats;
    semesters: SemesterData[];
    programs: Array<{ id: number; name: string; code: string | null }>;
    filters: {
        program_id: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/admin/dashboard' },
    { title: 'Semesters Overview', href: '/admin/semesters' },
];

export default function AdminSemestersIndex({
    stats,
    semesters = [],
    programs = [],
    filters,
}: AdminSemestersIndexProps) {
    const handleProgramChange = (programId: string) => {
        router.get(
            '/admin/semesters',
            programId === 'all' ? {} : { program_id: programId },
            { preserveState: true, preserveScroll: true }
        );
    };

    return (
        <>
            <Head title="Semester Curricula & Cohorts" />

            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h1 className="text-lg font-semibold text-foreground tracking-tight">
                            Semester Overview & Cohort Distribution
                        </h1>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Track the 8-semester standard academic progression, active courses per semester term, and cohort student distribution.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Program Filter */}
                        <select
                            className="h-8 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                            value={filters.program_id || 'all'}
                            onChange={(e) => handleProgramChange(e.target.value)}
                        >
                            <option value="all">All Academic Programs</option>
                            {programs.map((p) => (
                                <option key={p.id} value={String(p.id)}>
                                    {p.name}
                                </option>
                            ))}
                        </select>

                        <Button variant="outline" size="sm" asChild>
                            <Link href="/admin/courses">
                                <BookOpen className="h-4 w-4 mr-1.5" />
                                All Courses
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Metric Cards */}
                <Deferred data="stats" fallback={<MetricCardsSkeleton />}>
                    {stats && (
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:gap-4 lg:grid-cols-4 animate-in fade-in slide-in-from-top-6 duration-1000 ease-in-out">
                            <MetricCard
                                title="Standard Terms"
                                value={`${stats.total_semesters} Semesters`}
                                icon={Calendar}
                                color="primary"
                            />
                            <MetricCard
                                title="Active Cohorts"
                                value={`${stats.active_cohorts} Cohorts`}
                                icon={Layers}
                                color="info"
                            />
                            <MetricCard
                                title="Courses Offered"
                                value={stats.total_courses_offered}
                                icon={BookOpen}
                                color="warning"
                            />
                            <MetricCard
                                title="Enrolled Students"
                                value={stats.total_enrolled_students}
                                icon={Users}
                                color="success"
                            />
                        </div>
                    )}
                </Deferred>

                {/* Semesters 1-8 Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {semesters.map((sem) => (
                        <UctPanelCard
                            key={sem.semester_number}
                            title={sem.name}
                            icon={Calendar}
                            badge={
                                <Badge variant="secondary" className="text-[10px] uppercase font-semibold">
                                    {sem.level}
                                </Badge>
                            }
                            description={`${sem.courses_count} Courses · ${sem.total_credits} Credits`}
                            actions={
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-1.5 text-xs text-muted-foreground hover:text-foreground"
                                    asChild
                                >
                                    <Link href={`/admin/courses?semester=${sem.semester_number}`}>
                                        <ArrowRight className="h-3.5 w-3.5" />
                                    </Link>
                                </Button>
                            }
                        >
                            <div className="space-y-3 pt-1">
                                {/* Quick Stats */}
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="rounded bg-muted/40 p-2 border border-border/40">
                                        <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Students</span>
                                        <span className="text-sm font-bold text-foreground">{sem.students_count} enrolled</span>
                                    </div>
                                    <div className="rounded bg-muted/40 p-2 border border-border/40">
                                        <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Workload</span>
                                        <span className="text-sm font-bold text-foreground">{sem.total_credits} CH</span>
                                    </div>
                                </div>

                                {/* Courses Preview */}
                                <div className="space-y-1.5 border-t border-border/40 pt-2">
                                    <p className="text-[10px] uppercase font-semibold text-muted-foreground">Curriculum Courses</p>
                                    {sem.courses.length === 0 ? (
                                        <p className="text-xs text-muted-foreground italic">No courses configured yet.</p>
                                    ) : (
                                        <div className="space-y-1">
                                            {sem.courses.slice(0, 4).map((c) => (
                                                <div
                                                    key={c.id}
                                                    className="flex items-center justify-between text-xs py-1 px-1.5 rounded bg-muted/20 hover:bg-muted/40 transition-colors"
                                                >
                                                    <div className="flex items-center gap-1.5 truncate">
                                                        <Badge variant="outline" className="font-mono text-[10px] px-1 py-0">
                                                            {c.code}
                                                        </Badge>
                                                        <span className="truncate text-foreground font-medium text-[11px]">{c.name}</span>
                                                    </div>
                                                    <span className="text-[10px] text-muted-foreground shrink-0 font-medium">{c.credit_hours} CH</span>
                                                </div>
                                            ))}
                                            {sem.courses.length > 4 && (
                                                <p className="text-[11px] text-muted-foreground text-center pt-0.5">
                                                    +{sem.courses.length - 4} more courses
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </UctPanelCard>
                    ))}
                </div>
            </div>
        </>
    );
}

AdminSemestersIndex.layout = { breadcrumbs };
