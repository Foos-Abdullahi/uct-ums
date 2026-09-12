import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    BookOpen,
    Check,
    CheckCircle2,
    Database,
    Eye,
    FileDown,
    History,
    Hourglass,
    Layers,
    ListOrdered,
    Pencil,
    Plus,
    Power,
    RefreshCw,
    Search,
    ShieldCheck,
    X,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { MetricCard } from '@/components/tools/MetricCard';
import { DataTableRowActionsMenu, DataTableRowActionItem, DataTableRowActionItemDestructive } from '@/components/tools/table/data-table-row-actions-menu';
import { ViewPanelSkeleton } from '@/components/tools/view-panel-skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { formatDate, formatDateTime } from '@/lib/utils';
import type { BreadcrumbItem } from '@/types';

export interface AccountRow {
    id: number;
    code: number;
    name: string;
    type: string;
    normal_balance: string;
    status: string;
    description: string | null;
    is_system: boolean;
    transaction_count: number;
}

export interface AccountCategoryData {
    type: string;
    name: string;
    code_range: string;
    normal_balance: string;
    legend: string;
    suggested_code: number | null;
    accounts: AccountRow[];
}

export interface AccountDetailData {
    account: {
        id: number;
        code: number;
        name: string;
        type: string;
        type_label: string;
        normal_balance: string;
        normal_balance_label: string;
        status: string;
        description: string | null;
        is_system: boolean;
        category: { type: string; name: string; code_range: string | null } | null;
        created_at: string | null;
        updated_at: string | null;
        has_transactions: boolean;
        can_change_code: boolean;
    };
    financial: {
        transaction_count: number;
        posted_count: number;
        total_debits: number;
        total_credits: number;
        balance: number;
    };
    recent_transactions: Array<{
        id: number;
        expense_no: string;
        title: string;
        amount: number;
        status: string;
        expense_date: string | null;
    }>;
    history: Array<{
        id: number;
        action: string;
        changes: Record<string, unknown> | null;
        actor: string;
        created_at: string;
    }>;
}

export interface AccountGroupOption {
    value: string;
    label: string;
}

