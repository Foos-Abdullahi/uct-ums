import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface LecturerStatusBadgeProps {
    status?: string;
    className?: string;
}

export function LecturerStatusBadge({ status = 'active', className }: LecturerStatusBadgeProps) {
    const config: Record<string, { label: string; className: string }> = {
        active: {
            label: 'Active',
            className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
        },
        on_leave: {
            label: 'On Leave',
            className: 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400',
        },
        sabbatical: {
            label: 'Sabbatical',
            className: 'border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400',
        },
        terminated: {
            label: 'Terminated',
            className: 'border-destructive/30 bg-destructive/10 text-destructive',
        },
    };

    const current = config[status] ?? {
        label: status.replace('_', ' ').toUpperCase(),
        className: 'border-muted-foreground/30 bg-muted text-muted-foreground',
    };

    return (
        <Badge variant="outline" className={cn('text-[11px] font-medium capitalize', current.className, className)}>
            {current.label}
        </Badge>
    );
}

export default LecturerStatusBadge;
