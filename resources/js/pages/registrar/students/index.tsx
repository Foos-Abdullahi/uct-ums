import { PortalPlaceholder } from '@/components/portal-placeholder';

const href = '/registrar/students';

export default function RegistrarStudentsIndex() {
    return <PortalPlaceholder title="Students" portal="Registrar" />;
}

RegistrarStudentsIndex.layout = {
    breadcrumbs: [{ title: 'Students', href }],
};
