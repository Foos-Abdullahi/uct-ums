import { PortalPlaceholder } from '@/components/portal-placeholder';

const href = '/registrar/semesters';

export default function RegistrarSemestersIndex() {
    return <PortalPlaceholder title="Semesters" portal="Registrar" />;
}

RegistrarSemestersIndex.layout = {
    breadcrumbs: [{ title: 'Semesters', href }],
};
