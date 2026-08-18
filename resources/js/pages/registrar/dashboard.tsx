import { PortalPlaceholder } from '@/components/portal-placeholder';

export default function RegistrarDashboard() {
    return <PortalPlaceholder title="Dashboard" portal="Registrar" />;
}

RegistrarDashboard.layout = {
    breadcrumbs: [{ title: 'Dashboard', href: '/registrar/dashboard' }],
};
