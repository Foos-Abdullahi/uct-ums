import { Check, AlertCircle, Clock } from 'lucide-react';
import React from 'react';
import { Badge } from '@/components/ui/badge';
import type { StudentFeeStatus } from '@/types/student';

interface StudentFeeBadgeProps {
    status: StudentFeeStatus | string;
    className?: string;
}

export function StudentFeeBadge({
    status,
    className = '',
}: StudentFeeBadgeProps) {
    switch (status) {
        case 'paid':
            return (
                <Badge
                    variant="outline"
                    className={`gap-1 border-emerald-500/30 bg-emerald-500/10 font-medium text-emerald-600 dark:text-emerald-400 ${className}`}
                >
                    <Check className="h-3 w-3" />
                    Paid
                </Badge>
            );
        case 'partial':
            return (
                <Badge
                    variant="outline"
                    className={`gap-1 border-amber-500/30 bg-amber-500/10 font-medium text-amber-600 dark:text-amber-400 ${className}`}
                >
                    <Clock className="h-3 w-3" />
                    Partial
                </Badge>
            );
        case 'unpaid':
            return (
                <Badge
                    variant="outline"
                    className={`gap-1 border-destructive/30 bg-destructive/10 font-medium text-destructive ${className}`}
                >
                    <AlertCircle className="h-3 w-3" />
                    Unpaid
                </Badge>
            );
        default:
            return (
                <Badge variant="secondary" className={`gap-1 ${className}`}>
                    {status}
                </Badge>
            );
    }
}
