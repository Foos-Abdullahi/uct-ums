import { PortalPlaceholder } from '@/components/portal-placeholder';

export default function LecturerDashboard() {
    return <PortalPlaceholder title="Dashboard" portal="Lecturer" />;
}

LecturerDashboard.layout = {
    breadcrumbs: [{ title: 'Dashboard', href: '/lecturer/dashboard' }],
};
