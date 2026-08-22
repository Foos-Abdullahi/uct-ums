import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { BreadcrumbItem } from '@/types';
import { BarChart3, Users, BookOpen, Calendar, DollarSign, GraduationCap } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/admin/dashboard' },
    { title: 'Reports', href: '/admin/reports' },
];

const reports = [
    { title: 'Overview', href: '/admin/reports/overview', icon: BarChart3, description: 'High-level summary of all metrics.' },
    { title: 'Students', href: '/admin/reports/students', icon: Users, description: 'Enrolment, demographics, and status.' },
    { title: 'Academic', href: '/admin/reports/academic', icon: BookOpen, description: 'Course performance and GPA trends.' },
    { title: 'Attendance', href: '/admin/reports/attendance', icon: Calendar, description: 'Attendance rates and patterns.' },
    { title: 'Finance', href: '/admin/reports/finance', icon: DollarSign, description: 'Revenue, payments, and outstanding fees.' },
    { title: 'Graduation', href: '/admin/reports/graduation', icon: GraduationCap, description: 'Graduation statistics and certificates.' },
];

export default function ReportsIndex() {
    return (
        <>
            <Head title="Reports" />
            <div className="p-6 space-y-6">
                <div>
                    <h1 className="text-lg font-semibold text-foreground tracking-tight">Reports</h1>
                    <p className="text-xs text-muted-foreground">Select a report to view detailed analytics.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {reports.map((report) => (
                        <Card key={report.href} className="border-border/40 hover:border-primary/50 transition-colors">
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <report.icon className="h-5 w-5 text-primary" />
                                    <CardTitle className="text-sm font-semibold">{report.title}</CardTitle>
                                </div>
                                <CardDescription className="text-xs">{report.description}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button asChild variant="outline" size="sm" className="w-full">
                                    <Link href={report.href}>View Report</Link>
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </>
    );
}

ReportsIndex.layout = (page: any) => <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>;