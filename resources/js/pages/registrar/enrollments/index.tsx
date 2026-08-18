import { PortalPlaceholder } from '@/components/portal-placeholder';

const href = '/registrar/enrollments';

export default function RegistrarEnrollmentsIndex() {
    return <PortalPlaceholder title="Enrollments" portal="Registrar" />;
}

RegistrarEnrollmentsIndex.layout = {
    breadcrumbs: [{ title: 'Enrollments', href }],
};
