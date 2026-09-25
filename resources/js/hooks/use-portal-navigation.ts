import { usePage } from '@inertiajs/react';
import { useMemo } from 'react';
import { adminNav, lecturerNav, studentNav } from '@/config/navigation';
import { usePermissions } from '@/hooks/use-permissions';
import type { NavItem } from '@/types';

const navigationByRole: Record<string, NavItem[]> = {
    super_admin: adminNav,
    registrar: adminNav,
    finance: adminNav,
    hr: adminNav,
    lecturer: lecturerNav,
    student: studentNav,
};

/**
 * Drop every entry the signed-in user's role does not cover, recursing into
 * groups and discarding groups that end up empty.
 */
function filterNavigation(
    items: NavItem[],
    can: (...permissions: string[]) => boolean,
): NavItem[] {
    return items.flatMap((item) => {
        if (item.permission && !can(item.permission)) {
            return [];
        }

        if (!item.items) {
            return [item];
        }

        const children = filterNavigation(item.items, can);

        return children.length > 0 ? [{ ...item, items: children }] : [];
    });
}

export function usePortalNavigation(): NavItem[] {
    const { auth } = usePage().props;
    const role = auth.user?.role;
    const { can, isSelfService } = usePermissions();

    return useMemo(() => {
        if (!role) {
            return [];
        }

        const navigation = navigationByRole[role] ?? [];

        if (isSelfService) {
            return navigation;
        }

        return filterNavigation(navigation, can);
    }, [role, isSelfService, can]);
}
