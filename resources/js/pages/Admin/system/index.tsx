import { PortalPlaceholder } from '@/components/portal-placeholder';

export default function AdminSystemIndex() {
    return <PortalPlaceholder title="System Settings" portal="Super Admin" />;
}

AdminSystemIndex.layout = {
    breadcrumbs: [{ title: 'System', href: '/admin/system' }],
};
