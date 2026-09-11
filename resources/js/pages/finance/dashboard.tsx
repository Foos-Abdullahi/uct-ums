import React from 'react';
import { Deferred, Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { MetricCard } from '@/components/tools/MetricCard';
import { MetricCardsSkeleton } from '@/components/tools/metric-cards-skeleton';
import { UctPanelCard } from '@/components/tools/uct-panel-card';
import type { BreadcrumbItem } from '@/types';
import {
    Wallet,
    CreditCard,
    FileText,
    Receipt,
    TrendingUp,
    AlertCircle,
    CheckCircle2,
    Clock,
    DollarSign,
    ArrowRight,
    HandCoins,
    Shield,
} from 'lucide-react';

interface FinanceDashboardProps {
    stats?: {
        total_collected: number;
        total_billed: number;
        outstanding: number;
        total_expenses: number;
        pending_approvals: number;
        net_flow: number;
    };
    recent_payments?: Array<{
        id: number;
        transaction_no: string;
        amount: number;
        payment_method: string;
        payment_date: string;
        status: string;
        student?: {
            matric_no: string;
            user?: { name: string };
            program?: { name: string };
        };
    }>;
    recent_invoices?: Array<{
        id: number;
        invoice_no: string;
        title: string;
        type: string;
        amount: number;
        paid_amount: number;
        due_date: string | null;
        status: string;
        student?: {
            matric_no: string;
            user?: { name: string };
        };
    }>;
    recent_expenses?: Array<{
        id: number;
        expense_no: string;
        title: string;
        expense_type: string;
        amount: number;
        status: string;
        expense_date: string;
        creator?: { name: string };
    }>;
    expenses_by_type?: Array<{
        expense_type: string;
        total: number;
        count: number;
    }>;
    revenue_by_method?: Array<{
        payment_method: string;
        total: number;
        count: number;
    }>;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/finance/dashboard' },
];

const EXPENSE_LABELS: Record<string, string> = {
    salary: 'Salary',
    utilities: 'Utilities',
    equipment: 'Equipment',
    maintenance: 'Maintenance',
    supplies: 'Supplies',
    others: 'Others',
};

const STATUS_COLORS: Record<string, string> = {
    paid: 'bg-emerald-500/10 text-emerald-700 text-[10px]',
    pending: 'bg-amber-500/10 text-amber-700 text-[10px]',
    rejected: 'bg-destructive/10 text-destructive text-[10px]',
    approved: 'bg-blue-500/10 text-blue-700 text-[10px]',
    pending_approval: 'bg-amber-500/10 text-amber-700 text-[10px]',
    partial: 'bg-amber-500/10 text-amber-700 text-[10px]',
    unpaid: 'bg-destructive/10 text-destructive text-[10px]',
};

export default function FinanceDashboard({
    stats,
    recent_payments = [],
    recent_invoices = [],
    recent_expenses = [],
    expenses_by_type = [],
    revenue_by_method = [],
}: FinanceDashboardProps) {
    const formatCurrency = (val: number) => `$${Number(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    return (
        <>
            <Head title="Finance Dashboard" />

            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h1 className="text-lg font-semibold text-foreground tracking-tight">
                            Finance Control Center
                        </h1>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Real-time fee collections, university expenses, invoice management, and multi-level approval queue.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/finance/expenses">
                                <Receipt className="h-4 w-4 mr-1.5" />
                                Expenses
                            </Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/finance/invoices">
                                <FileText className="h-4 w-4 mr-1.5" />
                                Invoices
                            </Link>
                        </Button>
                        <Button size="sm" asChild>
                            <Link href="/finance/payments">
                                <CreditCard className="h-4 w-4 mr-1.5" />
                                Payments
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Metric Cards */}
                <Deferred data="stats" fallback={<MetricCardsSkeleton />}>
                    {stats && (
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:gap-4 lg:grid-cols-6 animate-in fade-in slide-in-from-top-6 duration-1000 ease-in-out">
                            <MetricCard
                                title="Total Collected"
                                value={formatCurrency(stats.total_collected)}
                                icon={CheckCircle2}
                                color="success"
                            />
                            <MetricCard
                                title="Total Expenses"
                                value={formatCurrency(stats.total_expenses)}
                                icon={DollarSign}
                                color="destructive"
                            />
                            <MetricCard
                                title="Net Flow"
                                value={formatCurrency(stats.net_flow)}
                                icon={TrendingUp}
                                color="success"
                            />
                            <MetricCard
                                title="Outstanding Due"
                                value={formatCurrency(stats.outstanding)}
                                icon={AlertCircle}
                                color="destructive"
                            />
                            <MetricCard
                                title="Pending Approvals"
                                value={`${stats.pending_approvals} items`}
                                icon={Clock}
                                color="warning"
                            />
                            <MetricCard
                                title="Total Invoiced"
                                value={formatCurrency(stats.total_billed)}
                                icon={FileText}
                                color="primary"
                            />
                        </div>
                    )}
                </Deferred>

                {/* Main 2-Column Analytics */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        {/* Recent Payments */}
                        <UctPanelCard
                            title="Recent Payments"
                            description="Latest student fee payments."
                            icon={CreditCard}
                            actions={
                                <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
                                    <Link href="/finance/payments">
                                        View All <ArrowRight className="h-3.5 w-3.5 ml-1" />
                                    </Link>
                                </Button>
                            }
                        >
                            <Deferred data="recent_payments" fallback={<div className="h-40 animate-pulse bg-muted/20 rounded" />}>
                                {recent_payments.length === 0 ? (
                                    <p className="text-xs text-muted-foreground italic py-6 text-center">No payment transactions recorded yet.</p>
                                ) : (
                                    <div className="divide-y divide-border/40 text-xs pt-1">
                                        {recent_payments.map((pmt) => (
                                            <div key={pmt.id} className="flex items-center justify-between py-2.5 px-1 hover:bg-muted/20 rounded transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="rounded-full bg-emerald-500/10 p-2 text-emerald-600">
                                                        <DollarSign className="h-4 w-4" />
                                                    </div>
                                                    <div>
                                                        <span className="font-semibold text-foreground">{pmt.student?.user?.name || 'Student'}</span>
                                                        <p className="text-[11px] text-muted-foreground mt-0.5">
                                                            {pmt.transaction_no} · {pmt.payment_method.replace('_', ' ').toUpperCase()} · {pmt.payment_date}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">+{formatCurrency(pmt.amount)}</p>
                                                    <Badge className={STATUS_COLORS[pmt.status] ?? 'bg-muted text-muted-foreground text-[10px]'}>
                                                        {pmt.status}
                                                    </Badge>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </Deferred>
                        </UctPanelCard>

                        {/* Recent Expenses */}
                        <UctPanelCard
                            title="Recent Expenses"
                            description="Latest university expense vouchers."
                            icon={Receipt}
                            actions={
                                <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
                                    <Link href="/finance/expenses">
                                        View All <ArrowRight className="h-3.5 w-3.5 ml-1" />
                                    </Link>
                                </Button>
                            }
                        >
                            <Deferred data="recent_expenses" fallback={<div className="h-40 animate-pulse bg-muted/20 rounded" />}>
                                {recent_expenses.length === 0 ? (
                                    <p className="text-xs text-muted-foreground italic py-6 text-center">No expenses recorded yet.</p>
                                ) : (
                                    <div className="divide-y divide-border/40 text-xs pt-1">
                                        {recent_expenses.map((exp) => (
                                            <div key={exp.id} className="flex items-center justify-between py-2.5 px-1 hover:bg-muted/20 rounded transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="rounded-full bg-destructive/10 p-2 text-destructive">
                                                        <HandCoins className="h-4 w-4" />
                                                    </div>
                                                    <div>
                                                        <span className="font-semibold text-foreground">{exp.title}</span>
                                                        <p className="text-[11px] text-muted-foreground mt-0.5">
                                                            <Badge variant="secondary" className="text-[10px] capitalize mr-1">{EXPENSE_LABELS[exp.expense_type] ?? exp.expense_type}</Badge>
                                                            {exp.expense_date} · {exp.creator?.name}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-destructive text-sm">-{formatCurrency(exp.amount)}</p>
                                                    <Badge className={STATUS_COLORS[exp.status] ?? 'bg-muted text-muted-foreground text-[10px]'}>
                                                        {exp.status.replace('_', ' ')}
                                                    </Badge>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </Deferred>
                        </UctPanelCard>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                        {/* Revenue by Payment Method */}
                        <UctPanelCard
                            title="Payment Channels"
                            description="Breakdown by collection method."
                            icon={Wallet}
                        >
                            <Deferred data="revenue_by_method" fallback={<div className="h-32 animate-pulse bg-muted/20 rounded" />}>
                                {revenue_by_method.length === 0 ? (
                                    <p className="text-xs text-muted-foreground italic py-4 text-center">No payment data available.</p>
                                ) : (
                                    <div className="space-y-3 pt-2">
                                        {revenue_by_method.map((method) => (
                                            <div key={method.payment_method} className="space-y-1">
                                                <div className="flex justify-between text-xs font-medium">
                                                    <span className="capitalize text-foreground">{method.payment_method.replace('_', ' ')}</span>
                                                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">{formatCurrency(method.total)}</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-primary rounded-full"
                                                        style={{ width: `${Math.min(100, Math.max(10, (Number(method.total) / (stats?.total_collected || 1)) * 100))}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </Deferred>
                        </UctPanelCard>

                        {/* Expenses by Type */}
                        <UctPanelCard
                            title="Expense Distribution"
                            description="Operational spending by category."
                            icon={Receipt}
                        >
                            <Deferred data="expenses_by_type" fallback={<div className="h-32 animate-pulse bg-muted/20 rounded" />}>
                                {expenses_by_type.length === 0 ? (
                                    <p className="text-xs text-muted-foreground italic py-4 text-center">No expense data available.</p>
                                ) : (
                                    <div className="divide-y divide-border/40 text-xs pt-1">
                                        {expenses_by_type.map((type) => (
                                            <div key={type.expense_type} className="flex items-center justify-between py-2">
                                                <span className="capitalize font-medium text-foreground">{EXPENSE_LABELS[type.expense_type] ?? type.expense_type}</span>
                                                <div className="text-right">
                                                    <span className="font-semibold text-foreground">{formatCurrency(type.total)}</span>
                                                    <span className="text-[10px] text-muted-foreground block">{type.count} vouchers</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </Deferred>
                        </UctPanelCard>

                        {/* Quick Links */}
                        <Card>
                            <CardContent className="pt-5 space-y-2">
                                <p className="text-xs font-semibold text-foreground mb-3">Quick Actions</p>
                                <Button variant="outline" size="sm" className="w-full justify-start text-xs" asChild>
                                    <Link href="/finance/approvals">
                                        <Shield className="h-4 w-4 mr-2" />
                                        My Approval Queue
                                    </Link>
                                </Button>
                                <Button variant="outline" size="sm" className="w-full justify-start text-xs" asChild>
                                    <Link href="/finance/invoices">
                                        <FileText className="h-4 w-4 mr-2" />
                                        All Invoices
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
}

FinanceDashboard.layout = { breadcrumbs };