interface AdminChartOfAccountsProps {
    summary: {
        total_accounts: number;
        active_accounts: number;
        inactive_accounts: number;
        account_groups: number;
    };
    categories: AccountCategoryData[];
    account_groups: AccountGroupOption[];
    account_types: string[];
    normal_balances: string[];
    filters: {
        search: string;
        group: string;
        type: string;
        normal_balance: string;
        status: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/admin/dashboard' },
    { title: 'Finance', href: '/admin/finance' },
    { title: 'Chart of Accounts', href: '/admin/finance/chart-of-accounts' },
];

const GROUP_DEFAULTS: Record<string, { type: string; balance: string }> = {
    assets: { type: 'asset', balance: 'Debit' },
    liabilities: { type: 'liability', balance: 'Credit' },
    equity: { type: 'equity', balance: 'Credit' },
    revenue: { type: 'revenue', balance: 'Credit' },
    expenses_direct_academic: { type: 'expense', balance: 'Debit' },
    expenses_operating: { type: 'expense', balance: 'Debit' },
    finance_costs_other: { type: 'expense', balance: 'Debit' },
};

const TYPE_BADGE: Record<string, React.ReactNode> = {
    asset: <Badge variant="outline" className="border-sky-200 bg-sky-500/10 text-sky-700">Asset</Badge>,
    liability: <Badge variant="outline" className="border-violet-200 bg-violet-500/10 text-violet-700">Liability</Badge>,
    equity: <Badge variant="outline" className="border-teal-200 bg-teal-500/10 text-teal-700">Equity</Badge>,
    revenue: <Badge variant="outline" className="border-emerald-200 bg-emerald-500/10 text-emerald-700">Revenue</Badge>,
    expense: <Badge variant="outline" className="border-rose-200 bg-rose-500/10 text-rose-700">Expense</Badge>,
};

const BALANCE_BADGE: Record<string, React.ReactNode> = {
    debit: <Badge variant="secondary" className="text-[10px] uppercase">Debit</Badge>,
    credit: <Badge variant="secondary" className="text-[10px] uppercase">Credit</Badge>,
};

const STATUS_BADGE: Record<string, React.ReactNode> = {
    active: (
        <Badge className="border-emerald-200 bg-emerald-500/10 text-emerald-700">
            <CheckCircle2 className="mr-1 h-3 w-3" /> Active
        </Badge>
    ),
    inactive: (
        <Badge className="border-muted bg-muted/40 text-muted-foreground">
            <Hourglass className="mr-1 h-3 w-3" /> Inactive
        </Badge>
    ),
};

function formatCurrency(value: number): string {
    return `$${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

interface AddAccountSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    groups: AccountGroupOption[];
    categories: AccountCategoryData[];
}

function AddAccountSheet({ open, onOpenChange, groups, categories }: AddAccountSheetProps) {
    const { data, setData, post, processing, reset, errors } = useForm({
        account_category_id: '',
        code: '',
        name: '',
        description: '',
        status: 'active',
    });

    const selectedGroup = categories.find((c) => c.type === data.account_category_id);
    const defaults = GROUP_DEFAULTS[data.account_category_id] ?? { type: '-', balance: '-' };
    const suggestedCode = selectedGroup?.suggested_code ?? null;

    const codeState = useMemo(() => {
        if (data.code === '') {
return { state: 'empty' as const };
}

        if (!/^\d{4}$/.test(data.code)) {
return { state: 'invalid' as const, text: 'Account codes are 4-digit numbers.' };
}

        const used = categories.some((c) => c.accounts.some((a) => String(a.code) === data.code));

        if (used) {
return { state: 'used' as const, text: 'This account code is already in use.' };
}

        const group = groups.find((g) => g.value === data.account_category_id);

        if (!group) {
return { state: 'ok' as const };
}

        const cat = categories.find((c) => c.type === data.account_category_id);
        const range = cat ? cat.code_range : '';

        return { state: 'ok' as const, text: `Available — within ${group.label} (${range})` };
    }, [data.code, data.account_category_id, categories, groups]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/finance/chart-of-accounts', {
            onSuccess: () => {
                toast.success('Account created successfully.');
                onOpenChange(false);
                reset();
            },
            onError: () => toast.error('Unable to create the account. Review the errors below.'),
        });
    };

    return (
        <Sheet open={open} onOpenChange={(next) => {
            if (!next) {
reset();
}

            onOpenChange(next);
        }}>
            <SheetContent className="w-full sm:max-w-lg">
                <SheetHeader>
                    <SheetTitle className="text-base font-semibold">Add Account</SheetTitle>
                    <SheetDescription className="text-xs">
                        Create a new account in the UCT chart of accounts.
                    </SheetDescription>
                </SheetHeader>

                <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto px-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="add_group" className="text-xs font-semibold">
                            Account Group <span className="text-destructive">*</span>
                        </Label>
                        <Select
                            value={data.account_category_id}
                            onValueChange={(val) => setData('account_category_id', val)}
                            required
                        >
                            <SelectTrigger id="add_group" className="text-xs h-9">
                                <SelectValue placeholder="Select account group..." />
                            </SelectTrigger>
                            <SelectContent>
                                {groups.map((group) => (
                                    <SelectItem key={group.value} value={group.value} className="text-xs">
                                        {group.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.account_category_id && (
                            <p className="text-[11px] text-destructive">{errors.account_category_id}</p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="add_code" className="text-xs font-semibold">
                            Account Code <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="add_code"
                            type="number"
                            min={1000}
                            max={7999}
                            placeholder="e.g. 4030"
                            value={data.code}
                            onChange={(e) => setData('code', e.target.value)}
                            className="text-xs"
                            required
                        />
                        {suggestedCode !== null && data.code === '' && (
                            <p className="text-[11px] text-muted-foreground">
                                Suggested code: <span className="font-mono font-semibold text-primary">{suggestedCode}</span>
                            </p>
                        )}
                        {codeState.state === 'invalid' && data.code !== '' && (
                            <p className="text-[11px] text-destructive">Account codes are 4-digit numbers.</p>
                        )}
                        {codeState.state === 'used' && data.code !== '' && (
                            <p className="text-[11px] text-destructive">{codeState.text}</p>
                        )}
                        {codeState.state === 'ok' && (
                            <p className="text-[11px] text-emerald-600">
                                <Check className="mr-1 inline h-3 w-3" />
                                {codeState.text ?? 'Available.'}
                            </p>
                        )}
                        {errors.code && <p className="text-[11px] text-destructive">{errors.code}</p>}
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="add_name" className="text-xs font-semibold">
                            Account Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="add_name"
                            placeholder="e.g. Tuition Revenue — New Program"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            className="text-xs"
                            required
                        />
                        {errors.name && <p className="text-[11px] text-destructive">{errors.name}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-md border border-border/60 bg-muted/30 p-3">
                            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Account Type</p>
                            <p className="mt-1 text-xs font-semibold capitalize text-foreground">{defaults.type}</p>
                        </div>
                        <div className="rounded-md border border-border/60 bg-muted/30 p-3">
                            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Normal Balance</p>
                            <p className="mt-1 text-xs font-semibold capitalize text-foreground">{defaults.balance}</p>
                            <p className="text-[10px] text-muted-foreground">Auto-derived from group</p>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="add_description" className="text-xs font-semibold">Description</Label>
                        <Textarea
                            id="add_description"
                            className="min-h-[70px] text-xs"
                            placeholder="Optional details about this account..."
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="add_status" className="text-xs font-semibold">Status</Label>
                        <Select
                            value={data.status}
                            onValueChange={(val) => setData('status', val)}
                        >
                            <SelectTrigger id="add_status" className="text-xs h-9">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="active" className="text-xs">Active</SelectItem>
                                <SelectItem value="inactive" className="text-xs">Inactive</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.status && <p className="text-[11px] text-destructive">{errors.status}</p>}
                    </div>

                    <SheetFooter className="gap-2 pt-1">
                        <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" size="sm" disabled={processing}>
                            <Plus className="mr-1.5 h-4 w-4" />
                            {processing ? 'Saving...' : 'Create Account'}
                        </Button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    );
}

interface EditAccountSheetProps {
    account: AccountRow;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    groups: AccountGroupOption[];
    categories: AccountCategoryData[];
}

function EditAccountSheet({ account, open, onOpenChange, groups, categories }: EditAccountSheetProps) {
    const { data, setData, put, processing, errors } = useForm({
        account_category_id: groups.find((g) => {
            const cat = categories.find((c) => c.accounts.some((a) => a.id === account.id));

            return cat ? cat.type === g.value : false;
        })?.value ?? '',
        code: String(account.code),
        name: account.name,
        description: account.description ?? '',
        status: account.status,
    });

    const locked = account.transaction_count > 0;
    const defaults = GROUP_DEFAULTS[data.account_category_id] ?? { type: '-', balance: '-' };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/admin/finance/chart-of-accounts/${account.id}`, {
            onSuccess: () => {
                toast.success('Account updated successfully.');
                onOpenChange(false);
            },
            onError: () => toast.error('Unable to update the account. Review the errors below.'),
        });
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-lg">
                <SheetHeader>
                    <SheetTitle className="text-base font-semibold">Edit Account</SheetTitle>
                    <SheetDescription className="text-xs">
                        {account.code} · {account.name}
                    </SheetDescription>
                </SheetHeader>

