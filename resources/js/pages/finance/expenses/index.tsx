import React, { useState } from 'react';
import { Deferred, Head, Link, router, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MetricCard } from '@/components/tools/MetricCard';
import { MetricCardsSkeleton } from '@/components/tools/metric-cards-skeleton';
import { DataTable } from '@/components/tools/table/main-table';
import { TableSkeleton } from '@/components/tools/table-skeleton';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import type { BreadcrumbItem } from '@/types';
import type { DataTableServerFilter } from '@/components/tools/table/types';
import type { ColumnDef } from '@tanstack/react-table';
import {
    Wallet,
    DollarSign,
    CheckCircle2,
    Clock,
    AlertCircle,
    Plus,
    Eye,
    Save,
    Receipt,
    Check,
    X,
    HandCoins,
} from 'lucide-react';
import { toast } from 'sonner';

interface ExpenseItem {
    id: number;
    expense_no: string;
    title: string;
    expense_type: string;
    amount: number;
    expense_date: string;
    vendor: string | null;
    status: string;
    creator?: { name: string };
}

interface ExpenseStats {
    total_spent: number;
    pending_approval: number;
    total_expenses: number;
    month_expenses: number;
    rejected_count: number;
}

interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface FinanceExpensesProps {
    stats?: ExpenseStats;
    expenses?: PaginatedData<ExpenseItem>;
    expense_types: string[];
    expense_statuses: string[];
    level_roles: Record<number, string>;
    filters: { search: string; status: string; expense_type: string; per_page: number };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/finance/dashboard' },
    { title: 'Expenses', href: '/finance/expenses' },
];

const TYPE_LABELS: Record<string, string> = {
    salary: 'Salary',
    utilities: 'Utilities',
    equipment: 'Equipment',
    maintenance: 'Maintenance',
    supplies: 'Supplies',
    others: 'Others',
};

