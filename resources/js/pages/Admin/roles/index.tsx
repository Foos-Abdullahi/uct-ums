import { PortalPlaceholder } from '@/components/portal-placeholder';

export default function AdminRolesIndex() {
    return <PortalPlaceholder title="Roles" portal="Super Admin" />;
}

AdminRolesIndex.layout = {
    breadcrumbs: [{ title: 'Roles', href: '/admin/roles' }],
};
