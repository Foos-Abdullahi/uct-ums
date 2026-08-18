import { PortalPlaceholder } from '@/components/portal-placeholder';

export default function HrDashboard() {
    return <PortalPlaceholder title="Dashboard" portal="HR" />;
}

HrDashboard.layout = {
    breadcrumbs: [{ title: 'Dashboard', href: '/hr/dashboard' }],
};
