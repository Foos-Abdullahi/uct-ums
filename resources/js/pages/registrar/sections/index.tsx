import { PortalPlaceholder } from '@/components/portal-placeholder';

const href = '/registrar/sections';

export default function RegistrarSectionsIndex() {
    return <PortalPlaceholder title="Sections" portal="Registrar" />;
}

RegistrarSectionsIndex.layout = {
    breadcrumbs: [{ title: 'Sections', href }],
};
