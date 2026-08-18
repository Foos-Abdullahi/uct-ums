import { PortalPlaceholder } from '@/components/portal-placeholder';

const href = '/student/courses';

export default function StudentCoursesIndex() {
    return <PortalPlaceholder title="Courses" portal="Student" />;
}

StudentCoursesIndex.layout = {
    breadcrumbs: [{ title: 'Courses', href }],
};
