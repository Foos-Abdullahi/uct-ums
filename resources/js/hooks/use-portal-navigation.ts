import { usePage } from '@inertiajs/react';
import {
    adminNav,
    financeNav,
    hrNav,
    lecturerNav,
    registrarNav,
    studentNav,
} from '@/config/navigation';
import type { NavItem } from '@/types';

const navigationByRole: Record<string, NavItem[]> = {
    super_admin: adminNav,
    registrar: registrarNav,
    finance: financeNav,
    hr: hrNav,
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
