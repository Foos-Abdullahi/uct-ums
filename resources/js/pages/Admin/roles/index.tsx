import React, { useState } from 'react';
import { Deferred, Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MetricCard } from '@/components/tools/MetricCard';
import { MetricCardsSkeleton } from '@/components/tools/metric-cards-skeleton';
import { DataTable } from '@/components/tools/table/main-table';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import type { BreadcrumbItem } from '@/types';
import type { ColumnDef } from '@tanstack/react-table';
import {
    Shield,
    KeyRound,
    Plus,
    Users,
    CheckCircle2,
    Eye,
    Edit3,
    Trash2,
    Lock,
    UserCheck,
    Layers,
} from 'lucide-react';
import { toast } from 'sonner';

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
    filters,
}: AdminRolesIndexProps) {
    const [selectedForDelete, setSelectedForDelete] = useState<RoleItem | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleteProcessing, setDeleteProcessing] = useState(false);

    const handleFilterUpdate = (newFilters: Partial<typeof filters>) => {
        const query = {
            ...filters,
            ...newFilters,
        };

        const cleanQuery: Record<string, any> = {};
        Object.entries(query).forEach(([key, val]) => {
            if (val !== undefined && val !== '') {
                cleanQuery[key] = val;
            }
        });

        router.get('/admin/settings/roles', cleanQuery, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const confirmDelete = () => {
        if (!selectedForDelete) return;
        setDeleteProcessing(true);

        router.delete(`/admin/settings/roles/${selectedForDelete.id}`, {
            onSuccess: () => {
                toast.success(`Role ${selectedForDelete.name} deleted.`);
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
            header: 'Role Name',
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-xs">
                        <Shield className="h-4 w-4" />
                    </div>
                    <div className="max-w-[220px]">
                        <div className="flex items-center gap-2">
                            <p className="font-semibold text-foreground text-sm">{row.original.name}</p>
                            {row.original.is_system && (
                                <Badge variant="secondary" className="text-[10px] px-1 py-0">
                                    System
                                </Badge>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground font-mono">{row.original.slug}</p>
                    </div>
                </div>
            ),
        },
        {
            accessorKey: 'description',
            header: 'Description',
            cell: ({ row }) => (
                <p className="text-xs text-muted-foreground max-w-[280px] truncate">
                    {row.original.description || 'No description provided.'}
                </p>
            ),
        },
        {
            accessorKey: 'permissions_count',
            header: 'Permissions',
            cell: ({ row }) => (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                    <KeyRound className="h-3.5 w-3.5 text-primary" />
                    <span>{row.original.permissions_count} Privileges</span>
                </div>
            ),
        },
        {
            accessorKey: 'users_count',
            header: 'Assigned Users',
            cell: ({ row }) => (
                <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <Users className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{row.original.users_count} accounts</span>
                </div>
            ),
        },
        {
            id: 'actions',
            header: () => <span className="sr-only">Actions</span>,
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
                                <Eye className="h-3.5 w-3.5 mr-1" />
                                View
                            </Link>
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            asChild
                        >
                            <Link href={`/admin/settings/roles/${r.id}/edit`}>
                                <Edit3 className="h-3.5 w-3.5 mr-1" />
                                Edit
                            </Link>
                        </Button>
                        {!r.is_system && (
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
            <Head title="Roles & Permissions Management" />

            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h1 className="text-lg font-semibold text-foreground tracking-tight">
                            Roles & Access Permissions
                        </h1>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Manage role hierarchies, configure fine-grained module privileges, and audit assigned user accounts.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/admin/settings/users">
                                <Users className="h-4 w-4 mr-1.5" />
                                Users Roster
                            </Link>
                        </Button>
                        <Button size="sm" asChild>
                            <Link href="/admin/settings/roles/create">
                                <Plus className="h-4 w-4 mr-1.5" />
                                Create Role
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Metric Cards */}
                <Deferred data="stats" fallback={<MetricCardsSkeleton />}>
                    {stats && (
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:gap-4 lg:grid-cols-5 animate-in fade-in slide-in-from-top-6 duration-1000 ease-in-out">
                            <MetricCard
                                title="Total Roles"
                                value={stats.total_roles}
                                icon={Shield}
                                color="primary"
                            />
                            <MetricCard
                                title="System Core Roles"
                                value={stats.system_roles}
                                icon={Lock}
                                color="accent"
                            />
                            <MetricCard
                                title="Custom Roles"
                                value={stats.custom_roles}
                                icon={Layers}
                                color="info"
                            />
                            <MetricCard
                                title="Defined Privileges"
                                value={stats.total_permissions}
                                icon={KeyRound}
                                color="warning"
                            />
                            <MetricCard
                                title="Assigned Users"
                                value={stats.total_users}
                                icon={UserCheck}
                                color="success"
                            />
                        </div>
                    )}
                </Deferred>

                {/* Roles Data Table */}
                <div className="border border-border/60 rounded-md bg-card p-4">
                    <DataTable
                        title="Configured Roles Roster"
                        searchTitle="Search by role name, slug, description..."
                        columns={columns}
                        data={roles}
                        onRowClick={(row) => router.visit(`/admin/settings/roles/${row.original.id}`)}
                    />
                </div>

                {/* Delete Confirmation Modal */}
                <ConfirmDeleteDialog
                    open={deleteModalOpen}
                    onOpenChange={setDeleteModalOpen}
                    title="Delete Custom Role"
                    description="Are you sure you want to delete this custom role? This will revoke all permissions attached to it."
                    itemName={selectedForDelete ? `${selectedForDelete.name} (${selectedForDelete.slug})` : undefined}
                    loading={deleteProcessing}
                    onConfirm={confirmDelete}
                />
            </div>
        </>
    );
}

AdminRolesIndex.layout = { breadcrumbs };
