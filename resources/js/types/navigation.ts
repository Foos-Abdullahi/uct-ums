import type { InertiaLinkProps } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';
import type { PermissionSlug } from '@/types/permissions';

export type BreadcrumbItem = {
    title: string;
    href: NonNullable<InertiaLinkProps['href']>;
};

export type NavItem = {
    title: string;
    href?: NonNullable<InertiaLinkProps['href']>;
    icon?: LucideIcon | null;
    isActive?: boolean;
    items?: NavItem[];
    /**
     * Permission slug required to see this entry. Entries without one are
     * always visible.
     */
    permission?: PermissionSlug;
};
