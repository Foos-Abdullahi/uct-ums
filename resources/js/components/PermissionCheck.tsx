import React from 'react';
import { usePage } from '@inertiajs/react';
import type { UserRole } from '@/types/auth';

interface PermissionCheckProps {
    role?: UserRole | UserRole[];
    requiredPermission?: string;
    fallback?: React.ReactNode;
    children: React.ReactNode;
}

export function PermissionCheck({
    role,
    requiredPermission,
    fallback = null,
    children,
}: PermissionCheckProps) {
    const { auth } = usePage().props as { auth?: { user?: { role?: UserRole } } };
    const userRole = auth?.user?.role;

    if (!userRole) {
        return <>{fallback}</>;
    }

    // Super admin has full permissions
    if (userRole === 'super_admin') {
        return <>{children}</>;
    }

    if (role) {
        const allowedRoles = Array.isArray(role) ? role : [role];
        if (!allowedRoles.includes(userRole)) {
            return <>{fallback}</>;
        }
    }

    return <>{children}</>;
}

export default PermissionCheck;
