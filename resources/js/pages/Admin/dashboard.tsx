import { PortalPlaceholder } from '@/components/portal-placeholder';

export default function AdminDashboard() {
    return <PortalPlaceholder title="Dashboard" portal="Super Admin" />;
}

AdminDashboard.layout = {
    breadcrumbs: [{ title: 'Dashboard', href: '/admin/dashboard' }],
};
