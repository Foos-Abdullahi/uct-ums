import { Head, router, useForm } from '@inertiajs/react';
import {
    CheckCircle2,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Clock,
    DollarSign,
    Pencil,
    Plus,
    Printer,
    Search,
    Trash2,
    Undo2,
    Wallet,
} from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import { MetricCard } from '@/components/tools/MetricCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
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
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface Entry {
    id: number;
    course_id: number;
    course: string;
    session_date: string;
    hours: number;
    hourly_rate: number;
    amount: number;
    notes: string | null;
    paid: boolean;
}

interface CourseTotal {
    course_id: number;
    code: string;
    name: string;
    sessions: number;
    hours: number;
    total: number;
}

interface PayrollRow {
    lecturer_id: number;
    name: string;
    lecturer_no: string;
    sessions: number;
    hours: number;
    total: number;
    paid: number;
    outstanding: number;
    status: 'paid' | 'partial' | 'unpaid';
    courses: CourseTotal[];
    entries: Entry[];
}

interface Props {
    month: string;
    month_label: string;
    previous_month: string;
    next_month: string;
    default_rate: number;
    search: string;
    totals: {
        lecturers: number;
        hours: number;
        total: number;
        paid: number;
        outstanding: number;
    };
    rows: PayrollRow[];
    lecturers: Array<{ id: number; name: string; lecturer_no: string }>;
    courses: Array<{ id: number; code: string; name: string }>;
}

const money = (value: number) =>
    new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(value);

const hoursLabel = (value: number) => `${Number(value.toFixed(2))} h`;

