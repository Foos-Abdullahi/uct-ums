import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { PayrollStatus } from '@/types/lecturer-payroll';

const config: Record<PayrollStatus, { label: string; className: string }> = {
    paid: {
        label: 'Paid',
        className:
            'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    },
    partial: {
        label: 'Partly Paid',
        className:
            'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400',
    },
    unpaid: {
        label: 'Not Paid',
        className: 'border-destructive/30 bg-destructive/10 text-destructive',
    },
};

export function PayrollStatusBadge({
    status,
    className,
}: {
    status: PayrollStatus;
    className?: string;
}) {
    const current = config[status];

    return (
        <Badge
            variant="outline"
            className={cn('text-[11px] font-medium', current.className, className)}
        >
            {current.label}
        </Badge>
    );
}
