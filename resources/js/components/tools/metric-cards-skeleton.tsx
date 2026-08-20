import { Skeleton } from '@/components/ui/skeleton';

export function MetricCardsSkeleton({ count = 4 }: { count?: number }) {
    return (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:gap-4 lg:grid-cols-4">
            {Array.from({ length: count }).map((_, index) => (
                <div
                    key={index}
                    className="rounded-lg border bg-card p-4 shadow-sm"
                >
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="mt-3 h-8 w-16" />
                    <Skeleton className="mt-2 h-3 w-32" />
                </div>
            ))}
        </div>
    );
}
