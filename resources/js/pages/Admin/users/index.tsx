import React, { useState } from 'react';
import { Deferred, Head, Link, router, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MetricCard } from '@/components/tools/MetricCard';
import { MetricCardsSkeleton } from '@/components/tools/metric-cards-skeleton';
import { DataTable } from '@/components/tools/table/main-table';
import { TableSkeleton } from '@/components/tools/table-skeleton';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import type { BreadcrumbItem } from '@/types';
import type { DataTableServerFilter } from '@/components/tools/table/types';
import type { ColumnDef } from '@tanstack/react-table';
import {
    Users,
    Shield,
    KeyRound,
    UserPlus,
    CheckCircle2,
    XCircle,
    Edit3,
    Trash2,
    GraduationCap,
    Lock,
    Save,
} from 'lucide-react';
import { toast } from 'sonner';

export interface UserItem {
    id: number;
    name: string;
    email: string;
    role: string;
    is_active: boolean;
    email_verified_at: string | null;
    created_at: string;
}

export interface UserStats {
    total_users: number;
    active_users: number;
    super_admins: number;
    students: number;
    lecturers: number;
}

export interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
}

interface AdminUsersIndexProps {
    stats?: UserStats;
    users?: PaginatedData<UserItem>;
    roles: Array<{ name: string; value: string }>;
    filters: {
        search: string;
        role: string;
        status: string;
        per_page: number;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/admin/dashboard' },
    { title: 'Settings', href: '/admin/settings/system' },
    { title: 'User Management', href: '/admin/settings/users' },
];

export default function AdminUsersIndex({
    stats,
    users,
    roles = [],
    filters,
}: AdminUsersIndexProps) {
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [passwordModalOpen, setPasswordModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
    const [deleteProcessing, setDeleteProcessing] = useState(false);

    // Create User Form
    const createForm = useForm({
        name: '',
        email: '',
        password: '',
        role: 'student',
        is_active: true,
    });

    // Edit User Form
    const editForm = useForm({
        name: '',
        email: '',
        role: 'student',
        is_active: true,
    });

    // Password Reset Form
    const passwordForm = useForm({
        password: '',
    });

    const handleFilterUpdate = (newFilters: Partial<typeof filters>) => {
        const query = {
            ...filters,
            ...newFilters,
        };

        const cleanQuery: Record<string, any> = {};
        Object.entries(query).forEach(([key, val]) => {
            if (val !== undefined && val !== '' && val !== 'all') {
                cleanQuery[key] = val;
            }
        });

        router.get('/admin/settings/users', cleanQuery, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleCreateUser = (e: React.FormEvent) => {
        e.preventDefault();
        createForm.post('/admin/settings/users', {
            onSuccess: () => {
                setCreateModalOpen(false);
                createForm.reset();
            },
        });
    };

    const handleEditUser = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser) return;

        editForm.put(`/admin/settings/users/${selectedUser.id}`, {
            onSuccess: () => {
                setEditModalOpen(false);
                setSelectedUser(null);
            },
        });
    };

    const handleResetPassword = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser) return;

        passwordForm.post(`/admin/settings/users/${selectedUser.id}/reset-password`, {
            onSuccess: () => {
                setPasswordModalOpen(false);
                passwordForm.reset();
                setSelectedUser(null);
            },
        });
    };

    const handleToggleStatus = (user: UserItem) => {
        router.post(`/admin/settings/users/${user.id}/toggle-status`, {}, {
            preserveScroll: true,
            onSuccess: () => toast.success(`User status updated.`),
        });
    };

