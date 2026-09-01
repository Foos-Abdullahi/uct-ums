import React from 'react';
import { Deferred, Head, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { MetricCard } from '@/components/tools/MetricCard';
import { MetricCardsSkeleton } from '@/components/tools/metric-cards-skeleton';
import { UctPanelCard } from '@/components/tools/uct-panel-card';
import type { BreadcrumbItem } from '@/types';
import {
    Settings,
    Server,
    Database,
    Shield,
    Globe,
    Building2,
    Calendar,
    Users,
    BookOpen,
    Save,
    CheckCircle2,
    Cpu,
} from 'lucide-react';
import { toast } from 'sonner';

interface ServerInfo {
    php_version: string;
    laravel_version: string;
    server_software: string;
    database_driver: string;
    database_name: string;
    cache_driver: string;
    queue_driver: string;
    timezone: string;
    environment: string;
    debug_mode: boolean;
}

interface AppConfig {
    institution_name: string;
    institution_motto: string;
    contact_email: string;
    contact_phone: string;
    campus_address: string;
    academic_year: string;
    current_term: string;
    student_registration_enabled: boolean;
    course_enrollment_open: boolean;
    maintenance_mode: boolean;
    late_fee_percentage: number;
}

interface AdminSystemIndexProps {
    server_info: ServerInfo;
    app_config: AppConfig;
    system_counts?: {
        total_users: number;
        total_students: number;
        total_lecturers: number;
        total_programs: number;
        total_courses: number;
        total_admissions: number;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/admin/dashboard' },
    { title: 'Settings', href: '/admin/settings/system' },
    { title: 'General Settings', href: '/admin/settings/system' },
];

export default function AdminSystemIndex({
    server_info,
    app_config,
    system_counts,
}: AdminSystemIndexProps) {
    const { data, setData, post, processing, errors } = useForm({
        institution_name: app_config.institution_name,
        institution_motto: app_config.institution_motto,
        contact_email: app_config.contact_email,
        contact_phone: app_config.contact_phone,
        campus_address: app_config.campus_address,
        academic_year: app_config.academic_year,
        current_term: app_config.current_term,
        student_registration_enabled: app_config.student_registration_enabled,
        course_enrollment_open: app_config.course_enrollment_open,
        maintenance_mode: app_config.maintenance_mode,
        late_fee_percentage: app_config.late_fee_percentage,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/settings/system', {
            preserveScroll: true,
            onSuccess: () => toast.success('System configuration saved successfully.'),
        });
    };

    return (
        <>
            <Head title="System Configuration & Server Diagnostics" />

            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h1 className="text-lg font-semibold text-foreground tracking-tight">
                            System & Institutional Configurations
                        </h1>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Manage institution metadata, portal enrollment locks, academic session dates, and server environment health.
                        </p>
                    </div>

                    <Button type="button" size="sm" onClick={handleSubmit} disabled={processing}>
                        <Save className="h-4 w-4 mr-1.5" />
                        {processing ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>

                {/* System Telemetry Metric Cards */}
                <Deferred data="system_counts" fallback={<MetricCardsSkeleton />}>
                    {system_counts && (
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:gap-4 lg:grid-cols-6 animate-in fade-in slide-in-from-top-6 duration-1000 ease-in-out">
                            <MetricCard
                                title="Total Accounts"
                                value={system_counts.total_users}
                                icon={Users}
                                color="primary"
                            />
                            <MetricCard
                                title="Enrolled Students"
                                value={system_counts.total_students}
                                icon={CheckCircle2}
                                color="success"
                            />
                            <MetricCard
                                title="Faculty Staff"
                                value={system_counts.total_lecturers}
                                icon={Shield}
                                color="info"
                            />
                            <MetricCard
                                title="Curriculum Degrees"
                                value={system_counts.total_programs}
                                icon={Building2}
                                color="accent"
                            />
                            <MetricCard
                                title="Catalog Courses"
                                value={system_counts.total_courses}
                                icon={BookOpen}
                                color="warning"
                            />
                            <MetricCard
                                title="Admissions Logged"
                                value={system_counts.total_admissions}
                                icon={Globe}
                                color="primary"
                            />
                        </div>
                    )}
                </Deferred>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left 2 Cols: Institution & Portal Configuration */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Institution Profile */}
                            <UctPanelCard
                                title="Institution Identity & Accreditation"
                                description="Official naming, branding, and contact details."
                                icon={Building2}
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                    <div className="space-y-1.5 md:col-span-2">
                                        <Label htmlFor="institution_name" className="text-xs font-semibold">
                                            Institution Full Name <span className="text-destructive">*</span>
                                        </Label>
                                        <Input
                                            id="institution_name"
                                            value={data.institution_name}
                                            onChange={(e) => setData('institution_name', e.target.value)}
                                            className="text-xs"
                                            required
                                        />
                                        {errors.institution_name && <p className="text-[11px] text-destructive">{errors.institution_name}</p>}
                                    </div>

                                    <div className="space-y-1.5 md:col-span-2">
                                        <Label htmlFor="institution_motto" className="text-xs font-semibold">
                                            Institutional Motto
                                        </Label>
                                        <Input
                                            id="institution_motto"
                                            value={data.institution_motto}
                                            onChange={(e) => setData('institution_motto', e.target.value)}
                                            className="text-xs"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="contact_email" className="text-xs font-semibold">
                                            Official Support Email <span className="text-destructive">*</span>
                                        </Label>
                                        <Input
                                            id="contact_email"
                                            type="email"
                                            value={data.contact_email}
                                            onChange={(e) => setData('contact_email', e.target.value)}
                                            className="text-xs"
                                            required
                                        />
                                        {errors.contact_email && <p className="text-[11px] text-destructive">{errors.contact_email}</p>}
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="contact_phone" className="text-xs font-semibold">
                                            Contact Telephone
                                        </Label>
                                        <Input
                                            id="contact_phone"
                                            value={data.contact_phone}
                                            onChange={(e) => setData('contact_phone', e.target.value)}
                                            className="text-xs"
                                        />
                                    </div>

                                    <div className="space-y-1.5 md:col-span-2">
                                        <Label htmlFor="campus_address" className="text-xs font-semibold">
                                            Campus Headquarters Location
                                        </Label>
                                        <Input
                                            id="campus_address"
                                            value={data.campus_address}
                                            onChange={(e) => setData('campus_address', e.target.value)}
                                            className="text-xs"
                                        />
                                    </div>
                                </div>
                            </UctPanelCard>

                            {/* Academic Session & Portal Controls */}
                            <UctPanelCard
                                title="Academic Session & Enrollment Locks"
                                description="Configure active term dates and public registration status."
                                icon={Calendar}
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="academic_year" className="text-xs font-semibold">
                                            Current Academic Year <span className="text-destructive">*</span>
                                        </Label>
                                        <Input
                                            id="academic_year"
                                            value={data.academic_year}
                                            onChange={(e) => setData('academic_year', e.target.value)}
                                            className="text-xs font-mono"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="current_term" className="text-xs font-semibold">
                                            Current Active Term <span className="text-destructive">*</span>
                                        </Label>
                                        <Input
                                            id="current_term"
                                            value={data.current_term}
                                            onChange={(e) => setData('current_term', e.target.value)}
                                            className="text-xs"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="late_fee_percentage" className="text-xs font-semibold">
                                            Late Payment Surcharge (%)
                                        </Label>
                                        <Input
                                            id="late_fee_percentage"
                                            type="number"
                                            min="0"
                                            max="50"
                                            value={data.late_fee_percentage}
                                            onChange={(e) => setData('late_fee_percentage', parseFloat(e.target.value) || 0)}
                                            className="text-xs"
                                        />
                                    </div>

                                    <div className="flex items-center gap-3 pt-6">
                                        <input
                                            type="checkbox"
                                            id="student_registration_enabled"
                                            checked={data.student_registration_enabled}
                                            onChange={(e) => setData('student_registration_enabled', e.target.checked)}
                                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                        />
                                        <Label htmlFor="student_registration_enabled" className="text-xs cursor-pointer">
                                            Enable Public Online Admissions
                                        </Label>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            id="course_enrollment_open"
                                            checked={data.course_enrollment_open}
                                            onChange={(e) => setData('course_enrollment_open', e.target.checked)}
                                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                        />
                                        <Label htmlFor="course_enrollment_open" className="text-xs cursor-pointer">
                                            Course Registration Window Open
                                        </Label>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            id="maintenance_mode"
                                            checked={data.maintenance_mode}
                                            onChange={(e) => setData('maintenance_mode', e.target.checked)}
                                            className="h-4 w-4 rounded border-gray-300 text-destructive focus:ring-destructive"
                                        />
                                        <Label htmlFor="maintenance_mode" className="text-xs cursor-pointer text-destructive font-semibold">
                                            System Maintenance Mode
                                        </Label>
                                    </div>
                                </div>
                            </UctPanelCard>
                        </div>

                        {/* Right Col: Server & Environment Diagnostics */}
                        <div className="space-y-6">
                            <UctPanelCard
                                title="Server & Runtime Environment"
                                description="Active host hardware and engine telemetry."
                                icon={Server}
                            >
                                <div className="divide-y divide-border/30 text-xs pt-1">
                                    <div className="flex justify-between py-2">
                                        <span className="text-muted-foreground">PHP Version</span>
                                        <Badge variant="outline" className="font-mono text-[11px] font-bold text-foreground">
                                            PHP {server_info.php_version}
                                        </Badge>
                                    </div>
                                    <div className="flex justify-between py-2">
                                        <span className="text-muted-foreground">Framework</span>
                                        <Badge variant="outline" className="font-mono text-[11px] font-bold text-foreground">
                                            Laravel {server_info.laravel_version}
                                        </Badge>
                                    </div>
                                    <div className="flex justify-between py-2">
                                        <span className="text-muted-foreground">Database Engine</span>
                                        <span className="font-mono text-foreground uppercase">{server_info.database_driver} ({server_info.database_name})</span>
                                    </div>
                                    <div className="flex justify-between py-2">
                                        <span className="text-muted-foreground">Web Server</span>
                                        <span className="text-foreground truncate max-w-[150px]">{server_info.server_software}</span>
                                    </div>
                                    <div className="flex justify-between py-2">
                                        <span className="text-muted-foreground">Cache Driver</span>
                                        <span className="font-mono text-foreground">{server_info.cache_driver}</span>
                                    </div>
                                    <div className="flex justify-between py-2">
                                        <span className="text-muted-foreground">Queue Driver</span>
                                        <span className="font-mono text-foreground">{server_info.queue_driver}</span>
                                    </div>
                                    <div className="flex justify-between py-2">
                                        <span className="text-muted-foreground">App Timezone</span>
                                        <span className="font-mono text-foreground">{server_info.timezone}</span>
                                    </div>
                                    <div className="flex justify-between py-2">
                                        <span className="text-muted-foreground">Environment</span>
                                        <Badge className="bg-emerald-500/10 text-emerald-700 text-[10px] uppercase">
                                            {server_info.environment}
                                        </Badge>
                                    </div>
                                </div>
                            </UctPanelCard>
                        </div>
                    </div>
                </form>
            </div>
        </>
    );
}

AdminSystemIndex.layout = { breadcrumbs };
