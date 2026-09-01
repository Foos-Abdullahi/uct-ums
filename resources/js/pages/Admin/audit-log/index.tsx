import React from 'react';
import { Deferred, Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MetricCard } from '@/components/tools/MetricCard';
import { MetricCardsSkeleton } from '@/components/tools/metric-cards-skeleton';
import { DataTable } from '@/components/tools/table/main-table';
import { TableSkeleton } from '@/components/tools/table-skeleton';
import type { BreadcrumbItem } from '@/types';
import type { DataTableServerFilter } from '@/components/tools/table/types';
import type { ColumnDef } from '@tanstack/react-table';
import {
    ScrollText,
    Shield,
    Activity,
    Clock,
    User,
    Server,
    Laptop,
    CheckCircle2,
    AlertTriangle,
} from 'lucide-react';

export interface AuditLogItem {
    id: number;
    user_name: string;
    user_email: string;
    role: string;
    event: string;
    resource: string;
    ip_address: string;
    device: string;
    status: string;
    created_at: string;
}

export interface AuditStats {
    total_logs: number;
    today_events: number;
    security_events: number;
    active_sessions: number;
}

interface AdminAuditLogIndexProps {
    stats?: AuditStats;
    logs: AuditLogItem[];
    filters: {
        search: string;
        event: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/admin/dashboard' },
    { title: 'Settings', href: '/admin/settings/system' },
    { title: 'Audit Log', href: '/admin/settings/audit-log' },
];

export default function AdminAuditLogIndex({
    stats,
    logs = [],
    filters,
}: AdminAuditLogIndexProps) {
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

        router.get('/admin/settings/audit-log', cleanQuery, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const getEventBadge = (event: string) => {
        if (event.includes('Created') || event.includes('Approved') || event.includes('Verified')) {
            return <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-200 text-[11px]">{event}</Badge>;
        }
        if (event.includes('Updated') || event.includes('Issued') || event.includes('Submitted')) {
            return <Badge className="bg-primary/10 text-primary border-primary/20 text-[11px]">{event}</Badge>;
        }
        if (event.includes('Deleted') || event.includes('Rejected')) {
            return <Badge variant="destructive" className="text-[11px]">{event}</Badge>;
        }
        return <Badge variant="outline" className="text-[11px]">{event}</Badge>;
    };

    const columns: ColumnDef<AuditLogItem>[] = [
        {
            accessorKey: 'user_name',
            header: 'Initiator',
            cell: ({ row }) => (
                <div className="max-w-[200px]">
                    <p className="font-semibold text-foreground truncate text-sm">{row.original.user_name}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Badge variant="secondary" className="text-[10px] px-1 py-0">{row.original.role}</Badge>
                        <span className="truncate">{row.original.user_email}</span>
                    </div>
                </div>
            ),
        },
        {
            accessorKey: 'event',
            header: 'Event Action',
            cell: ({ row }) => getEventBadge(row.original.event),
        },
        {
            accessorKey: 'resource',
            header: 'Target Entity / Resource',
            cell: ({ row }) => (
                <span className="text-xs font-mono font-medium text-foreground">
                    {row.original.resource}
                </span>
            ),
        },
        {
            accessorKey: 'ip_address',
            header: 'Network & Device',
            cell: ({ row }) => (
                <div className="text-xs">
                    <span className="font-mono text-muted-foreground">{row.original.ip_address}</span>
                    <span className="text-[11px] text-muted-foreground block truncate max-w-[180px]">{row.original.device}</span>
                </div>
            ),
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => (
                <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-200 text-[10px] uppercase font-bold">
                    {row.original.status}
                </Badge>
            ),
        },
        {
            accessorKey: 'created_at',
            header: 'Timestamp',
            cell: ({ row }) => (
                <span className="text-xs text-muted-foreground">
                    {row.original.created_at}
                </span>
            ),
        },
    ];

    const serverFilters: DataTableServerFilter[] = [
        {
            key: 'event',
            title: 'Event Category',
            options: [
                { label: 'All Events', value: 'all' },
                { label: 'Settings Updated', value: 'Settings Updated' },
                { label: 'Payment Verified', value: 'Payment Verified' },
                { label: 'Course Created', value: 'Course Created' },
                { label: 'Admission Approved', value: 'Admission Approved' },
                { label: 'Grade Submitted', value: 'Grade Submitted' },
                { label: 'Invoice Issued', value: 'Invoice Issued' },
                { label: 'User Created', value: 'User Created' },
            ],
            value: filters.event || undefined,
        },
    ];

    return (
        <>
            <Head title="System Audit Logs & Security Events" />

            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h1 className="text-lg font-semibold text-foreground tracking-tight">
                            Security & Audit Trail Log
                        </h1>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Comprehensive ledger of all administrative events, user authentications, financial actions, and record modifications.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/admin/settings/users">
                                <User className="h-4 w-4 mr-1.5" />
                                Users Roster
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Metric Cards */}
                <Deferred data="stats" fallback={<MetricCardsSkeleton />}>
                    {stats && (
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:gap-4 lg:grid-cols-4 animate-in fade-in slide-in-from-top-6 duration-1000 ease-in-out">
                            <MetricCard
                                title="Total Logged Events"
                                value={`${stats.total_logs} actions`}
                                icon={Activity}
                                color="primary"
                            />
                            <MetricCard
                                title="Events Today"
                                value={`${stats.today_events} actions`}
                                icon={Clock}
                                color="success"
                            />
                            <MetricCard
                                title="Security Events"
                                value={`${stats.security_events} alerts`}
                                icon={Shield}
                                color="warning"
                            />
                            <MetricCard
                                title="Active Sessions"
                                value={`${stats.active_sessions} accounts`}
                                icon={Laptop}
                                color="accent"
                            />
                        </div>
                    )}
                </Deferred>

                {/* Audit Log Table */}
                <div className="border border-border/60 rounded-md bg-card p-4">
                    <DataTable
                        title="Security Audit Records"
                        searchTitle="Search by initiator, resource, IP address..."
                        columns={columns}
                        data={logs}
                        serverFilters={serverFilters}
                        onServerFilterChange={(key, values) => {
                            handleFilterUpdate({ [key]: values?.[0] ?? 'all' });
                        }}
                        onServerFilterClear={() => {
                            router.get('/admin/settings/audit-log', {}, { preserveState: true });
                        }}
                    />
                </div>
            </div>
        </>
    );
}

AdminAuditLogIndex.layout = { breadcrumbs };
