import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UctPanelCard } from '@/components/tools/uct-panel-card';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import type { BreadcrumbItem } from '@/types';
import {
    ArrowLeft,
    Shield,
    Edit3,
    Trash2,
    Users,
    KeyRound,
    Lock,
    UserCheck,
    CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';

interface PermissionItem {
    id: number;
    module: string;
    name: string;
    slug: string;
    description: string | null;
}

interface UserItem {
    id: number;
    name: string;
    email: string;
    is_active: boolean;
    created_at: string;
}

interface RoleDetails {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    is_system: boolean;
    permissions_count: number;
    users_count: number;
    created_at: string;
}

interface PaginatedUsers {
    data: UserItem[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface AdminRoleShowProps {
    role: RoleDetails;
    permissions_by_module: Record<string, PermissionItem[]>;
    users: PaginatedUsers;
}

export default function AdminRoleShow({
    role,
    permissions_by_module = {},
    users,
}: AdminRoleShowProps) {
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleteProcessing, setDeleteProcessing] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/admin/dashboard' },
        { title: 'Roles', href: '/admin/settings/roles' },
        { title: role.name, href: `/admin/settings/roles/${role.id}` },
    ];

    const handleDelete = () => {
        setDeleteProcessing(true);
        router.delete(`/admin/settings/roles/${role.id}`, {
            onSuccess: () => {
                toast.success('Role deleted successfully.');
                setDeleteModalOpen(false);
                setDeleteProcessing(false);
            },
            onError: () => setDeleteProcessing(false),
        });
    };

    return (
        <>
            <Head title={`${role.name} - Role Details`} />

            <div className="p-6 space-y-6">
                {/* Header UctPanelCard */}
                <UctPanelCard
                    title={role.name}
                    subtitle={
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5 font-mono">
                            <span>Slug: {role.slug}</span>
                            <span>· {role.permissions_count} Granted Permissions</span>
                        </div>
                    }
                    icon={Shield}
                    badge={
                        <div className="flex items-center gap-1.5">
                            {role.is_system ? (
                                <Badge className="bg-primary/10 text-primary border-primary/20">
                                    Core System Role
                                </Badge>
                            ) : (
                                <Badge variant="outline">
                                    Custom Role
                                </Badge>
                            )}
                            <Badge variant="secondary">
                                {role.users_count} Users
                            </Badge>
                        </div>
                    }
                    actions={
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" asChild>
                                <Link href="/admin/settings/roles">
                                    <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
                                    Back
                                </Link>
                            </Button>
                            <Button size="sm" asChild>
                                <Link href={`/admin/settings/roles/${role.id}/edit`}>
                                    <Edit3 className="h-3.5 w-3.5 mr-1.5" />
                                    Edit Role
                                </Link>
                            </Button>
                            {!role.is_system && (
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => setDeleteModalOpen(true)}
                                >
                                    <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                                    Delete
                                </Button>
                            )}
                        </div>
                    }
                />

                {/* Main 2-Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Col: Role Summary & Metadata */}
                    <div className="space-y-6">
                        <UctPanelCard
                            title="Role Overview"
                            description="Access level and scope details."
                            icon={Lock}
                        >
                            <div className="divide-y divide-border/30 text-xs pt-1">
                                <div className="flex justify-between py-2">
                                    <span className="text-muted-foreground">Role Type</span>
                                    <span className="font-semibold text-foreground">
                                        {role.is_system ? 'System Native' : 'User Defined'}
                                    </span>
                                </div>
                                <div className="flex justify-between py-2">
                                    <span className="text-muted-foreground">Machine Identifier</span>
                                    <span className="font-mono text-foreground">{role.slug}</span>
                                </div>
                                <div className="flex justify-between py-2">
                                    <span className="text-muted-foreground">Assigned Accounts</span>
                                    <span className="font-semibold text-foreground">{role.users_count} users</span>
                                </div>
                                <div className="flex justify-between py-2">
                                    <span className="text-muted-foreground">Granted Capabilities</span>
                                    <span className="font-semibold text-foreground">{role.permissions_count} privileges</span>
                                </div>
                            </div>
                        </UctPanelCard>

                        {role.description && (
                            <UctPanelCard
                                title="Role Scope Description"
                                icon={Shield}
                            >
                                <p className="text-xs text-muted-foreground leading-relaxed pt-1">
                                    {role.description}
                                </p>
                            </UctPanelCard>
                        )}

                        {/* Assigned Users Roster */}
                        <UctPanelCard
                            title="Assigned User Accounts"
                            description={`Active accounts holding ${role.name} credentials.`}
                            icon={Users}
                            actions={
                                <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
                                    <Link href={`/admin/settings/users?role=${role.slug}`}>
                                        Manage
                                    </Link>
                                </Button>
                            }
                        >
                            {users.data.length === 0 ? (
                                <p className="text-xs text-muted-foreground italic py-4 text-center">
                                    No accounts currently assigned to this role.
                                </p>
                            ) : (
                                <div className="divide-y divide-border/40 text-xs pt-1">
                                    {users.data.map((u) => (
                                        <div key={u.id} className="flex items-center justify-between py-2">
                                            <div>
                                                <p className="font-semibold text-foreground">{u.name}</p>
                                                <p className="text-[11px] text-muted-foreground">{u.email}</p>
                                            </div>
                                            <Badge
                                                className={
                                                    u.is_active
                                                        ? 'bg-emerald-500/10 text-emerald-700 text-[10px]'
                                                        : 'bg-muted text-muted-foreground text-[10px]'
                                                }
                                            >
                                                {u.is_active ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </UctPanelCard>
                    </div>

                    {/* Right 2 Cols: Granted Permissions by Module */}
                    <div className="lg:col-span-2 space-y-4">
                        <UctPanelCard
                            title="Granted Permission Matrix"
                            description="Privileges enabled for this institutional role."
                            icon={KeyRound}
                        >
                            {Object.keys(permissions_by_module).length === 0 ? (
                                <p className="text-xs text-muted-foreground italic py-6 text-center">
                                    No permissions assigned to this role.
                                </p>
                            ) : (
                                <div className="space-y-4 pt-2">
                                    {Object.entries(permissions_by_module).map(([moduleName, permissions]) => (
                                        <div key={moduleName} className="rounded border border-border/50 bg-card p-3 space-y-2">
                                            <div className="flex items-center justify-between border-b border-border/40 pb-1.5">
                                                <span className="font-bold text-xs text-foreground uppercase tracking-wide">
                                                    {moduleName} Module
                                                </span>
                                                <Badge variant="secondary" className="text-[10px]">
                                                    {permissions.length} Enabled
                                                </Badge>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                                                {permissions.map((p) => (
                                                    <div
                                                        key={p.id}
                                                        className="flex items-start gap-2 p-2 rounded bg-muted/20 border border-border/40 text-xs"
                                                    >
                                                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                                                        <div>
                                                            <p className="font-semibold text-foreground leading-tight">{p.name}</p>
                                                            {p.description && (
                                                                <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                                                                    {p.description}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </UctPanelCard>
                    </div>
                </div>

                {/* Delete Confirmation Modal */}
                <ConfirmDeleteDialog
                    open={deleteModalOpen}
                    onOpenChange={setDeleteModalOpen}
                    title="Delete Role"
                    description="Are you sure you want to delete this custom role? This will revoke all permissions attached to it."
                    itemName={`${role.name} (${role.slug})`}
                    loading={deleteProcessing}
                    onConfirm={handleDelete}
                />
            </div>
        </>
    );
}

AdminRoleShow.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/admin/dashboard' },
        { title: 'Roles', href: '/admin/settings/roles' },
    ],
};
