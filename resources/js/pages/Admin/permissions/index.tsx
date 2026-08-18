import { PortalPlaceholder } from '@/components/portal-placeholder';

export default function AdminPermissionsIndex() {
    return <PortalPlaceholder title="Permissions" portal="Super Admin" />;
}

AdminPermissionsIndex.layout = {
    breadcrumbs: [{ title: 'Permissions', href: '/admin/permissions' }],
};
