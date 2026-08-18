import { Head } from '@inertiajs/react';
import Heading from '@/components/heading';

type Props = {
    title: string;
    portal?: string;
    description?: string;
};

export function PortalPlaceholder({ title, portal, description }: Props) {
    return (
        <>
            <Head title={title} />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <Heading
                    title={title}
                    description={
                        description ??
                        `${portal ? `${portal} · ` : ''}Phase 1 scaffold — CRUD arrives in the next delivery slice.`
                    }
                />
                <div className="rounded-xl border border-sidebar-border/70 bg-card p-8 text-sm text-muted-foreground">
                    This screen is wired for navigation and role-based access
                    control. Module functionality will be implemented in Phase
                    1.
                </div>
            </div>
        </>
    );
}
