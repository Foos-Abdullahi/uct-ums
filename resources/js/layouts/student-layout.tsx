import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { StudentHeader } from '@/components/student-header';
import type { AppLayoutProps } from '@/types';

export default function StudentLayout({
    children,
    breadcrumbs = [],
}: AppLayoutProps) {
    return (
        <AppShell variant="header">
            <StudentHeader breadcrumbs={breadcrumbs} />
            <AppContent
                variant="header"
                className="min-h-[calc(100vh-4rem)] max-w-none bg-slate-50/70 dark:bg-background"
            >
                {children}
            </AppContent>
        </AppShell>
    );
}
