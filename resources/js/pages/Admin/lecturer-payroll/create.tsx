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
    lecturer_id: number | null;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/admin/dashboard' },
    { title: 'Lecturer Payroll', href: '/admin/lecturer-payroll' },
    { title: 'Add Teaching Hours', href: '/admin/lecturer-payroll/create' },
];

export default function AdminLecturerPayrollCreate({
    lecturer_id,
    default_rate,
    lecturers,
    courses,
}: Props) {
    const { data, setData, post, processing, errors } = useForm({
        lecturer_id: lecturer_id ? String(lecturer_id) : '',
        course_id: '',
        session_date: new Date().toISOString().split('T')[0],
        hours: '2',
        hourly_rate: String(default_rate),
        notes: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/lecturer-payroll', {
            onError: () =>
                toast.error('Please review the form for validation errors.'),
        });
    };

    return (
        <>
            <Head title="Add Teaching Hours" />

            <div className="mx-auto max-w-6xl space-y-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-semibold tracking-tight text-foreground">
                            Add Teaching Hours
                        </h1>
                        <p className="text-xs text-muted-foreground">
                            Record the hours a lecturer taught on a course so
                            they are included in this month's payroll.
                        </p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/admin/lecturer-payroll">
                            <ArrowLeft className="mr-1.5 h-4 w-4" />
                            Back to List
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
                    submitLabel="Save Hours"
                    cancelHref="/admin/lecturer-payroll"
                    setData={setData as any}
                    onSubmit={handleSubmit}
                />
            </div>
        </>
    );
}

AdminLecturerPayrollCreate.layout = (page: React.ReactNode) => (
    <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>
);