export default function FinanceExpensesIndex({ stats, expenses, expense_types = [], level_roles = {}, filters }: FinanceExpensesProps) {
    const [createModalOpen, setCreateModalOpen] = useState(false);

    const formatCurrency = (val: number) => `$${Number(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const { data, setData, post, processing, reset, errors } = useForm({
        title: '',
        description: '',
        expense_type: 'others',
        amount: '',
        expense_date: new Date().toISOString().split('T')[0],
        vendor: '',
        budget_line: '',
        status: 'pending_approval',
        notes: '',
    });

    const handleFilterUpdate = (newFilters: Partial<typeof filters>) => {
        const query = { ...filters, ...newFilters };
        const cleanQuery: Record<string, any> = {};
        Object.entries(query).forEach(([key, val]) => {
            if (val !== undefined && val !== '' && val !== 'all') {
                cleanQuery[key] = val;
            }
        });
        router.get('/finance/expenses', cleanQuery, { preserveState: true, preserveScroll: true });
    };

    const handleCreateExpense = (e: React.FormEvent) => {
        e.preventDefault();
        post('/finance/expenses', {
            onSuccess: () => {
                setCreateModalOpen(false);
                reset();
            },
        });
    };

    const statusBadge = (status: string) => {
        const map: Record<string, React.ReactNode> = {
            paid: <Badge className="bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 border-emerald-200"><Check className="h-3 w-3 mr-1" /> Paid</Badge>,
            approved: <Badge className="bg-blue-500/10 text-blue-700 hover:bg-blue-500/20 border-blue-200"><CheckCircle2 className="h-3 w-3 mr-1" /> Approved</Badge>,
            pending_approval: <Badge className="bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 border-amber-200"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>,
            rejected: <Badge variant="destructive"><X className="h-3 w-3 mr-1" /> Rejected</Badge>,
            draft: <Badge variant="outline">Draft</Badge>,
            cancelled: <Badge variant="secondary">Cancelled</Badge>,
        };
        return map[status] ?? <Badge variant="outline">{status}</Badge>;
    };

    const columns: ColumnDef<ExpenseItem>[] = [
        {
            accessorKey: 'expense_no',
            header: 'Expense No',
            cell: ({ row }) => <Badge variant="outline" className="font-mono text-xs font-semibold">{row.original.expense_no}</Badge>,
        },
        {
            accessorKey: 'title',
            header: 'Expense',
            cell: ({ row }) => (
                <div>
                    <p className="font-medium text-foreground truncate text-sm">{row.original.title}</p>
                    {row.original.vendor && <p className="text-xs text-muted-foreground">{row.original.vendor}</p>}
                </div>
            ),
        },
        {
            accessorKey: 'expense_type',
            header: 'Type',
            cell: ({ row }) => <Badge variant="secondary" className="capitalize text-[10px]">{TYPE_LABELS[row.original.expense_type] ?? row.original.expense_type}</Badge>,
        },
        {
            accessorKey: 'amount',
            header: 'Amount',
            cell: ({ row }) => <span className="text-xs font-semibold text-foreground">{formatCurrency(row.original.amount)}</span>,
        },
        {
            accessorKey: 'expense_date',
            header: 'Date',
            cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.original.expense_date}</span>,
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => statusBadge(row.original.status),
        },
        {
            id: 'actions',
            header: () => <span className="sr-only">Actions</span>,
            cell: ({ row }) => (
                <div className="flex items-center justify-end">
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" asChild>
                        <Link href={`/finance/expenses/${row.original.id}`}>
                            <Eye className="h-3.5 w-3.5 mr-1" />
                            View
                        </Link>
                    </Button>
                </div>
            ),
        },
    ];

    const serverFilters: DataTableServerFilter[] = [
        {
            key: 'status',
            title: 'Status',
            options: [
                { label: 'All Statuses', value: 'all' },
                { label: 'Draft', value: 'draft' },
                { label: 'Pending Approval', value: 'pending_approval' },
                { label: 'Approved', value: 'approved' },
                { label: 'Paid', value: 'paid' },
                { label: 'Rejected', value: 'rejected' },
                { label: 'Cancelled', value: 'cancelled' },
            ],
            value: filters.status || undefined,
        },
        {
            key: 'expense_type',
            title: 'Type',
            options: [
                { label: 'All Types', value: 'all' },
                ...expense_types.map((t) => ({ label: TYPE_LABELS[t] ?? t, value: t })),
            ],
            value: filters.expense_type || undefined,
        },
    ];

    return (
        <>
            <Head title="Expenses Management" />
            <div className="p-6 space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h1 className="text-lg font-semibold text-foreground tracking-tight">University Expenses</h1>
                        <p className="text-xs text-muted-foreground mt-0.5">Track salary, utilities, equipment, maintenance, and supply expenses across departments.</p>
                    </div>
                    <Button size="sm" onClick={() => setCreateModalOpen(true)}>
                        <Plus className="h-4 w-4 mr-1.5" />
                        Record Expense
                    </Button>
                </div>

                <Deferred data="stats" fallback={<MetricCardsSkeleton />}>
                    {stats && (
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:gap-4 lg:grid-cols-5 animate-in fade-in slide-in-from-top-6 duration-1000 ease-in-out">
                            <MetricCard title="Total Expense" value={formatCurrency(stats.total_spent)} icon={DollarSign} color="destructive" />
                            <MetricCard title="Pending Approval" value={`${stats.pending_approval} items`} icon={Clock} color="warning" />
                            <MetricCard title="This Month" value={formatCurrency(stats.month_expenses)} icon={Wallet} color="primary" />
                            <MetricCard title="Total Vouchers" value={`${stats.total_expenses} items`} icon={Receipt} color="accent" />
                            <MetricCard title="Rejected" value={`${stats.rejected_count} items`} icon={AlertCircle} color="destructive" />
                        </div>
                    )}
                </Deferred>

                <Deferred data="expenses" fallback={<TableSkeleton />}>
                    {expenses && (
                        <div className="border border-border/60 rounded-md bg-card p-4">
                            <DataTable
                                title="Expense Vouchers"
                                searchTitle="Search by expense no, title, vendor..."
                                columns={columns}
                                data={expenses.data}
                                pagination={{ current_page: expenses.current_page, last_page: expenses.last_page, per_page: expenses.per_page, total: expenses.total }}
                                onPageChange={(page) => handleFilterUpdate({ ...filters, page } as any)}
                                onPageSizeChange={(per_page) => handleFilterUpdate({ per_page, page: 1 } as any)}
                                serverFilters={serverFilters}
                                onServerFilterChange={(key, values) => handleFilterUpdate({ [key]: values?.[0] ?? 'all' })}
                                onServerFilterClear={() => router.get('/finance/expenses', {}, { preserveState: true })}
                                onRowClick={(row) => router.visit(`/finance/expenses/${row.original.id}`)}
                            />
                        </div>
                    )}
                </Deferred>

                {/* Record Expense Modal */}
                <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
                    <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle className="text-base font-semibold">Record University Expense</DialogTitle>
                            <DialogDescription className="text-xs">Submit an expense voucher for approval.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreateExpense} className="space-y-4 py-2">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">Expense Title <span className="text-destructive">*</span></Label>
                                <Input placeholder="e.g. Electricity bill for main campus" value={data.title} onChange={(e) => setData('title', e.target.value)} className="text-xs" required />
                                {errors.title && <p className="text-[11px] text-destructive">{errors.title}</p>}
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold">Type <span className="text-destructive">*</span></Label>
                                    <select className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring" value={data.expense_type} onChange={(e) => setData('expense_type', e.target.value)} required>
                                        {expense_types.map((t) => <option key={t} value={t}>{TYPE_LABELS[t] ?? t}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold">Amount ($) <span className="text-destructive">*</span></Label>
                                    <Input type="number" step="0.01" placeholder="1500.00" value={data.amount} onChange={(e) => setData('amount', e.target.value)} className="text-xs" required />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold">Date</Label>
                                    <Input type="date" value={data.expense_date} onChange={(e) => setData('expense_date', e.target.value)} className="text-xs" required />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold">Vendor</Label>
                                    <Input placeholder="e.g. Golis Electric" value={data.vendor} onChange={(e) => setData('vendor', e.target.value)} className="text-xs" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold">Budget Line</Label>
                                    <Input placeholder="e.g. Operations" value={data.budget_line} onChange={(e) => setData('budget_line', e.target.value)} className="text-xs" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold">Status</Label>
                                    <select className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring" value={data.status} onChange={(e) => setData('status', e.target.value)}>
                                        <option value="pending_approval">Submit for Approval</option>
                                        <option value="draft">Save as Draft</option>
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">Description</Label>
                                <textarea className="w-full min-h-[70px] rounded-md border border-input bg-background px-3 py-2 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring" placeholder="Details about this expense..." value={data.description} onChange={(e) => setData('description', e.target.value)} />
                            </div>
                            <DialogFooter className="pt-2">
                                <Button type="button" variant="outline" size="sm" onClick={() => setCreateModalOpen(false)}>Cancel</Button>
                                <Button type="submit" size="sm" disabled={processing}>
                                    <Save className="h-4 w-4 mr-1.5" />
                                    {processing ? 'Saving...' : 'Record Expense'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}

FinanceExpensesIndex.layout = { breadcrumbs };