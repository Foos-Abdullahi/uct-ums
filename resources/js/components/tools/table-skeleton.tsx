import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export interface TableSkeletonProps {
    columns?: number;
    rows?: number;
    filterCount?: number;
    hasSearch?: boolean;
    hasFilterButton?: boolean;
    hasPagination?: boolean;
    hasAvatar?: boolean;
    className?: string;
}

export function TableSkeleton({
    columns = 6,
    rows = 6,
    filterCount = 2,
    hasSearch = true,
    hasFilterButton = true,
    hasPagination = true,
    hasAvatar = true,
    className,
}: TableSkeletonProps) {
    const colWidths = ['w-28', 'w-24', 'w-32', 'w-20', 'w-20', 'w-16', 'w-24', 'w-16'];

    return (
        <div className={cn('space-y-4 animate-in fade-in duration-500', className)}>
            {/* Toolbar Skeleton */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-1 flex-wrap items-center gap-2">
                    {hasSearch && <Skeleton className="h-9 w-[240px] rounded-md" />}
                    {Array.from({ length: filterCount }).map((_, i) => (
                        <Skeleton key={i} className="h-9 w-[120px] rounded-md" />
                    ))}
                </div>
                {hasFilterButton && <Skeleton className="h-9 w-[100px] rounded-md shrink-0" />}
            </div>

            {/* Table Container Skeleton */}
            <div className="rounded-sm border border-border/40 overflow-hidden bg-card">
                {/* Table Header */}
                <div className="border-b border-border/60 bg-muted/40 p-3">
                    <div
                        className="grid items-center gap-4"
                        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
                    >
                        {Array.from({ length: columns }).map((_, i) => (
                            <Skeleton
                                key={i}
                                className={cn(
                                    'h-4',
                                    colWidths[i % colWidths.length],
                                    i === columns - 1 && 'ml-auto'
                                )}
                            />
                        ))}
                    </div>
                </div>

                {/* Table Rows */}
                <div className="divide-y divide-border/30 p-2">
                    {Array.from({ length: rows }).map((_, rowIndex) => (
                        <div
                            key={rowIndex}
                            className="grid items-center gap-4 py-3 px-2"
                            style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
                        >
                            {/* First column with optional avatar */}
                            {hasAvatar ? (
                                <div className="flex items-center gap-3">
                                    <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                                    <div className="space-y-1">
                                        <Skeleton className="h-4 w-28" />
                                        <Skeleton className="h-3 w-36" />
                                    </div>
                                </div>
                            ) : (
                                <Skeleton className="h-4 w-28" />
                            )}

                            {/* Middle columns */}
                            {Array.from({ length: columns - 2 }).map((_, colIndex) => (
                                <Skeleton
                                    key={colIndex}
                                    className={cn(
                                        colIndex === columns - 3 ? 'h-5 w-20 rounded-full' : 'h-4',
                                        colWidths[(colIndex + 1) % colWidths.length]
                                    )}
                                />
                            ))}

                            {/* Last action column */}
                            <Skeleton className="h-8 w-8 rounded-md ml-auto shrink-0" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Pagination Skeleton */}
            {hasPagination && (
                <div className="flex items-center justify-between pt-1">
                    <Skeleton className="h-4 w-36" />
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-8 w-24 rounded-md" />
                        <Skeleton className="h-8 w-8 rounded-md" />
                        <Skeleton className="h-8 w-8 rounded-md" />
                    </div>
                </div>
            )}
        </div>
    );
}

export default TableSkeleton;
