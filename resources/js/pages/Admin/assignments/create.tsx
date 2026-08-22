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
import { Textarea } from '@/components/ui/textarea';
import type { BreadcrumbItem } from '@/types';
import { ArrowLeft, BookOpen, User, Calendar, Clock, Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface LecturerOption {
    id: number;
    name: string;
    lecturer_no: string;
}

interface CourseOption {
    id: number;
    code: string;
    name: string;
}

interface AdminAssignmentsCreateProps {
    lecturers: LecturerOption[];
    courses: CourseOption[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/admin/dashboard' },
    { title: 'Assignments', href: '/admin/assignments' },
    { title: 'Create Assignment', href: '/admin/assignments/create' },
];

export default function AdminAssignmentsCreate({ lecturers = [], courses = [] }: AdminAssignmentsCreateProps) {
    const { data, setData, post, processing, errors } = useForm({
        lecturer_id: '',
        course_id: '',
        academic_year: '2026/2027',
        semester: 'Semester 1',
        section: 'Section A',
        role: 'lead_lecturer',
        status: 'assigned',
        workload_hours: 3,
        room: '',
        schedule_day: '',
        schedule_time: '',
        notes: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/assignments', {
            onError: () => {
                toast.error('Please review the form for validation errors.');
            },
        });
    };

    return (
        <>
            <Head title="Create New Course Assignment" />

            <div className="p-6 max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-semibold text-foreground tracking-tight">
                            Create New Course Assignment
                        </h1>
                        <p className="text-xs text-muted-foreground">
                            Assign a lecturer to a course for a specific academic year, semester, and section.
                        </p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/admin/assignments">
                            <ArrowLeft className="h-4 w-4 mr-1.5" />
                            Back to List
                        </Link>
                    </Button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Section 1: Lecturer & Course */}
                    <UctPanelCard
                        title="1. Lecturer & Course Selection"
                        description="Select the lecturer and the course to assign."
                        icon={User}
                        type="default"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="lecturer_id">Lecturer <span className="text-destructive">*</span></Label>
                                <Select
                                    value={String(data.lecturer_id)}
                                    onValueChange={(val) => setData('lecturer_id', Number(val))}
                                >
                                    <SelectTrigger id="lecturer_id">
                                        <SelectValue placeholder="Select lecturer" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {lecturers.map((l) => (
                                            <SelectItem key={l.id} value={String(l.id)}>
                                                {l.name} ({l.lecturer_no})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.lecturer_id && <p className="text-xs text-destructive">{errors.lecturer_id}</p>}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="course_id">Course <span className="text-destructive">*</span></Label>
                                <Select
                                    value={String(data.course_id)}
                                    onValueChange={(val) => setData('course_id', Number(val))}
                                >
                                    <SelectTrigger id="course_id">
                                        <SelectValue placeholder="Select course" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {courses.map((c) => (
                                            <SelectItem key={c.id} value={String(c.id)}>
                                                {c.code} – {c.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.course_id && <p className="text-xs text-destructive">{errors.course_id}</p>}
                            </div>
                        </div>
                    </UctPanelCard>

                    {/* Section 2: Academic Period & Section */}
                    <UctPanelCard
                        title="2. Academic Period & Section"
                        description="Academic year, semester, and section details."
                        icon={Calendar}
                        type="default"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="academic_year">Academic Year</Label>
                                <Input
                                    id="academic_year"
                                    value={data.academic_year}
                                    onChange={(e) => setData('academic_year', e.target.value)}
                                    placeholder="2026/2027"
                                />
                                {errors.academic_year && <p className="text-xs text-destructive">{errors.academic_year}</p>}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="semester">Semester</Label>
                                <Select
                                    value={data.semester}
                                    onValueChange={(val) => setData('semester', val)}
                                >
                                    <SelectTrigger id="semester">
                                        <SelectValue placeholder="Select semester" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {[1, 2, 3, 4, 5, 6].map((s) => (
                                            <SelectItem key={s} value={`Semester ${s}`}>
                                                Semester {s}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.semester && <p className="text-xs text-destructive">{errors.semester}</p>}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="section">Section</Label>
                                <Input
                                    id="section"
                                    value={data.section}
                                    onChange={(e) => setData('section', e.target.value)}
                                    placeholder="Section A"
                                />
                                {errors.section && <p className="text-xs text-destructive">{errors.section}</p>}
                            </div>
                        </div>
                    </UctPanelCard>

                    {/* Section 3: Role & Status */}
                    <UctPanelCard
                        title="3. Role & Status"
                        description="Define the lecturer's role and the assignment status."
                        icon={Clock}
                        type="default"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="role">Role</Label>
                                <Select
                                    value={data.role}
                                    onValueChange={(val) => setData('role', val)}
                                >
                                    <SelectTrigger id="role">
                                        <SelectValue placeholder="Select role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="lead_lecturer">Lead Lecturer</SelectItem>
                                        <SelectItem value="co_lecturer">Co-Lecturer</SelectItem>
                                        <SelectItem value="assistant">Assistant</SelectItem>
                                        <SelectItem value="lab_instructor">Lab Instructor</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.role && <p className="text-xs text-destructive">{errors.role}</p>}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="status">Status</Label>
                                <Select
                                    value={data.status}
                                    onValueChange={(val) => setData('status', val)}
                                >
                                    <SelectTrigger id="status">
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="assigned">Assigned</SelectItem>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                        <SelectItem value="cancelled">Cancelled</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.status && <p className="text-xs text-destructive">{errors.status}</p>}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="workload_hours">Workload Hours</Label>
                                <Input
                                    id="workload_hours"
                                    type="number"
                                    value={data.workload_hours}
                                    onChange={(e) => setData('workload_hours', Number(e.target.value))}
                                    min={0}
                                />
                                {errors.workload_hours && <p className="text-xs text-destructive">{errors.workload_hours}</p>}
                            </div>
                        </div>
                    </UctPanelCard>

                    {/* Section 4: Schedule & Notes */}
                    <UctPanelCard
                        title="4. Schedule & Additional Notes"
                        description="Room, day, time, and any extra details."
                        icon={BookOpen}
                        type="default"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="room">Room / Venue</Label>
                                <Input
                                    id="room"
                                    value={data.room}
                                    onChange={(e) => setData('room', e.target.value)}
                                    placeholder="Building A, Room 205"
                                />
                                {errors.room && <p className="text-xs text-destructive">{errors.room}</p>}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="schedule_day">Schedule Day</Label>
                                <Input
                                    id="schedule_day"
                                    value={data.schedule_day}
                                    onChange={(e) => setData('schedule_day', e.target.value)}
                                    placeholder="Monday"
                                />
                                {errors.schedule_day && <p className="text-xs text-destructive">{errors.schedule_day}</p>}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="schedule_time">Schedule Time</Label>
                                <Input
                                    id="schedule_time"
                                    value={data.schedule_time}
                                    onChange={(e) => setData('schedule_time', e.target.value)}
                                    placeholder="10:00 AM - 12:00 PM"
                                />
                                {errors.schedule_time && <p className="text-xs text-destructive">{errors.schedule_time}</p>}
                            </div>

                            <div className="grid gap-2 md:col-span-2">
                                <Label htmlFor="notes">Notes</Label>
                                <Textarea
                                    id="notes"
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    rows={3}
                                    placeholder="Any additional information about this assignment..."
                                />
                                {errors.notes && <p className="text-xs text-destructive">{errors.notes}</p>}
                            </div>
                        </div>
                    </UctPanelCard>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/admin/assignments">Cancel</Link>
                        </Button>
                        <Button type="submit" size="sm" disabled={processing}>
                            {processing ? (
                                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                            ) : (
                                <Plus className="mr-1.5 h-4 w-4" />
                            )}
                            Create Assignment
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

AdminAssignmentsCreate.layout = (page: any) => (
    <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>
);