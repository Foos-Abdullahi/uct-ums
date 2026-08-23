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
import { AssignmentStatusBadge } from './components/assignment-status-badge';
import { AssignmentRoleBadge } from './components/assignment-role-badge';
import { UctPanelCard } from '@/components/tools/uct-panel-card';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import type { CourseAssignment } from './components/assignment';
import {
    ArrowLeft,
    Edit3,
    Trash2,
    User,
    BookOpen,
    Calendar,
    Clock,
    MapPin,
    FileText,
    CheckCircle2,
    XCircle,
    RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

interface AdminAssignmentsShowProps {
    assignment: CourseAssignment;
}

export default function AdminAssignmentsShow({ assignment }: AdminAssignmentsShowProps) {
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleteProcessing, setDeleteProcessing] = useState(false);
    const [statusUpdating, setStatusUpdating] = useState(false);

    const lecturerName = assignment.lecturer?.user?.name ?? 'Unknown';
    const courseCode = assignment.course?.code ?? 'N/A';
    const courseName = assignment.course?.name ?? '';

    const handleStatusChange = (newStatus: string) => {
        setStatusUpdating(true);
        router.patch(
            `/admin/assignments/${assignment.id}/status`,
            { status: newStatus },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(`Status updated to ${newStatus}.`);
                    setStatusUpdating(false);
                },
                onError: () => {
                    toast.error('Failed to update status.');
                    setStatusUpdating(false);
                },
            }
        );
    };

    const confirmDelete = () => {
        setDeleteProcessing(true);
        router.delete(`/admin/assignments/${assignment.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Assignment deleted.');
                router.visit('/admin/assignments');
            },
            onError: () => {
                toast.error('Failed to delete assignment.');
                setDeleteProcessing(false);
            },
        });
    };

    return (
        <>
            <Head title={`Assignment - ${courseCode} / ${lecturerName}`} />

            <div className="p-6 space-y-6">
                {/* Header Banner */}
                <UctPanelCard
                    type="default"
                    className="overflow-hidden"
                    title={
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3.5">
                            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0 border border-primary/20">
                                <BookOpen className="h-7 w-7" />
                            </div>
                            <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-lg font-bold text-foreground tracking-tight">
                                        {courseCode}
                                    </span>
                                    <span className="text-sm font-medium text-muted-foreground">
                                        {courseName}
                                    </span>
                                    <AssignmentStatusBadge status={assignment.status} />
                                    <AssignmentRoleBadge role={assignment.role} />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Lecturer: <strong className="text-foreground font-semibold">{lecturerName}</strong> • {assignment.academic_year} ({assignment.semester})
                                </p>
                            </div>
                        </div>
                    }
                    actions={
                        <div className="flex flex-wrap items-center gap-2">
                            <Button size="sm" asChild>
                                <Link href={`/admin/assignments/${assignment.id}/edit`}>
                                    <Edit3 className="h-3.5 w-3.5 mr-1.5" />
                                    Edit Assignment
                                </Link>
                            </Button>

                            <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => setDeleteModalOpen(true)}
                            >
                                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                                Delete
                            </Button>
                        </div>
                    }
                />

                {/* Tabs */}
                <Tabs defaultValue="details" className="space-y-4">
                    <TabsList className="bg-muted/60 p-1 rounded-sm border border-border/40 flex-wrap h-auto">
                        <TabsTrigger value="details" className="text-xs">Details</TabsTrigger>
                        <TabsTrigger value="schedule" className="text-xs">Schedule</TabsTrigger>
                        <TabsTrigger value="notes" className="text-xs">Notes</TabsTrigger>
                    </TabsList>

                    {/* Tab 1: Details */}
                    <TabsContent value="details" className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <UctPanelCard
                                title="Assignment Information"
                                description="Core assignment data."
                                icon={BookOpen}
                                type="default"
                            >
                                <div className="divide-y divide-border/30 text-xs">
                                    <div className="flex justify-between py-2">
                                        <span className="text-muted-foreground">Course</span>
                                        <span className="font-medium text-foreground">{courseCode} – {courseName}</span>
                                    </div>
                                    <div className="flex justify-between py-2">
                                        <span className="text-muted-foreground">Lecturer</span>
                                        <span className="font-medium text-foreground">{lecturerName}</span>
                                    </div>
                                    <div className="flex justify-between py-2">
                                        <span className="text-muted-foreground">Staff ID</span>
                                        <span className="font-mono font-medium text-foreground">{assignment.lecturer?.lecturer_no || '—'}</span>
                                    </div>
                                    <div className="flex justify-between py-2">
                                        <span className="text-muted-foreground">Role</span>
                                        <AssignmentRoleBadge role={assignment.role} />
                                    </div>
                                    <div className="flex justify-between py-2">
                                        <span className="text-muted-foreground">Status</span>
                                        <AssignmentStatusBadge status={assignment.status} />
                                    </div>
                                    <div className="flex justify-between py-2">
                                        <span className="text-muted-foreground">Workload Hours</span>
                                        <span className="font-medium text-foreground">{assignment.workload_hours}</span>
                                    </div>
                                    <div className="flex justify-between py-2">
                                        <span className="text-muted-foreground">Academic Year</span>
                                        <span className="font-medium text-foreground">{assignment.academic_year}</span>
                                    </div>
                                    <div className="flex justify-between py-2">
                                        <span className="text-muted-foreground">Semester</span>
                                        <span className="font-medium text-foreground">{assignment.semester}</span>
                                    </div>
                                    <div className="flex justify-between py-2">
                                        <span className="text-muted-foreground">Section</span>
                                        <span className="font-medium text-foreground">{assignment.section}</span>
                                    </div>
                                </div>
                            </UctPanelCard>

                            <div className="space-y-6">
                                <UctPanelCard
                                    title="Quick Actions"
                                    description="Update status or manage this assignment."
                                    icon={Clock}
                                    type="default"
                                >
                                    <div className="space-y-3">
                                        <p className="text-xs text-muted-foreground">Change Assignment Status</p>
                                        <div className="flex flex-wrap gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="text-xs"
                                                onClick={() => handleStatusChange('active')}
                                                disabled={statusUpdating || assignment.status === 'active'}
                                            >
                                                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5 text-emerald-600" />
                                                Activate
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="text-xs"
                                                onClick={() => handleStatusChange('completed')}
                                                disabled={statusUpdating || assignment.status === 'completed'}
                                            >
                                                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5 text-blue-600" />
                                                Complete
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="text-xs"
                                                onClick={() => handleStatusChange('cancelled')}
                                                disabled={statusUpdating || assignment.status === 'cancelled'}
                                            >
                                                <XCircle className="h-3.5 w-3.5 mr-1.5 text-destructive" />
                                                Cancel
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="text-xs"
                                                onClick={() => handleStatusChange('assigned')}
                                                disabled={statusUpdating || assignment.status === 'assigned'}
                                            >
                                                <RefreshCw className="h-3.5 w-3.5 mr-1.5 text-amber-600" />
                                                Reset to Assigned
                                            </Button>
                                        </div>
                                    </div>
                                </UctPanelCard>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Tab 2: Schedule */}
                    <TabsContent value="schedule" className="space-y-4">
                        <UctPanelCard
                            title="Schedule Details"
                            description="Room, day, and time of lectures."
                            icon={MapPin}
                            type="default"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                                <div className="space-y-2">
                                    <p className="text-muted-foreground">Room / Venue</p>
                                    <p className="font-medium">{assignment.room || 'Not specified'}</p>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-muted-foreground">Schedule Day</p>
                                    <p className="font-medium">{assignment.schedule_day || 'Not specified'}</p>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-muted-foreground">Schedule Time</p>
                                    <p className="font-medium">{assignment.schedule_time || 'Not specified'}</p>
                                </div>
                            </div>
                        </UctPanelCard>
                    </TabsContent>

                    {/* Tab 3: Notes */}
                    <TabsContent value="notes" className="space-y-4">
                        <UctPanelCard
                            title="Notes & Remarks"
                            description="Additional information about this assignment."
                            icon={FileText}
                            type="default"
                        >
                            {assignment.notes ? (
                                <p className="text-xs text-foreground whitespace-pre-wrap">{assignment.notes}</p>
                            ) : (
                                <p className="text-xs text-muted-foreground">No notes have been added for this assignment.</p>
                            )}
                        </UctPanelCard>
                    </TabsContent>
                </Tabs>

                {/* Delete Confirmation Dialog */}
                <ConfirmDeleteDialog
                    open={deleteModalOpen}
                    onOpenChange={setDeleteModalOpen}
                    title="Delete Assignment"
                    description="Are you sure you want to permanently delete this course assignment? This action cannot be undone."
                    itemName={`${courseCode} – ${lecturerName} (${assignment.section})`}
                    loading={deleteProcessing}
                    onConfirm={confirmDelete}
                />
            </div>
        </>
    );
}

AdminAssignmentsShow.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/admin/dashboard' },
        { title: 'Assignments', href: '/admin/assignments' },
    ],
};