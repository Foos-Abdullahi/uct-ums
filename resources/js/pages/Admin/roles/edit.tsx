import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Shield, KeyRound, Save } from 'lucide-react';
import React from 'react';
import { UctPanelCard } from '@/components/tools/uct-panel-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface PermissionItem {
    id: number;
    module: string;
    name: string;
    slug: string;
    description: string | null;
}

interface RoleDetails {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    is_system: boolean;
}

interface EditRoleProps {
    role: RoleDetails;
    permissions_by_module: Record<string, PermissionItem[]>;
    assigned_permission_ids: number[];
}

export default function AdminRoleEdit({
    role,
    permissions_by_module = {},
    assigned_permission_ids = [],
}: EditRoleProps) {
    const { data, setData, put, processing, errors } = useForm({
        name: role.name,
        slug: role.slug,
        description: role.description || '',
        permissions: assigned_permission_ids,
    });

    const handleTogglePermission = (id: number) => {
        if (data.permissions.includes(id)) {
            setData(
                'permissions',
                data.permissions.filter((pId) => pId !== id),
            );
        } else {
            setData('permissions', [...data.permissions, id]);
        }
    };

    const handleSelectAllInModule = (modulePermissions: PermissionItem[]) => {
        const moduleIds = modulePermissions.map((p) => p.id);
        const allSelected = moduleIds.every((id) =>
            data.permissions.includes(id),
        );

        if (allSelected) {
            setData(
                'permissions',
                data.permissions.filter((id) => !moduleIds.includes(id)),
            );
        } else {
            const newPermissions = Array.from(
                new Set([...data.permissions, ...moduleIds]),
            );
            setData('permissions', newPermissions);
        }
    };

    const handleSelectAll = () => {
        const allIds = Object.values(permissions_by_module).flatMap((list) =>
            list.map((p) => p.id),
        );
        const areAllSelected = allIds.every((id) =>
            data.permissions.includes(id),
        );

        if (areAllSelected) {
            setData('permissions', []);
        } else {
            setData('permissions', allIds);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/admin/settings/roles/${role.id}`);
    };

    return (
        <>
            <Head title={`Edit Role - ${role.name}`} />

            <div className="max-w-5xl space-y-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-lg font-semibold tracking-tight text-foreground">
                                Edit Role: {role.name}
                            </h1>
                            {role.is_system && (
                                <Badge
                                    variant="secondary"
                                    className="text-[10px]"
                                >
                                    System Role
                                </Badge>
                            )}
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            Update role title, scope description, and granted
                            module permissions.
                        </p>
                    </div>

                    <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/settings/roles/${role.id}`}>
                            <ArrowLeft className="mr-1.5 h-4 w-4" />
                            Back to Details
                        </Link>
                    </Button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Role Identification */}
                    <UctPanelCard
                        title="Role Configuration"
                        description="Core role naming and scope."
                        icon={Shield}
                    >
                        <div className="grid grid-cols-1 gap-4 pt-2 md:grid-cols-2">
                            <div className="space-y-1.5">
                                <Label
                                    htmlFor="name"
                                    className="text-xs font-semibold"
                                >
                                    Role Name{' '}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) =>
                                        setData('name', e.target.value)
                                    }
                                    className="text-xs"
                                    required
                                />
                                {errors.name && (
                                    <p className="text-[11px] text-destructive">
                                        {errors.name}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <Label
                                    htmlFor="slug"
                                    className="text-xs font-semibold"
                                >
                                    Role Identifier (Slug)
                                </Label>
                                <Input
                                    id="slug"
                                    value={data.slug}
                                    onChange={(e) =>
                                        setData(
                                            'slug',
                                            e.target.value
                                                .toLowerCase()
                                                .replace(/[^a-z0-9_]/g, ''),
                                        )
                                    }
                                    className="font-mono text-xs lowercase"
                                    disabled={role.is_system}
                                    required
                                />
                                {role.is_system && (
                                    <p className="text-[11px] text-muted-foreground">
                                        System role slugs are immutable.
                                    </p>
                                )}
                                {errors.slug && (
                                    <p className="text-[11px] text-destructive">
                                        {errors.slug}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-1.5 md:col-span-2">
                                <Label
                                    htmlFor="description"
                                    className="text-xs font-semibold"
                                >
                                    Role Description
                                </Label>
                                <Textarea
                                    id="description"
                                    rows={2}
                                    value={data.description}
                                    onChange={(e) =>
                                        setData('description', e.target.value)
                                    }
                                    className="text-xs"
                                />
                                {errors.description && (
                                    <p className="text-[11px] text-destructive">
                                        {errors.description}
                                    </p>
                                )}
                            </div>
                        </div>
                    </UctPanelCard>

                    {/* Permissions Selection Matrix */}
                    <UctPanelCard
                        title="Granted Module Privileges"
                        description="Select the administrative actions allowed for this role."
                        icon={KeyRound}
                        actions={
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={handleSelectAll}
                            >
                                Toggle All Permissions
                            </Button>
                        }
                    >
                        <div className="space-y-6 pt-2">
                            {Object.entries(permissions_by_module).map(
                                ([moduleName, permissions]) => {
                                    const moduleIds = permissions.map(
                                        (p) => p.id,
                                    );
                                    const allSelected = moduleIds.every((id) =>
                                        data.permissions.includes(id),
                                    );

                                    return (
                                        <div
                                            key={moduleName}
                                            className="space-y-3 rounded border border-border/50 bg-card p-3"
                                        >
                                            <div className="flex items-center justify-between border-b border-border/40 pb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold tracking-wide text-foreground uppercase">
                                                        {moduleName} Module
                                                    </span>
                                                    <Badge
                                                        variant="secondary"
                                                        className="text-[10px]"
                                                    >
                                                        {
                                                            permissions.filter(
                                                                (p) =>
                                                                    data.permissions.includes(
                                                                        p.id,
                                                                    ),
                                                            ).length
                                                        }{' '}
                                                        of {permissions.length}
                                                    </Badge>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleSelectAllInModule(
                                                            permissions,
                                                        )
                                                    }
                                                    className="text-xs font-medium text-primary hover:underline"
                                                >
                                                    {allSelected
                                                        ? 'Deselect Module'
                                                        : 'Select All'}
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-3">
                                                {permissions.map(
                                                    (permission) => {
                                                        const isChecked =
                                                            data.permissions.includes(
                                                                permission.id,
                                                            );

                                                        return (
                                                            <label
                                                                key={
                                                                    permission.id
                                                                }
                                                                className={`flex cursor-pointer items-start gap-2.5 rounded border p-2 text-xs transition-colors ${
                                                                    isChecked
                                                                        ? 'border-primary/30 bg-primary/5'
                                                                        : 'border-border/40 bg-muted/10 hover:bg-muted/20'
                                                                }`}
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    checked={
                                                                        isChecked
                                                                    }
                                                                    onChange={() =>
                                                                        handleTogglePermission(
                                                                            permission.id,
                                                                        )
                                                                    }
                                                                    className="mt-0.5 h-3.5 w-3.5 rounded border-gray-300 text-primary focus:ring-primary"
                                                                />
                                                                <div>
                                                                    <p className="leading-tight font-semibold text-foreground">
                                                                        {
                                                                            permission.name
                                                                        }
                                                                    </p>
                                                                    {permission.description && (
                                                                        <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
                                                                            {
                                                                                permission.description
                                                                            }
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </label>
                                                        );
                                                    },
                                                )}
                                            </div>
                                        </div>
                                    );
                                },
                            )}
                        </div>
                    </UctPanelCard>

                    <div className="flex items-center justify-end gap-3">
                        <Button variant="outline" size="sm" asChild>
                            <Link href={`/admin/settings/roles/${role.id}`}>
                                Cancel
                            </Link>
                        </Button>
                        <Button type="submit" size="sm" disabled={processing}>
                            <Save className="mr-1.5 h-4 w-4" />
                            {processing ? 'Saving...' : 'Update Role'}
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

AdminRoleEdit.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/admin/dashboard' },
        { title: 'Roles', href: '/admin/settings/roles' },
    ],
};
