import React from 'react';
import { Badge } from '@/components/ui/badge';
import type { EnrollmentStatus } from '@/types/student';
import { CheckCircle2, Clock, Ban, GraduationCap, XCircle } from 'lucide-react';

interface StudentStatusBadgeProps {
    status: EnrollmentStatus | string;
    className?: string;
}

export function StudentStatusBadge({ status, className = '' }: StudentStatusBadgeProps) {
    switch (status) {
        case 'enrolled':
            return (
                <Badge variant="outline" className={`border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 gap-1 font-medium ${className}`}>
                    <CheckCircle2 className="h-3 w-3" />
                    Enrolled
                </Badge>
            );
        case 'pending':
            return (
                <Badge variant="outline" className={`border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 gap-1 font-medium ${className}`}>
                    <Clock className="h-3 w-3" />
                    Pending
                </Badge>
            );
        case 'suspended':
            return (
                <Badge variant="destructive" className={`gap-1 font-medium ${className}`}>
                    <Ban className="h-3 w-3" />
                    Suspended
                </Badge>
            );
        case 'graduated':
            return (
                <Badge variant="outline" className={`border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 gap-1 font-medium ${className}`}>
                    <GraduationCap className="h-3 w-3" />
                    Graduated
                </Badge>
            );
        case 'withdrawn':
            return (
                <Badge variant="secondary" className={`gap-1 font-medium text-muted-foreground ${className}`}>
                    <XCircle className="h-3 w-3" />
                    Withdrawn
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
