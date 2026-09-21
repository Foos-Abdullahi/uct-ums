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
} from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { MetricCardsSkeleton } from '@/components/tools/metric-cards-skeleton';
import { MetricCard } from '@/components/tools/MetricCard';
import { UctPanelCard } from '@/components/tools/uct-panel-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { BreadcrumbItem } from '@/types';

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
    const { t } = useTranslation();

    const formatCurrency = (val: number) =>
        `$${Number(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    return (
        <>
            <Head title={t('financial_solvency_revenue')} />

            <div className="space-y-6 p-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h1 className="text-lg font-semibold tracking-tight text-foreground">
                            {t('finance_bursar_center')}
                        </h1>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            {t('finance_description')}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/admin/finance/fees">
                                <Receipt className="mr-1.5 h-4 w-4" />
                                {t('manage_fees')}
                            </Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/admin/finance/invoices">
                                <FileText className="mr-1.5 h-4 w-4" />
                                {t('view_all_invoices')}
                            </Link>
                        </Button>
                        <Button size="sm" asChild>
                            <Link href="/admin/finance/payments">
                                <CreditCard className="mr-1.5 h-4 w-4" />
                                {t('view_all_payments')}
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Metric Cards */}
                <Deferred data="stats" fallback={<MetricCardsSkeleton />}>
                    {stats && (
                        <div className="grid animate-in grid-cols-1 gap-2 duration-1000 ease-in-out fade-in slide-in-from-top-6 sm:grid-cols-2 md:gap-4 lg:grid-cols-5">
                            <MetricCard
                                title={t('total_invoiced_finance')}
                                value={formatCurrency(stats.total_invoiced)}
                                icon={FileText}
                                color="primary"
                            />
                            <MetricCard
                                title={t('total_collected_finance')}
                                value={formatCurrency(stats.total_collected)}
                                icon={CheckCircle2}
                                color="success"
                            />
                            <MetricCard
                                title={t('total_outstanding_finance')}
                                value={formatCurrency(stats.total_outstanding)}
                                icon={TrendingUp}
                                color="destructive"
                            />
                            <MetricCard
                                title={t('pending_payments_finance')}
                                value={`${stats.pending_payments} txns`}
                                icon={Clock}
                                color="warning"
                            />
                            <MetricCard
                                title={t('overdue_invoices_finance')}
                                value={`${stats.overdue_invoices} bills`}
                                icon={AlertCircle}
                                color="destructive"
                            />
                        </div>
                    )}
                </Deferred>

                {/* Main 2-Column Analytics and Stream */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Left 2 Cols: Recent Payments & Invoices */}
                    <div className="space-y-6 lg:col-span-2">
                        {/* Recent Payments Stream */}
                        <UctPanelCard
                            title={t('recent_transactions')}
                            description={t('revenue_by_payment_method')}
                            icon={CreditCard}
                            actions={
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs"
                                    asChild
                                >
                                    <Link href="/admin/finance/payments">
                                        {t('view_all')}
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
                                        {t('no_payment_transactions')}
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
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-semibold text-foreground">
                                                                {pmt.student
                                                                    ?.user
                                                                    ?.name ||
                                                                    'Student'}
                                                            </span>
                                                            <Badge
                                                                variant="outline"
                                                                className="font-mono text-[10px]"
                                                            >
                                                                {
                                                                    pmt.student
                                                                        ?.matric_no
                                                                }
                                                            </Badge>
                                                        </div>
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
                                                            pmt.status ===
                                                            'paid'
                                                                ? 'bg-emerald-500/10 text-[10px] text-emerald-700'
                                                                : pmt.status ===
                                                                    'pending'
                                                                  ? 'bg-amber-500/10 text-[10px] text-amber-700'
                                                                  : 'bg-destructive/10 text-[10px] text-destructive'
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
                            title={t('recent_invoices_finance')}
                            description={t('recent_invoices_desc')}
                            icon={FileText}
                            actions={
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs"
                                    asChild
                                >
                                    <Link href="/admin/finance/invoices">
                                        {t('view_all')}
                                        <ArrowRight className="ml-1 h-3.5 w-3.5" />
                                    </Link>
                                </Button>
                            }
                        >
                            <Deferred
                                data="recent_invoices"
                                fallback={
                                    <div className="h-32 animate-pulse rounded bg-muted/20" />
                                }
                            >
                                {recent_invoices.length === 0 ? (
                                    <p className="py-6 text-center text-xs text-muted-foreground italic">
                                        {t('no_invoices_recorded')}
                                    </p>
                                ) : (
                                    <div className="divide-y divide-border/40 pt-1 text-xs">
                                        {recent_invoices.map((inv) => {
                                            const balance =
                                                inv.amount - inv.paid_amount;

                                            return (
                                                <div
                                                    key={inv.id}
                                                    className="flex items-center justify-between rounded px-1 py-2 transition-colors hover:bg-muted/20"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <Badge
                                                            variant="outline"
                                                            className="font-mono text-[10px]"
                                                        >
                                                            {inv.invoice_no}
                                                        </Badge>
                                                        <div>
                                                            <p className="font-medium text-foreground">
                                                                {inv.title}
                                                            </p>
                                                            <p className="text-[11px] text-muted-foreground">
                                                                {
                                                                    inv.student
                                                                        ?.user
                                                                        ?.name
                                                                }{' '}
                                                                (
                                                                {
                                                                    inv.student
                                                                        ?.matric_no
                                                                }
                                                                ) · Due{' '}
                                                                {inv.due_date ||
                                                                    'N/A'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-xs font-semibold text-foreground">
                                                            {formatCurrency(
                                                                inv.amount,
                                                            )}
                                                        </p>
                                                        <span className="block text-[10px] text-muted-foreground">
                                                            {balance <= 0
                                                                ? 'Fully Paid'
                                                                : `Bal: ${formatCurrency(balance)}`}
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
                                                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                                                    <span>
                                                        {method.count}{' '}
                                                        transactions
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

                        {/* Fee Assessment by Category */}
                        <UctPanelCard
                            title="Fee Type Distribution"
                            description="Breakdown of billed items."
                            icon={Receipt}
                        >
                            <Deferred
                                data="invoices_by_type"
                                fallback={
                                    <div className="h-32 animate-pulse rounded bg-muted/20" />
                                }
                            >
                                {invoices_by_type.length === 0 ? (
                                    <p className="py-4 text-center text-xs text-muted-foreground italic">
                                        No fee distribution data.
                                    </p>
                                ) : (
                                    <div className="divide-y divide-border/40 pt-1 text-xs">
                                        {invoices_by_type.map((type) => (
                                            <div
                                                key={type.type}
                                                className="flex items-center justify-between py-2"
                                            >
                                                <span className="font-medium text-foreground capitalize">
                                                    {type.type}
                                                </span>
                                                <div className="text-right">
                                                    <span className="font-semibold text-foreground">
                                                        {formatCurrency(
                                                            type.total,
                                                        )}
                                                    </span>
                                                    <span className="block text-[10px] text-muted-foreground">
                                                        {type.count} invoices
                                                    </span>
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
