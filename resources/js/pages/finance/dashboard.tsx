import { PortalPlaceholder } from '@/components/portal-placeholder';

export default function FinanceDashboard() {
    return <PortalPlaceholder title="Dashboard" portal="Finance" />;
}

FinanceDashboard.layout = {
    breadcrumbs: [{ title: 'Dashboard', href: '/finance/dashboard' }],
};