                <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto px-4">
                    {locked && (
                        <div className="rounded-md border border-amber-200 bg-amber-500/10 p-3 text-[11px] text-amber-700">
                            This account has posted transactions, so its account code and group cannot be changed.
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <Label htmlFor="edit_group" className="text-xs font-semibold">
                            Account Group
                        </Label>
                        <Select
                            value={data.account_category_id}
                            onValueChange={(val) => setData('account_category_id', val)}
                            disabled={locked}
                        >
                            <SelectTrigger id="edit_group" className="text-xs h-9">
                                <SelectValue placeholder="Select account group..." />
                            </SelectTrigger>
                            <SelectContent>
                                {groups.map((group) => (
                                    <SelectItem key={group.value} value={group.value} className="text-xs">
                                        {group.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.account_category_id && (
                            <p className="text-[11px] text-destructive">{errors.account_category_id}</p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="edit_code" className="text-xs font-semibold">
                            Account Code
                        </Label>
                        <Input
                            id="edit_code"
                            type="number"
                            min={1000}
                            max={7999}
                            value={data.code}
                            onChange={(e) => setData('code', e.target.value)}
                            className="text-xs"
                            disabled={locked}
                            required
                        />
                        {locked && (
                            <p className="text-[11px] text-muted-foreground">
                                Code locks once the account has posted transactions.
                            </p>
                        )}
                        {errors.code && <p className="text-[11px] text-destructive">{errors.code}</p>}
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="edit_name" className="text-xs font-semibold">
                            Account Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="edit_name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            className="text-xs"
                            required
                        />
                        {errors.name && <p className="text-[11px] text-destructive">{errors.name}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-md border border-border/60 bg-muted/30 p-3">
                            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Account Type</p>
                            <p className="mt-1 text-xs font-semibold capitalize text-foreground">{defaults.type}</p>
                        </div>
                        <div className="rounded-md border border-border/60 bg-muted/30 p-3">
                            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Normal Balance</p>
                            <p className="mt-1 text-xs font-semibold capitalize text-foreground">{defaults.balance}</p>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="edit_description" className="text-xs font-semibold">Description</Label>
                        <Textarea
                            id="edit_description"
                            className="min-h-[70px] text-xs"
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="edit_status" className="text-xs font-semibold">Status</Label>
                        <Select
                            value={data.status}
                            onValueChange={(val) => setData('status', val)}
                        >
                            <SelectTrigger id="edit_status" className="text-xs h-9">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="active" className="text-xs">Active</SelectItem>
                                <SelectItem value="inactive" className="text-xs">Inactive</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.status && <p className="text-[11px] text-destructive">{errors.status}</p>}
                    </div>

                    <SheetFooter className="gap-2 pt-1">
                        <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" size="sm" disabled={processing}>
                            <Check className="mr-1.5 h-4 w-4" />
                            {processing ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    );
}

interface DetailSheetProps {
    account: AccountRow | null;
    data: AccountDetailData | null;
    loading: boolean;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onEdit: (account: AccountRow) => void;
    onToggleStatus: (account: AccountRow) => void;
    onTransactions: (account: AccountRow) => void;
}

function DetailSheet({ account, data, loading, open, onOpenChange, onEdit, onToggleStatus, onTransactions }: DetailSheetProps) {
    const info = data?.account;
    const financial = data?.financial;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
                {loading || !account || !info ? (
                    <>
                        <SheetHeader>
                            <SheetTitle className="text-base font-semibold">Account Details</SheetTitle>
                        </SheetHeader>
                        <div className="px-4">
                            <ViewPanelSkeleton rows={8} />
                        </div>
                    </>
                ) : (
                    <>
                        <SheetHeader className="pb-0">
                            <div className="flex items-center justify-between gap-3 pr-6">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="font-mono text-sm font-semibold">
                                            {info.code}
                                        </Badge>
                                        {STATUS_BADGE[info.status]}
                                    </div>
                                    <SheetTitle className="mt-2 text-base font-semibold leading-snug">
                                        {info.name}
                                    </SheetTitle>
                                    <SheetDescription className="flex items-center gap-2 text-xs">
                                        {TYPE_BADGE[info.type]}
                                        {BALANCE_BADGE[info.normal_balance]}
                                        {info.is_system && (
                                            <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary text-[10px]">
                                                <ShieldCheck className="mr-1 h-3 w-3" /> System
                                            </Badge>
                                        )}
                                    </SheetDescription>
                                </div>
                            </div>
                        </SheetHeader>

                        <div className="space-y-5 px-4">
                            <section>
                                <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                    Account Information
                                </h3>
                                <div className="rounded-md border border-border/60 bg-muted/20 divide-y divide-border/60 text-xs">
                                    <div className="flex justify-between px-3 py-2">
                                        <span className="text-muted-foreground">Account Code</span>
                                        <span className="font-mono font-semibold text-foreground">{info.code}</span>
                                    </div>
                                    <div className="flex justify-between px-3 py-2">
                                        <span className="text-muted-foreground">Account Group</span>
                                        <span className="font-medium text-foreground">{info.category?.name ?? '—'}</span>
                                    </div>
                                    <div className="flex justify-between px-3 py-2">
                                        <span className="text-muted-foreground">Type</span>
                                        <span className="font-medium text-foreground">{info.type_label}</span>
                                    </div>
                                    <div className="flex justify-between px-3 py-2">
                                        <span className="text-muted-foreground">Normal Balance</span>
                                        <span className="font-medium text-foreground">{info.normal_balance_label}</span>
                                    </div>
                                    <div className="flex justify-between px-3 py-2">
                                        <span className="text-muted-foreground">Code Range</span>
                                        <span className="font-mono font-medium text-foreground">{info.category?.code_range ?? '—'}</span>
                                    </div>
                                    <div className="flex justify-between px-3 py-2">
                                        <span className="text-muted-foreground">Status</span>
                                        <span className="font-medium capitalize text-foreground">{info.status}</span>
                                    </div>
                                    <div className="px-3 py-2">
                                        <p className="text-muted-foreground">Description</p>
                                        <p className="mt-0.5 text-foreground">{info.description || 'No description provided.'}</p>
                                    </div>
                                    <div className="flex justify-between px-3 py-2">
                                        <span className="text-muted-foreground">Created</span>
                                        <span className="font-medium text-foreground">{formatDate(info.created_at)}</span>
                                    </div>
                                    <div className="flex justify-between px-3 py-2">
                                        <span className="text-muted-foreground">Last Updated</span>
                                        <span className="font-medium text-foreground">{formatDate(info.updated_at)}</span>
                                    </div>
                                </div>
                            </section>

                            <section>
                                <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                    Financial Activity
                                </h3>
                                {financial && financial.transaction_count > 0 ? (
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="rounded-md border border-border/60 p-3">
                                            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                                                {info.normal_balance === 'credit' ? 'Total Credits' : 'Total Debits'}
                                            </p>
                                            <p className="mt-1 text-sm font-semibold text-foreground tabular-nums">
                                                {formatCurrency(financial.total_debits)}
                                            </p>
                                        </div>
                                        <div className="rounded-md border border-border/60 p-3">
                                            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Transactions</p>
                                            <p className="mt-1 text-sm font-semibold text-foreground tabular-nums">
                                                {financial.transaction_count} ({financial.posted_count} posted)
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="rounded-md border border-dashed border-border/60 p-4 text-center">
                                        <Database className="mx-auto h-5 w-5 text-muted-foreground/50" />
                                        <p className="mt-1 text-xs font-medium text-foreground">No financial activity yet</p>
                                        <p className="text-[11px] text-muted-foreground">
                                            No transactions have been posted to this account.
                                        </p>
                                    </div>
                                )}
                            </section>

                            <section>
                                <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                    Recent Transactions
                                </h3>
                                {data.recent_transactions.length > 0 ? (
                                    <div className="divide-y divide-border/60 rounded-md border border-border/60 text-xs">
                                        {data.recent_transactions.map((tx) => (
                                            <div key={tx.id} className="flex items-center justify-between gap-2 px-3 py-2">
                                                <div className="min-w-0">
                                                    <p className="truncate font-medium text-foreground">
                                                        <span className="font-mono text-[10px] text-muted-foreground">{tx.expense_no}</span> · {tx.title}
                                                    </p>
                                                    <p className="text-[10px] text-muted-foreground">{formatDate(tx.expense_date)} · {tx.status.replace('_', ' ')}</p>
                                                </div>
                                                <span className="shrink-0 font-semibold tabular-nums text-foreground">
                                                    {formatCurrency(tx.amount)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-[11px] text-muted-foreground">
                                        No transactions have been posted to this account.
                                    </p>
                                )}
                            </section>

                            <section>
                                <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                    Activity History
                                </h3>
                                {data.history.length > 0 ? (
                                    <div className="space-y-2">
                                        {data.history.map((entry) => (
                                            <div key={entry.id} className="flex items-start gap-2 rounded-md border border-border/60 px-3 py-2">
                                                <History className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                                <div className="min-w-0 text-xs">
                                                    <p className="font-medium text-foreground capitalize">{entry.action.replace('_', ' ')}</p>
                                                    <p className="text-[10px] text-muted-foreground">
                                                        {entry.actor} · {formatDateTime(entry.created_at)}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-[11px] text-muted-foreground">No recorded history yet.</p>
                                )}
                            </section>
                        </div>

                        <SheetFooter className="gap-2 px-4">
                            <Button type="button" variant="outline" size="sm" onClick={() => onTransactions(account)}>
                                <ListOrdered className="mr-1.5 h-4 w-4" />
                                View Transactions
                            </Button>
                            <Button type="button" variant="outline" size="sm" onClick={() => onEdit(account)}>
                                <Pencil className="mr-1.5 h-4 w-4" />
                                Edit Account
                            </Button>
                            <Button
                                type="button"
                                variant={info.status === 'active' ? 'destructive' : 'default'}
                                size="sm"
                                onClick={() => onToggleStatus(account)}
                            >
                                {info.status === 'active' ? <Power className="mr-1.5 h-4 w-4" /> : <RefreshCw className="mr-1.5 h-4 w-4" />}
                                {info.status === 'active' ? 'Deactivate' : 'Reactivate'}
                            </Button>
                        </SheetFooter>
                    </>
                )}
            </SheetContent>
        </Sheet>
    );
}

export default function AdminChartOfAccounts({
    summary,
    categories,
    account_groups = [],
    account_types = [],
    normal_balances = [],
    filters,
}: AdminChartOfAccountsProps) {
    const [addSheetOpen, setAddSheetOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<AccountRow | null>(null);
    const [statusTarget, setStatusTarget] = useState<AccountRow | null>(null);
    const [statusDialogOpen, setStatusDialogOpen] = useState(false);
    const [statusProcessing, setStatusProcessing] = useState(false);
    const [detail, setDetail] = useState<{ account: AccountRow | null; data: AccountDetailData | null; loading: boolean }>({
        account: null,
        data: null,
        loading: false,
    });

    const totalInRange = categories.reduce((sum, cat) => sum + cat.accounts.length, 0);

    const [searchInput, setSearchInput] = useState(filters.search);

    const fetchDetails = async (account: AccountRow) => {
        setDetail({ account, data: null, loading: true });

        try {
            const response = await fetch(`/admin/finance/chart-of-accounts/${account.id}`, {
                headers: { Accept: 'application/json' },
            });

            if (!response.ok) {
                throw new Error('bad response');
            }

            const json = (await response.json()) as AccountDetailData;
            setDetail({ account, data: json, loading: false });
        } catch {
            setDetail({ account, data: null, loading: false });
            toast.error('Failed to load account details.');
        }
    };

    const handleFilterUpdate = (updated: Partial<typeof filters>) => {
        const query = { ...filters, ...updated } as Record<string, string>;

        const cleanQuery: Record<string, string> = {};
        Object.entries(query).forEach(([key, val]) => {
            if (val !== '' && val !== 'all') {
                cleanQuery[key] = val;
            }
        });

        router.get('/admin/finance/chart-of-accounts', cleanQuery, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchInput !== filters.search) {
                handleFilterUpdate({ search: searchInput });
            }
        }, 350);

        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchInput, filters.search]);

    const confirmToggleStatus = () => {
        if (!statusTarget) {
return;
}

        setStatusProcessing(true);

        const willBeActive = statusTarget.status === 'inactive';

        router.post(`/admin/finance/chart-of-accounts/${statusTarget.id}/status`, {}, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(
                    willBeActive
                        ? `Account ${statusTarget.code} · ${statusTarget.name} reactivated.`
                        : `Account ${statusTarget.code} · ${statusTarget.name} deactivated.`
                );
                setStatusDialogOpen(false);
                setStatusTarget(null);
                setStatusProcessing(false);
            },
            onError: () => {
                toast.error('Failed to update account status.');
                setStatusProcessing(false);
            },
        });
    };

    const openEdit = (account: AccountRow) => {
        setDetail((d) => ({ ...d, account: null, data: null }));
        setEditTarget(account);
    };

    const openStatusDialog = (account: AccountRow) => {
        setStatusTarget(account);
        setStatusDialogOpen(true);
    };

    const isEmpty = summary.total_accounts === 0;

    return (
        <>
            <Head title="Chart of Accounts" />

            <div className="p-6 space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h1 className="text-lg font-semibold text-foreground tracking-tight">Chart of Accounts</h1>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Manage, organize and maintain the university's financial accounts.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/admin/finance/chart-of-accounts/import">
                                <FileDown className="h-4 w-4 mr-1.5" />
                                Import Accounts
                            </Link>
                        </Button>
                        <Button size="sm" onClick={() => setAddSheetOpen(true)}>
                            <Plus className="h-4 w-4 mr-1.5" />
                            Add Account
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:gap-4 lg:grid-cols-4">
                    <MetricCard title="Total Accounts" value={summary.total_accounts} icon={BookOpen} color="primary" />
                    <MetricCard title="Active Accounts" value={summary.active_accounts} icon={CheckCircle2} color="success" />
                    <MetricCard title="Inactive Accounts" value={summary.inactive_accounts} icon={Hourglass} color="warning" />
                    <MetricCard title="Account Groups" value={summary.account_groups} icon={Layers} color="accent" />
                </div>

                <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                    <div className="relative sm:max-w-xs w-full">
                        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search by code, name or description..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            className="pl-8 text-xs"
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Select
                            value={filters.group || 'all'}
                            onValueChange={(val) => handleFilterUpdate({ group: val })}
                        >
                            <SelectTrigger className="h-9 text-xs w-[140px]">
                                <SelectValue placeholder="All Groups" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all" className="text-xs">All Groups</SelectItem>
                                {account_groups.map((group) => (
                                    <SelectItem key={group.value} value={group.value} className="text-xs">
                                        {group.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select
                            value={filters.type || 'all'}
                            onValueChange={(val) => handleFilterUpdate({ type: val })}
                        >
                            <SelectTrigger className="h-9 text-xs w-[120px]">
                                <SelectValue placeholder="All Types" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all" className="text-xs">All Types</SelectItem>
                                {account_types.map((type) => (
                                    <SelectItem key={type} value={type} className="text-xs">
                                        {type.charAt(0).toUpperCase() + type.slice(1)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select
                            value={filters.normal_balance || 'all'}
                            onValueChange={(val) => handleFilterUpdate({ normal_balance: val })}
                        >
                            <SelectTrigger className="h-9 text-xs w-[130px]">
                                <SelectValue placeholder="All Balances" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all" className="text-xs">All Balances</SelectItem>
                                {normal_balances.map((balance) => (
                                    <SelectItem key={balance} value={balance} className="text-xs">
                                        {balance.charAt(0).toUpperCase() + balance.slice(1)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select
                            value={filters.status || 'all'}
                            onValueChange={(val) => handleFilterUpdate({ status: val })}
                        >
                            <SelectTrigger className="h-9 text-xs w-[120px]">
                                <SelectValue placeholder="All Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all" className="text-xs">All Status</SelectItem>
                                <SelectItem value="active" className="text-xs">Active</SelectItem>
                                <SelectItem value="inactive" className="text-xs">Inactive</SelectItem>
                            </SelectContent>
                        </Select>
                        {(filters.search !== '' || filters.group !== 'all' || filters.type !== 'all'
                            || filters.normal_balance !== 'all' || filters.status !== 'all') && (
                            <Button variant="ghost" size="sm" onClick={() => {
 setSearchInput(''); router.get('/admin/finance/chart-of-accounts', {}, { preserveState: true }); 
}}>
                                <X className="h-3.5 w-3.5 mr-1" />
                                Clear
                            </Button>
                        )}
                    </div>
                </div>

                {isEmpty ? (
                    <div className="rounded-md border border-dashed border-border/60 p-12 text-center">
                        <BookOpen className="mx-auto h-8 w-8 text-muted-foreground/50" />
                        <h2 className="mt-3 text-sm font-semibold text-foreground">No accounts found</h2>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Create your first account or import the UCT Chart of Accounts.
                        </p>
                        <div className="mt-4 flex items-center justify-center gap-2">
                            <Button variant="outline" size="sm" asChild>
                                <Link href="/admin/finance/chart-of-accounts/import">Import Accounts</Link>
                            </Button>
                            <Button size="sm" onClick={() => setAddSheetOpen(true)}>
                                <Plus className="h-4 w-4 mr-1.5" /> Add Account
                            </Button>
                        </div>
                    </div>
                ) : totalInRange === 0 ? (
                    <div className="rounded-md border border-dashed border-border/60 p-12 text-center">
                        <Search className="mx-auto h-8 w-8 text-muted-foreground/50" />
                        <h2 className="mt-3 text-sm font-semibold text-foreground">No accounts match your search</h2>
                        <p className="mt-1 text-xs text-muted-foreground">Try a different account name or code.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {categories.map((category) => (
                            <div key={category.type} className="rounded-md border border-border/60 bg-card p-4">
                                <div className="mb-3 flex items-center justify-between gap-3">
                                    <div>
                                        <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                                            {category.name}
                                        </h2>
                                        <p className="mt-0.5 text-[10px] text-muted-foreground">{category.legend}</p>
                                    </div>
                                    <Badge variant="outline" className="font-mono text-[10px] font-semibold shrink-0">
                                        {category.code_range}
                                    </Badge>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-border/60 text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                                                <th className="py-2 pr-3 font-medium">Code</th>
                                                <th className="py-2 pr-3 font-medium">Account</th>
                                                <th className="hidden py-2 pr-3 font-medium sm:table-cell">Type</th>
                                                <th className="hidden py-2 pr-3 font-medium md:table-cell">Normal Balance</th>
                                                <th className="py-2 pr-3 font-medium">Status</th>
                                                <th className="py-2 text-right font-medium">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/40">
                                            {category.accounts.map((account) => (
                                                <tr
                                                    key={account.id}
                                                    className="group cursor-pointer transition-colors hover:bg-muted/30"
                                                    onClick={() => fetchDetails(account)}
                                                >
                                                    <td className="py-2.5 pr-3">
                                                        <Badge variant="outline" className="font-mono text-[11px] font-semibold">
                                                            {account.code}
                                                        </Badge>
                                                    </td>
                                                    <td className="py-2.5 pr-3">
                                                        <div className="max-w-[260px]">
                                                            <p className="truncate text-xs font-medium text-foreground">{account.name}</p>
                                                            <p className="truncate text-[10px] text-muted-foreground">
                                                                {account.is_system ? 'Core UCT account' : 'User-defined'}
                                                                {account.transaction_count > 0 && ` · ${account.transaction_count} transaction${account.transaction_count === 1 ? '' : 's'}`}
                                                            </p>
                                                        </div>
                                                    </td>
                                                    <td className="hidden py-2.5 pr-3 sm:table-cell">{TYPE_BADGE[account.type]}</td>
                                                    <td className="hidden py-2.5 pr-3 md:table-cell">{BALANCE_BADGE[account.normal_balance]}</td>
                                                    <td className="py-2.5 pr-3">{STATUS_BADGE[account.status]}</td>
                                                    <td className="py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                                                        <DataTableRowActionsMenu trigger="icon">
                                                            <DataTableRowActionItem onClick={() => fetchDetails(account)}>
                                                                <Eye className="h-3.5 w-3.5" /> View Account
                                                            </DataTableRowActionItem>
                                                            <DataTableRowActionItem onClick={() => openEdit(account)}>
                                                                <Pencil className="h-3.5 w-3.5" /> Edit Account
                                                            </DataTableRowActionItem>
                                                            <DataTableRowActionItem asChild>
                                                                <Link href={`/admin/expenses?account_id=${account.id}`}>
                                                                    <ListOrdered className="h-3.5 w-3.5" /> View Transactions
                                                                </Link>
                                                            </DataTableRowActionItem>
                                                            <DataTableRowActionItem onClick={() => fetchDetails(account)}>
                                                                <History className="h-3.5 w-3.5" /> View History
                                                            </DataTableRowActionItem>
                                                            {account.status === 'active' ? (
                                                                <DataTableRowActionItemDestructive onClick={() => openStatusDialog(account)}>
                                                                    <Power className="h-3.5 w-3.5" /> Deactivate
                                                                </DataTableRowActionItemDestructive>
                                                            ) : (
                                                                <DataTableRowActionItem onClick={() => openStatusDialog(account)}>
                                                                    <RefreshCw className="h-3.5 w-3.5" /> Reactivate
                                                                </DataTableRowActionItem>
                                                            )}
                                                        </DataTableRowActionsMenu>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <AddAccountSheet
                    open={addSheetOpen}
                    onOpenChange={setAddSheetOpen}
                    groups={account_groups}
                    categories={categories}
                />

                {editTarget && (
                    <EditAccountSheet
                        account={editTarget}
                        open
                        onOpenChange={(open) => {
 if (!open) {
setEditTarget(null);
} 
}}
                        groups={account_groups}
                        categories={categories}
                    />
                )}

                <DetailSheet
                    account={detail.account}
                    data={detail.data}
                    loading={detail.loading}
                    open={!!detail.account || detail.loading}
                    onOpenChange={(open) => {
 if (!open) {
setDetail({ account: null, data: null, loading: false });
} 
}}
                    onEdit={openEdit}
                    onToggleStatus={openStatusDialog}
                    onTransactions={(account) => router.visit(`/admin/expenses?account_id=${account.id}`)}
                />

                <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-base font-semibold">
                                {statusTarget?.status === 'active' ? 'Deactivate Account?' : 'Reactivate Account?'}
                            </DialogTitle>
                            <DialogDescription className="text-xs">
                                {statusTarget?.code} · {statusTarget?.name}
                            </DialogDescription>
                        </DialogHeader>
                        <p className="text-xs text-muted-foreground">
                            {statusTarget?.status === 'active' ? (
                                <>This account will no longer be available for new financial transactions. Historical transactions will remain intact.</>
                            ) : (
                                <>This account will become available for new financial transactions again.</>
                            )}
                        </p>
                        <DialogFooter className="gap-2 pt-2">
                            <Button type="button" variant="outline" size="sm" onClick={() => setStatusDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                variant={statusTarget?.status === 'active' ? 'destructive' : 'default'}
                                size="sm"
                                disabled={statusProcessing}
                                onClick={confirmToggleStatus}
                            >
                                {statusTarget?.status === 'active' ? (
                                    statusProcessing ? 'Deactivating...' : 'Deactivate Account'
                                ) : (
                                    statusProcessing ? 'Reactivating...' : 'Reactivate Account'
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}

AdminChartOfAccounts.layout = { breadcrumbs };