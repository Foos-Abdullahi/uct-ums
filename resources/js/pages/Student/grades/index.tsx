import { PortalPlaceholder } from '@/components/portal-placeholder';

const href = '/student/grades';

export default function StudentGradesIndex() {
    return <PortalPlaceholder title="Grades" portal="Student" />;
}

StudentGradesIndex.layout = {
    breadcrumbs: [{ title: 'Grades', href }],
};