const today = () => {
    const d = new Date();

    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const statusStyles: Record<PayrollRow['status'], string> = {
    paid: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
    partial: 'bg-amber-500/10 text-amber-700 border-amber-500/20',
    unpaid: 'bg-destructive/10 text-destructive border-destructive/20',
};

const statusText: Record<PayrollRow['status'], string> = {
    paid: 'Paid',
    partial: 'Partly paid',
    unpaid: 'Not paid',
};

export default function LecturerPayrollIndex({
    month,
    month_label,
    previous_month,
    next_month,
    default_rate,
    search,
    totals,
    rows,
    lecturers,
    courses,
}: Props) {
    const [expanded, setExpanded] = useState<number | null>(null);
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<Entry | null>(null);
    const [deleting, setDeleting] = useState<Entry | null>(null);
    const [deleteBusy, setDeleteBusy] = useState(false);
    const [payTarget, setPayTarget] = useState<PayrollRow | null>(null);
    const [payBusy, setPayBusy] = useState(false);
    const [query, setQuery] = useState(search);

    const form = useForm({
        lecturer_id: '',
        course_id: '',
        session_date: today(),
        hours: '2',
        hourly_rate: String(default_rate),
        notes: '',
    });

    const goTo = (target: string, searchText = query) => {
        router.get(
            '/admin/lecturer-payroll',
            { month: target, ...(searchText ? { search: searchText } : {}) },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    const openCreate = (lecturerId?: number) => {
        setEditing(null);
        form.reset();
        form.clearErrors();
        form.setData({
            lecturer_id: lecturerId ? String(lecturerId) : '',
            course_id: '',
            session_date: today(),
            hours: '2',
            hourly_rate: String(default_rate),
            notes: '',
        });
        setFormOpen(true);
    };

    const openEdit = (row: PayrollRow, entry: Entry) => {
        setEditing(entry);
        form.clearErrors();
        form.setData({
            lecturer_id: String(row.lecturer_id),
            course_id: String(entry.course_id),
            session_date: entry.session_date,
            hours: String(entry.hours),
            hourly_rate: String(entry.hourly_rate),
            notes: entry.notes ?? '',
        });
        setFormOpen(true);
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        const options = {
            preserveScroll: true,
            onSuccess: () => setFormOpen(false),
        };

        if (editing) {
            form.put(`/admin/lecturer-payroll/sessions/${editing.id}`, options);
        } else {
            form.post('/admin/lecturer-payroll', options);
        }
    };

    const confirmDelete = () => {
        if (!deleting) {
            return;
        }

        setDeleteBusy(true);
        router.delete(`/admin/lecturer-payroll/sessions/${deleting.id}`, {
            preserveScroll: true,
            onFinish: () => {
                setDeleteBusy(false);
                setDeleting(null);
            },
        });
    };

    const confirmPay = () => {
        if (!payTarget) {
            return;
        }

        setPayBusy(true);
        router.post(
            `/admin/lecturer-payroll/lecturers/${payTarget.lecturer_id}/paid`,
            { month },
            {
                preserveScroll: true,
                onFinish: () => {
                    setPayBusy(false);
                    setPayTarget(null);
                },
            },
        );
    };

    const undoPay = (row: PayrollRow) => {
        router.delete(
            `/admin/lecturer-payroll/lecturers/${row.lecturer_id}/paid`,
            { data: { month }, preserveScroll: true },
        );
    };

    const previewAmount =
        (parseFloat(form.data.hours) || 0) *
        (parseFloat(form.data.hourly_rate) || 0);

    return (
        <>
            <Head title="Lecturer Payroll" />

            <div className="space-y-6 p-6 print:p-0">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h1 className="text-lg font-semibold tracking-tight text-foreground">
                            Lecturer Payroll
                        </h1>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            Record the hours each lecturer teaches on a course.
                            Pay is hours × {money(default_rate)} per hour.
                        </p>
                    </div>
                    <div className="flex gap-2 print:hidden">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.print()}
                        >
                            <Printer className="mr-1.5 h-4 w-4" />
                            Print
                        </Button>
                        <Button size="sm" onClick={() => openCreate()}>
                            <Plus className="mr-1.5 h-4 w-4" />
                            Add teaching hours
                        </Button>
                    </div>
                </div>

                {/* Month switcher + search */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            className="print:hidden"
                            aria-label="Previous month"
                            onClick={() => goTo(previous_month)}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="min-w-40 text-center text-base font-semibold">
                            {month_label}
                        </div>
                        <Button
                            variant="outline"
                            size="icon"
                            className="print:hidden"
                            aria-label="Next month"
                            onClick={() => goTo(next_month)}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                    <form
                        className="relative w-full sm:w-72 print:hidden"
                        onSubmit={(e) => {
                            e.preventDefault();
                            goTo(month);
                        }}
                    >
                        <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search lecturer name…"
                            className="pl-8"
                        />
                    </form>
                </div>

                {/* Summary */}
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:gap-4 lg:grid-cols-4">
                    <MetricCard
                        title="Total hours"
                        value={hoursLabel(totals.hours)}
                        icon={Clock}
                        color="info"
                    />
                    <MetricCard
                        title="Total to pay"
                        value={money(totals.total)}
                        icon={DollarSign}
                        color="primary"
                    />
                    <MetricCard
                        title="Already paid"
                        value={money(totals.paid)}
                        icon={CheckCircle2}
                        color="success"
                    />
                    <MetricCard
                        title="Still to pay"
                        value={money(totals.outstanding)}
                        icon={Wallet}
                        color="warning"
                    />
                </div>

                {/* Lecturers */}
                {rows.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
                            <Clock className="h-10 w-10 text-muted-foreground" />
                            <div>
                                <p className="font-medium">
                                    No teaching hours in {month_label}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Click “Add teaching hours” to record the
                                    first session.
                                </p>
                            </div>
                            <Button size="sm" onClick={() => openCreate()}>
                                <Plus className="mr-1.5 h-4 w-4" />
                                Add teaching hours
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {rows.map((row) => {
                            const open = expanded === row.lecturer_id;

                            return (
                                <Card key={row.lecturer_id}>
                                    <CardContent className="p-0">
                                        <div className="flex flex-col gap-3 p-4 md:flex-row md:items-center">
                                            <button
                                                type="button"
                                                className="flex flex-1 items-center gap-3 text-left"
                                                onClick={() =>
                                                    setExpanded(
                                                        open
                                                            ? null
                                                            : row.lecturer_id,
                                                    )
                                                }
                                            >
                                                <ChevronDown
                                                    className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform print:hidden ${open ? '' : '-rotate-90'}`}
                                                />
                                                <div>
                                                    <div className="font-medium">
                                                        {row.name}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {row.lecturer_no} ·{' '}
                                                        {row.courses.length}{' '}
                                                        {row.courses.length ===
                                                        1
                                                            ? 'course'
                                                            : 'courses'}{' '}
                                                        · {row.sessions}{' '}
                                                        {row.sessions === 1
                                                            ? 'session'
                                                            : 'sessions'}
                                                    </div>
                                                </div>
                                            </button>

                                            <div className="flex items-center gap-6 text-sm">
                                                <div className="text-right">
                                                    <div className="text-xs text-muted-foreground">
                                                        Hours
                                                    </div>
                                                    <div className="font-medium">
                                                        {hoursLabel(row.hours)}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-xs text-muted-foreground">
                                                        Amount
                                                    </div>
                                                    <div className="font-semibold">
                                                        {money(row.total)}
                                                    </div>
                                                </div>
                                                <Badge
                                                    variant="outline"
                                                    className={
                                                        statusStyles[row.status]
                                                    }
                                                >
                                                    {statusText[row.status]}
                                                </Badge>
                                            </div>

                                            <div className="flex gap-2 print:hidden">
                                                {row.outstanding > 0 && (
                                                    <Button
                                                        size="sm"
                                                        onClick={() =>
                                                            setPayTarget(row)
                                                        }
                                                    >
                                                        <CheckCircle2 className="mr-1.5 h-4 w-4" />
                                                        Mark as paid
                                                    </Button>
                                                )}
                                                {row.paid > 0 && (
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() =>
                                                            undoPay(row)
                                                        }
                                                    >
                                                        <Undo2 className="mr-1.5 h-4 w-4" />
                                                        Undo
                                                    </Button>
                                                )}
                                            </div>
                                        </div>

                                        {open && (
                                            <div className="space-y-4 border-t bg-muted/30 p-4">
                                                {/* Per-course breakdown */}
                                                <div>
                                                    <div className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                                        By course
                                                    </div>
                                                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                                        {row.courses.map(
                                                            (c) => (
                                                                <div
                                                                    key={
                                                                        c.course_id
                                                                    }
                                                                    className="rounded-md border bg-background p-3"
                                                                >
                                                                    <div className="text-sm font-medium">
                                                                        {c.code}
                                                                    </div>
                                                                    <div className="truncate text-xs text-muted-foreground">
                                                                        {c.name}
                                                                    </div>
                                                                    <div className="mt-2 flex justify-between text-sm">
                                                                        <span>
                                                                            {hoursLabel(
                                                                                c.hours,
                                                                            )}
                                                                        </span>
                                                                        <span className="font-semibold">
                                                                            {money(
                                                                                c.total,
                                                                            )}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            ),
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Session list */}
                                                <div>
                                                    <div className="mb-2 flex items-center justify-between">
                                                        <div className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                                            Sessions
                                                        </div>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="print:hidden"
                                                            onClick={() =>
                                                                openCreate(
                                                                    row.lecturer_id,
                                                                )
                                                            }
                                                        >
                                                            <Plus className="mr-1 h-3.5 w-3.5" />
                                                            Add hours
                                                        </Button>
                                                    </div>
                                                    <div className="overflow-x-auto rounded-md border bg-background">
                                                        <table className="w-full text-sm">
                                                            <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                                                                <tr>
                                                                    <th className="px-3 py-2">
                                                                        Date
                                                                    </th>
                                                                    <th className="px-3 py-2">
                                                                        Course
                                                                    </th>
                                                                    <th className="px-3 py-2 text-right">
                                                                        Hours
                                                                    </th>
                                                                    <th className="px-3 py-2 text-right">
                                                                        Rate
                                                                    </th>
                                                                    <th className="px-3 py-2 text-right">
                                                                        Amount
                                                                    </th>
                                                                    <th className="px-3 py-2 print:hidden" />
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {row.entries.map(
                                                                    (e) => (
                                                                        <tr
                                                                            key={
                                                                                e.id
                                                                            }
                                                                            className="border-t"
                                                                        >
                                                                            <td className="px-3 py-2 whitespace-nowrap">
                                                                                {
                                                                                    e.session_date
                                                                                }
                                                                            </td>
                                                                            <td className="px-3 py-2">
                                                                                {
                                                                                    e.course
                                                                                }
                                                                                {e.notes && (
                                                                                    <div className="text-xs text-muted-foreground">
                                                                                        {
                                                                                            e.notes
                                                                                        }
                                                                                    </div>
                                                                                )}
                                                                            </td>
                                                                            <td className="px-3 py-2 text-right">
                                                                                {hoursLabel(
                                                                                    e.hours,
                                                                                )}
                                                                            </td>
                                                                            <td className="px-3 py-2 text-right">
                                                                                {money(
                                                                                    e.hourly_rate,
                                                                                )}
                                                                            </td>
                                                                            <td className="px-3 py-2 text-right font-medium">
                                                                                {money(
                                                                                    e.amount,
                                                                                )}
                                                                            </td>
                                                                            <td className="px-3 py-2 text-right whitespace-nowrap print:hidden">
                                                                                {e.paid ? (
                                                                                    <span className="text-xs text-emerald-700">
                                                                                        Paid
                                                                                    </span>
                                                                                ) : (
                                                                                    <>
                                                                                        <Button
                                                                                            size="icon"
                                                                                            variant="ghost"
                                                                                            className="h-7 w-7"
                                                                                            aria-label="Edit entry"
                                                                                            onClick={() =>
                                                                                                openEdit(
                                                                                                    row,
                                                                                                    e,
                                                                                                )
                                                                                            }
                                                                                        >
                                                                                            <Pencil className="h-3.5 w-3.5" />
                                                                                        </Button>
                                                                                        <Button
                                                                                            size="icon"
                                                                                            variant="ghost"
                                                                                            className="h-7 w-7 text-destructive"
                                                                                            aria-label="Delete entry"
                                                                                            onClick={() =>
                                                                                                setDeleting(
                                                                                                    e,
                                                                                                )
                                                                                            }
                                                                                        >
                                                                                            <Trash2 className="h-3.5 w-3.5" />
                                                                                        </Button>
                                                                                    </>
                                                                                )}
                                                                            </td>
                                                                        </tr>
                                                                    ),
                                                                )}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Add / edit dialog */}
            <Dialog open={formOpen} onOpenChange={setFormOpen}>
                <DialogContent className="sm:max-w-md">
                    <form onSubmit={submit} className="space-y-4">
                        <DialogHeader>
                            <DialogTitle>
                                {editing
                                    ? 'Edit teaching hours'
                                    : 'Add teaching hours'}
                            </DialogTitle>
                            <DialogDescription>
                                Pick the lecturer, the course they taught and
                                how many hours.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-1.5">
                            <Label>Lecturer</Label>
                            <Select
                                value={form.data.lecturer_id}
                                onValueChange={(v) =>
                                    form.setData('lecturer_id', v)
                                }
                                disabled={!!editing}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Choose lecturer" />
                                </SelectTrigger>
                                <SelectContent>
                                    {lecturers.map((l) => (
                                        <SelectItem
                                            key={l.id}
                                            value={String(l.id)}
                                        >
                                            {l.name} ({l.lecturer_no})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {form.errors.lecturer_id && (
                                <p className="text-xs text-destructive">
                                    {form.errors.lecturer_id}
                                </p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <Label>Course / subject</Label>
                            <Select
                                value={form.data.course_id}
                                onValueChange={(v) =>
                                    form.setData('course_id', v)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Choose course" />
                                </SelectTrigger>
                                <SelectContent>
                                    {courses.map((c) => (
                                        <SelectItem
                                            key={c.id}
                                            value={String(c.id)}
                                        >
                                            {c.code} – {c.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {form.errors.course_id && (
                                <p className="text-xs text-destructive">
                                    {form.errors.course_id}
                                </p>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label>Date</Label>
                                <DatePicker
                                    value={form.data.session_date}
                                    onChange={(v) =>
                                        form.setData('session_date', v)
                                    }
                                    maxDate={new Date()}
                                />
                                {form.errors.session_date && (
                                    <p className="text-xs text-destructive">
                                        {form.errors.session_date}
                                    </p>
                                )}
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="hours">Hours taught</Label>
                                <Input
                                    id="hours"
                                    type="number"
                                    step="0.25"
                                    min="0.25"
                                    max="24"
                                    value={form.data.hours}
                                    onChange={(e) =>
                                        form.setData('hours', e.target.value)
                                    }
                                />
                                {form.errors.hours && (
                                    <p className="text-xs text-destructive">
                                        {form.errors.hours}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="rate">Rate per hour ($)</Label>
                            <Input
                                id="rate"
                                type="number"
                                step="0.5"
                                min="0"
                                value={form.data.hourly_rate}
                                onChange={(e) =>
                                    form.setData('hourly_rate', e.target.value)
                                }
                            />
                            {form.errors.hourly_rate && (
                                <p className="text-xs text-destructive">
                                    {form.errors.hourly_rate}
                                </p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="notes">Note (optional)</Label>
                            <Textarea
                                id="notes"
                                rows={2}
                                value={form.data.notes}
                                onChange={(e) =>
                                    form.setData('notes', e.target.value)
                                }
                            />
                        </div>

                        <div className="flex items-center justify-between rounded-md bg-muted px-3 py-2 text-sm">
                            <span className="text-muted-foreground">
                                This entry pays
                            </span>
                            <span className="font-semibold">
                                {money(previewAmount)}
                            </span>
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setFormOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={form.processing}>
                                {editing ? 'Save changes' : 'Save hours'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Mark paid confirmation */}
            <Dialog
                open={!!payTarget}
                onOpenChange={(o) => !o && setPayTarget(null)}
            >
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Mark as paid?</DialogTitle>
                        <DialogDescription>
                            {payTarget &&
                                `Confirm you paid ${payTarget.name} ${money(payTarget.outstanding)} for ${month_label}.`}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setPayTarget(null)}
                        >
                            Cancel
                        </Button>
                        <Button onClick={confirmPay} disabled={payBusy}>
                            Yes, mark as paid
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ConfirmDeleteDialog
                open={!!deleting}
                onOpenChange={(o) => !o && setDeleting(null)}
                title="Delete this entry?"
                description="The hours will be removed from this month's payroll."
                itemName={
                    deleting
                        ? `${deleting.session_date} – ${deleting.course}`
                        : undefined
                }
                loading={deleteBusy}
                onConfirm={confirmDelete}
            />
        </>
    );
}

LecturerPayrollIndex.layout = (page: React.ReactNode) => {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/admin/dashboard' },
        { title: 'Lecturer Payroll', href: '/admin/lecturer-payroll' },
    ];

    return <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>;
};
