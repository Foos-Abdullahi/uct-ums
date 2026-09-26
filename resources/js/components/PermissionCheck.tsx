import React from 'react';
import { usePermissions } from '@/hooks/use-permissions';
import type { PermissionSlug } from '@/types/permissions';

type PermissionCheckProps = {
    /** Every listed permission must be granted for the children to render. */
    permission: PermissionSlug | PermissionSlug[];
    fallback?: React.ReactNode;
    children: React.ReactNode;
};

/**
 * Render children only when the signed-in user's role grants the permission.
 *
 * The server-side `permission` middleware remains the real enforcement
 * boundary; this only keeps the UI in step with it.
 */
export function PermissionCheck({
    permission,
    fallback = null,
    children,
}: PermissionCheckProps) {
    const { can } = usePermissions();

    const permissions = Array.isArray(permission) ? permission : [permission];

    return <>{can(...permissions) ? children : fallback}</>;
}

export default PermissionCheck;
