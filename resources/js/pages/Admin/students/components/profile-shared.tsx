import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface FinancialSummary {
    total_invoiced: number;
    total_paid: number;
    total_outstanding: number;
    clearance_status: string;
    overdue_count: number;
}

export interface AcademicSummary {
    total_credits: number;
    completed_credits: number;
    passed_count: number;
    failed_count: number;
    in_progress_count: number;
    gpa: number | string;
}

export interface AttendanceSummary {
    total_classes: number;
    present_count: number;
    late_count: number;
    absent_count: number;
    attendance_rate: number | null;
}

export interface CurrentSemesterFinance {
    label: string;
    academic_year: string | null;
    charged: number;
    paid: number;
    balance: number;
    status: string;
}

export const formatMoney = (value: number | string | null | undefined) =>
    `$${Number(value || 0).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;

export const formatDate = (value?: string | null) =>
    value ? String(value).split('T')[0] : '—';

export function StatTile({
    label,
    value,
    hint,
    tone,
    children,
}: {
    label: string;
    value: ReactNode;
    hint?: ReactNode;
    tone?: 'good' | 'bad' | 'warn';
    children?: ReactNode;
}) {
    return (
        <div className="rounded-lg border bg-card p-4">
            <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                {label}
            </p>
            <p
                className={cn(
                    'mt-1 text-2xl font-bold tabular-nums',
                    tone === 'good' && 'text-emerald-600',
                    tone === 'bad' && 'text-destructive',
                    tone === 'warn' && 'text-amber-600',
                )}
            >
                {value}
            </p>
            {children}
            {hint && (
                <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
            )}
        </div>
    );
}

export function ProgressBar({
    value,
    className,
}: {
    value: number;
    className?: string;
}) {
    return (
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
            <div
                className={cn('h-full rounded-full bg-primary', className)}
                style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
            />
        </div>
    );
}

export function FieldRow({
    label,
    children,
}: {
    label: string;
    children: ReactNode;
}) {
    return (
        <div className="flex items-start justify-between gap-4 py-2.5 text-sm">
            <span className="shrink-0 text-muted-foreground">{label}</span>
            <span className="text-right font-medium text-foreground">
                {children}
            </span>
        </div>
    );
}

export function SectionCard({
    title,
    description,
    action,
    children,
}: {
    title: string;
    description?: string;
    action?: ReactNode;
    children: ReactNode;
}) {
    return (
        <section className="rounded-lg border bg-card">
            <header className="flex items-start justify-between gap-3 border-b px-4 py-3">
                <div>
                    <h3 className="text-sm font-semibold">{title}</h3>
                    {description && (
                        <p className="text-xs text-muted-foreground">
                            {description}
                        </p>
                    )}
                </div>
                {action}
            </header>
            <div className="p-4">{children}</div>
        </section>
    );
}
