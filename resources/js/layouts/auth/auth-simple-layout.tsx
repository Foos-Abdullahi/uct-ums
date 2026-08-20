import { GraduationCap } from 'lucide-react';
import type { AuthLayoutProps } from '@/types';

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        <div className="flex min-h-svh flex-col items-center justify-center bg-[#f4f5f7] p-6 md:p-10">
            <div className="w-full max-w-md">
                <div className="rounded-xl border border-border/60 bg-white p-8 shadow-sm md:p-10">
                    <div className="mb-8 flex flex-col items-center gap-4 text-center">
                        <div className="flex size-14 items-center justify-center rounded-xl bg-primary">
                            <GraduationCap className="size-7 text-primary-foreground" />
                        </div>
                        <div className="space-y-1">
                            <h1 className="text-2xl font-bold tracking-tight text-primary">
                                {title}
                            </h1>
                            {description && (
                                <p className="text-sm text-muted-foreground">
                                    {description}
                                </p>
                            )}
                        </div>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}
