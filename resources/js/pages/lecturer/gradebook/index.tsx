import { PortalPlaceholder } from '@/components/portal-placeholder';

const href = '/lecturer/gradebook';

export default function LecturerGradebookIndex() {
    return <PortalPlaceholder title="Gradebook" portal="Lecturer" />;
}

LecturerGradebookIndex.layout = {
    breadcrumbs: [{ title: 'Gradebook', href }],
};
