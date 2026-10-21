import { Head, router, useForm } from '@inertiajs/react';
import React from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/tools/table/main-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';

type ReportRow = Record<string, string | number | null>;

interface FinancialDetailProps {
    title: string;
    rows: ReportRow[];
    accounts?: Array<{ id: number; code: number; name: string }>;
    period?: string;
    showBudgetForm?: boolean;
    filters?: Record<string, string | number | null>;
    options?: {
        academic_years?: string[];
        semesters?: number[];
        programs?: Array<{ id: number; name: string }>;
    };
}

const labelFor = (key: string) => key.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
const money = (value: number) => `$${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function FinancialDetail({ title, rows, accounts = [], period = String(new Date().getFullYear()), showBudgetForm = false, filters = {}, options = {} }: FinancialDetailProps) {
    const form = useForm({ account_id: '', financial_period: period, amount: '' });
    const filterForm = useForm({
        from: String(filters.from ?? ''),
        to: String(filters.to ?? ''),
        academic_year: String(filters.academic_year ?? ''),
        semester: String(filters.semester ?? ''),
        program_id: String(filters.program_id ?? ''),
        status: String(filters.status ?? ''),
        vendor: String(filters.vendor ?? ''),
        group_by: String(filters.group_by ?? 'daily'),
        period: String(filters.period ?? period),
    });
    const columns: ColumnDef<ReportRow>[] = Object.keys(rows[0] ?? {}).map((column) => ({
        accessorKey: column,
        header: labelFor(column),
        cell: ({ row }) => {
            const value = row.original[column];
            const isAmount = /amount|balance|paid|charged|collected|revenue|budget|actual|variance|cash|inflow|outflow|surplus|deficit/i.test(column);

            return value === null ? '—' : isAmount && typeof value === 'number' ? money(value) : value;
        },
    }));

    const saveBudget = (event: React.FormEvent) => {
        event.preventDefault();
        form.post('/admin/reports/budgets', { onSuccess: () => form.reset('amount') });
    };

    const applyFilters = (event: React.FormEvent) => {
        event.preventDefault();
        const query = Object.fromEntries(Object.entries(filterForm.data).filter(([, value]) => value !== ''));
        router.get(window.location.pathname, query, { preserveState: true, preserveScroll: true });
    };

    return (
        <>
            <Head title={title} />
            <div key={title} className="animate-in space-y-6 p-6 duration-700 ease-in-out fade-in slide-in-from-bottom-6">
                <header>
                    <h1 className="text-xl font-semibold">{title}</h1>
                    <p className="text-sm text-muted-foreground">Cash basis: collections and paid expenses are included.</p>
                </header>

                <form onSubmit={applyFilters} className="flex flex-wrap items-end gap-3 rounded-lg border bg-card p-4">
                    {title === 'Budget vs Actual' ? <div className="space-y-1"><Label>Period</Label><Input placeholder="YYYY or YYYY-MM" value={filterForm.data.period} onChange={(event) => filterForm.setData('period', event.target.value)} /></div> : <>
                        <div className="space-y-1"><Label>From</Label><Input type="date" value={filterForm.data.from} onChange={(event) => filterForm.setData('from', event.target.value)} /></div>
                        <div className="space-y-1"><Label>To</Label><Input type="date" value={filterForm.data.to} onChange={(event) => filterForm.setData('to', event.target.value)} /></div>
                    </>}
                    {title === 'Student Fees & Collections' && <>
                        <div className="space-y-1"><Label>Academic year</Label><Select value={filterForm.data.academic_year || 'all'} onValueChange={(value) => filterForm.setData('academic_year', value === 'all' ? '' : value)}><SelectTrigger><SelectValue placeholder="All years" /></SelectTrigger><SelectContent><SelectItem value="all">All years</SelectItem>{(options.academic_years ?? []).map((year) => <SelectItem key={year} value={year}>{year}</SelectItem>)}</SelectContent></Select></div>
                        <div className="space-y-1"><Label>Semester</Label><Select value={filterForm.data.semester || 'all'} onValueChange={(value) => filterForm.setData('semester', value === 'all' ? '' : value)}><SelectTrigger><SelectValue placeholder="All semesters" /></SelectTrigger><SelectContent><SelectItem value="all">All semesters</SelectItem>{(options.semesters ?? []).map((semester) => <SelectItem key={semester} value={String(semester)}>{semester}</SelectItem>)}</SelectContent></Select></div>
                        <div className="space-y-1"><Label>Program</Label><Select value={filterForm.data.program_id || 'all'} onValueChange={(value) => filterForm.setData('program_id', value === 'all' ? '' : value)}><SelectTrigger><SelectValue placeholder="All programs" /></SelectTrigger><SelectContent><SelectItem value="all">All programs</SelectItem>{(options.programs ?? []).map((program) => <SelectItem key={program.id} value={String(program.id)}>{program.name}</SelectItem>)}</SelectContent></Select></div>
                    </>}
                    {title === 'Expenses' && <>
                        <div className="space-y-1"><Label>Status</Label><Select value={filterForm.data.status || 'all'} onValueChange={(value) => filterForm.setData('status', value === 'all' ? '' : value)}><SelectTrigger><SelectValue placeholder="All statuses" /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem>{['draft', 'pending_approval', 'approved', 'paid', 'rejected', 'cancelled'].map((status) => <SelectItem key={status} value={status}>{labelFor(status)}</SelectItem>)}</SelectContent></Select></div>
                        <div className="space-y-1"><Label>Vendor</Label><Input value={filterForm.data.vendor} onChange={(event) => filterForm.setData('vendor', event.target.value)} /></div>
                    </>}
                    {title === 'Cash Flow' && <div className="space-y-1"><Label>Group by</Label><Select value={filterForm.data.group_by} onValueChange={(value) => filterForm.setData('group_by', value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="daily">Daily</SelectItem><SelectItem value="monthly">Monthly</SelectItem></SelectContent></Select></div>}
                    <Button type="submit">Apply filters</Button>
                </form>

                {showBudgetForm && <form onSubmit={saveBudget} className="grid gap-3 rounded-lg border bg-card p-4 sm:grid-cols-4 sm:items-end">
                    <div className="space-y-1"><Label>Expense account</Label><Select value={form.data.account_id} onValueChange={(value) => form.setData('account_id', value)}><SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger><SelectContent>{accounts.map((account) => <SelectItem key={account.id} value={String(account.id)}>{account.code} · {account.name}</SelectItem>)}</SelectContent></Select></div>
                    <div className="space-y-1"><Label>Period (YYYY or YYYY-MM)</Label><Input value={form.data.financial_period} onChange={(event) => form.setData('financial_period', event.target.value)} /></div>
                    <div className="space-y-1"><Label>Budget amount</Label><Input type="number" min="0" step="0.01" value={form.data.amount} onChange={(event) => form.setData('amount', event.target.value)} /></div>
                    <Button type="submit" disabled={form.processing}>Save budget</Button>
                </form>}

                <DataTable
                    title={title}
                    searchTitle={`Search ${title.toLowerCase()}...`}
                    columns={columns}
                    data={rows}
                />
            </div>
        </>
    );
}

FinancialDetail.layout = (page: React.ReactNode) => <AppLayout breadcrumbs={[{ title: 'Dashboard', href: '/admin/dashboard' }, { title: 'Reports', href: '/admin/reports' }]}>{page}</AppLayout>;
