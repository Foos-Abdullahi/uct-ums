import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import React from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type { PayrollFormOptions } from '@/types/lecturer-payroll';
import { PayrollEntryForm } from './components/payroll-entry-form';

interface Props extends PayrollFormOptions {
    entry: {
        id: number;
        lecturer_id: number;
        lecturer_name: string;
        course_id: number;
        session_date: string;
        hours: number;
        hourly_rate: number;
        notes: string | null;
    };
}

export default function AdminLecturerPayrollEdit({
    entry,
    default_rate,
    lecturers,
    courses,
}: Props) {
    const { data, setData, put, processing, errors } = useForm({
        lecturer_id: String(entry.lecturer_id),
        course_id: String(entry.course_id),
        session_date: entry.session_date,
        hours: String(entry.hours),
        hourly_rate: String(entry.hourly_rate),
        notes: entry.notes ?? '',
    });

    const month = entry.session_date.substring(0, 7);
    const backHref = `/admin/lecturer-payroll/lecturers/${entry.lecturer_id}?month=${month}`;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/admin/lecturer-payroll/sessions/${entry.id}`, {
            onError: () => toast.error('Please fix errors in the form.'),
        });
    };

    return (
        <>
            <Head title={`Edit Hours - ${entry.lecturer_name}`} />

            <div className="mx-auto max-w-6xl space-y-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-semibold tracking-tight text-foreground">
                            Edit Teaching Hours
                        </h1>
                        <p className="text-xs text-muted-foreground">
                            Correct this entry for {entry.lecturer_name}. Paid
                            entries cannot be changed.
                        </p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                        <Link href={backHref}>
                            <ArrowLeft className="mr-1.5 h-4 w-4" />
                            Back to Details
                        </Link>
                    </Button>
                </div>

                <PayrollEntryForm
                    data={data}
                    errors={errors}
                    processing={processing}
                    lecturers={lecturers}
                    courses={courses}
                    default_rate={default_rate}
                    lecturerLocked
                    submitLabel="Save Changes"
                    cancelHref={backHref}
                    setData={setData as any}
                    onSubmit={handleSubmit}
                />
            </div>
        </>
    );
}

AdminLecturerPayrollEdit.layout = (page: any) => {
    const entry = page?.props?.entry;
    const month = entry?.session_date?.substring(0, 7) ?? '';
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/admin/dashboard' },
        { title: 'Lecturer Payroll', href: '/admin/lecturer-payroll' },
        {
            title: entry?.lecturer_name ?? 'Lecturer',
            href: `/admin/lecturer-payroll/lecturers/${entry?.lecturer_id ?? ''}?month=${month}`,
        },
        { title: 'Edit Hours', href: `#` },
    ];

    return <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>;
};
