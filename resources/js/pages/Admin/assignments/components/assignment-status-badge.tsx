import React from 'react';
import { Badge } from '@/components/ui/badge';

const statusMap: Record<string, { label: string; className: string }> = {
    assigned: { label: 'Assigned', className: 'bg-blue-100 text-blue-800 border-blue-200' },
    active: { label: 'Active', className: 'bg-green-100 text-green-800 border-green-200' },
    completed: { label: 'Completed', className: 'bg-purple-100 text-purple-800 border-purple-200' },
    cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-800 border-red-200' },
};

export function AssignmentStatusBadge({ status }: { status: string }) {
    const config = statusMap[status] || { label: status, className: 'bg-gray-100 text-gray-800' };
    return <Badge variant="outline" className={config.className}>{config.label}</Badge>;
}