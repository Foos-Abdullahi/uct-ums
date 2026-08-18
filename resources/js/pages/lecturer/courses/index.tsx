import { PortalPlaceholder } from '@/components/portal-placeholder';

const href = '/lecturer/courses';

export default function LecturerCoursesIndex() {
    return <PortalPlaceholder title="My Courses" portal="Lecturer" />;
}

LecturerCoursesIndex.layout = {
    breadcrumbs: [{ title: 'My Courses', href }],
};
