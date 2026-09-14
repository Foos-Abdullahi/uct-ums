import { Clock, Eye, CheckCircle2, XCircle, UserCheck } from 'lucide-react';
import React from 'react';
import { Badge } from '@/components/ui/badge';
import type { AdmissionStatus } from '@/types/admission';

interface AdmissionStatusBadgeProps {
    status: AdmissionStatus | string;
    className?: string;
}

export function AdmissionStatusBadge({
    status,
    className = '',
}: AdmissionStatusBadgeProps) {
    switch (status) {
        case 'pending':
            return (
                <Badge
                    variant="outline"
                    className={`gap-1 border-amber-500/30 bg-amber-500/10 font-medium text-amber-600 dark:text-amber-400 ${className}`}
                >
                    <Clock className="h-3 w-3" />
                    Pending
                </Badge>
            );
        case 'under_review':
            return (
                <Badge
                    variant="outline"
                    className={`gap-1 border-blue-500/30 bg-blue-500/10 font-medium text-blue-600 dark:text-blue-400 ${className}`}
                >
                    <Eye className="h-3 w-3" />
                    Under Review
                </Badge>
            );
        case 'approved':
            return (
                <Badge
                    variant="outline"
                    className={`gap-1 border-emerald-500/30 bg-emerald-500/10 font-medium text-emerald-600 dark:text-emerald-400 ${className}`}
                >
                    <CheckCircle2 className="h-3 w-3" />
                    Approved
                </Badge>
            );
        case 'rejected':
            return (
                <Badge
                    variant="destructive"
                    className={`gap-1 font-medium ${className}`}
                >
                    <XCircle className="h-3 w-3" />
                    Rejected
                </Badge>
            );
        case 'enrolled':
            return (
                <Badge
                    variant="outline"
                    className={`gap-1 border-purple-500/30 bg-purple-500/10 font-medium text-purple-600 dark:text-purple-400 ${className}`}
                >
                    <UserCheck className="h-3 w-3" />
                    Enrolled
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
