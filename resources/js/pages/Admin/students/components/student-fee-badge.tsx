import React from 'react';
import { Badge } from '@/components/ui/badge';
import type { StudentFeeStatus } from '@/types/student';
import { Check, AlertCircle, Clock } from 'lucide-react';

interface StudentFeeBadgeProps {
    status: StudentFeeStatus | string;
    className?: string;
}

export function StudentFeeBadge({ status, className = '' }: StudentFeeBadgeProps) {
    switch (status) {
        case 'paid':
            return (
                <Badge variant="outline" className={`border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 gap-1 font-medium ${className}`}>
                    <Check className="h-3 w-3" />
                    Paid
                </Badge>
            );
        case 'partial':
            return (
                <Badge variant="outline" className={`border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 gap-1 font-medium ${className}`}>
                    <Clock className="h-3 w-3" />
                    Partial
                </Badge>
            );
        case 'unpaid':
            return (
                <Badge variant="outline" className={`border-destructive/30 bg-destructive/10 text-destructive gap-1 font-medium ${className}`}>
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
