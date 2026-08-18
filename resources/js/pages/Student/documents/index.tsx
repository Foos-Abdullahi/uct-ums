import { PortalPlaceholder } from '@/components/portal-placeholder';

const href = '/student/documents';

export default function StudentDocumentsIndex() {
    return <PortalPlaceholder title="Documents" portal="Student" />;
}

StudentDocumentsIndex.layout = {
    breadcrumbs: [{ title: 'Documents', href }],
};
