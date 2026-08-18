import { PortalPlaceholder } from '@/components/portal-placeholder';

export default function AdminAuditLogIndex() {
    return <PortalPlaceholder title="Audit Log" portal="Super Admin" />;
}

AdminAuditLogIndex.layout = {
    breadcrumbs: [{ title: 'Audit Log', href: '/admin/audit-log' }],
};
