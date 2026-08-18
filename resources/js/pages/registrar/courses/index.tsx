import { PortalPlaceholder } from '@/components/portal-placeholder';

const href = '/registrar/courses';

export default function RegistrarCoursesIndex() {
    return <PortalPlaceholder title="Courses" portal="Registrar" />;
}

RegistrarCoursesIndex.layout = {
    breadcrumbs: [{ title: 'Courses', href }],
};
