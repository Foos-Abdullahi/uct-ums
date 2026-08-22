import React from 'react';
import { Badge } from '@/components/ui/badge';

const roleMap: Record<string, { label: string; className: string }> = {
    lead_lecturer: { label: 'Lead', className: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
    co_lecturer: { label: 'Co-Lecturer', className: 'bg-cyan-100 text-cyan-800 border-cyan-200' },
    assistant: { label: 'Assistant', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    lab_instructor: { label: 'Lab Instructor', className: 'bg-orange-100 text-orange-800 border-orange-200' },
};

export function AssignmentRoleBadge({ role }: { role: string }) {
    const config = roleMap[role] || { label: role, className: 'bg-gray-100 text-gray-800' };
    return <Badge variant="outline" className={config.className}>{config.label}</Badge>;
}