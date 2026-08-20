import { Skeleton } from '@/components/ui/skeleton';

export function ViewPanelSkeleton({ rows = 4 }: { rows?: number }) {
    return (
        <div className="space-y-3 rounded-sm border p-4">
            {Array.from({ length: rows }).map((_, index) => (
                <div key={index} className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                </div>
            ))}
        </div>
    );
}
