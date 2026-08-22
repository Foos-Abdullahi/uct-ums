import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Deferred } from '@inertiajs/react';
import { MetricCard } from '@/components/tools/MetricCard';
import { MetricCardsSkeleton } from '@/components/tools/metric-cards-skeleton';
import { UctPanelCard } from '@/components/tools/uct-panel-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
} from 'lucide-react';

interface DashboardStats {
    total_students: number;
    total_lecturers: number;
    total_courses: number;
    total_revenue: number;
    pending_applications: number;
    active_assignments: number;
}

interface DashboardProps {
    stats: DashboardStats;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/admin/dashboard' },
];

export default function AdminDashboard({ stats }: DashboardProps) {
    return (
        <>
            <Head title="Dashboard" />

            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-1">
                    <h1 className="text-lg font-semibold text-foreground tracking-tight">
                        Dashboard
                    </h1>
                    <p className="text-xs text-muted-foreground">
                        Overview of key metrics and recent activity across the university.
                    </p>
                </div>

                {/* Summary Metrics */}
                <Deferred data="stats" fallback={<MetricCardsSkeleton />}>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:gap-4 lg:grid-cols-3 xl:grid-cols-6 animate-in fade-in slide-in-from-top-6 duration-1000 ease-in-out">
                        <MetricCard
                            title="Total Students"
                            value={stats.total_students}
                            icon={Users}
                            color="primary"
                        />
                        <MetricCard
                            title="Lecturers"
                            value={stats.total_lecturers}
                            icon={GraduationCap}
                            color="info"
                        />
                        <MetricCard
                            title="Courses"
                            value={stats.total_courses}
                            icon={BookOpen}
                            color="success"
                        />
                        <MetricCard
                            title="Revenue"
                            value={`$${stats.total_revenue.toLocaleString()}`}
                            icon={DollarSign}
                            color="warning"
                        />
                        <MetricCard
                            title="Pending Applications"
                            value={stats.pending_applications}
                            icon={Clock}
                            color="destructive"
                        />
                        <MetricCard
                            title="Active Assignments"
                            value={stats.active_assignments}
                            icon={BarChart3}
                            color="info"
                        />
                    </div>
                </Deferred>

                {/* Quick Actions & Recent Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Quick Actions */}
                    <UctPanelCard
                        title="Quick Actions"
                        description="Common administrative tasks"
                        icon={UserPlus}
                        type="default"
                        className="lg:col-span-1"
                    >
                        <div className="flex flex-col gap-2">
                            <Button asChild variant="outline" size="sm" className="justify-start">
                                <Link href="/admin/students/create">
                                    <UserPlus className="h-4 w-4 mr-2" />
                                    Register New Student
                                </Link>
                            </Button>
                            <Button asChild variant="outline" size="sm" className="justify-start">
                                <Link href="/admin/lecturers/create">
                                    <GraduationCap className="h-4 w-4 mr-2" />
                                    Add Lecturer
                                </Link>
                            </Button>
                            <Button asChild variant="outline" size="sm" className="justify-start">
                                <Link href="/admin/assignments/create">
                                    <BookOpen className="h-4 w-4 mr-2" />
                                    Create Assignment
                                </Link>
                            </Button>
                            <Button asChild variant="outline" size="sm" className="justify-start">
                                <Link href="/admin/reports/overview">
                                    <FileText className="h-4 w-4 mr-2" />
                                    View Reports
                                </Link>
                            </Button>
                        </div>
                    </UctPanelCard>

                    {/* Recent Activity Placeholder */}
                    <Card className="lg:col-span-2 border-border/40 rounded-sm shadow-xs">
                        <CardHeader>
                            <CardTitle className="text-sm font-semibold">Recent Activity</CardTitle>
                            <p className="text-xs text-muted-foreground">Latest updates from across the system</p>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-start gap-3 border-b border-border/30 pb-3">
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                    <UserPlus className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium">New student registered</p>
                                    <p className="text-[11px] text-muted-foreground">Ali Hassan · 2 hours ago</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 border-b border-border/30 pb-3">
                                <div className="h-8 w-8 rounded-full bg-amber-500/10 flex items-center justify-center">
                                    <Clock className="h-4 w-4 text-amber-600" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium">Assignment pending approval</p>
                                    <p className="text-[11px] text-muted-foreground">CS101 · Dr. Ahmed · 5 hours ago</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                    <DollarSign className="h-4 w-4 text-emerald-600" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium">Payment received</p>
                                    <p className="text-[11px] text-muted-foreground">Student #435 · $1,200 · 1 day ago</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

AdminDashboard.layout = (page: any) => <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>;