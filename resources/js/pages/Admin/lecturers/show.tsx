import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { LecturerStatusBadge } from './components/lecturer-status-badge';
import { UctPanelCard } from '@/components/tools/uct-panel-card';
import type { Lecturer } from '@/types/lecturer';
import {
    ArrowLeft,
    Edit3,
    KeyRound,
    Ban,
    CheckCircle2,
    BookOpen,
    User,
    Shield,
    Briefcase,
    MapPin,
    FileText,
    GraduationCap,
    Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import ResetPasswordModal from '@/components/tools/reset-password-modal';

interface AdminLecturersShowProps {
    lecturer: Lecturer;
}

export default function AdminLecturersShow({ lecturer }: AdminLecturersShowProps) {
    const [passwordModalOpen, setPasswordModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleteProcessing, setDeleteProcessing] = useState(false);

    const name = lecturer.user?.name ?? 'Unknown Lecturer';
    const initials = name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();

    const isInactive = lecturer.employment_status === 'inactive' || lecturer.employment_status === 'terminated';

    const handleToggleStatus = () => {
        router.post(
            `/admin/lecturers/${lecturer.id}/toggle-status`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(isInactive ? 'Lecturer activated.' : 'Lecturer deactivated.');
                },
                onError: () => toast.error('Failed to change status.'),
            }
        );
    };

    const confirmDelete = () => {
        setDeleteProcessing(true);
        router.delete(`/admin/lecturers/${lecturer.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Lecturer record deleted.');
                router.visit('/admin/lecturers');
            },
            onError: () => {
                toast.error('Failed to delete lecturer.');
                setDeleteProcessing(false);
            },
        });
    };

    return (
        <>
            <Head title={`Lecturer - ${name}`} />

            <div className="p-6 space-y-6">
                {/* Profile Header Banner */}
                <UctPanelCard
                    type="default"
                    className="overflow-hidden"
                    title={
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3.5">
                            <Avatar className="h-14 w-14 border-2 border-primary/20 shrink-0">
                                <AvatarFallback className="bg-primary/10 text-base font-bold text-primary">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>

                            <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-lg font-bold text-foreground tracking-tight">{name}</span>
                                    <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-muted text-foreground border border-border/60">
                                        {lecturer.lecturer_no}
                                    </span>
                                    <LecturerStatusBadge status={lecturer.employment_status} />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {lecturer.designation ? `${lecturer.designation} • ` : ''}{lecturer.department}
                                </p>
                            </div>
                        </div>
                    }
                    actions={
                        <div className="flex flex-wrap items-center gap-2">
                            <Button
                                variant={isInactive ? 'outline' : 'secondary'}
                                size="sm"
                                onClick={handleToggleStatus}
                            >
                                {isInactive ? (
                                    <>
                                        <CheckCircle2 className="h-3.5 w-3.5 mr-1.5 text-emerald-600" />
                                        Activate
                                    </>
                                ) : (
                                    <>
                                        <Ban className="h-3.5 w-3.5 mr-1.5" />
                                        Deactivate
                                    </>
                                )}
                            </Button>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPasswordModalOpen(true)}
                            >
                                <KeyRound className="h-3.5 w-3.5 mr-1.5" />
                                Password
                            </Button>

                            <Button size="sm" asChild>
                                <Link href={`/admin/lecturers/${lecturer.id}/edit`}>
                                    <Edit3 className="h-3.5 w-3.5 mr-1.5" />
                                    Edit Lecturer
                                </Link>
                            </Button>

                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => setDeleteModalOpen(true)}
                            >
                                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                                Delete
                            </Button>
                        </div>
                    }
                />

                {/* Tabs */}
                <Tabs defaultValue="overview" className="space-y-4">
                    <TabsList className="bg-muted/60 p-1 rounded-sm border border-border/40 flex-wrap h-auto">
                        <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
                        <TabsTrigger value="employment" className="text-xs">Employment</TabsTrigger>
                        <TabsTrigger value="qualifications" className="text-xs">Qualifications</TabsTrigger>
                        <TabsTrigger value="documents" className="text-xs">Documents</TabsTrigger>
                        <TabsTrigger value="account" className="text-xs">Account</TabsTrigger>
                    </TabsList>

                    {/* Tab 1: Overview */}
                    <TabsContent value="overview" className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <UctPanelCard
                                title="Personal Information"
                                description="Contact details, staff ID, and identity."
                                icon={User}
                                type="default"
                            >
                                <div className="divide-y divide-border/30 text-xs">
                                    <div className="flex justify-between py-2">
                                        <span className="text-muted-foreground">Full Name</span>
                                        <span className="font-medium text-foreground">{name}</span>
                                    </div>
                                    <div className="flex justify-between py-2">
                                        <span className="text-muted-foreground">Staff ID</span>
                                        <span className="font-mono font-medium text-foreground">{lecturer.lecturer_no}</span>
                                    </div>
                                    <div className="flex justify-between py-2">
                                        <span className="text-muted-foreground">Email</span>
                                        <span className="font-medium text-foreground">{lecturer.user?.email}</span>
                                    </div>
                                    <div className="flex justify-between py-2">
                                        <span className="text-muted-foreground">Phone</span>
                                        <span className="font-medium text-foreground">{lecturer.phone || '—'}</span>
                                    </div>
                                    <div className="flex justify-between py-2">
                                        <span className="text-muted-foreground">Gender</span>
                                        <span className="font-medium text-foreground">{lecturer.gender || '—'}</span>
                                    </div>
                                    <div className="flex justify-between py-2">
                                        <span className="text-muted-foreground">Date of Birth</span>
                                        <span className="font-medium text-foreground">{lecturer.date_of_birth ? String(lecturer.date_of_birth).split('T')[0] : '—'}</span>
                                    </div>
                                    <div className="flex justify-between py-2">
                                        <span className="text-muted-foreground">Address</span>
                                        <span className="font-medium text-foreground text-right">{lecturer.address || '—'}</span>
                                    </div>
                                </div>
                            </UctPanelCard>

                            <UctPanelCard
                                title="Professional Summary"
                                description="Department, faculty, designation, and employment status."
                                icon={Briefcase}
                                type="default"
                            >
                                <div className="divide-y divide-border/30 text-xs">
                                    <div className="flex justify-between py-2">
                                        <span className="text-muted-foreground">Department</span>
                                        <span className="font-medium text-foreground">{lecturer.department}</span>
                                    </div>
                                    <div className="flex justify-between py-2">
                                        <span className="text-muted-foreground">Faculty</span>
                                        <span className="font-medium text-foreground">{lecturer.faculty}</span>
                                    </div>
                                    <div className="flex justify-between py-2">
                                        <span className="text-muted-foreground">Designation</span>
                                        <span className="font-medium text-foreground">{lecturer.designation}</span>
                                    </div>
                                    <div className="flex justify-between py-2">
                                        <span className="text-muted-foreground">Employment Status</span>
                                        <LecturerStatusBadge status={lecturer.employment_status} />
                                    </div>
                                    <div className="flex justify-between py-2">
                                        <span className="text-muted-foreground">Contract Type</span>
                                        <span className="font-medium capitalize text-foreground">{lecturer.contract_type?.replace('_', ' ') || '—'}</span>
                                    </div>
                                    <div className="flex justify-between py-2">
                                        <span className="text-muted-foreground">Hire Date</span>
                                        <span className="font-medium text-foreground">{lecturer.hire_date ? String(lecturer.hire_date).split('T')[0] : '—'}</span>
                                    </div>
                                    <div className="flex justify-between py-2">
                                        <span className="text-muted-foreground">Office Location</span>
                                        <span className="font-medium text-foreground">{lecturer.office_location || '—'}</span>
                                    </div>
                                </div>
                            </UctPanelCard>
                        </div>

                        {/* Bio */}
                        {lecturer.bio && (
                            <UctPanelCard
                                title="Biography"
                                description="Academic background, research interests, and teaching experience."
                                icon={FileText}
                                type="default"
                            >
                                <p className="text-xs text-foreground whitespace-pre-wrap">{lecturer.bio}</p>
                            </UctPanelCard>
                        )}
                    </TabsContent>

                    {/* Tab 2: Employment */}
                    <TabsContent value="employment" className="space-y-4">
                        <UctPanelCard
                            title="Employment Details"
                            description="Contract, status, and office assignments."
                            icon={Briefcase}
                            type="default"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                                <div className="space-y-2">
                                    <p className="text-muted-foreground">Employment Status</p>
                                    <LecturerStatusBadge status={lecturer.employment_status} />
                                </div>
                                <div className="space-y-2">
                                    <p className="text-muted-foreground">Contract Type</p>
                                    <p className="font-medium capitalize">{lecturer.contract_type?.replace('_', ' ') || '—'}</p>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-muted-foreground">Hire Date</p>
                                    <p className="font-medium">{lecturer.hire_date ? String(lecturer.hire_date).split('T')[0] : '—'}</p>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-muted-foreground">Office Location</p>
                                    <p className="font-medium">{lecturer.office_location || '—'}</p>
                                </div>
                            </div>
                        </UctPanelCard>
                    </TabsContent>

                    {/* Tab 3: Qualifications */}
                    <TabsContent value="qualifications" className="space-y-4">
                        <UctPanelCard
                            title="Academic & Professional Qualifications"
                            description="Highest qualification, specialization, and research areas."
                            icon={GraduationCap}
                            type="default"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                                <div className="space-y-2">
                                    <p className="text-muted-foreground">Highest Qualification</p>
                                    <p className="font-medium">{lecturer.qualification || '—'}</p>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-muted-foreground">Specialization / Research Area</p>
                                    <p className="font-medium">{lecturer.specialization || '—'}</p>
                                </div>
                            </div>
                        </UctPanelCard>
                    </TabsContent>

                    {/* Tab 4: Documents */}
                    <TabsContent value="documents" className="space-y-4">
                        <UctPanelCard
                            title="Documents & Attachments"
                            description="Uploaded documents (CV, certificates, contracts, etc.)"
                            icon={FileText}
                            type="default"
                        >
                            {/* You can add a document management section similar to student's tab */}
                            <div className="py-8 text-center text-xs text-muted-foreground border border-dashed border-border rounded-md bg-muted/20">
                                <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                                Document management coming soon.
                            </div>
                        </UctPanelCard>
                    </TabsContent>

                    {/* Tab 5: Account */}
                    <TabsContent value="account" className="space-y-4">
                        <UctPanelCard
                            title="User Authentication & Account Security"
                            description="Manage login credentials and security controls."
                            icon={Shield}
                            type="default"
                        >
                            <div className="space-y-4 text-xs">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-3 bg-muted/30 rounded border border-border/40 space-y-2">
                                        <p className="text-muted-foreground">Login Email</p>
                                        <p className="font-semibold text-foreground">{lecturer.user?.email}</p>
                                    </div>
                                    <div className="p-3 bg-muted/30 rounded border border-border/40 space-y-2">
                                        <p className="text-muted-foreground">Account Status</p>
                                        <div className="flex items-center gap-2">
                                            {isInactive ? (
                                                <Badge variant="destructive">Account Inactive</Badge>
                                            ) : (
                                                <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600">
                                                    Active & Unlocked
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-border/30 flex flex-wrap items-center gap-3">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setPasswordModalOpen(true)}
                                    >
                                        <KeyRound className="h-3.5 w-3.5 mr-1.5" />
                                        Reset Lecturer Password
                                    </Button>

                                    <Button
                                        size="sm"
                                        variant={isInactive ? 'outline' : 'destructive'}
                                        onClick={handleToggleStatus}
                                    >
                                        {isInactive ? (
                                            <>
                                                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5 text-emerald-600" />
                                                Re-activate Account
                                            </>
                                        ) : (
                                            <>
                                                <Ban className="h-3.5 w-3.5 mr-1.5" />
                                                Deactivate Account
                                            </>
                                        )}
                                    </Button>

                                    <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => setDeleteModalOpen(true)}
                                    >
                                        <Ban className="h-3.5 w-3.5 mr-1.5" />
                                        Delete Record
                                    </Button>
                                </div>
                            </div>
                        </UctPanelCard>
                    </TabsContent>
                </Tabs>

                {/* Modals */}
                <ResetPasswordModal
                    open={passwordModalOpen}
                    onOpenChange={setPasswordModalOpen}
                    user={{
                        id: lecturer.user_id,
                        name: lecturer.user?.name ?? '',
                        email: lecturer.user?.email ?? '',
                    }}
                />

                <ConfirmDeleteDialog
                    open={deleteModalOpen}
                    onOpenChange={setDeleteModalOpen}
                    title="Delete Lecturer Record"
                    description="Are you sure you want to permanently delete this lecturer record? This action cannot be undone."
                    itemName={`${name} (${lecturer.lecturer_no})`}
                    loading={deleteProcessing}
                    onConfirm={confirmDelete}
                />
            </div>
        </>
    );
}

AdminLecturersShow.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/admin/dashboard' },
        { title: 'Lecturers', href: '/admin/lecturers' },
    ],
};