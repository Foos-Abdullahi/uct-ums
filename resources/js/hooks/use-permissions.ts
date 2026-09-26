import { usePage } from '@inertiajs/react';
import { useCallback, useMemo } from 'react';
import type { UserRole } from '@/types/auth';
import type { PermissionSlug } from '@/types/permissions';

const NO_PERMISSIONS: PermissionSlug[] = [];

/**
 * Roles that own a dedicated self-service portal and are therefore never
 * permission gated.
 */
const SELF_SERVICE_ROLES: UserRole[] = ['lecturer', 'student'];

export type PermissionsApi = {
    /** Permission slugs granted to the signed-in user by their role. */
    granted: PermissionSlug[];
    /** Whether the signed-in user owns an ungated self-service portal. */
    isSelfService: boolean;
    /** Whether the signed-in user holds every one of the listed permissions. */
    can: (...permissions: PermissionSlug[]) => boolean;
};

/**
 * Resolve the permission grants of the signed-in user so the UI can hide
 * anything their role does not cover. This mirrors the server-side
 * `permission` middleware, which is the real enforcement boundary.
 */
export function usePermissions(): PermissionsApi {
    const { auth } = usePage().props;
    const user = auth?.user;
    const role = user?.role;

    const isSelfService = role !== undefined && SELF_SERVICE_ROLES.includes(role);
    const granted = user?.permissions ?? NO_PERMISSIONS;

    const can = useCallback(
        (...permissions: PermissionSlug[]) => {
            if (isSelfService || permissions.length === 0) {
                return true;
            }

            return permissions.every((permission) => granted.includes(permission));
        },
        [granted, isSelfService],
    );

    return useMemo(
        () => ({ granted, isSelfService, can }),
        [granted, isSelfService, can],
    );
}
