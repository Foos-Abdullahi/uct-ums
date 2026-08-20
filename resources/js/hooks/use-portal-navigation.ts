import { usePage } from '@inertiajs/react';
import { adminNav, lecturerNav, studentNav } from '@/config/navigation';
import type { NavItem } from '@/types';

const navigationByRole: Record<string, NavItem[]> = {
    super_admin: adminNav,
    registrar: adminNav,
    finance: adminNav,
    hr: adminNav,
    lecturer: lecturerNav,
    student: studentNav,
};

export function usePortalNavigation(): NavItem[] {
    const { auth } = usePage().props;
    const role = auth.user?.role;

    if (!role) {
        return [];
    }

    return navigationByRole[role] ?? [];
}
