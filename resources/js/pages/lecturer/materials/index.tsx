import { PortalPlaceholder } from '@/components/portal-placeholder';

const href = '/lecturer/materials';

export default function LecturerMaterialsIndex() {
    return <PortalPlaceholder title="Materials" portal="Lecturer" />;
}

LecturerMaterialsIndex.layout = {
    breadcrumbs: [{ title: 'Materials', href }],
};
