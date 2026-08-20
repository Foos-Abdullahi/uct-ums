import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export function AdmissionsTableSkeleton() {
    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-1 items-center gap-2">
                    <Skeleton className="h-9 w-[250px] rounded-md" />
                    <Skeleton className="h-9 w-[120px] rounded-md" />
                </div>
                <Skeleton className="h-9 w-[100px] rounded-md" />
            </div>

            <div className="rounded-sm border border-border/40 overflow-hidden">
                <div className="border-b border-border bg-muted/40 p-3">
                    <div className="grid grid-cols-6 gap-4">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-12 ml-auto" />
                    </div>
                </div>
                <div className="divide-y divide-border/30 p-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="grid grid-cols-6 items-center gap-4 py-3 px-2">
                            <Skeleton className="h-4 w-24" />
                            <div className="space-y-1">
                                <Skeleton className="h-4 w-28" />
                                <Skeleton className="h-3 w-36" />
                            </div>
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-5 w-20 rounded-full" />
                            <Skeleton className="h-8 w-8 rounded-md ml-auto" />
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-36" />
                <div className="flex items-center gap-2">
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-8" />
                </div>
            </div>
        </div>
    );
}
