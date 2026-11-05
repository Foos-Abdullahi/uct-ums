import { Link } from '@inertiajs/react';
import { Clock, DollarSign, Loader2, Save, User } from 'lucide-react';
import React from 'react';
import { UctPanelCard } from '@/components/tools/uct-panel-card';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
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
import { formatMoney, type PayrollFormOptions } from '@/types/lecturer-payroll';

export interface PayrollEntryData {
    lecturer_id: string;
    course_id: string;
    session_date: string;
    hours: string;
    hourly_rate: string;
    notes: string;
}

interface PayrollEntryFormProps extends PayrollFormOptions {
    data: PayrollEntryData;
    errors: Partial<Record<keyof PayrollEntryData, string>>;
    processing: boolean;
    lecturerLocked?: boolean;
    submitLabel: string;
    cancelHref: string;
    setData: <K extends keyof PayrollEntryData>(
        key: K,
        value: PayrollEntryData[K],
    ) => void;
    onSubmit: (e: React.FormEvent) => void;
}

function FieldError({ message }: { message?: string }) {
    return message ? (
        <p className="text-xs text-destructive">{message}</p>
    ) : null;
}

export function PayrollEntryForm({
    data,
    errors,
    processing,
    lecturers,
    courses,
    lecturerLocked = false,
    submitLabel,
    cancelHref,
    setData,
    onSubmit,
}: PayrollEntryFormProps) {
    const amount =
        (parseFloat(data.hours) || 0) * (parseFloat(data.hourly_rate) || 0);

    return (
        <form onSubmit={onSubmit} className="space-y-6">
            <UctPanelCard
                title="1. Lecturer & Course"
                description="Who taught, and which course or subject."
                icon={User}
                type="default"
            >
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="grid gap-2">
                        <Label htmlFor="lecturer_id">
                            Lecturer <span className="text-destructive">*</span>
                        </Label>
                        <Select
                            value={data.lecturer_id}
                            onValueChange={(v) => setData('lecturer_id', v)}
                            disabled={lecturerLocked}
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
                        <FieldError message={errors.lecturer_id} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="course_id">
                            Course / Subject{' '}
                            <span className="text-destructive">*</span>
                        </Label>
                        <Select
                            value={data.course_id}
                            onValueChange={(v) => setData('course_id', v)}
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
                        <FieldError message={errors.course_id} />
                    </div>
                </div>
            </UctPanelCard>

            <UctPanelCard
                title="2. Hours & Pay"
                description="Date, hours taught and the hourly rate. The amount is calculated for you."
                icon={Clock}
                type="default"
            >
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <div className="grid gap-2">
                        <Label htmlFor="session_date">
                            Date <span className="text-destructive">*</span>
                        </Label>
                        <DatePicker
                            id="session_date"
                            value={data.session_date}
                            onChange={(v) => setData('session_date', v)}
                            maxDate={new Date()}
                        />
                        <FieldError message={errors.session_date} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="hours">
                            Hours Taught{' '}
                            <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="hours"
                            type="number"
                            step="0.25"
                            min="0.25"
                            max="24"
                            value={data.hours}
                            onChange={(e) => setData('hours', e.target.value)}
                            required
                        />
                        <FieldError message={errors.hours} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="hourly_rate">Rate per Hour ($)</Label>
                        <Input
                            id="hourly_rate"
                            type="number"
                            step="0.5"
                            min="0"
                            value={data.hourly_rate}
                            onChange={(e) =>
                                setData('hourly_rate', e.target.value)
                            }
                        />
                        <FieldError message={errors.hourly_rate} />
                    </div>

                    <div className="grid gap-2 md:col-span-3">
                        <Label htmlFor="notes">Notes (Optional)</Label>
                        <Textarea
                            id="notes"
                            rows={2}
                            placeholder="e.g. Makeup class, exam invigilation"
                            value={data.notes}
                            onChange={(e) => setData('notes', e.target.value)}
                        />
                        <FieldError message={errors.notes} />
                    </div>

                    <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 md:col-span-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <DollarSign className="h-4 w-4 text-primary" />
                            This entry pays
                        </div>
                        <span className="text-lg font-bold text-foreground">
                            {formatMoney(amount)}
                        </span>
                    </div>
                </div>
            </UctPanelCard>

            <div className="flex items-center justify-end gap-3 pt-2">
                <Button variant="outline" size="sm" asChild>
                    <Link href={cancelHref}>Cancel</Link>
                </Button>
                <Button type="submit" size="sm" disabled={processing}>
                    {processing ? (
                        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                    ) : (
                        <Save className="mr-1.5 h-4 w-4" />
                    )}
                    {submitLabel}
                </Button>
            </div>
        </form>
    );
}
