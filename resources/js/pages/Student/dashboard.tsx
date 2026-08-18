import { PortalPlaceholder } from '@/components/portal-placeholder';

export default function StudentDashboard() {
    return <PortalPlaceholder title="Dashboard" portal="Student" />;
}

StudentDashboard.layout = {
    breadcrumbs: [{ title: 'Dashboard', href: '/student/dashboard' }],
};
