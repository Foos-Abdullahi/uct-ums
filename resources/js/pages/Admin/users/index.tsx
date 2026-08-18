import { PortalPlaceholder } from '@/components/portal-placeholder';

export default function AdminUsersIndex() {
    return <PortalPlaceholder title="Users" portal="Super Admin" />;
}

AdminUsersIndex.layout = {
    breadcrumbs: [
        { title: 'Users', href: '/admin/users' },
    ],
};
