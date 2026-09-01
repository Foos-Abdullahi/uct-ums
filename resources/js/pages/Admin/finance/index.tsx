import React from 'react';
import { Deferred, Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
    ArrowUpRight,
    ArrowRight,
    Users,
} from 'lucide-react';

interface FinanceOverviewProps {
    stats?: {
        total_invoiced: number;
        total_collected: number;
        total_outstanding: number;
        pending_payments: number;
        overdue_invoices: number;
    };
    recent_payments?: Array<{
        id: number;
        transaction_no: string;
        amount: number;
        payment_method: string;
        payment_date: string;
        status: string;
        student?: {
            id: number;
            matric_no: string;
            user?: { name: string; email: string };
            program?: { name: string; code: string | null };
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
            id: number;
            matric_no: string;
            user?: { name: string };
        };
    }>;
    revenue_by_method?: Array<{
        payment_method: string;
        total: number;
        count: number;
    }>;
    invoices_by_type?: Array<{
        type: string;
        total: number;
        count: number;
    }>;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/admin/dashboard' },
    { title: 'Finance Overview', href: '/admin/finance' },
];

export default function AdminFinanceOverview({
    stats,
    recent_payments = [],
    recent_invoices = [],
    revenue_by_method = [],
    invoices_by_type = [],
}: FinanceOverviewProps) {
    const formatCurrency = (val: number) => `$${Number(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    return (
        <>
            <Head title="Financial Solvency & Revenue Overview" />

            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h1 className="text-lg font-semibold text-foreground tracking-tight">
                            Finance & Bursar Control Center
                        </h1>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Real-time tuition fee assessment, fee collections, student payment verification, and cashflow audit.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/admin/finance/fees">
                                <Receipt className="h-4 w-4 mr-1.5" />
                                Fee Schedules
                            </Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/admin/finance/invoices">
                                <FileText className="h-4 w-4 mr-1.5" />
                                All Invoices
                            </Link>
                        </Button>
                        <Button size="sm" asChild>
                            <Link href="/admin/finance/payments">
                                <CreditCard className="h-4 w-4 mr-1.5" />
                                Payments Roster
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Metric Cards */}
                <Deferred data="stats" fallback={<MetricCardsSkeleton />}>
                    {stats && (
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:gap-4 lg:grid-cols-5 animate-in fade-in slide-in-from-top-6 duration-1000 ease-in-out">
                            <MetricCard
                                title="Total Invoiced"
                                value={formatCurrency(stats.total_invoiced)}
                                icon={FileText}
                                color="primary"
                            />
                            <MetricCard
                                title="Total Collected"
                                value={formatCurrency(stats.total_collected)}
                                icon={CheckCircle2}
                                color="success"
                            />
                            <MetricCard
                                title="Outstanding Balance"
                                value={formatCurrency(stats.total_outstanding)}
                                icon={TrendingUp}
                                color="destructive"
                            />
                            <MetricCard
                                title="Pending Approvals"
                                value={`${stats.pending_payments} txns`}
                                icon={Clock}
                                color="warning"
                            />
                            <MetricCard
                                title="Overdue Invoices"
                                value={`${stats.overdue_invoices} bills`}
                                icon={AlertCircle}
                                color="destructive"
                            />
                        </div>
                    )}
                </Deferred>

                {/* Main 2-Column Analytics and Stream */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left 2 Cols: Recent Payments & Invoices */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Recent Payments Stream */}
                        <UctPanelCard
                            title="Recent Transactions & Collections"
                            description="Latest student payments processed across all channels."
                            icon={CreditCard}
                            actions={
                                <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
                                    <Link href="/admin/finance/payments">
                                        View All
                                        <ArrowRight className="h-3.5 w-3.5 ml-1" />
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
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-semibold text-foreground">{pmt.student?.user?.name || 'Student'}</span>
                                                            <Badge variant="outline" className="font-mono text-[10px]">
                                                                {pmt.student?.matric_no}
                                                            </Badge>
                                                        </div>
                                                        <p className="text-[11px] text-muted-foreground mt-0.5">
                                                            {pmt.transaction_no} · {pmt.payment_method.replace('_', ' ').toUpperCase()} · {pmt.payment_date}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                                                        +{formatCurrency(pmt.amount)}
                                                    </p>
                                                    <Badge
                                                        className={
                                                            pmt.status === 'paid'
                                                                ? 'bg-emerald-500/10 text-emerald-700 text-[10px]'
                                                                : pmt.status === 'pending'
                                                                ? 'bg-amber-500/10 text-amber-700 text-[10px]'
                                                                : 'bg-destructive/10 text-destructive text-[10px]'
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

                        {/* Recent Invoices Issued */}
                        <UctPanelCard
                            title="Recent Invoices & Tuition Bills"
                            description="Newly generated student fee assessments."
                            icon={FileText}
                            actions={
                                <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
                                    <Link href="/admin/finance/invoices">
                                        View All
                                        <ArrowRight className="h-3.5 w-3.5 ml-1" />
                                    </Link>
                                </Button>
                            }
                        >
                            <Deferred data="recent_invoices" fallback={<div className="h-32 animate-pulse bg-muted/20 rounded" />}>
                                {recent_invoices.length === 0 ? (
                                    <p className="text-xs text-muted-foreground italic py-6 text-center">No student invoices generated yet.</p>
                                ) : (
                                    <div className="divide-y divide-border/40 text-xs pt-1">
                                        {recent_invoices.map((inv) => {
                                            const balance = inv.amount - inv.paid_amount;
                                            return (
                                                <div key={inv.id} className="flex items-center justify-between py-2 px-1 hover:bg-muted/20 rounded transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <Badge variant="outline" className="font-mono text-[10px]">
                                                            {inv.invoice_no}
                                                        </Badge>
                                                        <div>
                                                            <p className="font-medium text-foreground">{inv.title}</p>
                                                            <p className="text-[11px] text-muted-foreground">
                                                                {inv.student?.user?.name} ({inv.student?.matric_no}) · Due {inv.due_date || 'N/A'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-semibold text-foreground text-xs">{formatCurrency(inv.amount)}</p>
                                                        <span className="text-[10px] text-muted-foreground block">
                                                            {balance <= 0 ? 'Fully Paid' : `Bal: ${formatCurrency(balance)}`}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </Deferred>
                        </UctPanelCard>
                    </div>

                    {/* Right Col: Payment Channels & Revenue Breakdown */}
                    <div className="space-y-6">
                        {/* Revenue by Payment Method */}
                        <UctPanelCard
                            title="Payment Channels"
                            description="Share of collection by method."
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
                                                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                                                    <span>{method.count} transactions</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-primary rounded-full"
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

                        {/* Fee Assessment by Category */}
                        <UctPanelCard
                            title="Fee Type Distribution"
                            description="Breakdown of billed items."
                            icon={Receipt}
                        >
                            <Deferred data="invoices_by_type" fallback={<div className="h-32 animate-pulse bg-muted/20 rounded" />}>
                                {invoices_by_type.length === 0 ? (
                                    <p className="text-xs text-muted-foreground italic py-4 text-center">No fee distribution data.</p>
                                ) : (
                                    <div className="divide-y divide-border/40 text-xs pt-1">
                                        {invoices_by_type.map((type) => (
                                            <div key={type.type} className="flex items-center justify-between py-2">
                                                <span className="capitalize font-medium text-foreground">{type.type}</span>
                                                <div className="text-right">
                                                    <span className="font-semibold text-foreground">{formatCurrency(type.total)}</span>
                                                    <span className="text-[10px] text-muted-foreground block">{type.count} invoices</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </Deferred>
                        </UctPanelCard>
                    </div>
                </div>
            </div>
        </>
    );
}

AdminFinanceOverview.layout = { breadcrumbs };
