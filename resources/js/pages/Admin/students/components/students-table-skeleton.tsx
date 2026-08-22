import React from 'react';
import { TableSkeleton } from '@/components/tools/table-skeleton';

export function StudentsTableSkeleton() {
    return <TableSkeleton columns={6} rows={6} filterCount={3} hasAvatar={true} />;
}

export default StudentsTableSkeleton;
