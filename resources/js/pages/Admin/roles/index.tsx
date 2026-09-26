import { Deferred, Head, Link, router } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import {
    Shield,
    KeyRound,
    Plus,
    Users,
    Eye,
    Edit3,
    Trash2,
    Lock,
    UserCheck,
    Layers,
} from 'lucide-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import { MetricCardsSkeleton } from '@/components/tools/metric-cards-skeleton';
import { MetricCard } from '@/components/tools/MetricCard';
import { DataTable } from '@/components/tools/table/main-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { usePermissions } from '@/hooks/use-permissions';
import type { BreadcrumbItem } from '@/types';

export interface RoleItem {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    is_system: boolean;
    permissions_count: number;
    users_count: number;
    created_at: string;
}

export interface RoleStats {
    total_roles: number;
    system_roles: number;
    custom_roles: number;
    total_permissions: number;
    total_users: number;
}

interface AdminRolesIndexProps {
    stats?: RoleStats;
    roles: RoleItem[];
    filters: {
        search: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/admin/dashboard' },
    { title: 'Settings', href: '/admin/settings/system' },
    { title: 'Roles & Permissions', href: '/admin/settings/roles' },
];

export default function AdminRolesIndex({
    stats,
    roles = [],
}: AdminRolesIndexProps) {
    const { t } = useTranslation();
    const { can } = usePermissions();
    const [selectedForDelete, setSelectedForDelete] = useState<RoleItem | null>(
        null,
    );
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleteProcessing, setDeleteProcessing] = useState(false);

    const confirmDelete = () => {
        if (!selectedForDelete) {
            return;
        }

        setDeleteProcessing(true);

        router.delete(`/admin/settings/roles/${selectedForDelete.id}`, {
            onSuccess: () => {
                toast.success(t('role_deleted_success', { name: selectedForDelete.name }));
                setDeleteModalOpen(false);
                setSelectedForDelete(null);
                setDeleteProcessing(false);
            },
            onError: () => setDeleteProcessing(false),
        });
    };

    const columns: ColumnDef<RoleItem>[] = [
        {
            accessorKey: 'name',
            header: t('role_name_column'),
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        <Shield className="h-4 w-4" />
                    </div>
                    <div className="max-w-[220px]">
                        <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-foreground">
                                {row.original.name}
                            </p>
                            {row.original.is_system && (
                                <Badge
                                    variant="secondary"
                                    className="px-1 py-0 text-[10px]"
                                >
                                    {t('system_badge')}
                                </Badge>
                            )}
                        </div>
                        <p className="font-mono text-xs text-muted-foreground">
                            {row.original.slug}
                        </p>
                    </div>
                </div>
            ),
        },
        {
            accessorKey: 'description',
            header: t('description_column'),
            cell: ({ row }) => (
                <p className="max-w-[280px] truncate text-xs text-muted-foreground">
                    {row.original.description || t('no_description_provided_role')}
                </p>
            ),
        },
        {
            accessorKey: 'permissions_count',
            header: t('permissions_column'),
            cell: ({ row }) => (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                    <KeyRound className="h-3.5 w-3.5 text-primary" />
                    <span>{row.original.permissions_count} {t('privileges_count')}</span>
                </div>
            ),
        },
        {
            accessorKey: 'users_count',
            header: t('assigned_users_column'),
            cell: ({ row }) => (
                <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <Users className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{row.original.users_count} {t('accounts_count')}</span>
                </div>
            ),
        },
        {
            id: 'actions',
            header: () => <span className="sr-only">{t('actions_column')}</span>,
            cell: ({ row }) => {
                const r = row.original;

                return (
                    <div className="flex items-center justify-end gap-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            asChild
                        >
                            <Link href={`/admin/settings/roles/${r.id}`}>
                                <Eye className="mr-1 h-3.5 w-3.5" />
                                {t('view_role')}
                            </Link>
                        </Button>
                        {can('settings.roles') && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs"
                                asChild
                            >
                                <Link href={`/admin/settings/roles/${r.id}/edit`}>
                                    <Edit3 className="mr-1 h-3.5 w-3.5" />
                                    {t('edit_role')}
                                </Link>
                            </Button>
                        )}
                        {can('settings.roles') && !r.is_system && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedForDelete(r);
                                    setDeleteModalOpen(true);
                                }}
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                        )}
                    </div>
                );
            },
        },
    ];

    return (
        <>
            <Head title={t('roles_permissions_management')} />

            <div className="space-y-6 p-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h1 className="text-lg font-semibold tracking-tight text-foreground">
                            {t('roles_permissions_management')}
                        </h1>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            {t('roles_permissions_description')}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/admin/settings/users">
                                <Users className="mr-1.5 h-4 w-4" />
                                {t('users_roster')}
                            </Link>
                        </Button>
                        <Button size="sm" asChild>
                            <Link href="/admin/settings/roles/create">
                                <Plus className="mr-1.5 h-4 w-4" />
                                {t('create_role_button')}
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Metric Cards */}
                <Deferred data="stats" fallback={<MetricCardsSkeleton />}>
                    {stats && (
                        <div className="grid animate-in grid-cols-1 gap-2 duration-1000 ease-in-out fade-in slide-in-from-top-6 sm:grid-cols-2 md:gap-4 lg:grid-cols-5">
                            <MetricCard
                                title={t('total_roles_stats')}
                                value={stats.total_roles}
                                icon={Shield}
                                color="primary"
                            />
                            <MetricCard
                                title={t('system_core_roles')}
                                value={stats.system_roles}
                                icon={Lock}
                                color="accent"
                            />
                            <MetricCard
                                title={t('custom_roles_stats')}
                                value={stats.custom_roles}
                                icon={Layers}
                                color="info"
                            />
                            <MetricCard
                                title={t('defined_privileges')}
                                value={stats.total_permissions}
                                icon={KeyRound}
                                color="warning"
                            />
                            <MetricCard
                                title={t('assigned_users_stats')}
                                value={stats.total_users}
                                icon={UserCheck}
                                color="success"
                            />
                        </div>
                    )}
                </Deferred>

                {/* Roles Data Table */}
                <div className="rounded-md border border-border/60 bg-card p-4">
                    <DataTable
                        title={t('configured_roles_roster')}
                        searchTitle={t('search_roles_description')}
                        columns={columns}
                        data={roles}
                        onRowClick={(row) =>
                            router.visit(
                                `/admin/settings/roles/${row.original.id}`,
                            )
                        }
                    />
                </div>

                {/* Delete Confirmation Modal */}
                <ConfirmDeleteDialog
                    open={deleteModalOpen}
                    onOpenChange={setDeleteModalOpen}
                    title="Delete Custom Role"
                    description="Are you sure you want to delete this custom role? This will revoke all permissions attached to it."
                    itemName={
                        selectedForDelete
                            ? `${selectedForDelete.name} (${selectedForDelete.slug})`
                            : undefined
                    }
                    loading={deleteProcessing}
                    onConfirm={confirmDelete}
                />
            </div>
        </>
    );
}

AdminRolesIndex.layout = { breadcrumbs };
