import { Deferred, Head, Link } from '@inertiajs/react';
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
import React from 'react';
import { MetricCardsSkeleton } from '@/components/tools/metric-cards-skeleton';
import { MetricCard } from '@/components/tools/MetricCard';
import { UctPanelCard } from '@/components/tools/uct-panel-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { BreadcrumbItem } from '@/types';

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
    recent_expenses = [],
    expenses_by_type = [],
    revenue_by_method = [],
}: FinanceDashboardProps) {
    const formatCurrency = (val: number) =>
        `$${Number(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    return (
        <>
            <Head title="Finance Dashboard" />

            <div className="space-y-6 p-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h1 className="text-lg font-semibold tracking-tight text-foreground">
                            Finance Control Center
                        </h1>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            Real-time fee collections, university expenses,
                            invoice management, and multi-level approval queue.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/finance/expenses">
                                <Receipt className="mr-1.5 h-4 w-4" />
                                Expenses
                            </Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/finance/invoices">
                                <FileText className="mr-1.5 h-4 w-4" />
                                Invoices
                            </Link>
                        </Button>
                        <Button size="sm" asChild>
                            <Link href="/finance/payments">
                                <CreditCard className="mr-1.5 h-4 w-4" />
                                Payments
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Metric Cards */}
                <Deferred data="stats" fallback={<MetricCardsSkeleton />}>
                    {stats && (
                        <div className="grid animate-in grid-cols-1 gap-2 duration-1000 ease-in-out fade-in slide-in-from-top-6 sm:grid-cols-2 md:gap-4 lg:grid-cols-6">
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
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="space-y-6 lg:col-span-2">
                        {/* Recent Payments */}
                        <UctPanelCard
                            title="Recent Payments"
                            description="Latest student fee payments."
                            icon={CreditCard}
                            actions={
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs"
                                    asChild
                                >
                                    <Link href="/finance/payments">
                                        View All{' '}
                                        <ArrowRight className="ml-1 h-3.5 w-3.5" />
                                    </Link>
                                </Button>
                            }
                        >
                            <Deferred
                                data="recent_payments"
                                fallback={
                                    <div className="h-40 animate-pulse rounded bg-muted/20" />
                                }
                            >
                                {recent_payments.length === 0 ? (
                                    <p className="py-6 text-center text-xs text-muted-foreground italic">
                                        No payment transactions recorded yet.
                                    </p>
                                ) : (
                                    <div className="divide-y divide-border/40 pt-1 text-xs">
                                        {recent_payments.map((pmt) => (
                                            <div
                                                key={pmt.id}
                                                className="flex items-center justify-between rounded px-1 py-2.5 transition-colors hover:bg-muted/20"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="rounded-full bg-emerald-500/10 p-2 text-emerald-600">
                                                        <DollarSign className="h-4 w-4" />
                                                    </div>
                                                    <div>
                                                        <span className="font-semibold text-foreground">
                                                            {pmt.student?.user
                                                                ?.name ||
                                                                'Student'}
                                                        </span>
                                                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                                                            {pmt.transaction_no}{' '}
                                                            ·{' '}
                                                            {pmt.payment_method
                                                                .replace(
                                                                    '_',
                                                                    ' ',
                                                                )
                                                                .toUpperCase()}{' '}
                                                            · {pmt.payment_date}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                                        +
                                                        {formatCurrency(
                                                            pmt.amount,
                                                        )}
                                                    </p>
                                                    <Badge
                                                        className={
                                                            STATUS_COLORS[
                                                                pmt.status
                                                            ] ??
                                                            'bg-muted text-[10px] text-muted-foreground'
                                                        }
                                                    >
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
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs"
                                    asChild
                                >
                                    <Link href="/finance/expenses">
                                        View All{' '}
                                        <ArrowRight className="ml-1 h-3.5 w-3.5" />
                                    </Link>
                                </Button>
                            }
                        >
                            <Deferred
                                data="recent_expenses"
                                fallback={
                                    <div className="h-40 animate-pulse rounded bg-muted/20" />
                                }
                            >
                                {recent_expenses.length === 0 ? (
                                    <p className="py-6 text-center text-xs text-muted-foreground italic">
                                        No expenses recorded yet.
                                    </p>
                                ) : (
                                    <div className="divide-y divide-border/40 pt-1 text-xs">
                                        {recent_expenses.map((exp) => (
                                            <div
                                                key={exp.id}
                                                className="flex items-center justify-between rounded px-1 py-2.5 transition-colors hover:bg-muted/20"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="rounded-full bg-destructive/10 p-2 text-destructive">
                                                        <HandCoins className="h-4 w-4" />
                                                    </div>
                                                    <div>
                                                        <span className="font-semibold text-foreground">
                                                            {exp.title}
                                                        </span>
                                                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                                                            <Badge
                                                                variant="secondary"
                                                                className="mr-1 text-[10px] capitalize"
                                                            >
                                                                {EXPENSE_LABELS[
                                                                    exp
                                                                        .expense_type
                                                                ] ??
                                                                    exp.expense_type}
                                                            </Badge>
                                                            {exp.expense_date} ·{' '}
                                                            {exp.creator?.name}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-bold text-destructive">
                                                        -
                                                        {formatCurrency(
                                                            exp.amount,
                                                        )}
                                                    </p>
                                                    <Badge
                                                        className={
                                                            STATUS_COLORS[
                                                                exp.status
                                                            ] ??
                                                            'bg-muted text-[10px] text-muted-foreground'
                                                        }
                                                    >
                                                        {exp.status.replace(
                                                            '_',
                                                            ' ',
                                                        )}
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
                            <Deferred
                                data="revenue_by_method"
                                fallback={
                                    <div className="h-32 animate-pulse rounded bg-muted/20" />
                                }
                            >
                                {revenue_by_method.length === 0 ? (
                                    <p className="py-4 text-center text-xs text-muted-foreground italic">
                                        No payment data available.
                                    </p>
                                ) : (
                                    <div className="space-y-3 pt-2">
                                        {revenue_by_method.map((method) => (
                                            <div
                                                key={method.payment_method}
                                                className="space-y-1"
                                            >
                                                <div className="flex justify-between text-xs font-medium">
                                                    <span className="text-foreground capitalize">
                                                        {method.payment_method.replace(
                                                            '_',
                                                            ' ',
                                                        )}
                                                    </span>
                                                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                                        {formatCurrency(
                                                            method.total,
                                                        )}
                                                    </span>
                                                </div>
                                                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                                                    <div
                                                        className="h-full rounded-full bg-primary"
                                                        style={{
                                                            width: `${Math.min(100, Math.max(10, (Number(method.total) / (stats?.total_collected || 1)) * 100))}%`,
                                                        }}
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
                            <Deferred
                                data="expenses_by_type"
                                fallback={
                                    <div className="h-32 animate-pulse rounded bg-muted/20" />
                                }
                            >
                                {expenses_by_type.length === 0 ? (
                                    <p className="py-4 text-center text-xs text-muted-foreground italic">
                                        No expense data available.
                                    </p>
                                ) : (
                                    <div className="divide-y divide-border/40 pt-1 text-xs">
                                        {expenses_by_type.map((type) => (
                                            <div
                                                key={type.expense_type}
                                                className="flex items-center justify-between py-2"
                                            >
                                                <span className="font-medium text-foreground capitalize">
                                                    {EXPENSE_LABELS[
                                                        type.expense_type
                                                    ] ?? type.expense_type}
                                                </span>
                                                <div className="text-right">
                                                    <span className="font-semibold text-foreground">
                                                        {formatCurrency(
                                                            type.total,
                                                        )}
                                                    </span>
                                                    <span className="block text-[10px] text-muted-foreground">
                                                        {type.count} vouchers
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </Deferred>
                        </UctPanelCard>

                        {/* Quick Links */}
                        <Card>
                            <CardContent className="space-y-2 pt-5">
                                <p className="mb-3 text-xs font-semibold text-foreground">
                                    Quick Actions
                                </p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full justify-start text-xs"
                                    asChild
                                >
                                    <Link href="/finance/approvals">
                                        <Shield className="mr-2 h-4 w-4" />
                                        My Approval Queue
                                    </Link>
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full justify-start text-xs"
                                    asChild
                                >
                                    <Link href="/finance/invoices">
                                        <FileText className="mr-2 h-4 w-4" />
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