    const confirmDelete = () => {
        if (!selectedUser) return;
        setDeleteProcessing(true);

        router.delete(`/admin/settings/users/${selectedUser.id}`, {
            onSuccess: () => {
                setDeleteModalOpen(false);
                setSelectedUser(null);
                setDeleteProcessing(false);
            },
            onError: () => setDeleteProcessing(false),
        });
    };

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'super_admin':
                return <Badge className="bg-primary/10 text-primary border-primary/20">Super Admin</Badge>;
            case 'registrar':
                return <Badge className="bg-sky-500/10 text-sky-700 border-sky-200">Registrar</Badge>;
            case 'finance':
                return <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-200">Finance</Badge>;
            case 'hr':
                return <Badge className="bg-purple-500/10 text-purple-700 border-purple-200">HR</Badge>;
            case 'lecturer':
                return <Badge className="bg-amber-500/10 text-amber-700 border-amber-200">Lecturer</Badge>;
            default:
                return <Badge variant="outline" className="capitalize">{role}</Badge>;
        }
    };

    const columns: ColumnDef<UserItem>[] = [
        {
            accessorKey: 'name',
            header: 'User Account',
            cell: ({ row }) => (
                <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-xs">
                        {row.original.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <p className="font-semibold text-foreground text-sm">{row.original.name}</p>
                        <p className="text-xs text-muted-foreground">{row.original.email}</p>
                    </div>
                </div>
            ),
        },
        {
            accessorKey: 'role',
            header: 'Assigned Role',
            cell: ({ row }) => getRoleBadge(row.original.role),
        },
        {
            accessorKey: 'is_active',
            header: 'Account Status',
            cell: ({ row }) => {
                const isActive = row.original.is_active;
                return (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleToggleStatus(row.original);
                        }}
                        className="cursor-pointer"
                    >
                        {isActive ? (
                            <Badge className="bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 border-emerald-200">
                                Active
                            </Badge>
                        ) : (
                            <Badge variant="outline" className="text-muted-foreground hover:bg-muted/40">
                                Deactivated
                            </Badge>
                        )}
                    </button>
                );
            },
        },
        {
            accessorKey: 'created_at',
            header: 'Created On',
            cell: ({ row }) => (
                <span className="text-xs text-muted-foreground">
                    {String(row.original.created_at).split('T')[0]}
                </span>
            ),
        },
        {
            id: 'actions',
            header: () => <span className="sr-only">Actions</span>,
            cell: ({ row }) => {
                const u = row.original;
                return (
                    <div className="flex items-center justify-end gap-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedUser(u);
                                passwordForm.reset();
                                setPasswordModalOpen(true);
                            }}
                        >
                            <KeyRound className="h-3.5 w-3.5 mr-1" />
                            Password
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedUser(u);
                                editForm.setData({
                                    name: u.name,
                                    email: u.email,
                                    role: u.role,
                                    is_active: u.is_active,
                                });
                                setEditModalOpen(true);
                            }}
                        >
                            <Edit3 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedUser(u);
                                setDeleteModalOpen(true);
                            }}
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                );
            },
        },
    ];

    const serverFilters: DataTableServerFilter[] = [
        {
            key: 'role',
            title: 'Role',
            options: [
                { label: 'All Roles', value: 'all' },
                { label: 'Super Admin', value: 'super_admin' },
                { label: 'Registrar', value: 'registrar' },
                { label: 'Finance', value: 'finance' },
                { label: 'HR', value: 'hr' },
                { label: 'Lecturer', value: 'lecturer' },
                { label: 'Student', value: 'student' },
            ],
            value: filters.role || undefined,
        },
        {
            key: 'status',
            title: 'Status',
            options: [
                { label: 'All Statuses', value: 'all' },
                { label: 'Active', value: 'active' },
                { label: 'Deactivated', value: 'inactive' },
            ],
            value: filters.status || undefined,
        },
    ];

    return (
        <>
            <Head title="User Management & Access Control" />

            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h1 className="text-lg font-semibold text-foreground tracking-tight">
                            User Management & Access Control
                        </h1>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Provision system logins, assign institutional roles, activate/deactivate credentials, and reset security passkeys.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/admin/settings/roles">
                                <Shield className="h-4 w-4 mr-1.5" />
                                Roles & Permissions
                            </Link>
                        </Button>
                        <Button size="sm" onClick={() => setCreateModalOpen(true)}>
                            <UserPlus className="h-4 w-4 mr-1.5" />
                            Create User
                        </Button>
                    </div>
                </div>

                {/* Metric Cards */}
                <Deferred data="stats" fallback={<MetricCardsSkeleton />}>
                    {stats && (
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:gap-4 lg:grid-cols-5 animate-in fade-in slide-in-from-top-6 duration-1000 ease-in-out">
                            <MetricCard
                                title="Total Users"
                                value={stats.total_users}
                                icon={Users}
                                color="primary"
                            />
                            <MetricCard
                                title="Active Accounts"
                                value={stats.active_users}
                                icon={CheckCircle2}
                                color="success"
                            />
                            <MetricCard
                                title="Super Admins"
                                value={stats.super_admins}
                                icon={Shield}
                                color="accent"
                            />
                            <MetricCard
                                title="Faculty Lecturers"
                                value={stats.lecturers}
                                icon={GraduationCap}
                                color="warning"
                            />
                            <MetricCard
                                title="Enrolled Students"
                                value={stats.students}
                                icon={Users}
                                color="info"
                            />
                        </div>
                    )}
                </Deferred>

                {/* Users Data Table */}
                <Deferred data="users" fallback={<TableSkeleton />}>
                    {users && (
                        <div className="border border-border/60 rounded-md bg-card p-4">
                            <DataTable
                                title="System Accounts Roster"
                                searchTitle="Search by name, email..."
                                columns={columns}
                                data={users.data}
                                pagination={{
                                    current_page: users.current_page,
                                    last_page: users.last_page,
                                    per_page: users.per_page,
                                    total: users.total,
                                }}
                                onPageChange={(page) => handleFilterUpdate({ ...filters, page } as any)}
                                onPageSizeChange={(per_page) => handleFilterUpdate({ per_page, page: 1 } as any)}
                                serverFilters={serverFilters}
                                onServerFilterChange={(key, values) => {
                                    handleFilterUpdate({ [key]: values?.[0] ?? 'all' });
                                }}
                                onServerFilterClear={() => {
                                    router.get('/admin/settings/users', {}, { preserveState: true });
                                }}
                            />
                        </div>
                    )}
                </Deferred>

                {/* Create User Modal */}
                <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-base font-semibold">Provision New User</DialogTitle>
                            <DialogDescription className="text-xs">
                                Create an authenticated institutional account.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleCreateUser} className="space-y-4 py-2">
                            <div className="space-y-1.5">
                                <Label htmlFor="name" className="text-xs font-semibold">
                                    Full Name <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    placeholder="e.g. Dr. Ahmed Hassan"
                                    value={createForm.data.name}
                                    onChange={(e) => createForm.setData('name', e.target.value)}
                                    className="text-xs"
                                    required
                                />
                                {createForm.errors.name && <p className="text-[11px] text-destructive">{createForm.errors.name}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="email" className="text-xs font-semibold">
                                    Institutional Email <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="e.g. a.hassan@uct.so"
                                    value={createForm.data.email}
                                    onChange={(e) => createForm.setData('email', e.target.value)}
                                    className="text-xs"
                                    required
                                />
                                {createForm.errors.email && <p className="text-[11px] text-destructive">{createForm.errors.email}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="password" className="text-xs font-semibold">
                                    Temporary Password <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Minimum 8 characters"
                                    value={createForm.data.password}
                                    onChange={(e) => createForm.setData('password', e.target.value)}
                                    className="text-xs"
                                    required
                                />
                                {createForm.errors.password && <p className="text-[11px] text-destructive">{createForm.errors.password}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="role" className="text-xs font-semibold">
                                    Institutional Role <span className="text-destructive">*</span>
                                </Label>
                                <select
                                    id="role"
                                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring capitalize"
                                    value={createForm.data.role}
                                    onChange={(e) => createForm.setData('role', e.target.value)}
                                    required
                                >
                                    <option value="super_admin">Super Administrator</option>
                                    <option value="registrar">Registrar Officer</option>
                                    <option value="finance">Finance / Bursar</option>
                                    <option value="hr">Human Resources</option>
                                    <option value="lecturer">Lecturer</option>
                                    <option value="student">Student</option>
                                </select>
                            </div>

                            <DialogFooter className="pt-2">
                                <Button type="button" variant="outline" size="sm" onClick={() => setCreateModalOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" size="sm" disabled={createForm.processing}>
                                    <Save className="h-4 w-4 mr-1.5" />
                                    {createForm.processing ? 'Creating...' : 'Create Account'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Edit User Modal */}
                <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-base font-semibold">Edit User Details</DialogTitle>
                            <DialogDescription className="text-xs">
                                Update user identity and assigned role.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleEditUser} className="space-y-4 py-2">
                            <div className="space-y-1.5">
                                <Label htmlFor="edit_name" className="text-xs font-semibold">Full Name</Label>
                                <Input
                                    id="edit_name"
                                    value={editForm.data.name}
                                    onChange={(e) => editForm.setData('name', e.target.value)}
                                    className="text-xs"
                                    required
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="edit_email" className="text-xs font-semibold">Email Address</Label>
                                <Input
                                    id="edit_email"
                                    type="email"
                                    value={editForm.data.email}
                                    onChange={(e) => editForm.setData('email', e.target.value)}
                                    className="text-xs"
                                    required
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="edit_role" className="text-xs font-semibold">Role</Label>
                                <select
                                    id="edit_role"
                                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring capitalize"
                                    value={editForm.data.role}
                                    onChange={(e) => editForm.setData('role', e.target.value)}
                                    required
                                >
                                    <option value="super_admin">Super Administrator</option>
                                    <option value="registrar">Registrar Officer</option>
                                    <option value="finance">Finance / Bursar</option>
                                    <option value="hr">Human Resources</option>
                                    <option value="lecturer">Lecturer</option>
                                    <option value="student">Student</option>
                                </select>
                            </div>

                            <DialogFooter className="pt-2">
                                <Button type="button" variant="outline" size="sm" onClick={() => setEditModalOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" size="sm" disabled={editForm.processing}>
                                    <Save className="h-4 w-4 mr-1.5" />
                                    {editForm.processing ? 'Saving...' : 'Update User'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Reset Password Modal */}
                <Dialog open={passwordModalOpen} onOpenChange={setPasswordModalOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-base font-semibold">Reset User Password</DialogTitle>
                            <DialogDescription className="text-xs">
                                Set a new security password for {selectedUser?.name}.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleResetPassword} className="space-y-4 py-2">
                            <div className="space-y-1.5">
                                <Label htmlFor="new_password" className="text-xs font-semibold">
                                    New Password <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="new_password"
                                    type="password"
                                    placeholder="Enter new password (minimum 8 characters)"
                                    value={passwordForm.data.password}
                                    onChange={(e) => passwordForm.setData('password', e.target.value)}
                                    className="text-xs"
                                    required
                                />
                                {passwordForm.errors.password && (
                                    <p className="text-[11px] text-destructive">{passwordForm.errors.password}</p>
                                )}
                            </div>

                            <DialogFooter className="pt-2">
                                <Button type="button" variant="outline" size="sm" onClick={() => setPasswordModalOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" size="sm" disabled={passwordForm.processing}>
                                    <Lock className="h-4 w-4 mr-1.5" />
                                    {passwordForm.processing ? 'Resetting...' : 'Reset Password'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Delete Confirmation Modal */}
                <ConfirmDeleteDialog
                    open={deleteModalOpen}
                    onOpenChange={setDeleteModalOpen}
                    title="Delete User Account"
                    description="Are you sure you want to delete this user? Their portal access will be permanently revoked."
                    itemName={selectedUser ? `${selectedUser.name} (${selectedUser.email})` : undefined}
                    loading={deleteProcessing}
                    onConfirm={confirmDelete}
                />
            </div>
        </>
    );
}

AdminUsersIndex.layout = { breadcrumbs };
