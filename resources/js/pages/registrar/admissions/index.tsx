import { PortalPlaceholder } from '@/components/portal-placeholder';

const href = '/registrar/admissions';

export default function RegistrarAdmissionsIndex() {
    return <PortalPlaceholder title="Admissions" portal="Registrar" />;
}

RegistrarAdmissionsIndex.layout = {
    breadcrumbs: [{ title: 'Admissions', href }],
};
