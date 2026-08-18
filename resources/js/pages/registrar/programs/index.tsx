import { PortalPlaceholder } from '@/components/portal-placeholder';

const href = '/registrar/programs';

export default function RegistrarProgramsIndex() {
    return <PortalPlaceholder title="Programs" portal="Registrar" />;
}

RegistrarProgramsIndex.layout = {
    breadcrumbs: [{ title: 'Programs', href }],
};
