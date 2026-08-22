import React from 'react';
import { TableSkeleton } from '@/components/tools/table-skeleton';

export function AdmissionsTableSkeleton() {
    return <TableSkeleton columns={6} rows={6} filterCount={2} hasAvatar={false} />;
}

export default AdmissionsTableSkeleton;
